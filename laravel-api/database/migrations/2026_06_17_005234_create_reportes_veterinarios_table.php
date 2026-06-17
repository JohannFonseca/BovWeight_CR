<?php
// database/migrations/2026_06_17_005234_create_reportes_veterinarios_table.php

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
        Schema::create('reportes_veterinarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('veterinario_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('ganadero_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('finca_id')->constrained('fincas')->onDelete('cascade');
            $table->foreignId('animal_id')->constrained('animales')->onDelete('cascade');
            $table->text('observaciones');
            $table->text('diagnostico_preliminar');
            $table->text('recomendaciones');
            $table->text('medicamentos_sugeridos')->nullable();
            $table->date('proxima_revision')->nullable();
            $table->string('prioridad')->default('media'); // baja, media, alta, urgente
            $table->string('estado')->default('abierto'); // abierto, en_seguimiento, resuelto
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes_veterinarios');
    }
};
