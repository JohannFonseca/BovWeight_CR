<?php
// routes/api.php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\GanadoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\RecordatorioSanitarioController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\ReporteVeterinarioController;
use App\Http\Controllers\VeterinarioAnimalController;
use App\Http\Controllers\VeterinarioDashboardController;
use Illuminate\Support\Facades\Route;

// Rutas públicas: no requieren token.
Route::post('/login', [AuthController::class, 'login'])->middleware('audit.login');
Route::post('/recuperar-password', [AuthController::class, 'recuperarPassword']);

// Rutas protegidas: requieren Authorization: Bearer <token>.
Route::middleware(['auth:sanctum', 'auth.user.headers'])->group(function () {
    // Sesión autenticada.
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/cambiar-password', [AuthController::class, 'cambiarPassword']);

    // Catálogos utilizados por módulos autenticados.
    Route::get('/roles', [AdminController::class, 'getRoles']);
    Route::get('/razas', [AdminController::class, 'getRazas']);
    Route::post('/razas', [AdminController::class, 'crearRaza'])->middleware('role:admin');

    // Usuarios: admin y ganadero.
    Route::middleware(['role:admin,ganadero'])->group(function () {
        Route::get('/usuarios', [AdminController::class, 'getUsuarios']);
        Route::post('/usuarios', [AdminController::class, 'crearUsuario']);
        Route::put('/usuarios/{id}', [AdminController::class, 'editarUsuario']);
        Route::delete('/usuarios/{id}', [AdminController::class, 'eliminarUsuario']);
        Route::put('/usuarios/{id}/toggle-activo', [AdminController::class, 'toggleEstadoUsuario']);
        Route::post('/usuarios/{id}/reenviar-credenciales', [AdminController::class, 'reenviarCredenciales']);
    });

    // Ayudantes: espacio de ganadero/admin.
    Route::middleware(['role:admin,ganadero'])->group(function () {
        Route::get('/ganadero/ayudantes', [GanadoController::class, 'getAyudantes']);
        Route::post('/ganadero/ayudantes', [GanadoController::class, 'crearAyudante']);
        Route::delete('/ganadero/ayudantes/{id}', [GanadoController::class, 'eliminarAyudante']);
    });

    // Gestión de veterinarios desde ganadero/admin.
    Route::middleware(['role:admin,ganadero'])->group(function () {
        Route::get('/ganadero/veterinarios', [GanadoController::class, 'getVeterinariosGanadero']);
        Route::post('/ganadero/veterinarios/asignar-finca', [GanadoController::class, 'asignarFincaVeterinario']);
        Route::post('/ganadero/veterinarios/guardar-permisos', [GanadoController::class, 'guardarPermisosVeterinario']);
        Route::delete('/ganadero/veterinarios/{vetId}/revocar-finca/{fincaId}', [GanadoController::class, 'revocarFincaVeterinario']);
        Route::put('/ganadero/veterinarios/{vetId}/toggle-estado', [GanadoController::class, 'toggleEstadoVeterinario']);
    });

    // Fincas y animales.
    Route::middleware(['role:admin,ganadero,veterinario'])->group(function () {
        Route::get('/fincas', [GanadoController::class, 'getFincas']);
        Route::post('/fincas', [GanadoController::class, 'crearFinca']);
        Route::put('/fincas/{id}', [GanadoController::class, 'editarFinca']);
        Route::delete('/fincas/{id}', [GanadoController::class, 'eliminarFinca']);

        Route::get('/ganado-completo', [GanadoController::class, 'getGanadoCompleto']);
        Route::get('/animales', [GanadoController::class, 'getAllAnimals']);
        Route::get('/animales/{id}', [GanadoController::class, 'getAnimalById']);
        Route::get('/animales/{id}/historial-peso', [GanadoController::class, 'getWeightHistory']);
        Route::post('/animales', [GanadoController::class, 'crearAnimal']);
        Route::put('/animales/{id}', [GanadoController::class, 'editarAnimal']);
        Route::delete('/animales/{id}', [GanadoController::class, 'eliminarAnimal']);
        Route::post('/estimar-peso', [GanadoController::class, 'estimarPeso']);
        Route::post('/animales/{id}/registrar-peso', [GanadoController::class, 'registrarPeso']);

        Route::get('/dashboard-stats', [GanadoController::class, 'getDashboardStats']);
        Route::get('/analisis-pesajes', [GanadoController::class, 'getAnalisisPesajes']);
        Route::get('/obtener-imagen-base64', [GanadoController::class, 'obtenerImagenBase64']);
    });

    // Reportes del ganadero.
    Route::middleware(['role:admin,ganadero'])->group(function () {
        Route::get('/reportes-ganadero', [ReporteController::class, 'getReportes']);
        Route::post('/reportes-ganadero', [ReporteController::class, 'guardarReporte']);
        Route::get('/reportes-ganadero/{id}', [ReporteController::class, 'getReporteDetalle']);
        Route::delete('/reportes-ganadero/{id}', [ReporteController::class, 'eliminarReporte']);
    });

    // Citas.
    Route::middleware(['role:admin,ganadero,veterinario'])->group(function () {
        Route::get('/citas', [CitaController::class, 'index']);
        Route::post('/citas', [CitaController::class, 'store']);
        Route::put('/citas/{id}', [CitaController::class, 'update']);
    });

    // Reportes veterinarios.
    Route::middleware(['role:admin,ganadero,veterinario'])->group(function () {
        Route::get('/reportes-veterinarios', [ReporteVeterinarioController::class, 'index']);
        Route::post('/reportes-veterinarios', [ReporteVeterinarioController::class, 'store']);
        Route::put('/reportes-veterinarios/{id}', [ReporteVeterinarioController::class, 'update']);
    });

    // Notificaciones.
    Route::middleware(['role:admin,ganadero,veterinario'])->group(function () {
        Route::get('/notificaciones', [NotificacionController::class, 'index']);
        Route::put('/notificaciones/leer-todas', [NotificacionController::class, 'readAll']);
        Route::put('/notificaciones/{id}/leer', [NotificacionController::class, 'read']);
        Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy']);
    });

    // Recordatorios sanitarios.
    Route::middleware(['role:admin,ganadero,veterinario'])->group(function () {
        Route::get('/recordatorios-sanitarios', [RecordatorioSanitarioController::class, 'index']);
        Route::post('/recordatorios-sanitarios', [RecordatorioSanitarioController::class, 'store']);
        Route::put('/recordatorios-sanitarios/{id}', [RecordatorioSanitarioController::class, 'update']);
        Route::delete('/recordatorios-sanitarios/{id}', [RecordatorioSanitarioController::class, 'destroy']);
        Route::post('/recordatorios-sanitarios/run-check', [RecordatorioSanitarioController::class, 'runCheck']);
    });

    // Panel administrativo API.
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'getDashboardStats']);
        Route::get('/usuarios', [AdminController::class, 'getUsuarios']);
        Route::post('/usuarios', [AdminController::class, 'crearUsuario']);
        Route::get('/usuarios/{id}', [AdminController::class, 'getUsuario']);
        Route::patch('/usuarios/{id}/status', [AdminController::class, 'toggleUsuarioStatus']);
        Route::get('/fincas', [AdminController::class, 'getFincas']);
        Route::get('/fincas/{id}', [AdminController::class, 'getFinca']);
        Route::get('/reportes', [AdminController::class, 'getReportes']);
        Route::get('/auditorias', [AdminController::class, 'getAuditLogs']);
    });

    // Panel veterinario con permisos por finca / animal.
    Route::middleware(['veterinario'])->prefix('veterinario')->group(function () {
        Route::get('/dashboard', [VeterinarioDashboardController::class, 'getDashboardData']);
        Route::get('/animal/{id}', [VeterinarioAnimalController::class, 'show']);
    });
});