<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Raza;
use App\Models\Usuario;
use App\Models\Finca;
use App\Models\Animal;
use App\Models\EstimacionPeso;
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
    public function getUsuarios(Request $request)
    {
        $query = Usuario::with('rol')->withCount('fincas');

        // Filtrar por nombre o correo
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre_completo', 'like', '%' . $search . '%')
                  ->orWhere('correo', 'like', '%' . $search . '%');
            });
        }

        // Filtrar por nombre de rol
        if ($request->has('rol_nombre')) {
            $query->whereHas('rol', function ($q) use ($request) {
                $q->where('nombre', $request->input('rol_nombre'));
            });
        }

        // Paginación
        if ($request->has('page')) {
            $usuarios = $query->orderBy('created_at', 'desc')->paginate(10);
            return response()->json([
                'data' => collect($usuarios->items())->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'correo' => $u->correo,
                        'nombre_completo' => $u->nombre_completo ?? 'Sin nombre',
                        'activo' => (bool)$u->activo,
                        'rol_id' => $u->rol_id,
                        'rol_nombre' => strtolower($u->rol->nombre),
                        'fincas_count' => $u->fincas_count,
                        'creado_en' => $u->created_at->format('d/m/Y'),
                    ];
                }),
                'current_page' => $usuarios->currentPage(),
                'last_page' => $usuarios->lastPage(),
                'total' => $usuarios->total(),
            ]);
        }

        $usuarios = $query->orderBy('created_at', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'correo' => $u->correo,
                'nombre_completo' => $u->nombre_completo ?? 'Sin nombre',
                'activo' => (bool)$u->activo,
                'rol_id' => $u->rol_id,
                'rol_nombre' => strtolower($u->rol->nombre),
                'fincas_count' => $u->fincas_count,
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
            'ganadero_id' => 'nullable|exists:usuarios,id',
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
            'ganadero_id' => $request->input('ganadero_id'),
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

    // ==========================================
    // ESTADÍSTICAS DEL DASHBOARD (API ADMIN)
    // ==========================================
    public function getDashboardStats()
    {
        $totalUsuarios = Usuario::count();
        $totalFincas = Finca::count();
        $totalAnimales = Animal::count();
        $totalPesajes = EstimacionPeso::count();
        $nuevosUsuarios30Dias = Usuario::where('created_at', '>=', now()->subDays(30))->count();

        return response()->json([
            'totalUsuarios' => $totalUsuarios,
            'totalFincas' => $totalFincas,
            'totalAnimales' => $totalAnimales,
            'totalPesajes' => $totalPesajes,
            'nuevosUsuarios30Dias' => $nuevosUsuarios30Dias,
        ]);
    }

    // ==========================================
    // OBTENER DETALLE DE USUARIO (API ADMIN)
    // ==========================================
    public function getUsuario($id)
    {
        $u = Usuario::with(['rol', 'ganadero', 'veterinarios'])->withCount('fincas')->find($id);
        if (!$u) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $fincas = Finca::where('propietario_id', $id)
            ->withCount('animales')
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'nombre' => $f->nombre,
                    'ubicacion' => $f->ubicacion,
                    'animales_count' => $f->animales_count,
                ];
            });

        return response()->json([
            'id' => $u->id,
            'correo' => $u->correo,
            'nombre_completo' => $u->nombre_completo ?? 'Sin nombre',
            'activo' => (bool)$u->activo,
            'rol_id' => $u->rol_id,
            'rol_nombre' => strtolower($u->rol->nombre),
            'creado_en' => $u->created_at->format('d/m/Y H:i'),
            'fincas' => $fincas,
            'ganadero' => $u->ganadero ? [
                'id' => $u->ganadero->id,
                'nombre_completo' => $u->ganadero->nombre_completo,
                'correo' => $u->ganadero->correo,
            ] : null,
            'veterinarios' => $u->veterinarios ? $u->veterinarios->map(function ($v) {
                return [
                    'id' => $v->id,
                    'nombre_completo' => $v->nombre_completo,
                    'correo' => $v->correo,
                ];
            }) : [],
        ]);
    }

    // ==========================================
    // CAMBIAR ESTADO DE USUARIO (API ADMIN)
    // ==========================================
    public function toggleUsuarioStatus($id)
    {
        $u = Usuario::find($id);
        if (!$u) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $u->activo = !$u->activo;
        $u->save();

        return response()->json([
            'message' => 'Estado del usuario actualizado correctamente.',
            'activo' => (bool)$u->activo
        ]);
    }

    // ==========================================
    // OBTENER FINCAS DEL SISTEMA (API ADMIN)
    // ==========================================
    public function getFincas(Request $request)
    {
        $query = Finca::with(['propietario'])->withCount('animales');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', '%' . $search . '%')
                  ->orWhereHas('propietario', function ($q2) use ($search) {
                      $q2->where('nombre_completo', 'like', '%' . $search . '%');
                  });
            });
        }

        if ($request->has('page')) {
            $fincas = $query->orderBy('created_at', 'desc')->paginate(10);
            return response()->json([
                'data' => collect($fincas->items())->map(function ($f) {
                    return [
                        'id' => $f->id,
                        'nombre' => $f->nombre,
                        'ubicacion' => $f->ubicacion,
                        'propietario_nombre' => $f->propietario->nombre_completo ?? 'Sin propietario',
                        'propietario_id' => $f->propietario_id,
                        'animales_count' => $f->animales_count,
                        'creado_en' => $f->created_at->format('d/m/Y'),
                    ];
                }),
                'current_page' => $fincas->currentPage(),
                'last_page' => $fincas->lastPage(),
                'total' => $fincas->total(),
            ]);
        }

        $fincas = $query->orderBy('created_at', 'desc')->get()->map(function ($f) {
            return [
                'id' => $f->id,
                'nombre' => $f->nombre,
                'ubicacion' => $f->ubicacion,
                'propietario_nombre' => $f->propietario->nombre_completo ?? 'Sin propietario',
                'propietario_id' => $f->propietario_id,
                'animales_count' => $f->animales_count,
                'creado_en' => $f->created_at->format('d/m/Y'),
            ];
        });

        return response()->json($fincas);
    }

    // ==========================================
    // OBTENER DETALLE DE FINCA (API ADMIN)
    // ==========================================
    public function getFinca($id)
    {
        $f = Finca::with(['propietario'])->find($id);
        if (!$f) {
            return response()->json(['message' => 'Finca no encontrada.'], 404);
        }

        $animales = Animal::where('finca_id', $id)
            ->with(['raza', 'estimacionesPeso'])
            ->get()
            ->map(function ($a) {
                $weights = $a->estimacionesPeso->sortBy('created_at')->values();
                $latest = $weights->last();
                $pesoActual = $latest ? (float)($latest->peso_corregido_kg ?? $latest->peso_estimado_kg ?? 0) : 0;
                $fechaActual = $latest ? $latest->created_at->format('d/m/Y') : 'Sin pesajes';

                return [
                    'id' => $a->id,
                    'nombre' => $a->nombre,
                    'numero_arete' => $a->numero_arete,
                    'raza' => $a->raza->nombre ?? 'Sin raza',
                    'peso_actual' => $pesoActual,
                    'fecha_pesaje' => $fechaActual,
                ];
            });

        return response()->json([
            'id' => $f->id,
            'nombre' => $f->nombre,
            'ubicacion' => $f->ubicacion ?? 'Sin ubicación registrada',
            'propietario_nombre' => $f->propietario->nombre_completo ?? 'Sin propietario',
            'creado_en' => $f->created_at->format('d/m/Y'),
            'animales' => $animales,
        ]);
    }

    // ==========================================
    // OBTENER REPORTES Y ANÁLISIS (API ADMIN)
    // ==========================================
    public function getReportes()
    {
        // 1. Estimaciones por mes (últimos 6 meses)
        $monthlyData = [];
        $spanishMonths = [
            1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr',
            5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Ago',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic'
        ];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $key = $date->format('Y-m');
            $monthlyData[$key] = [
                'month' => $key,
                'label' => $spanishMonths[(int)$date->format('n')] . ' ' . $date->format('y'),
                'count' => 0
            ];
        }

        $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
        $estimaciones = EstimacionPeso::where('created_at', '>=', $sixMonthsAgo)->get();

        foreach ($estimaciones as $est) {
            $key = $est->created_at->format('Y-m');
            if (isset($monthlyData[$key])) {
                $monthlyData[$key]['count']++;
            }
        }
        $estimacionesPorMes = array_values($monthlyData);

        // 2. Top 5 usuarios con más estimaciones realizadas
        $topUsuarios = Usuario::select('usuarios.id', 'usuarios.nombre_completo', 'usuarios.correo')
            ->leftJoin('fincas', 'fincas.propietario_id', '=', 'usuarios.id')
            ->leftJoin('animales', 'animales.finca_id', '=', 'fincas.id')
            ->leftJoin('estimaciones_peso', 'estimaciones_peso.animal_id', '=', 'animales.id')
            ->selectRaw('COUNT(estimaciones_peso.id) as estimaciones_count')
            ->groupBy('usuarios.id', 'usuarios.nombre_completo', 'usuarios.correo')
            ->orderBy('estimaciones_count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($u, $index) {
                return [
                    'posicion' => $index + 1,
                    'nombre' => $u->nombre_completo ?? 'Sin nombre',
                    'correo' => $u->correo,
                    'cantidad' => (int)$u->estimaciones_count,
                ];
            });

        // 3. Estado de usuarios (activos vs inactivos)
        $totalActivos = Usuario::where('activo', true)->count();
        $totalInactivos = Usuario::where('activo', false)->count();
        $total = $totalActivos + $totalInactivos;
        $porcentajeActivos = $total > 0 ? round(($totalActivos / $total) * 100, 1) : 0;
        $porcentajeInactivos = $total > 0 ? round(($totalInactivos / $total) * 100, 1) : 0;

        return response()->json([
            'estimacionesPorMes' => $estimacionesPorMes,
            'topUsuarios' => $topUsuarios,
            'usuariosEstado' => [
                'activos' => $totalActivos,
                'inactivos' => $totalInactivos,
                'porcentajeActivos' => $porcentajeActivos,
                'porcentajeInactivos' => $porcentajeInactivos,
            ]
        ]);
    }
}
