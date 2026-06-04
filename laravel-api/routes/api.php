<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GanadoController;

// Auth Routes
Route::post('/login', [AuthController::class, 'login']);

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

// Fincas CRUD Routes
Route::get('/fincas', [GanadoController::class, 'getFincas']);
Route::post('/fincas', [GanadoController::class, 'crearFinca']);
Route::delete('/fincas/{id}', [GanadoController::class, 'eliminarFinca']);

// Animales CRUD Routes
Route::get('/ganado-completo', [GanadoController::class, 'getGanadoCompleto']);
Route::get('/animales', [GanadoController::class, 'getAllAnimals']);
Route::get('/animales/{id}', [GanadoController::class, 'getAnimalById']);
Route::get('/animales/{id}/historial-peso', [GanadoController::class, 'getWeightHistory']);
Route::post('/animales', [GanadoController::class, 'crearAnimal']);
Route::delete('/animales/{id}', [GanadoController::class, 'eliminarAnimal']);

// Dashboard & Weight Analysis Routes
Route::get('/dashboard-stats', [GanadoController::class, 'getDashboardStats']);
Route::get('/analisis-pesajes', [GanadoController::class, 'getAnalisisPesajes']);
