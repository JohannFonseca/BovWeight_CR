<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\AdminWebController;

Route::get('/', function () {
    return redirect()->route('admin.login');
});

// Rutas del Panel de Administración Web (Blade)
Route::prefix('admin')->group(function () {
    // Rutas públicas / de invitados
    Route::get('/login', [AdminWebController::class, 'showLogin'])->name('admin.login');
    Route::post('/login', [AdminWebController::class, 'login'])->name('admin.login.submit');
    Route::post('/logout', [AdminWebController::class, 'logout'])->name('admin.logout');
    Route::get('/logout', [AdminWebController::class, 'logout']); // Fallback por GET para mayor comodidad

    // Rutas protegidas por el middleware 'admin'
    Route::middleware(['admin'])->group(function () {
        Route::get('/dashboard', [AdminWebController::class, 'dashboard'])->name('admin.dashboard');

        // CRUD Usuarios
        Route::get('/usuarios', [AdminWebController::class, 'usuarios'])->name('admin.usuarios');
        Route::post('/usuarios', [AdminWebController::class, 'crearUsuario'])->name('admin.usuarios.crear');
        Route::post('/usuarios/editar/{id}', [AdminWebController::class, 'editarUsuario'])->name('admin.usuarios.editar');
        Route::post('/usuarios/eliminar/{id}', [AdminWebController::class, 'eliminarUsuario'])->name('admin.usuarios.eliminar');
        Route::post('/usuarios/toggle/{id}', [AdminWebController::class, 'toggleUsuario'])->name('admin.usuarios.toggle');

        // CRUD Razas
        Route::get('/razas', [AdminWebController::class, 'razas'])->name('admin.razas');
        Route::post('/razas', [AdminWebController::class, 'crearRaza'])->name('admin.razas.crear');
    });
});
