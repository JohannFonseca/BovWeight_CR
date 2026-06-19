<?php
// app/Http/Controllers/RecordatorioSanitarioController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RecordatorioSanitario;
use App\Models\Usuario;
use App\Models\Finca;
use App\Models\Animal;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class RecordatorioSanitarioController extends Controller
{
    /**
     * Listar recordatorios sanitarios según el rol y el usuario autenticado.
     */
    public function index(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $user = Usuario::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $query = RecordatorioSanitario::with([
            'usuario:id,nombre_completo,correo',
            'finca:id,nombre,ubicacion',
            'animal:id,nombre,numero_arete'
        ]);

        if ($userRole === 'admin') {
            // El admin ve todos
        } elseif ($userRole === 'ganadero') {
            // El ganadero ve sus recordatorios directos o los asociados a sus fincas
            $fincaIds = Finca::where('propietario_id', $userId)->pluck('id')->toArray();
            
            $query->where(function ($q) use ($userId, $fincaIds) {
                $q->where('usuario_id', $userId)
                  ->orWhereIn('finca_id', $fincaIds);
            });
        } elseif ($userRole === 'veterinario') {
            // El veterinario ve sus recordatorios o los asociados a fincas que tiene asignadas
            $fincaIds = $user->fincasAsignadas()->pluck('fincas.id')->toArray();

            $query->where(function ($q) use ($userId, $fincaIds) {
                $q->where('usuario_id', $userId)
                  ->orWhereIn('finca_id', $fincaIds);
            });
        } else {
            return response()->json(['message' => 'Rol no permitido'], 403);
        }

        $recordatorios = $query->orderBy('fecha_programada', 'asc')
                               ->orderBy('created_at', 'desc')
                               ->get();

        return response()->json($recordatorios);
    }

    /**
     * Crear un nuevo recordatorio sanitario.
     */
    public function store(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|min:1|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|string|in:vacuna,desparasitacion,revision_medica,otro',
            'fecha_programada' => 'required|date',
            'finca_id' => 'nullable|exists:fincas,id',
            'animal_id' => 'nullable|exists:animales,id',
            'estado' => 'nullable|string|in:pendiente,completado'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Si se provee finca, validar acceso
        $fincaId = $request->input('finca_id');
        if ($fincaId && $userRole !== 'admin') {
            $finca = Finca::find($fincaId);
            if ($userRole === 'ganadero' && $finca->propietario_id != $userId) {
                return response()->json(['message' => 'No tienes acceso a esta finca'], 403);
            }
            if ($userRole === 'veterinario') {
                $user = Usuario::find($userId);
                $hasAccess = $user->fincasAsignadas()->where('finca_id', $fincaId)->exists();
                if (!$hasAccess) {
                    return response()->json(['message' => 'No estás asignado a esta finca'], 403);
                }
            }
        }

        // Si se provee animal, validar que pertenece a la finca o al ganadero
        $animalId = $request->input('animal_id');
        if ($animalId) {
            $animal = Animal::find($animalId);
            if ($fincaId && $animal->finca_id != $fincaId) {
                return response()->json(['message' => 'El animal no pertenece a la finca seleccionada'], 422);
            }
            if ($userRole === 'ganadero') {
                $finca = Finca::find($animal->finca_id);
                if ($finca && $finca->propietario_id != $userId) {
                    return response()->json(['message' => 'El animal pertenece a una finca que no es tuya'], 403);
                }
            }
        }

        $recordatorio = RecordatorioSanitario::create([
            'usuario_id' => $userId,
            'finca_id' => $fincaId,
            'animal_id' => $animalId,
            'titulo' => trim($request->input('titulo')),
            'descripcion' => $request->input('descripcion') ? trim($request->input('descripcion')) : null,
            'tipo' => $request->input('tipo'),
            'fecha_programada' => $request->input('fecha_programada'),
            'estado' => $request->input('estado', 'pendiente'),
            'notificado' => false
        ]);

        $recordatorio->load([
            'usuario:id,nombre_completo,correo',
            'finca:id,nombre',
            'animal:id,nombre,numero_arete'
        ]);

        return response()->json([
            'message' => 'Recordatorio sanitario creado exitosamente.',
            'recordatorio' => $recordatorio
        ], 201);
    }

    /**
     * Actualizar un recordatorio sanitario.
     */
    public function update(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $recordatorio = RecordatorioSanitario::find($id);
        if (!$recordatorio) {
            return response()->json(['message' => 'Recordatorio no encontrado'], 404);
        }

        // Seguridad: solo el creador, el dueño de la finca asociada o admin puede editarlo
        if ($userRole !== 'admin' && $recordatorio->usuario_id != $userId) {
            if ($recordatorio->finca_id) {
                $finca = Finca::find($recordatorio->finca_id);
                if ($userRole === 'ganadero' && $finca->propietario_id != $userId) {
                    return response()->json(['message' => 'No tienes acceso para editar este recordatorio'], 403);
                }
                if ($userRole === 'veterinario') {
                    $user = Usuario::find($userId);
                    $hasAccess = $user->fincasAsignadas()->where('finca_id', $recordatorio->finca_id)->exists();
                    if (!$hasAccess) {
                        return response()->json(['message' => 'No tienes acceso para editar este recordatorio'], 403);
                    }
                }
            } else {
                return response()->json(['message' => 'No tienes permiso para editar este recordatorio'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'nullable|string|min:1|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|string|in:vacuna,desparasitacion,revision_medica,otro',
            'fecha_programada' => 'nullable|date',
            'finca_id' => 'nullable|exists:fincas,id',
            'animal_id' => 'nullable|exists:animales,id',
            'estado' => 'nullable|string|in:pendiente,completado'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Si se cambia la finca, validar acceso
        if ($request->has('finca_id')) {
            $fincaId = $request->input('finca_id');
            if ($fincaId && $userRole !== 'admin') {
                $finca = Finca::find($fincaId);
                if ($userRole === 'ganadero' && $finca->propietario_id != $userId) {
                    return response()->json(['message' => 'No tienes acceso a la finca seleccionada'], 403);
                }
                if ($userRole === 'veterinario') {
                    $user = Usuario::find($userId);
                    $hasAccess = $user->fincasAsignadas()->where('finca_id', $fincaId)->exists();
                    if (!$hasAccess) {
                        return response()->json(['message' => 'No estás asignado a la finca seleccionada'], 403);
                    }
                }
            }
            $recordatorio->finca_id = $fincaId;
        }

        // Si se cambia el animal
        if ($request->has('animal_id')) {
            $animalId = $request->input('animal_id');
            if ($animalId) {
                $animal = Animal::find($animalId);
                $fincaId = $recordatorio->finca_id;
                if ($fincaId && $animal->finca_id != $fincaId) {
                    return response()->json(['message' => 'El animal no pertenece a la finca del recordatorio'], 422);
                }
                if ($userRole === 'ganadero') {
                    $finca = Finca::find($animal->finca_id);
                    if ($finca && $finca->propietario_id != $userId) {
                        return response()->json(['message' => 'El animal pertenece a una finca ajena'], 403);
                    }
                }
            }
            $recordatorio->animal_id = $animalId;
        }

        // Si cambia fecha programada, re-iniciar el estado de notificación
        if ($request->has('fecha_programada') && $request->input('fecha_programada') != $recordatorio->fecha_programada->format('Y-m-d')) {
            $recordatorio->fecha_programada = $request->input('fecha_programada');
            $recordatorio->notificado = false;
        }

        $fields = ['titulo', 'descripcion', 'tipo', 'estado'];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $recordatorio->$field = $request->input($field);
            }
        }

        $recordatorio->save();

        $recordatorio->load([
            'usuario:id,nombre_completo,correo',
            'finca:id,nombre',
            'animal:id,nombre,numero_arete'
        ]);

        return response()->json([
            'message' => 'Recordatorio sanitario actualizado exitosamente.',
            'recordatorio' => $recordatorio
        ]);
    }

    /**
     * Eliminar un recordatorio sanitario.
     */
    public function destroy(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $recordatorio = RecordatorioSanitario::find($id);
        if (!$recordatorio) {
            return response()->json(['message' => 'Recordatorio no encontrado'], 404);
        }

        // Seguridad: solo creador o admin pueden eliminar
        if ($userRole !== 'admin' && $recordatorio->usuario_id != $userId) {
            return response()->json(['message' => 'No tienes permiso para eliminar este recordatorio'], 403);
        }

        $recordatorio->delete();

        return response()->json([
            'message' => 'Recordatorio sanitario eliminado exitosamente.'
        ]);
    }

    /**
     * Ejecutar manualmente la verificación de recordatorios (útil para pruebas y desarrollo).
     */
    public function runCheck(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        try {
            // Llamar al comando programático
            \Illuminate\Support\Facades\Artisan::call('recordatorios:notificar');
            $output = \Illuminate\Support\Facades\Artisan::output();
            
            return response()->json([
                'message' => 'Verificación de recordatorios ejecutada con éxito.',
                'output' => trim($output)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al ejecutar la verificación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
