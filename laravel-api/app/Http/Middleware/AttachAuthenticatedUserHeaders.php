<?php
// app/Http/Middleware/AttachAuthenticatedUserHeaders.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AttachAuthenticatedUserHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // Obtiene el usuario desde el token validado por Sanctum.
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'No autenticado. Token ausente o inválido.'
            ], 401);
        }

        // Carga el rol real desde la base de datos.
        $user->loadMissing('rol');

        /*
            Seguridad:
            Se sobrescriben las cabeceras antiguas con datos derivados del token validado.
            Aunque alguien falsifique X-User-Id o X-User-Role desde Postman/DevTools,
            aquí quedan reemplazadas por el usuario real autenticado con Sanctum.
        */
        $request->headers->set('X-User-Id', (string) $user->id);
        $request->headers->set('X-User-Role', $this->normalizarRol($user->rol?->nombre));

        return $next($request);
    }

    private function normalizarRol(?string $rol): string
    {
        // Convierte administrador a admin para mantener compatibilidad con el frontend.
        $rolNormalizado = strtolower(trim((string) $rol));

        return match ($rolNormalizado) {
            'administrador' => 'admin',
            'veterinario' => 'veterinario',
            'ganadero' => 'ganadero',
            default => $rolNormalizado,
        };
    }
}
