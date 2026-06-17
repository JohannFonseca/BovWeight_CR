<?php
// database/migrations/2026_06_17_060000_add_visita_recomendada_and_cita_id_to_reportes_veterinarios_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reportes_veterinarios', function (Blueprint $table) {
            $table->boolean('visita_recomendada')->default(false);
            $table->foreignId('cita_id')->nullable()->constrained('citas')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('reportes_veterinarios', function (Blueprint $table) {
            $table->dropForeign(['cita_id']);
            $table->dropColumn(['visita_recomendada', 'cita_id']);
        });
    }
};
