<?php
// database/migrations/2026_06_19_000000_create_recordatorios_sanitarios_table.php

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
        Schema::create('recordatorios_sanitarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('finca_id')->nullable()->constrained('fincas')->onDelete('cascade');
            $table->foreignId('animal_id')->nullable()->constrained('animales')->onDelete('cascade');
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('tipo'); // vacuna, desparasitacion, revision_medica, otro
            $table->date('fecha_programada');
            $table->string('estado')->default('pendiente'); // pendiente, completado
            $table->boolean('notificado')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recordatorios_sanitarios');
    }
};
