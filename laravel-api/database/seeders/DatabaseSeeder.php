<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Usuario;
use App\Models\Raza;
use App\Models\Finca;
use App\Models\Animal;
use App\Models\EstimacionPeso;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles
        $adminRole = Role::create(['nombre' => 'admin']);
        $ganaderoRole = Role::create(['nombre' => 'ganadero']);
        $vetRole = Role::create(['nombre' => 'veterinario']);

        // 2. Seed Users
        $admin = Usuario::create([
            'correo' => 'admin@test.com',
            'contrasena_hash' => '1234', // In plain text to match Supabase Auth fallback
            'nombre_completo' => 'Administrador BovWeight',
            'rol_id' => $adminRole->id,
            'activo' => true,
        ]);

        $ganadero = Usuario::create([
            'correo' => 'ganadero@test.com',
            'contrasena_hash' => '1234',
            'nombre_completo' => 'Pedro Ganadero',
            'rol_id' => $ganaderoRole->id,
            'activo' => true,
        ]);

        $vet = Usuario::create([
            'correo' => 'vet@test.com',
            'contrasena_hash' => '1234',
            'nombre_completo' => 'Ana Veterinaria',
            'rol_id' => $vetRole->id,
            'activo' => true,
        ]);

        // 3. Seed Fincas
        $finca1 = Finca::create([
            'nombre' => 'La Ensenada',
            'ubicacion' => 'San Carlos, Alajuela',
            'propietario_id' => $ganadero->id,
        ]);

        $finca2 = Finca::create([
            'nombre' => 'El Capulín',
            'ubicacion' => 'Liberia, Guanacaste',
            'propietario_id' => $ganadero->id,
        ]);

        // 4. Seed Razas
        $brahman = Raza::create(['nombre' => 'Brahman', 'descripcion' => 'Raza cebuina productora de carne']);
        $charolais = Raza::create(['nombre' => 'Charolais', 'descripcion' => 'Raza europea de gran musculatura']);
        $nelore = Raza::create(['nombre' => 'Nelore', 'descripcion' => 'Raza cebuina resistente a climas tropicales']);
        $holstein = Raza::create(['nombre' => 'Holstein', 'descripcion' => 'Raza lechera por excelencia']);

        // 5. Seed Animals
        $animal1 = Animal::create([
            'nombre' => 'Clara',
            'numero_arete' => 'CR-1001',
            'fecha_nacimiento' => Carbon::now()->subYears(3)->format('Y-m-d'),
            'sexo' => 'hembra',
            'color' => 'blanco',
            'estado' => 'activo',
            'finca_id' => $finca1->id,
            'raza_id' => $brahman->id,
            'observaciones' => 'Hembra reproductora sana',
        ]);

        $animal2 = Animal::create([
            'nombre' => 'Relámpago',
            'numero_arete' => 'CR-1002',
            'fecha_nacimiento' => Carbon::now()->subYears(2)->format('Y-m-d'),
            'sexo' => 'macho',
            'color' => 'crema',
            'estado' => 'activo',
            'finca_id' => $finca1->id,
            'raza_id' => $charolais->id,
            'observaciones' => 'Macho joven de engorde',
        ]);

        $animal3 = Animal::create([
            'nombre' => 'Lola',
            'numero_arete' => 'CR-1003',
            'fecha_nacimiento' => Carbon::now()->subYears(4)->format('Y-m-d'),
            'sexo' => 'hembra',
            'color' => 'negro con blanco',
            'estado' => 'activo',
            'finca_id' => $finca2->id,
            'raza_id' => $holstein->id,
            'observaciones' => 'Alta productora de leche',
        ]);

        // 6. Seed Weights (Last 6 months)
        $now = Carbon::now();

        // Weights for Clara
        for ($i = 5; $i >= 0; $i--) {
            EstimacionPeso::create([
                'animal_id' => $animal1->id,
                'peso_estimado_kg' => 380 + ((5 - $i) * 12),
                'peso_corregido_kg' => 382 + ((5 - $i) * 12.5),
                'created_at' => $now->copy()->subMonths($i),
            ]);
        }

        // Weights for Relámpago
        for ($i = 5; $i >= 0; $i--) {
            EstimacionPeso::create([
                'animal_id' => $animal2->id,
                'peso_estimado_kg' => 420 + ((5 - $i) * 15),
                'peso_corregido_kg' => 425 + ((5 - $i) * 16),
                'created_at' => $now->copy()->subMonths($i),
            ]);
        }

        // Weights for Lola
        for ($i = 5; $i >= 0; $i--) {
            EstimacionPeso::create([
                'animal_id' => $animal3->id,
                'peso_estimado_kg' => 480 + ((5 - $i) * 8),
                'peso_corregido_kg' => 482 + ((5 - $i) * 8.2),
                'created_at' => $now->copy()->subMonths($i),
            ]);
        }
    }
}
