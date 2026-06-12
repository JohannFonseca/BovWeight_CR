<?php

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
        Schema::table('estimaciones_peso', function (Blueprint $table) {
            $table->text('ruta_imagen')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimaciones_peso', function (Blueprint $table) {
            $table->dropColumn('ruta_imagen');
        });
    }
};
