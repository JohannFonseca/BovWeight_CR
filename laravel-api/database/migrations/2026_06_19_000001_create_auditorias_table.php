<?php
// database/migrations/2026_06_19_000001_create_auditorias_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('auditorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->string('correo')->nullable();
            $table->string('accion'); // CREAR, MODIFICAR, ELIMINAR, LOGIN_EXITOSO, LOGIN_FALLIDO, BLOQUEO_IP
            $table->string('tabla')->nullable();
            $table->unsignedBigInteger('registro_id')->nullable();
            $table->json('detalles')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
