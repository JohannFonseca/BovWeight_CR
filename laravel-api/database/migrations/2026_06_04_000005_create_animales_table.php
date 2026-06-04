<?php
// database/migrations/2026_06_04_000005_create_animales_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animales', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('numero_arete');
            $table->date('fecha_nacimiento')->nullable();
            $table->string('sexo')->default('macho');
            $table->string('color')->nullable();
            $table->string('estado')->default('activo');
            $table->foreignId('finca_id')->constrained('fincas')->onDelete('cascade');
            $table->foreignId('raza_id')->nullable()->constrained('razas')->onDelete('set null');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animales');
    }
};
