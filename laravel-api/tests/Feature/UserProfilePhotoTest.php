<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed standard roles
        Role::create(['nombre' => 'admin', 'descripcion' => 'Administrador']);
        Role::create(['nombre' => 'ganadero', 'descripcion' => 'Ganadero']);
    }

    public function test_can_upload_profile_photo_as_file()
    {
        Storage::fake('public');

        $role = Role::where('nombre', 'ganadero')->first();
        $user = Usuario::create([
            'correo' => 'test@bovweight.com',
            'contrasena_hash' => bcrypt('password123'),
            'nombre_completo' => 'Juan Perez',
            'rol_id' => $role->id,
            'activo' => true,
        ]);

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->putJson("/api/usuarios/{$user->id}", [
            'correo' => 'test@bovweight.com',
            'nombre_completo' => 'Juan Perez',
            'foto' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'foto_url']);

        $user->refresh();
        $this->assertNotNull($user->foto_url);
        $this->assertStringContainsString('storage/avatars/', $user->foto_url);

        $fileName = basename(parse_url($user->foto_url, PHP_URL_PATH));
        Storage::disk('public')->assertExists('avatars/' . $fileName);
    }

    public function test_can_upload_profile_photo_as_base64()
    {
        Storage::fake('public');

        $role = Role::where('nombre', 'ganadero')->first();
        $user = Usuario::create([
            'correo' => 'test@bovweight.com',
            'contrasena_hash' => bcrypt('password123'),
            'nombre_completo' => 'Juan Perez',
            'rol_id' => $role->id,
            'activo' => true,
        ]);

        // Standard 1x1 pixel base64 GIF
        $base64Image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        $response = $this->putJson("/api/usuarios/{$user->id}", [
            'correo' => 'test@bovweight.com',
            'nombre_completo' => 'Juan Perez',
            'foto_base64' => $base64Image,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'foto_url']);

        $user->refresh();
        $this->assertNotNull($user->foto_url);
        $this->assertStringContainsString('storage/avatars/', $user->foto_url);

        $fileName = basename(parse_url($user->foto_url, PHP_URL_PATH));
        Storage::disk('public')->assertExists('avatars/' . $fileName);
    }
}
