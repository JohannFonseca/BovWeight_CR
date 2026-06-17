<?php
// app/Http/Controllers/ReporteVeterinarioController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ReporteVeterinario;
use App\Models\Animal;
use App\Models\Finca;
use Illuminate\Support\Facades\Validator;

class ReporteVeterinarioController extends Controller
{
    /**
     * Listar reportes veterinarios con filtros y según el rol del usuario.
     */
    public function index(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $query = ReporteVeterinario::with([
            'veterinario:id,nombre_completo,correo',
            'ganadero:id,nombre_completo,correo',
            'finca:id,nombre,ubicacion',
            'animal:id,nombre,numero_arete,raza_id',
            'animal.raza:id,nombre',
            'cita'
        ]);

        // Filtro por rol
        if ($userRole === 'ganadero') {
            $query->where('ganadero_id', $userId);
        } elseif ($userRole === 'veterinario') {
            $query->where('veterinario_id', $userId);
        } elseif ($userRole !== 'admin') {
            return response()->json(['message' => 'Rol no permitido'], 403);
        }

        // Filtro adicional por animal
        if ($request->has('animal_id')) {
            $query->where('animal_id', $request->input('animal_id'));
        }

        $reportes = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reportes);
    }

    /**
     * Crear un nuevo reporte veterinario.
     */
    public function store(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        if ($userRole !== 'veterinario' && $userRole !== 'admin') {
            return response()->json(['message' => 'Solo los veterinarios pueden crear reportes'], 403);
        }

        $validator = Validator::make($request->all(), [
            'animal_id' => 'required|exists:animales,id',
            'observaciones' => 'required|string|min:1',
            'diagnostico_preliminar' => 'required|string|min:1',
            'recomendaciones' => 'required|string|min:1',
            'medicamentos_sugeridos' => 'nullable|string',
            'proxima_revision' => 'nullable|date',
            'prioridad' => 'required|string|in:baja,media,alta,urgente',
            'estado' => 'required|string|in:abierto,en_seguimiento,resuelto',
            'visita_recomendada' => 'nullable|boolean',
            'cita_id' => 'nullable|integer'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $animalId = $request->input('animal_id');
        $animal = Animal::find($animalId);
        if (!$animal) {
            return response()->json(['message' => 'Animal no encontrado'], 404);
        }

        $finca = Finca::find($animal->finca_id);
        if (!$finca) {
            return response()->json(['message' => 'Finca asociada al animal no encontrada'], 404);
        }

        $reporte = ReporteVeterinario::create([
            'veterinario_id' => (int)$userId,
            'ganadero_id' => $finca->propietario_id,
            'finca_id' => $finca->id,
            'animal_id' => $animal->id,
            'observaciones' => trim($request->input('observaciones')),
            'diagnostico_preliminar' => trim($request->input('diagnostico_preliminar')),
            'recomendaciones' => trim($request->input('recomendaciones')),
            'medicamentos_sugeridos' => $request->input('medicamentos_sugeridos') ? trim($request->input('medicamentos_sugeridos')) : null,
            'proxima_revision' => $request->input('proxima_revision'),
            'prioridad' => $request->input('prioridad'),
            'estado' => $request->input('estado'),
            'visita_recomendada' => $request->boolean('visita_recomendada', false),
            'cita_id' => $request->input('cita_id'),
        ]);

        // Crear notificaciones automáticas para el Ganadero
        try {
            \App\Models\Notificacion::create([
                'usuario_id' => $finca->propietario_id,
                'titulo' => 'Nuevo reporte veterinario disponible',
                'descripcion' => "Nuevo reporte veterinario disponible para Animal {$animal->nombre} (Arete: {$animal->numero_arete}).",
                'tipo' => 'reporte',
                'leido' => false,
            ]);

            if ($reporte->visita_recomendada) {
                \App\Models\Notificacion::create([
                    'usuario_id' => $finca->propietario_id,
                    'titulo' => 'El veterinario recomienda una visita',
                    'descripcion' => "El veterinario recomienda una visita para el animal {$animal->nombre} (Arete: {$animal->numero_arete}).",
                    'tipo' => 'cita',
                    'leido' => false,
                ]);
            }
        } catch (\Exception $e) {
            // No bloquear la respuesta si falla la notificación
            \Log::error("Error al crear notificación de reporte: " . $e->getMessage());
        }

        $reporte->load([
            'veterinario:id,nombre_completo,correo',
            'ganadero:id,nombre_completo,correo',
            'finca:id,nombre',
            'animal:id,nombre,numero_arete',
            'cita'
        ]);

        return response()->json([
            'message' => 'Reporte veterinario creado exitosamente.',
            'reporte' => $reporte
        ], 201);
    }

    /**
     * Actualizar estado o detalles de un reporte existente.
     */
    public function update(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $reporte = ReporteVeterinario::find($id);
        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        // Seguridad: solo el veterinario creador o administrador
        if ($userRole !== 'admin' && $reporte->veterinario_id != $userId) {
            return response()->json(['message' => 'Acceso denegado. No eres el creador de este reporte.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'observaciones' => 'nullable|string|min:1',
            'diagnostico_preliminar' => 'nullable|string|min:1',
            'recomendaciones' => 'nullable|string|min:1',
            'medicamentos_sugeridos' => 'nullable|string',
            'proxima_revision' => 'nullable|date',
            'prioridad' => 'nullable|string|in:baja,media,alta,urgente',
            'estado' => 'nullable|string|in:abierto,en_seguimiento,resuelto'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Actualizar campos
        $fields = [
            'observaciones', 'diagnostico_preliminar', 'recomendaciones',
            'medicamentos_sugeridos', 'proxima_revision', 'prioridad', 'estado'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                $reporte->$field = $request->input($field);
            }
        }

        $reporte->save();

        $reporte->load([
            'veterinario:id,nombre_completo,correo',
            'ganadero:id,nombre_completo,correo',
            'finca:id,nombre',
            'animal:id,nombre,numero_arete'
        ]);

        return response()->json([
            'message' => 'Reporte veterinario actualizado exitosamente.',
            'reporte' => $reporte
        ]);
    }
}
