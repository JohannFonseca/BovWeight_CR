<?php
// app/Http/Controllers/GanadoController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Finca;
use App\Models\Animal;
use App\Models\EstimacionPeso;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class GanadoController extends Controller
{
    // ==========================================
    // FINCAS
    // ==========================================
    public function getFincas(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        $query = Finca::with(['propietario', 'animales']);

        if ($userRole === 'ganadero' && $userId) {
            $query->where('propietario_id', $userId);
        }

        $fincas = $query->orderBy('nombre')->get()->map(function ($f) {
            $ownerName = $f->propietario ? $f->propietario->nombre_completo : 'Sin asignar';
            return [
                'id' => $f->id,
                'nombre' => $f->nombre,
                'ubicacion' => $f->ubicacion ?? 'Sin ubicación',
                'propietario_id' => $f->propietario_id,
                'propietario_nombre' => $ownerName,
                'encargado_nombre' => $ownerName,
                'bovinos_count' => $f->animales->count(),
                'creado_en' => $f->created_at ? $f->created_at->format('d/m/Y') : null,
            ];
        });

        return response()->json($fincas);
    }

    public function crearFinca(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|min:1',
            'ubicacion' => 'required|string|min:1',
            'propietario_id' => 'required|exists:usuarios,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $finca = Finca::create([
            'nombre' => trim($request->input('nombre')),
            'ubicacion' => trim($request->input('ubicacion')),
            'propietario_id' => $request->input('propietario_id'),
        ]);

        return response()->json($finca, 201);
    }

    public function eliminarFinca($id)
    {
        $finca = Finca::withCount('animales')->find($id);
        if (!$finca) {
            return response()->json(['message' => 'Finca no encontrada.'], 404);
        }

        if ($finca->animales_count > 0) {
            return response()->json([
                'message' => "No se puede eliminar esta finca porque tiene {$finca->animales_count} animales asignados. Elimine o reasigne los animales primero."
            ], 400);
        }

        $finca->delete();
        return response()->json(['message' => 'Finca eliminada exitosamente.']);
    }

    // ==========================================
    // ANIMALES
    // ==========================================
    public function getGanadoCompleto(Request $request)
    {
        // Admin view of all animals (replicates adminService.getGanadoCompleto)
        $animales = Animal::with(['raza', 'finca', 'estimacionesPeso'])
            ->get()
            ->map(function ($a) {
                // Get weights ordered by date to find latest weight
                $weights = $a->estimacionesPeso->sortByDesc('created_at')->values();
                $latestWeight = 0;
                if ($weights->isNotEmpty()) {
                    $latestWeight = $weights->first()->peso_corregido_kg ?? $weights->first()->peso_estimado_kg ?? 0;
                }

                return [
                    'id' => $a->id,
                    'nombre' => $a->nombre ?? 'Sin nombre',
                    'raza' => $a->raza ? $a->raza->nombre : 'Sin raza',
                    'raza_id' => $a->raza_id,
                    'numero_arete' => $a->numero_arete ?? 'N/A',
                    'fecha_nacimiento' => $a->fecha_nacimiento ? Carbon::parse($a->fecha_nacimiento)->format('d/m/Y') : 'N/A',
                    'sexo' => $a->sexo ?? 'N/A',
                    'color' => $a->color ?? '',
                    'estado' => $a->estado ?? 'activo',
                    'finca_id' => $a->finca_id,
                    'finca_nombre' => $a->finca ? $a->finca->nombre : 'Sin finca',
                    'peso_actual' => $latestWeight > 0 ? (float)number_format($latestWeight, 1, '.', '') : 0,
                    'observaciones' => $a->observaciones ?? '',
                ];
            });

        return response()->json($animales);
    }

    public function getAllAnimals(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        $query = Animal::with(['raza', 'finca', 'estimacionesPeso']);

        if ($userRole === 'ganadero' && $userId) {
            $query->whereHas('finca', function ($q) use ($userId) {
                $q->where('propietario_id', $userId);
            });
        }

        $animales = $query->get()->map(function ($a) {
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

            // Calculate age description
            $edad = 'N/A';
            if ($a->fecha_nacimiento) {
                $diffYears = Carbon::now()->diffInYears(Carbon::parse($a->fecha_nacimiento));
                $edad = $diffYears > 0 ? "{$diffYears} años" : 'Menos de 1 año';
            }

            return [
                'id' => $a->id,
                'nombre' => $a->nombre ?? 'Sin nombre',
                'raza' => $a->raza ? $a->raza->nombre : 'Brahman',
                'edad' => $edad,
                'arete' => $a->numero_arete,
                'imagen' => $a->observaciones ?? 'assets/cow-placeholder.png', // Fallback or observations
                'pesoActual' => $pesoActual,
                'historialPeso' => $historialPeso,
            ];
        });

        return response()->json($animales);
    }

    public function getAnimalById(Request $request, $id)
    {
        $a = Animal::with(['raza', 'finca', 'estimacionesPeso'])->find($id);
        if (!$a) {
            return response()->json(['message' => 'Animal no encontrado.'], 404);
        }

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

        return response()->json([
            'id' => $a->id,
            'nombre' => $a->nombre ?? 'Sin nombre',
            'raza' => $a->raza ? $a->raza->nombre : 'Desconocida',
            'edad' => $edad,
            'arete' => $a->numero_arete,
            'imagen' => $a->observaciones ?? 'assets/cow-placeholder.png',
            'pesoActual' => $pesoActual,
            'historialPeso' => $historialPeso,
        ]);
    }

    public function getWeightHistory($id)
    {
        $weights = EstimacionPeso::where('animal_id', $id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($h) {
                return [
                    'fecha' => Carbon::parse($h->created_at)->format('d/m/Y'),
                    'peso' => (float)($h->peso_corregido_kg ?? $h->peso_estimado_kg ?? 0),
                ];
            });

        return response()->json($weights);
    }

    public function crearAnimal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|min:1',
            'numero_arete' => 'required|string|min:1',
            'finca_id' => 'required|exists:fincas,id',
            'raza_id' => 'nullable|exists:razas,id',
            'fecha_nacimiento' => 'nullable|date',
            'sexo' => 'nullable|string',
            'color' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $animal = Animal::create([
            'nombre' => trim($request->input('nombre')),
            'numero_arete' => trim($request->input('numero_arete')),
            'finca_id' => $request->input('finca_id'),
            'raza_id' => $request->input('raza_id'),
            'fecha_nacimiento' => $request->input('fecha_nacimiento'),
            'sexo' => $request->input('sexo') ?? 'macho',
            'color' => $request->input('color') ? trim($request->input('color')) : null,
            'observaciones' => $request->input('observaciones') ? trim($request->input('observaciones')) : null,
            'estado' => 'activo',
        ]);

        return response()->json($animal, 201);
    }

    public function eliminarAnimal($id)
    {
        $a = Animal::find($id);
        if (!$a) {
            return response()->json(['message' => 'Animal no encontrado.'], 404);
        }

        $a->delete();
        return response()->json(['message' => 'Animal eliminado exitosamente.']);
    }

    // ==========================================
    // ESTADÍSTICAS DEL DASHBOARD
    // ==========================================
    public function getDashboardStats(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if ($userRole === 'admin') {
            $personal = Usuario::where('activo', true)->count();
            $bovinos = Animal::count();
            $fincas = Finca::count();
        } else {
            // Ganadero or Veterinario
            $personal = 0;
            $fincas = Finca::where('propietario_id', $userId)->count();
            $bovinos = Animal::whereHas('finca', function ($q) use ($userId) {
                $q->where('propietario_id', $userId);
            })->count();
        }

        return response()->json([
            'personalActivo' => $personal,
            'bovinos' => $bovinos,
            'fincas' => $fincas,
        ]);
    }

    // ==========================================
    // ANÁLISIS DE PESAJES
    // ==========================================
    public function getAnalisisPesajes(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        // Generate monthly labels for the last 6 months
        $hoy = Carbon::now();
        $labels = [];
        $monthsRange = [];

        for ($i = 5; $i >= 0; $i--) {
            $d = $hoy->copy()->subMonths($i);
            $labels[] = strtoupper($d->locale('es-CR')->isoFormat('MMM'));
            $monthsRange[] = [
                'start' => $d->copy()->startOfMonth(),
                'end' => $d->copy()->endOfMonth(),
                'month' => $d->month,
                'year' => $d->year,
            ];
        }

        // Query animals
        $query = Animal::with(['raza', 'estimacionesPeso']);

        if ($userRole === 'ganadero' && $userId) {
            $query->whereHas('finca', function ($q) use ($userId) {
                $q->where('propietario_id', $userId);
            });
        }

        $animales = $query->get();

        if ($animales->isEmpty()) {
            return response()->json([
                'labels' => $labels,
                'pesosPromedio' => [0, 0, 0, 0, 0, 0],
                'crecimientoMensual' => 0,
                'pesoPromedioGeneral' => 0,
                'bovinoMasPesado' => null,
            ]);
        }

        // Aggregate weights per month index (0 to 5)
        $pesosPorMes = [0 => [], 1 => [], 2 => [], 3 => [], 4 => [], 5 => []];
        $totalPesoActual = 0;
        $countPesosActuales = 0;
        $maxPeso = 0;
        $heaviestBovino = null;

        foreach ($animales as $a) {
            $weights = $a->estimacionesPeso->sortBy('created_at')->values();
            if ($weights->isEmpty()) {
                continue;
            }

            $latestWeight = $weights->last()->peso_corregido_kg ?? $weights->last()->peso_estimado_kg ?? 0;
            if ($latestWeight > 0) {
                $totalPesoActual += $latestWeight;
                $countPesosActuales++;

                if ($latestWeight > $maxPeso) {
                    $maxPeso = $latestWeight;
                    $heaviestBovino = [
                        'nombre' => $a->nombre ?? "Arete: {$a->numero_arete}",
                        'peso' => (float)number_format($latestWeight, 1, '.', ''),
                        'raza' => $a->raza ? $a->raza->nombre : 'Sin raza',
                    ];
                }
            }

            // Distribute weights over last 6 months
            foreach ($weights as $w) {
                $wDate = Carbon::parse($w->created_at);
                $pesoVal = (float)($w->peso_corregido_kg ?? $w->peso_estimado_kg ?? 0);
                if ($pesoVal <= 0) {
                    continue;
                }

                // Check difference in months
                $monthDiff = $hoy->diffInMonths($wDate);
                if ($wDate->gt($hoy)) {
                    continue; // Skip future weights
                }

                if ($monthDiff >= 0 && $monthDiff < 6) {
                    $index = 5 - $monthDiff;
                    // Double check by month and year match to prevent edge cases with diffInMonths
                    // Find actual month index
                    $foundIndex = -1;
                    foreach ($monthsRange as $key => $rng) {
                        if ($wDate->month === $rng['month'] && $wDate->year === $rng['year']) {
                            $foundIndex = $key;
                            break;
                        }
                    }
                    if ($foundIndex !== -1) {
                        $pesosPorMes[$foundIndex][] = $pesoVal;
                    }
                }
            }
        }

        // Calculate averages per month
        $pesosPromedio = [0, 0, 0, 0, 0, 0];
        for ($i = 0; $i < 6; $i++) {
            $arr = $pesosPorMes[$i];
            if (count($arr) > 0) {
                $pesosPromedio[$i] = (float)number_format(array_sum($arr) / count($arr), 1, '.', '');
            }
        }

        // Calculate monthly growth rate (month index 5 vs month index 4)
        $crecimientoMensual = 0;
        $pesoUltimoMes = $pesosPromedio[5];
        $pesoMesAnterior = $pesosPromedio[4];

        if ($pesoMesAnterior > 0) {
            $crecimientoMensual = (($pesoUltimoMes - $pesoMesAnterior) / $pesoMesAnterior) * 100;
            $crecimientoMensual = (float)number_format($crecimientoMensual, 2, '.', '');
        }

        $pesoPromedioGeneral = $countPesosActuales > 0 ? $totalPesoActual / $countPesosActuales : 0;
        $pesoPromedioGeneral = (float)number_format($pesoPromedioGeneral, 1, '.', '');

        return response()->json([
            'labels' => $labels,
            'pesosPromedio' => $pesosPromedio,
            'crecimientoMensual' => $crecimientoMensual,
            'pesoPromedioGeneral' => $pesoPromedioGeneral,
            'bovinoMasPesado' => $heaviestBovino,
        ]);
    }
}
