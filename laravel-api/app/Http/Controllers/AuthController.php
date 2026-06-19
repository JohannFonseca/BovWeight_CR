<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Mail\PasswordCambiadoMail;
use App\Mail\RecuperarPasswordMail;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Los datos proporcionados no son válidos.'], 422);
        }

        $correo = strtolower(trim($request->input('correo')));
        $password = $request->input('password');

        $usuario = Usuario::with('rol')
            ->whereRaw('LOWER(correo) = ?', [$correo])
            ->first();

        if (!$usuario || !$this->passwordValida($password, $usuario->contrasena_hash)) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        if (!$usuario->activo) {
            return response()->json(['message' => 'Tu cuenta está desactivada. Contacta al administrador.'], 403);
        }

        if ($usuario->debe_cambiar_password && $usuario->password_expira_en) {
            $expiresAt = Carbon::parse($usuario->password_expira_en);

            if ($expiresAt->isPast()) {
                return response()->json([
                    'message' => 'Su contraseña temporal ha expirado. Contacte al administrador.'
                ], 403);
            }
        }

        /*
            Seguridad:
            Se eliminan tokens anteriores para evitar que queden sesiones viejas activas.
            Si el equipo quiere permitir varias sesiones simultáneas por usuario,
            puede quitar esta línea.
        */
        $usuario->tokens()->delete();

        $plainToken = $usuario->createToken('bovweight-api-token', ['*'])->plainTextToken;

        return response()->json([
            'id' => $usuario->id,
            'usuario' => $usuario->correo,
            'rol' => $this->normalizarRol($usuario->rol?->nombre),
            'nombre_completo' => $usuario->nombre_completo ?? 'Usuario de BovWeight',
            'debe_cambiar_password' => (bool) $usuario->debe_cambiar_password,
            'foto_url' => $usuario->foto_url,
            'token' => $plainToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request)
    {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $usuario->loadMissing('rol');

        return response()->json([
            'id' => $usuario->id,
            'usuario' => $usuario->correo,
            'rol' => $this->normalizarRol($usuario->rol?->nombre),
            'nombre_completo' => $usuario->nombre_completo ?? 'Usuario de BovWeight',
            'debe_cambiar_password' => (bool) $usuario->debe_cambiar_password,
            'foto_url' => $usuario->foto_url,
        ]);
    }

    public function logout(Request $request)
    {
        $usuario = $request->user();

        if ($usuario && $usuario->currentAccessToken()) {
            $usuario->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function recuperarPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'El correo electrónico no es válido.'], 422);
        }

        $correo = strtolower(trim($request->input('correo')));

        $usuario = Usuario::whereRaw('LOWER(correo) = ?', [$correo])->first();

        if (!$usuario) {
            return response()->json(['message' => 'No se encontró ningún usuario registrado con ese correo electrónico.'], 404);
        }

        $passwordTemporal = 'REC' . random_int(100000, 999999);

        $usuario->contrasena_hash = Hash::make($passwordTemporal);
        $usuario->debe_cambiar_password = true;
        $usuario->password_expira_en = Carbon::now()->addHours(24);
        $usuario->tokens()->delete();
        $usuario->save();

        try {
            Mail::to($usuario->correo)->send(
                new RecuperarPasswordMail(
                    $usuario->nombre_completo ?? 'Usuario',
                    $usuario->correo,
                    $passwordTemporal
                )
            );
            $enviado = true;
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de recuperación: ' . $e->getMessage());
            $enviado = false;
        }

        return response()->json([
            'message' => 'Se ha enviado una contraseña temporal a su correo electrónico.' . ($enviado ? '' : ' (Advertencia: No se pudo enviar el correo, contacte al administrador).'),
            'password_temporal_debug' => app()->environment('local', 'testing') ? $passwordTemporal : null,
        ]);
    }

    public function cambiarPassword(Request $request)
    {
        $usuarioAutenticado = $request->user();

        if (!$usuarioAutenticado) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'id' => 'nullable|integer|exists:usuarios,id',
            'password_actual' => 'required|string',
            'nuevo_password' => 'required|string|min:6|different:password_actual',
        ], [
            'nuevo_password.different' => 'La nueva contraseña debe ser diferente a la contraseña actual.',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $usuarioAutenticado->loadMissing('rol');

        $rolAutenticado = $this->normalizarRol($usuarioAutenticado->rol?->nombre);
        $idSolicitado = (int) ($request->input('id') ?: $usuarioAutenticado->id);

        if ($rolAutenticado !== 'admin' && $idSolicitado !== (int) $usuarioAutenticado->id) {
            return response()->json(['message' => 'No puedes cambiar la contraseña de otro usuario.'], 403);
        }

        $usuario = Usuario::find($idSolicitado);

        if (!$usuario || !$this->passwordValida($request->input('password_actual'), $usuario->contrasena_hash)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
        }

        $usuario->contrasena_hash = Hash::make($request->input('nuevo_password'));
        $usuario->debe_cambiar_password = false;
        $usuario->password_expira_en = null;
        $usuario->save();

        $tokenActualId = $request->user()?->currentAccessToken()?->id;

        if ($tokenActualId) {
            $usuario->tokens()->where('id', '!=', $tokenActualId)->delete();
        } else {
            $usuario->tokens()->delete();
        }

        try {
            Mail::to($usuario->correo)->send(
                new PasswordCambiadoMail(
                    $usuario->nombre_completo ?? 'Usuario',
                    $usuario->correo
                )
            );
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de confirmación de cambio de contraseña: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    private function passwordValida(string $passwordPlano, ?string $passwordAlmacenada): bool
    {
        if (!$passwordAlmacenada) {
            return false;
        }

        if (Hash::info($passwordAlmacenada)['algo'] !== null) {
            return Hash::check($passwordPlano, $passwordAlmacenada);
        }

        return hash_equals($passwordAlmacenada, $passwordPlano);
    }

    private function normalizarRol(?string $rol): string
    {
        $rolNormalizado = strtolower(trim((string) $rol));

        return match ($rolNormalizado) {
            'administrador' => 'admin',
            'veterinario' => 'veterinario',
            'ganadero' => 'ganadero',
            default => $rolNormalizado,
        };
    }
}
