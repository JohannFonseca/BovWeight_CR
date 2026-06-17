<?php
// database/migrations/2026_06_16_235449_create_citas_table.php

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
        Schema::create('citas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ganadero_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('veterinario_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('finca_id')->constrained('fincas')->onDelete('cascade');
            $table->foreignId('animal_id')->nullable()->constrained('animales')->onDelete('cascade');
            $table->date('fecha');
            $table->string('hora');
            $table->string('motivo');
            $table->string('estado')->default('pendiente'); // pendiente, aceptada, rechazada, completada, propuesta_veterinario
            $table->text('comentario_rechazo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citas');
    }
};
