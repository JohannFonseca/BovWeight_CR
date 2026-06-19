<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Support API JSON response based on headers
        if ($request->is('api/*') || $request->expectsJson()) {
            $userId = $request->header('X-User-Id');
            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. No se proporcionó ID de usuario.'
                ], 401);
            }
            $user = \App\Models\Usuario::with('rol')->find($userId);
            if (!$user || strtolower($user->rol->nombre ?? '') !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Se requiere perfil de Administrador.'
                ], 403);
            }
            return $next($request);
        }

        // Web session fallback
        if (!$request->session()->has('admin_logged_in') || !$request->session()->get('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors([
                'auth' => 'Debes iniciar sesión como administrador para acceder a esta sección.'
            ]);
        }

        return $next($request);
    }
}
