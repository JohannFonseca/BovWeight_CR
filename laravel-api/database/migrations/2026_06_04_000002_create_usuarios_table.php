<?php
// database/migrations/2026_06_04_000002_create_usuarios_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->string('correo')->unique();
            $table->string('contrasena_hash');
            $table->string('nombre_completo')->nullable();
            $table->foreignId('rol_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('ganadero_id')->nullable()->constrained('usuarios')->onDelete('cascade');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
