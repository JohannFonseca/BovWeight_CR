<?php
// app/Http/Controllers/CitaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cita;
use App\Models\Finca;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;

class CitaController extends Controller
{
    /**
     * Listar citas del usuario autenticado según su rol.
     */
    public function index(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $query = Cita::with([
            'ganadero:id,nombre_completo,correo',
            'veterinario:id,nombre_completo,correo',
            'finca:id,nombre,ubicacion',
            'animal:id,nombre,numero_arete,raza_id',
            'animal.raza:id,nombre'
        ]);

        if ($userRole === 'ganadero') {
            $query->where('ganadero_id', $userId);
        } elseif ($userRole === 'veterinario') {
            $query->where('veterinario_id', $userId);
        } elseif ($userRole === 'admin') {
            // El administrador puede ver todas
        } else {
            return response()->json(['message' => 'Rol no permitido'], 403);
        }

        $citas = $query->orderBy('fecha', 'desc')
                       ->orderBy('hora', 'desc')
                       ->get();

        return response()->json($citas);
    }

    /**
     * Crear una nueva cita (solicitud o propuesta).
     */
    public function store(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $validator = Validator::make($request->all(), [
            'veterinario_id' => 'required|exists:usuarios,id',
            'finca_id' => 'required|exists:fincas,id',
            'animal_id' => 'nullable|exists:animales,id',
            'fecha' => 'required|date',
            'hora' => 'required|string',
            'motivo' => 'required|string|min:1',
            'estado' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $finca = Finca::find($request->input('finca_id'));
        if (!$finca) {
            return response()->json(['message' => 'Finca no encontrada'], 404);
        }

        $ganaderoId = null;
        $veterinarioId = null;
        $estado = $request->input('estado');

        if ($userRole === 'ganadero') {
            $ganaderoId = (int)$userId;
            $veterinarioId = (int)$request->input('veterinario_id');
            // Si el ganadero es quien la solicita, el estado por defecto es pendiente
            if (!$estado) {
                $estado = 'pendiente';
            }
        } elseif ($userRole === 'veterinario') {
            $veterinarioId = (int)$userId;
            $ganaderoId = $finca->propietario_id;
            // Si el veterinario es quien propone, el estado es propuesta_veterinario
            if (!$estado) {
                $estado = 'propuesta_veterinario';
            }
        } else {
            // Admin u otros
            $ganaderoId = $finca->propietario_id;
            $veterinarioId = (int)$request->input('veterinario_id');
            if (!$estado) {
                $estado = 'pendiente';
            }
        }

        $cita = Cita::create([
            'ganadero_id' => $ganaderoId,
            'veterinario_id' => $veterinarioId,
            'finca_id' => $request->input('finca_id'),
            'animal_id' => $request->input('animal_id'),
            'fecha' => $request->input('fecha'),
            'hora' => $request->input('hora'),
            'motivo' => trim($request->input('motivo')),
            'estado' => $estado,
        ]);

        // Cargar relaciones antes de retornar
        $cita->load([
            'ganadero:id,nombre_completo,correo',
            'veterinario:id,nombre_completo,correo',
            'finca:id,nombre,ubicacion',
            'animal:id,nombre,numero_arete'
        ]);

        return response()->json([
            'message' => 'Cita registrada exitosamente.',
            'cita' => $cita
        ], 201);
    }

    /**
     * Actualizar estado o reprogramar una cita existente.
     */
    public function update(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $cita = Cita::find($id);
        if (!$cita) {
            return response()->json(['message' => 'Cita no encontrada'], 404);
        }

        // Seguridad: validar que el usuario es parte de la cita
        if ($userRole !== 'admin' && $cita->ganadero_id != $userId && $cita->veterinario_id != $userId) {
            return response()->json(['message' => 'Acceso denegado a esta cita'], 403);
        }

        $validator = Validator::make($request->all(), [
            'fecha' => 'nullable|date',
            'hora' => 'nullable|string',
            'estado' => 'nullable|string|in:pendiente,aceptada,rechazada,completada,propuesta_veterinario',
            'comentario_rechazo' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Reprogramación
        $rescheduled = false;
        if ($request->has('fecha') && $request->input('fecha') != $cita->fecha) {
            $cita->fecha = $request->input('fecha');
            $rescheduled = true;
        }
        if ($request->has('hora') && $request->input('hora') != $cita->hora) {
            $cita->hora = $request->input('hora');
            $rescheduled = true;
        }

        if ($rescheduled) {
            // Si el veterinario reprograma, el estado pasa a propuesta_veterinario
            if ($userRole === 'veterinario') {
                $cita->estado = 'propuesta_veterinario';
            } else {
                // Si el ganadero reprograma, pasa a pendiente (esperando aprobación del veterinario)
                $cita->estado = 'pendiente';
            }
        }

        // Cambio de estado explícito
        if ($request->has('estado')) {
            $cita->estado = $request->input('estado');
        }

        // Comentario de rechazo
        if ($request->has('comentario_rechazo')) {
            $cita->comentario_rechazo = $request->input('comentario_rechazo');
        } else if ($cita->estado !== 'rechazada') {
            $cita->comentario_rechazo = null;
        }

        $cita->save();

        // Cargar relaciones antes de retornar
        $cita->load([
            'ganadero:id,nombre_completo,correo',
            'veterinario:id,nombre_completo,correo',
            'finca:id,nombre,ubicacion',
            'animal:id,nombre,numero_arete'
        ]);

        return response()->json([
            'message' => 'Cita actualizada exitosamente.',
            'cita' => $cita
        ]);
    }
}
