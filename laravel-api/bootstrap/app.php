<?php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Se registra en el grupo api para evitar interferir con peticiones globales u OPTIONS.
        $middleware->api(append: [
            \App\Http\Middleware\HandleAyudanteRole::class,
        ]);

        // Registra alias de middlewares.
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'veterinario' => \App\Http\Middleware\EnsureVeterinarioAccess::class,
            'audit.login' => \App\Http\Middleware\AuditLoginAttempts::class,
            'role' => \App\Http\Middleware\EnsureRole::class,
            'auth.user.headers' => \App\Http\Middleware\AttachAuthenticatedUserHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Fuerza JSON en errores de API.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();