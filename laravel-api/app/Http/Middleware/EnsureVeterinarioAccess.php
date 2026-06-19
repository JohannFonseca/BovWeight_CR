<?php
// app/Http/Middleware/EnsureVeterinarioAccess.php

namespace App\Http\Middleware;

use App\Models\Animal;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVeterinarioAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        // Usa el usuario autenticado por token.
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Token ausente o inválido.'
            ], 401);
        }

        // Carga el rol real.
        $user->loadMissing('rol');

        // Verifica que el usuario sea veterinario.
        if (!$user->isVeterinario()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Se requiere perfil de Veterinario.'
            ], 403);
        }

        // Obtiene finca desde ruta, body o query.
        $fincaId = $request->route('finca')
            ?? $request->input('finca_id')
            ?? $request->query('finca_id');

        // Valida permiso sobre la finca.
        if ($fincaId && !$this->veterinarioTieneAccesoAFinca($user, (int) $fincaId)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. No tienes permisos para consultar esta finca.'
            ], 403);
        }

        // Obtiene animal desde ruta, body o query.
        $animalId = $request->route('animal')
            ?? $request->route('id')
            ?? $request->input('animal_id')
            ?? $request->query('animal_id');

        // Valida permiso sobre el animal.
        if ($animalId && !$this->veterinarioTieneAccesoAAnimal($user, (int) $animalId)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Este animal pertenece a una finca no autorizada para tu perfil.'
            ], 403);
        }

        return $next($request);
    }

    private function veterinarioTieneAccesoAFinca($user, int $fincaId): bool
    {
        // Verifica si la finca está asignada al veterinario.
        return $user->fincasAsignadas()
            ->wherePivot('activo', true)
            ->where('fincas.id', $fincaId)
            ->exists();
    }

    private function veterinarioTieneAccesoAAnimal($user, int $animalId): bool
    {
        // Busca el animal y valida su finca.
        $animal = Animal::find($animalId);

        if (!$animal) {
            return false;
        }

        return $this->veterinarioTieneAccesoAFinca($user, (int) $animal->finca_id);
    }
}
