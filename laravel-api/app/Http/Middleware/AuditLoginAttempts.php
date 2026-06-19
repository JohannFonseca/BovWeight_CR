<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Auditoria;

class AuditLoginAttempts
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip() ?? '127.0.0.1';
        $correo = $request->input('correo');

        // Check if this IP is currently blocked
        $limitAttempts = 5;
        $blockMinutes = 15;
        $since = now()->subMinutes($blockMinutes);

        $failedAttemptsCount = Auditoria::where('ip_address', $ip)
            ->where('accion', 'LOGIN_FALLIDO')
            ->where('created_at', '>=', $since)
            ->count();

        if ($failedAttemptsCount >= $limitAttempts) {
            // Log a block audit record if not logged in the last 1 minute to avoid flooding
            $recentlyLoggedBlock = Auditoria::where('ip_address', $ip)
                ->where('accion', 'BLOQUEO_IP')
                ->where('created_at', '>=', now()->subMinute())
                ->exists();

            if (!$recentlyLoggedBlock) {
                Auditoria::create([
                    'accion' => 'BLOQUEO_IP',
                    'correo' => $correo,
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                    'detalles' => ['mensaje' => 'IP bloqueada temporalmente por superar límite de intentos fallidos.']
                ]);
            }

            return response()->json([
                'message' => 'Demasiados intentos fallidos. Su dirección IP ha sido bloqueada temporalmente por 15 minutos.'
            ], 429);
        }

        $response = $next($request);

        // Post-request hook: log the result of the login attempt
        if ($request->isMethod('post')) {
            if ($response->status() === 200) {
                // Decode output to extract user ID
                $content = json_decode($response->getContent(), true);
                $usuarioId = $content['id'] ?? null;

                Auditoria::create([
                    'usuario_id' => $usuarioId,
                    'correo' => $correo,
                    'accion' => 'LOGIN_EXITOSO',
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                    'detalles' => ['mensaje' => 'Inicio de sesión exitoso.']
                ]);
            } elseif ($response->status() === 401 || $response->status() === 422 || $response->status() === 403) {
                Auditoria::create([
                    'correo' => $correo,
                    'accion' => 'LOGIN_FALLIDO',
                    'ip_address' => $ip,
                    'user_agent' => $request->userAgent(),
                    'detalles' => [
                        'mensaje' => 'Intento de inicio de sesión fallido.',
                        'codigo_respuesta' => $response->status()
                    ]
                ]);
            }
        }

        return $response;
    }
}
