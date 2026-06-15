<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVeterinarioAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->header('X-User-Id');
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. No se proporcionó ID de usuario.'
            ], 401);
        }

        $user = \App\Models\Usuario::with('rol')->find($userId);

        // 1. Validar que el usuario exista y tenga el rol de Veterinario
        if (!$user || !$user->isVeterinario()) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Se requiere perfil de Veterinario.'
            ], 403);
        }

        // 2. Interceptar peticiones que involucren un ID de finca
        $fincaId = $request->route('finca') ?? $request->input('finca_id');

        if ($fincaId) {
            $tieneAccesoFinca = $user->fincasAsignadas()->where('fincas.id', $fincaId)->exists();
            
            if (!$tieneAccesoFinca) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. No tienes permisos para consultar esta finca.'
                ], 403);
            }
        }

        // 3. Interceptar peticiones directas a un animal
        $animalId = $request->route('animal');
        
        if ($animalId) {
            $tieneAccesoAnimal = $user->fincasAsignadas()
                ->whereHas('animales', function ($query) use ($animalId) {
                    $query->where('animales.id', $animalId);
                })->exists();

            if (!$tieneAccesoAnimal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Este animal pertenece a una finca no autorizada para tu perfil.'
                ], 403);
            }
        }

        return $next($request);
    }
}
