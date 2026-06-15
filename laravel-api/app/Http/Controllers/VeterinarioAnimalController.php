<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Animal;

class VeterinarioAnimalController extends Controller
{
    /**
     * Muestra el detalle del animal validando estrictamente que pertenezca a una finca autorizada.
     */
    public function show(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        $user = \App\Models\Usuario::find($userId);

        // 1. Extraer los IDs de las fincas asignadas al veterinario
        $fincasIds = $user->fincasAsignadas()->pluck('fincas.id');

        // 2. Buscar el animal con eager loading de relaciones incluyendo su historial cronológico
        $animal = Animal::with([
            'raza',
            'finca',
            'estimacionesPeso' => function($query) {
                $query->orderBy('created_at', 'asc');
            }
        ])->find($id);

        if (!$animal) {
            return response()->json([
                'success' => false,
                'message' => 'Animal no encontrado.'
            ], 404);
        }

        // 3. SEGURIDAD (CRÍTICO): Validar que el animal pertenece a una de las fincas asignadas
        if (!$fincasIds->contains($animal->finca_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Este animal pertenece a una finca no autorizada para tu perfil.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $animal
        ]);
    }
}
