<?php
// database/migrations/2026_06_04_000003_create_fincas_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fincas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('ubicacion');
            $table->foreignId('propietario_id')->constrained('usuarios')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fincas');
    }
};
