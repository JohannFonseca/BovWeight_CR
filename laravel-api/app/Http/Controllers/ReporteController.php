<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reporte;
use App\Models\Animal;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReporteController extends Controller
{
    /**
     * Obtener todos los reportes guardados por el usuario.
     */
    public function getReportes(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado (falta X-User-Id).'], 401);
        }

        $reportes = Reporte::where('usuario_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'titulo' => $r->titulo,
                    'descripcion' => $r->descripcion,
                    'destinatario' => $r->destinatario,
                    'animal_ids' => $r->animal_ids,
                    'cant_animales' => is_array($r->animal_ids) ? count($r->animal_ids) : 0,
                    'fecha_creacion' => $r->created_at ? $r->created_at->format('d/m/Y H:i') : null,
                ];
            });

        return response()->json($reportes);
    }

    /**
     * Guardar un nuevo reporte en la base de datos.
     */
    public function guardarReporte(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|min:1|max:255',
            'descripcion' => 'nullable|string',
            'destinatario' => 'nullable|string|max:255',
            'animal_ids' => 'required|array|min:1',
            'animal_ids.*' => 'exists:animales,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $reporte = Reporte::create([
            'titulo' => trim($request->input('titulo')),
            'descripcion' => $request->input('descripcion') ? trim($request->input('descripcion')) : null,
            'usuario_id' => $userId,
            'animal_ids' => $request->input('animal_ids'),
            'destinatario' => $request->input('destinatario') ? trim($request->input('destinatario')) : null,
        ]);

        // Crear notificación automática al guardar un reporte
        try {
            \App\Models\Notificacion::create([
                'usuario_id' => $userId,
                'titulo' => 'Reporte generado',
                'descripcion' => "Has generado exitosamente el reporte '{$reporte->titulo}' con " . count($reporte->animal_ids) . " animales.",
                'tipo' => 'reporte',
                'leido' => false,
            ]);
        } catch (\Exception $e) {
            \Log::error("Error al crear notificación de reporte: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reporte guardado exitosamente.',
            'reporte' => [
                'id' => $reporte->id,
                'titulo' => $reporte->titulo,
                'descripcion' => $reporte->descripcion,
                'destinatario' => $reporte->destinatario,
                'animal_ids' => $reporte->animal_ids,
                'fecha_creacion' => $reporte->created_at->format('d/m/Y H:i')
            ]
        ], 201);
    }

    /**
     * Obtener el detalle de un reporte y los animales con su información actual de pesaje.
     */
    public function getReporteDetalle(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $reporte = Reporte::where('usuario_id', $userId)->find($id);
        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado.'], 404);
        }

        $animalIds = $reporte->animal_ids ?? [];

        // Consultar los animales guardados en este reporte
        $animales = Animal::with(['raza', 'finca', 'estimacionesPeso'])
            ->whereIn('id', $animalIds)
            ->get()
            ->map(function ($a) {
                $weights = $a->estimacionesPeso->sortBy('created_at')->values();
                
                $historialPeso = $weights->map(function ($h) {
                    return [
                        'fecha' => Carbon::parse($h->created_at)->format('d/m/Y'),
                        'peso' => (float)($h->peso_corregido_kg ?? $h->peso_estimado_kg ?? 0),
                    ];
                })->all();

                $pesoActual = 0;
                if ($weights->isNotEmpty()) {
                    $latest = $weights->last();
                    $pesoActual = (float)($latest->peso_corregido_kg ?? $latest->peso_estimado_kg ?? 0);
                }

                $edad = 'N/A';
                if ($a->fecha_nacimiento) {
                    $diffYears = Carbon::now()->diffInYears(Carbon::parse($a->fecha_nacimiento));
                    $edad = $diffYears > 0 ? "{$diffYears} años" : 'Menos de 1 año';
                }

                $imagenUrl = null;
                $latestWithImage = $weights->whereNotNull('ruta_imagen')->last();
                if ($latestWithImage) {
                    $imagenUrl = $latestWithImage->ruta_imagen;
                }

                $estimacionesDetalle = $weights->map(function ($h) {
                    return [
                        'fecha' => Carbon::parse($h->created_at)->format('d/m/Y'),
                        'peso_estimado' => (float)$h->peso_estimado_kg,
                        'peso_corregido' => $h->peso_corregido_kg ? (float)$h->peso_corregido_kg : null,
                        'ruta_imagen' => $h->ruta_imagen
                    ];
                })->all();

                return [
                    'id' => $a->id,
                    'nombre' => $a->nombre ?? 'Sin nombre',
                    'arete' => $a->numero_arete,
                    'raza' => $a->raza ? $a->raza->nombre : 'Brahman',
                    'edad' => $edad,
                    'sexo' => $a->sexo ?? 'macho',
                    'color' => $a->color ?? '',
                    'finca' => $a->finca ? $a->finca->nombre : 'Sin finca',
                    'pesoActual' => $pesoActual,
                    'historialPeso' => $historialPeso,
                    'imagen' => $imagenUrl,
                    'estimaciones' => $estimacionesDetalle,
                ];
            });

        return response()->json([
            'id' => $reporte->id,
            'titulo' => $reporte->titulo,
            'descripcion' => $reporte->descripcion,
            'destinatario' => $reporte->destinatario,
            'animal_ids' => $reporte->animal_ids,
            'fecha_creacion' => $reporte->created_at->format('d/m/Y H:i'),
            'animales' => $animales
        ]);
    }

    /**
     * Eliminar un reporte guardado.
     */
    public function eliminarReporte(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado.'], 401);
        }

        $reporte = Reporte::where('usuario_id', $userId)->find($id);
        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado.'], 404);
        }

        $reporte->delete();

        return response()->json(['message' => 'Reporte eliminado exitosamente.']);
    }
}

