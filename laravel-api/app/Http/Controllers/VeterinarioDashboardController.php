<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Animal;
use App\Models\EstimacionPeso;

class VeterinarioDashboardController extends Controller
{
    public function getDashboardData(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $user = \App\Models\Usuario::find($userId);

        // Extraer los IDs de las fincas asignadas al usuario autenticado (Veterinario)
        $fincasIds = $user->fincasAsignadas()->pluck('fincas.id');

        // 1. Conteo de fincas autorizadas
        $totalFincas = $fincasIds->count();

        // 2. Conteo de todos los animales pertenecientes a esas fincas
        $totalAnimales = Animal::whereIn('finca_id', $fincasIds)->count();

        // 3. Seguimiento prioritario: últimos 10 animales monitoreados
        // Se extraen usando las fincas autorizadas, asegurando Eager Loading para evitar N+1,
        // y ordenados por la fecha de su última estimación de peso.
        $seguimientoPrioritario = Animal::with(['raza', 'finca', 'estimacionesPeso' => function($query) {
                $query->latest()->limit(1);
            }])
            ->whereIn('finca_id', $fincasIds)
            ->whereHas('estimacionesPeso')
            ->orderByDesc(
                EstimacionPeso::select('created_at')
                    ->whereColumn('estimaciones_peso.animal_id', 'animales.id')
                    ->latest()
                    ->take(1)
            )
            ->take(10)
            ->get();

        // Formatear el JSON de salida para las tablas iniciales
        $seguimientoFormateado = $seguimientoPrioritario->map(function ($animal) {
            $ultimaEstimacion = $animal->estimacionesPeso->first();
            return [
                'id' => $animal->id,
                'numero_arete' => $animal->numero_arete,
                'nombre' => $animal->nombre,
                'raza' => $animal->raza ? $animal->raza->nombre : 'No especificada',
                'finca' => $animal->finca ? $animal->finca->nombre : 'Sin finca',
                'ultima_estimacion_kg' => $ultimaEstimacion ? $ultimaEstimacion->peso_estimado_kg : null,
                'peso_corregido_kg' => $ultimaEstimacion ? $ultimaEstimacion->peso_corregido_kg : null,
                'fecha_ultima_estimacion' => $ultimaEstimacion ? $ultimaEstimacion->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total_fincas' => $totalFincas,
                'total_animales' => $totalAnimales,
                'seguimiento_prioritario' => $seguimientoFormateado,
            ]
        ]);
    }
}
