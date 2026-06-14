<?php
// database/migrations/2026_06_14_000000_create_finca_veterinario_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finca_veterinario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finca_id')->constrained('fincas')->onDelete('cascade');
            $table->foreignId('veterinario_id')->constrained('usuarios')->onDelete('cascade');
            $table->json('animales_autorizados')->nullable(); // Guardamos los IDs de animales autorizados como [1, 2, 5]
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Evitar duplicados de la misma asignación de Finca y Veterinario
            $table->unique(['finca_id', 'veterinario_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finca_veterinario');
    }
};
