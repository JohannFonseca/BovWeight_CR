<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Usuario;

class HandleAyudanteRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->header('X-User-Id');
        $userRole = strtolower($request->header('X-User-Role') ?? '');

        if ($userRole === 'ayudante' && $userId) {
            $user = Usuario::find($userId);

            if ($user && $user->ganadero_id) {
                // Save original helper info for auditing
                $request->headers->set('X-Original-User-Id', $userId);
                
                // Impersonate the parent ganadero
                $request->headers->set('X-User-Id', $user->ganadero_id);
                $request->headers->set('X-User-Role', 'ganadero');
            }
        }

        return $next($request);
    }
}
