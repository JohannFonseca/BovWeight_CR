<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Los datos proporcionados no son válidos.'], 422);
        }

        $correo = $request->input('correo');
        $password = $request->input('password');

        // Buscar el usuario por correo
        $usuario = Usuario::with('rol')
            ->where('correo', $correo)
            ->first();

        if (!$usuario) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Verificar contraseña con soporte legacy y secure hashing sin lanzar excepciones
        $passwordMatches = false;
        if (str_starts_with($usuario->contrasena_hash, '$2y$') || str_starts_with($usuario->contrasena_hash, '$2a$')) {
            if (Hash::check($password, $usuario->contrasena_hash)) {
                $passwordMatches = true;
            }
        } else {
            if ($usuario->contrasena_hash === $password) {
                $passwordMatches = true;
            }
        }

        if (!$passwordMatches) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        if (!$usuario->activo) {
            return response()->json(['message' => 'Tu cuenta está desactivada. Contacta al administrador.'], 403);
        }

        // Verificar si la contraseña temporal ha expirado
        if ($usuario->debe_cambiar_password && $usuario->password_expira_en) {
            $expiresAt = Carbon::parse($usuario->password_expira_en);
            if ($expiresAt->isPast()) {
                return response()->json([
                    'message' => 'Su contraseña temporal ha expirado. Contacte al administrador.'
                ], 403);
            }
        }

        return response()->json([
            'id' => $usuario->id,
            'usuario' => $usuario->correo,
            'rol' => strtolower($usuario->rol->nombre),
            'nombre_completo' => $usuario->nombre_completo ?? 'Usuario de BovWeight',
            'debe_cambiar_password' => (bool)$usuario->debe_cambiar_password,
        ]);
    }

    public function cambiarPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:usuarios,id',
            'password_actual' => 'required',
            'nuevo_password' => 'required|min:6',
            'confirmar_password' => 'required|same:nuevo_password',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $usuario = Usuario::find($request->input('id'));

        // Verificar contraseña actual
        $passwordMatches = false;
        if (Hash::check($request->input('password_actual'), $usuario->contrasena_hash)) {
            $passwordMatches = true;
        } elseif ($usuario->contrasena_hash === $request->input('password_actual')) {
            $passwordMatches = true;
        }

        if (!$passwordMatches) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
        }

        // Validar que la nueva contraseña no sea igual a la temporal (actual)
        if ($request->input('password_actual') === $request->input('nuevo_password')) {
            return response()->json(['message' => 'La nueva contraseña debe ser diferente a la contraseña temporal.'], 422);
        }

        // Actualizar contraseña
        $usuario->contrasena_hash = Hash::make($request->input('nuevo_password'));
        $usuario->debe_cambiar_password = false;
        $usuario->password_expira_en = null;
        $usuario->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }
}
