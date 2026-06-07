<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Raza;
use App\Models\Usuario;
use App\Models\Finca;
use App\Models\Animal;
use Illuminate\Support\Facades\Validator;

class AdminWebController extends Controller
{
    // ==========================================
    // AUTHENTICATION
    // ==========================================
    public function showLogin()
    {
        if (session('admin_logged_in')) {
            return redirect()->route('admin.dashboard');
        }
        return view('admin.login');
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $correo = $request->input('correo');
        $password = $request->input('password');

        // Buscar usuario coincidente por email y contraseña en texto plano (compatibilidad con Supabase)
        $usuario = Usuario::with('rol')
            ->where('correo', $correo)
            ->where('contrasena_hash', $password)
            ->first();

        if (!$usuario) {
            return redirect()->back()
                ->withErrors(['login_error' => 'Correo o contraseña incorrectos.'])
                ->withInput();
        }

        if (strtolower($usuario->rol->nombre) !== 'admin') {
            return redirect()->back()
                ->withErrors(['login_error' => 'Acceso denegado. No tienes permisos de administrador.'])
                ->withInput();
        }

        if (!$usuario->activo) {
            return redirect()->back()
                ->withErrors(['login_error' => 'Tu cuenta de administrador está desactivada.'])
                ->withInput();
        }

        // Registrar la sesión de administrador
        session([
            'admin_logged_in' => true,
            'admin_id' => $usuario->id,
            'admin_email' => $usuario->correo,
            'admin_name' => $usuario->nombre_completo ?? 'Administrador',
        ]);

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['admin_logged_in', 'admin_id', 'admin_email', 'admin_name']);
        return redirect()->route('admin.login')->with('success', 'Sesión cerrada correctamente.');
    }

    // ==========================================
    // DASHBOARD
    // ==========================================
    public function dashboard()
    {
        $usuariosCount = Usuario::count();
        $fincasCount = Finca::count();
        $animalesCount = Animal::count();

        // Obtener últimos 5 usuarios registrados para una pequeña vista dinámica
        $ultimosUsuarios = Usuario::with('rol')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return view('admin.dashboard', compact('usuariosCount', 'fincasCount', 'animalesCount', 'ultimosUsuarios'));
    }

    // ==========================================
    // GESTIÓN DE USUARIOS
    // ==========================================
    public function usuarios()
    {
        $usuarios = Usuario::with('rol')
            ->orderBy('created_at', 'desc')
            ->get();

        $roles = Role::orderBy('nombre')->get();

        return view('admin.usuarios', compact('usuarios', 'roles'));
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
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $correo = $request->input('correo');

        // Validar si el correo ya existe
        $existe = Usuario::where('correo', $correo)->first();
        if ($existe) {
            return redirect()->back()
                ->withErrors(['correo' => 'Ya existe un usuario con este correo electrónico.'])
                ->withInput();
        }

        Usuario::create([
            'correo' => $correo,
            'contrasena_hash' => $request->input('contrasena'),
            'rol_id' => $request->input('rol_id'),
            'nombre_completo' => $request->input('nombre_completo'),
            'activo' => true,
        ]);

        return redirect()->route('admin.usuarios')->with('success', 'Usuario registrado con éxito.');
    }

    public function editarUsuario(Request $request, $id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return redirect()->back()->with('error', 'Usuario no encontrado.');
        }

        $validator = Validator::make($request->all(), [
            'correo' => 'required|email',
            'nombre_completo' => 'required|string|min:1',
            'contrasena' => 'nullable|string|min:4',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $correo = $request->input('correo');

        // Validar si otro usuario ya tiene el mismo correo
        $existe = Usuario::where('correo', $correo)
            ->where('id', '!=', $id)
            ->first();
        if ($existe) {
            return redirect()->back()
                ->withErrors(['correo' => 'Otro usuario ya está registrado con este correo electrónico.'])
                ->withInput();
        }

        $usuario->correo = $correo;
        $usuario->nombre_completo = $request->input('nombre_completo');
        if ($request->filled('contrasena')) {
            $usuario->contrasena_hash = $request->input('contrasena');
        }
        $usuario->save();

        return redirect()->route('admin.usuarios')->with('success', 'Usuario actualizado con éxito.');
    }

    public function toggleUsuario($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return redirect()->back()->with('error', 'Usuario no encontrado.');
        }

        // Evitar que el administrador se desactive a sí mismo
        if ($usuario->id === session('admin_id')) {
            return redirect()->back()->with('error', 'No puedes desactivar tu propia cuenta de administrador.');
        }

        $usuario->activo = !$usuario->activo;
        $usuario->save();

        $estado = $usuario->activo ? 'activado' : 'desactivado';
        return redirect()->route('admin.usuarios')->with('success', "Usuario {$estado} con éxito.");
    }

    public function eliminarUsuario($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return redirect()->back()->with('error', 'Usuario no encontrado.');
        }

        // Evitar que el administrador se elimine a sí mismo
        if ($usuario->id === session('admin_id')) {
            return redirect()->back()->with('error', 'No puedes eliminar tu propia cuenta de administrador.');
        }

        $usuario->delete();

        return redirect()->route('admin.usuarios')->with('success', 'Usuario eliminado con éxito.');
    }

    // ==========================================
    // GESTIÓN DE RAZAS
    // ==========================================
    public function razas()
    {
        $razas = Raza::orderBy('nombre')->get();
        return view('admin.razas', compact('razas'));
    }

    public function crearRaza(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|unique:razas,nombre',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        Raza::create([
            'nombre' => $request->input('nombre'),
            'descripcion' => $request->input('descripcion'),
        ]);

        return redirect()->route('admin.razas')->with('success', 'Raza registrada con éxito.');
    }
}
