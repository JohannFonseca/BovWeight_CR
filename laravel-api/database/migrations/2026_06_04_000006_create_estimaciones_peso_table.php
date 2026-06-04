<?php
// database/migrations/2026_06_04_000006_create_estimaciones_peso_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estimaciones_peso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained('animales')->onDelete('cascade');
            $table->decimal('peso_estimado_kg', 8, 2);
            $table->decimal('peso_corregido_kg', 8, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimaciones_peso');
    }
};
