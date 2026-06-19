<?php
// database/migrations/2026_06_19_000002_add_ayudante_role.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if role 'ayudante' already exists, if not insert it
        if (!DB::table('roles')->where('nombre', 'ayudante')->exists()) {
            DB::table('roles')->insert([
                'nombre' => 'ayudante',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')->where('nombre', 'ayudante')->delete();
    }
};
