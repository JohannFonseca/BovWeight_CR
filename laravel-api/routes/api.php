<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GanadoController;
use App\Http\Controllers\ReporteController;

// Auth Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/cambiar-password', [AuthController::class, 'cambiarPassword']);
Route::post('/recuperar-password', [AuthController::class, 'recuperarPassword']);

// Roles and Razas Routes
Route::get('/roles', [AdminController::class, 'getRoles']);
Route::get('/razas', [AdminController::class, 'getRazas']);
Route::post('/razas', [AdminController::class, 'crearRaza']);

// Users CRUD Routes
Route::get('/usuarios', [AdminController::class, 'getUsuarios']);
Route::post('/usuarios', [AdminController::class, 'crearUsuario']);
Route::put('/usuarios/{id}', [AdminController::class, 'editarUsuario']);
Route::delete('/usuarios/{id}', [AdminController::class, 'eliminarUsuario']);
Route::put('/usuarios/{id}/toggle-activo', [AdminController::class, 'toggleEstadoUsuario']);
Route::post('/usuarios/{id}/reenviar-credenciales', [AdminController::class, 'reenviarCredenciales']);

// Veterinarians & Permissions Routes (within Ganadero space)
Route::get('/ganadero/veterinarios', [GanadoController::class, 'getVeterinariosGanadero']);
Route::post('/ganadero/veterinarios/asignar-finca', [GanadoController::class, 'asignarFincaVeterinario']);
Route::post('/ganadero/veterinarios/guardar-permisos', [GanadoController::class, 'guardarPermisosVeterinario']);
Route::delete('/ganadero/veterinarios/{vetId}/revocar-finca/{fincaId}', [GanadoController::class, 'revocarFincaVeterinario']);
Route::put('/ganadero/veterinarios/{vetId}/toggle-estado', [GanadoController::class, 'toggleEstadoVeterinario']);

// Fincas CRUD Routes
Route::get('/fincas', [GanadoController::class, 'getFincas']);
Route::post('/fincas', [GanadoController::class, 'crearFinca']);
Route::put('/fincas/{id}', [GanadoController::class, 'editarFinca']);
Route::delete('/fincas/{id}', [GanadoController::class, 'eliminarFinca']);

// Animales CRUD Routes
Route::get('/ganado-completo', [GanadoController::class, 'getGanadoCompleto']);
Route::get('/animales', [GanadoController::class, 'getAllAnimals']);
Route::get('/animales/{id}', [GanadoController::class, 'getAnimalById']);
Route::get('/animales/{id}/historial-peso', [GanadoController::class, 'getWeightHistory']);
Route::post('/animales', [GanadoController::class, 'crearAnimal']);
Route::put('/animales/{id}', [GanadoController::class, 'editarAnimal']);
Route::delete('/animales/{id}', [GanadoController::class, 'eliminarAnimal']);
Route::post('/estimar-peso', [GanadoController::class, 'estimarPeso']);
Route::post('/animales/{id}/registrar-peso', [GanadoController::class, 'registrarPeso']);

// Reportes Ganadero Routes
Route::get('/reportes-ganadero', [ReporteController::class, 'getReportes']);
Route::post('/reportes-ganadero', [ReporteController::class, 'guardarReporte']);
Route::get('/reportes-ganadero/{id}', [ReporteController::class, 'getReporteDetalle']);
Route::delete('/reportes-ganadero/{id}', [ReporteController::class, 'eliminarReporte']);

// Citas Routes
Route::get('/citas', [\App\Http\Controllers\CitaController::class, 'index']);
Route::post('/citas', [\App\Http\Controllers\CitaController::class, 'store']);
Route::put('/citas/{id}', [\App\Http\Controllers\CitaController::class, 'update']);

// Reportes Veterinarios Routes
Route::get('/reportes-veterinarios', [\App\Http\Controllers\ReporteVeterinarioController::class, 'index']);
Route::post('/reportes-veterinarios', [\App\Http\Controllers\ReporteVeterinarioController::class, 'store']);
Route::put('/reportes-veterinarios/{id}', [\App\Http\Controllers\ReporteVeterinarioController::class, 'update']);





// Dashboard & Weight Analysis Routes
Route::get('/admin/dashboard', [AdminController::class, 'getDashboardStats']);
Route::get('/admin/usuarios', [AdminController::class, 'getUsuarios']);
Route::post('/admin/usuarios', [AdminController::class, 'crearUsuario']);
Route::get('/admin/usuarios/{id}', [AdminController::class, 'getUsuario']);
Route::patch('/admin/usuarios/{id}/status', [AdminController::class, 'toggleUsuarioStatus']);
Route::get('/admin/fincas', [AdminController::class, 'getFincas']);
Route::get('/admin/fincas/{id}', [AdminController::class, 'getFinca']);
Route::get('/admin/reportes', [AdminController::class, 'getReportes']);
Route::get('/dashboard-stats', [GanadoController::class, 'getDashboardStats']);
Route::get('/analisis-pesajes', [GanadoController::class, 'getAnalisisPesajes']);
Route::get('/obtener-imagen-base64', [GanadoController::class, 'obtenerImagenBase64']);

// Notificaciones Routes
Route::get('/notificaciones', [\App\Http\Controllers\NotificacionController::class, 'index']);
Route::put('/notificaciones/leer-todas', [\App\Http\Controllers\NotificacionController::class, 'readAll']);
Route::put('/notificaciones/{id}/leer', [\App\Http\Controllers\NotificacionController::class, 'read']);
Route::delete('/notificaciones/{id}', [\App\Http\Controllers\NotificacionController::class, 'destroy']);

// Veterinarian Dashboard Routes
Route::middleware(['veterinario'])->prefix('veterinario')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\VeterinarioDashboardController::class, 'getDashboardData']);
    Route::get('/animal/{id}', [\App\Http\Controllers\VeterinarioAnimalController::class, 'show']);
});
