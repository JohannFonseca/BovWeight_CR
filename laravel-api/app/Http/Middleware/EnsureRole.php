<?php
// app/Http/Middleware/EnsureRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Obtiene el usuario real autenticado.
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // Carga el rol del usuario desde la BD.
        $user->loadMissing('rol');

        $rolUsuario = $this->normalizarRol($user->rol?->nombre);

        // Normaliza los roles permitidos en la ruta.
        $rolesPermitidos = array_map(
            fn ($rol) => $this->normalizarRol($rol),
            $roles
        );

        // Bloquea si el rol no está autorizado.
        if (!in_array($rolUsuario, $rolesPermitidos, true)) {
            return response()->json([
                'message' => 'Acceso denegado. No tienes permisos para realizar esta acción.'
            ], 403);
        }

        return $next($request);
    }

    private function normalizarRol(?string $rol): string
    {
        // Mantiene nombres de roles consistentes.
        $rolNormalizado = strtolower(trim((string) $rol));

        return match ($rolNormalizado) {
            'administrador' => 'admin',
            'veterinario' => 'veterinario',
            'ganadero' => 'ganadero',
            default => $rolNormalizado,
        };
    }
}
