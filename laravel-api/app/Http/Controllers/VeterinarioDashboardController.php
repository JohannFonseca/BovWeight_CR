<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\EstimacionPeso;
use App\Models\ReporteVeterinario;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Http\Request;

class VeterinarioDashboardController extends Controller
{
    public function getDashboardData(Request $request)
    {
        $userId = $request->header('X-User-Id');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'No se recibió el usuario autenticado.'
            ], 401);
        }

        $user = Usuario::with('rol')->find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario veterinario no encontrado.'
            ], 404);
        }

        $fincasIds = $user->fincasAsignadas()
            ->wherePivot('activo', true)
            ->pluck('fincas.id');

        $totalFincas = $fincasIds->count();

        if ($fincasIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_fincas' => 0,
                    'total_animales' => 0,
                    'alertas_perdida_peso' => 0,
                    'seguimiento_prioritario' => [],
                    'reportes_creados' => 0,
                    'reportes_abiertos' => 0,
                    'reportes_en_seguimiento' => 0,
                    'reportes_resueltos' => 0,
                ]
            ]);
        }

        $totalAnimales = Animal::whereIn('finca_id', $fincasIds)->count();

        $animales = Animal::with([
                'raza',
                'finca',
                'estimacionesPeso' => function ($query) {
                    $query->orderBy('created_at', 'asc');
                }
            ])
            ->whereIn('finca_id', $fincasIds)
            ->whereHas('estimacionesPeso')
            ->get();

        $seguimientoFormateado = $animales
            ->map(function ($animal) {
                $analisisPeso = $this->analizarPerdidaPesoUltimos30Dias($animal);

                $ultimaEstimacion = $analisisPeso['ultima_estimacion'];

                return [
                    'id' => $animal->id,
                    'numero_arete' => $animal->numero_arete,
                    'nombre' => $animal->nombre,
                    'raza' => $animal->raza ? $animal->raza->nombre : 'No especificada',
                    'finca' => $animal->finca ? $animal->finca->nombre : 'Sin finca',
                    'ultima_estimacion_kg' => $analisisPeso['peso_actual_kg'],
                    'peso_corregido_kg' => $ultimaEstimacion ? $ultimaEstimacion->peso_corregido_kg : null,
                    'fecha_ultima_estimacion' => $ultimaEstimacion && $ultimaEstimacion->created_at
                        ? $ultimaEstimacion->created_at->toIso8601String()
                        : null,
                    'peso_referencia_kg' => $analisisPeso['peso_referencia_kg'],
                    'fecha_peso_referencia' => $analisisPeso['fecha_peso_referencia'],
                    'porcentaje_perdida_peso' => $analisisPeso['porcentaje_perdida_peso'],
                    'tiene_alerta_perdida_peso' => $analisisPeso['tiene_alerta_perdida_peso'],
                ];
            })
            ->sortByDesc(function ($animal) {
                return $animal['tiene_alerta_perdida_peso'] ? 1 : 0;
            })
            ->sortByDesc(function ($animal) {
                return $animal['porcentaje_perdida_peso'] ?? 0;
            })
            ->values()
            ->take(10);

        $alertasPerdidaPeso = $seguimientoFormateado
            ->filter(function ($animal) {
                return $animal['tiene_alerta_perdida_peso'] === true;
            })
            ->count();

        $reportesQuery = ReporteVeterinario::where('veterinario_id', $userId);

        $reportesCreados = (clone $reportesQuery)->count();
        $reportesAbiertos = (clone $reportesQuery)->where('estado', 'abierto')->count();
        $reportesEnSeguimiento = (clone $reportesQuery)->where('estado', 'en_seguimiento')->count();
        $reportesResueltos = (clone $reportesQuery)->where('estado', 'resuelto')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_fincas' => $totalFincas,
                'total_animales' => $totalAnimales,
                'alertas_perdida_peso' => $alertasPerdidaPeso,
                'seguimiento_prioritario' => $seguimientoFormateado,
                'reportes_creados' => $reportesCreados,
                'reportes_abiertos' => $reportesAbiertos,
                'reportes_en_seguimiento' => $reportesEnSeguimiento,
                'reportes_resueltos' => $reportesResueltos,
            ]
        ]);
    }

    private function analizarPerdidaPesoUltimos30Dias(Animal $animal): array
    {
        $estimaciones = $animal->estimacionesPeso
            ->filter(function ($estimacion) {
                return $this->obtenerPesoValido($estimacion) !== null;
            })
            ->sortBy('created_at')
            ->values();

        if ($estimaciones->isEmpty()) {
            return [
                'ultima_estimacion' => null,
                'peso_actual_kg' => null,
                'peso_referencia_kg' => null,
                'fecha_peso_referencia' => null,
                'porcentaje_perdida_peso' => 0,
                'tiene_alerta_perdida_peso' => false,
            ];
        }

        $ultimaEstimacion = $estimaciones->last();
        $pesoActual = $this->obtenerPesoValido($ultimaEstimacion);

        if (!$ultimaEstimacion || !$ultimaEstimacion->created_at || !$pesoActual) {
            return [
                'ultima_estimacion' => $ultimaEstimacion,
                'peso_actual_kg' => $pesoActual,
                'peso_referencia_kg' => null,
                'fecha_peso_referencia' => null,
                'porcentaje_perdida_peso' => 0,
                'tiene_alerta_perdida_peso' => false,
            ];
        }

        $fechaLimite = Carbon::parse($ultimaEstimacion->created_at)->subDays(30);

        $estimacionReferencia = $estimaciones
            ->filter(function ($estimacion) use ($ultimaEstimacion, $fechaLimite) {
                if (!$estimacion->created_at) {
                    return false;
                }

                $fechaEstimacion = Carbon::parse($estimacion->created_at);
                $fechaUltima = Carbon::parse($ultimaEstimacion->created_at);

                return $fechaEstimacion->greaterThanOrEqualTo($fechaLimite)
                    && $fechaEstimacion->lessThan($fechaUltima);
            })
            ->first();

        if (!$estimacionReferencia) {
            return [
                'ultima_estimacion' => $ultimaEstimacion,
                'peso_actual_kg' => $pesoActual,
                'peso_referencia_kg' => null,
                'fecha_peso_referencia' => null,
                'porcentaje_perdida_peso' => 0,
                'tiene_alerta_perdida_peso' => false,
            ];
        }

        $pesoReferencia = $this->obtenerPesoValido($estimacionReferencia);

        if (!$pesoReferencia || $pesoReferencia <= 0) {
            return [
                'ultima_estimacion' => $ultimaEstimacion,
                'peso_actual_kg' => $pesoActual,
                'peso_referencia_kg' => null,
                'fecha_peso_referencia' => null,
                'porcentaje_perdida_peso' => 0,
                'tiene_alerta_perdida_peso' => false,
            ];
        }

        $porcentajePerdida = 0;

        if ($pesoActual < $pesoReferencia) {
            $porcentajePerdida = (($pesoReferencia - $pesoActual) / $pesoReferencia) * 100;
        }

        $porcentajePerdida = round($porcentajePerdida, 2);

        return [
            'ultima_estimacion' => $ultimaEstimacion,
            'peso_actual_kg' => round($pesoActual, 2),
            'peso_referencia_kg' => round($pesoReferencia, 2),
            'fecha_peso_referencia' => $estimacionReferencia->created_at
                ? Carbon::parse($estimacionReferencia->created_at)->toIso8601String()
                : null,
            'porcentaje_perdida_peso' => $porcentajePerdida,
            'tiene_alerta_perdida_peso' => $porcentajePerdida > 10,
        ];
    }

    private function obtenerPesoValido(EstimacionPeso $estimacion): ?float
    {
        if ($estimacion->peso_corregido_kg !== null) {
            return (float) $estimacion->peso_corregido_kg;
        }

        if ($estimacion->peso_estimado_kg !== null) {
            return (float) $estimacion->peso_estimado_kg;
        }

        return null;
    }
}
