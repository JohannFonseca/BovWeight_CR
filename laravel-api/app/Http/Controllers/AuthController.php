<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;

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

        // Look up the user by email and the plain-text password (matching Supabase setup)
        $usuario = Usuario::with('rol')
            ->where('correo', $correo)
            ->where('contrasena_hash', $password)
            ->first();

        if (!$usuario) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        if (!$usuario->activo) {
            return response()->json(['message' => 'Tu cuenta está desactivada. Contacta al administrador.'], 403);
        }

        return response()->json([
            'id' => $usuario->id,
            'usuario' => $usuario->correo,
            'rol' => strtolower($usuario->rol->nombre),
            'nombre_completo' => $usuario->nombre_completo ?? 'Usuario de BovWeight',
        ]);
    }
}
