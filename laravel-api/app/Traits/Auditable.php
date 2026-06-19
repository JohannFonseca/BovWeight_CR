<?php
// app/Traits/Auditable.php

namespace App\Traits;

use App\Models\Auditoria;
use App\Models\Usuario;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            static::logAudit($model, 'CREAR');
        });

        static::updating(function ($model) {
            static::logAudit($model, 'MODIFICAR');
        });

        static::deleted(function ($model) {
            static::logAudit($model, 'ELIMINAR');
        });
    }

    protected static function logAudit($model, string $accion)
    {
        try {
            // Get user from request header (as BovWeight CR authentication uses X-User-Id)
            // Support fallback to X-Original-User-Id if request was mapped from an ayudante
            $userId = request()->header('X-Original-User-Id') ?? request()->header('X-User-Id');
            $user = null;
            if ($userId) {
                $user = Usuario::find($userId);
            }

            $usuarioId = $user ? $user->id : null;
            $correo = $user ? $user->correo : null;

            $detalles = [];
            if ($accion === 'MODIFICAR') {
                $dirty = $model->getDirty();
                $original = $model->getOriginal();
                foreach ($dirty as $key => $value) {
                    // Avoid logging password and token fields
                    if (in_array($key, ['contrasena_hash', 'password', 'remember_token', 'token'])) {
                        continue;
                    }
                    $detalles[$key] = [
                        'antes' => $original[$key] ?? null,
                        'despues' => $value
                    ];
                }
                if (empty($detalles)) {
                    return; // No auditable fields changed
                }
            } elseif ($accion === 'CREAR') {
                $detalles = collect($model->getAttributes())
                    ->except(['contrasena_hash', 'password', 'remember_token', 'token'])
                    ->toArray();
            } elseif ($accion === 'ELIMINAR') {
                $detalles = collect($model->getOriginal())
                    ->except(['contrasena_hash', 'password', 'remember_token', 'token'])
                    ->toArray();
            }

            Auditoria::create([
                'usuario_id' => $usuarioId,
                'correo' => $correo,
                'accion' => $accion,
                'tabla' => $model->getTable(),
                'registro_id' => $model->id,
                'detalles' => $detalles,
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error guardando log de auditoría: ' . $e->getMessage());
        }
    }
}
