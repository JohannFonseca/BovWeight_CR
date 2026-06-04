<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Raza;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    // ==========================================
    // ROLES
    // ==========================================
    public function getRoles()
    {
        $roles = Role::orderBy('id')->get();
        return response()->json($roles);
    }

    // ==========================================
    // RAZAS
    // ==========================================
    public function getRazas()
    {
        $razas = Raza::orderBy('nombre')->get();
        return response()->json($razas);
    }

    public function crearRaza(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|unique:razas,nombre',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $raza = Raza::create([
            'nombre' => $request->input('nombre'),
            'descripcion' => $request->input('descripcion'),
        ]);

        return response()->json($raza, 201);
    }

    // ==========================================
    // USUARIOS (Empleados/Ganaderos)
    // ==========================================
    public function getUsuarios()
    {
        $usuarios = Usuario::with('rol')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'correo' => $u->correo,
                    'nombre_completo' => $u->nombre_completo ?? 'Sin nombre',
                    'activo' => (bool)$u->activo,
                    'rol_id' => $u->rol_id,
                    'rol_nombre' => strtolower($u->rol->nombre),
                    'creado_en' => $u->created_at->format('d/m/Y'),
                ];
            });

        return response()->json($usuarios);
    }

    public function crearUsuario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'contrasena' => 'required|min:4',
            'rol_id' => 'required|exists:roles,id',
            'nombre_completo' => 'required|string|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Check if user email already exists
        $existe = Usuario::where('correo', $request->input('correo'))->first();
        if ($existe) {
            return response()->json(['message' => 'Ya existe un usuario con el correo: ' . $request->input('correo')], 409);
        }

        $usuario = Usuario::create([
            'correo' => $request->input('correo'),
            'contrasena_hash' => $request->input('contrasena'), // In plain text to match Supabase setup
            'rol_id' => $request->input('rol_id'),
            'nombre_completo' => $request->input('nombre_completo'),
            'activo' => true,
        ]);

        return response()->json(['message' => 'Usuario creado exitosamente.'], 201);
    }

    public function eliminarUsuario($id)
    {
        $u = Usuario::find($id);
        if (!$u) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $u->delete();
        return response()->json(['message' => 'Usuario eliminado exitosamente.']);
    }

    public function toggleEstadoUsuario(Request $request, $id)
    {
        $u = Usuario::find($id);
        if (!$u) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'activo' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $u->activo = $request->input('activo');
        $u->save();

        return response()->json(['message' => 'Estado de usuario actualizado exitosamente.']);
    }

    public function editarUsuario(Request $request, $id)
    {
        $u = Usuario::find($id);
        if (!$u) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'nombre_completo' => 'required|string|min:1',
            'contrasena' => 'nullable|string|min:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Check if other user already has this email
        $existe = Usuario::where('correo', $request->input('correo'))
            ->where('id', '!=', $id)
            ->first();
        if ($existe) {
            return response()->json(['message' => 'Ya existe otro usuario con el correo: ' . $request->input('correo')], 409);
        }

        $u->correo = $request->input('correo');
        $u->nombre_completo = $request->input('nombre_completo');
        if ($request->filled('contrasena')) {
            $u->contrasena_hash = $request->input('contrasena');
        }
        $u->save();

        return response()->json(['message' => 'Usuario modificado exitosamente.']);
    }
}
