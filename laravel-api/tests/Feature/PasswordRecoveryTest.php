<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Role;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\RecuperarPasswordMail;
use App\Mail\PasswordCambiadoMail;

class PasswordRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private $role;

    protected function setUp(): void
    {
        parent::setUp();
        // Create default role for testing
        $this->role = Role::create(['nombre' => 'ganadero']);
    }

    public function test_request_password_recovery_success()
    {
        Mail::fake();

        // 1. Create a user
        $usuario = Usuario::create([
            'correo' => 'juan@bovweight.com',
            'contrasena_hash' => Hash::make('password123'),
            'nombre_completo' => 'Juan Perez',
            'rol_id' => $this->role->id,
            'activo' => true,
            'debe_cambiar_password' => false,
            'password_expira_en' => null,
        ]);

        // 2. Request recovery
        $response = $this->postJson('/api/recuperar-password', [
            'correo' => 'juan@bovweight.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'password_temporal_debug']);

        $tempPassword = $response->json('password_temporal_debug');
        $this->assertNotEmpty($tempPassword);

        // 3. Assert Mail was sent with the correct details
        Mail::assertSent(RecuperarPasswordMail::class, function ($mail) use ($usuario, $tempPassword) {
            return $mail->hasTo('juan@bovweight.com') && 
                   $mail->nombre === 'Juan Perez' && 
                   $mail->passwordTemporal === $tempPassword;
        });

        // 4. Assert database fields are correctly updated
        $usuario->refresh();
        $this->assertTrue(Hash::check($tempPassword, $usuario->contrasena_hash));
        $this->assertTrue((bool)$usuario->debe_cambiar_password);
        $this->assertNotNull($usuario->password_expira_en);
    }

    public function test_request_password_recovery_fails_with_invalid_or_non_existent_email()
    {
        Mail::fake();

        // Fails validation (invalid email)
        $response = $this->postJson('/api/recuperar-password', [
            'correo' => 'not-an-email',
        ]);
        $response->assertStatus(422);

        // Fails with 404 (non-existent email)
        $response = $this->postJson('/api/recuperar-password', [
            'correo' => 'nonexistent@bovweight.com',
        ]);
        $response->assertStatus(404);

        Mail::assertNothingSent();
    }

    public function test_change_password_success()
    {
        Mail::fake();

        // 1. Create user with must-change-password status (after recovery or welcome)
        $usuario = Usuario::create([
            'correo' => 'maria@bovweight.com',
            'contrasena_hash' => Hash::make('tempPass123'),
            'nombre_completo' => 'Maria Gomez',
            'rol_id' => $this->role->id,
            'activo' => true,
            'debe_cambiar_password' => true,
            'password_expira_en' => now()->addHours(24),
        ]);

        // 2. Post password change (without confirmar_password field)
        $response = $this->actingAs($usuario, 'sanctum')->postJson('/api/cambiar-password', [
            'id' => $usuario->id,
            'password_actual' => 'tempPass123',
            'nuevo_password' => 'newSecurePass456',
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Contraseña actualizada correctamente.']);

        // 3. Assert Database updated
        $usuario->refresh();
        $this->assertTrue(Hash::check('newSecurePass456', $usuario->contrasena_hash));
        $this->assertFalse((bool)$usuario->debe_cambiar_password);
        $this->assertNull($usuario->password_expira_en);

        // 4. Assert password changed mail notification was sent
        Mail::assertSent(PasswordCambiadoMail::class, function ($mail) {
            return $mail->hasTo('maria@bovweight.com') && 
                   $mail->nombre === 'Maria Gomez';
        });
    }

    public function test_change_password_fails_if_incorrect_current_password()
    {
        Mail::fake();

        $usuario = Usuario::create([
            'correo' => 'maria@bovweight.com',
            'contrasena_hash' => Hash::make('tempPass123'),
            'nombre_completo' => 'Maria Gomez',
            'rol_id' => $this->role->id,
            'activo' => true,
        ]);

        $response = $this->actingAs($usuario, 'sanctum')->postJson('/api/cambiar-password', [
            'id' => $usuario->id,
            'password_actual' => 'wrongTempPass',
            'nuevo_password' => 'newSecurePass456',
        ]);

        $response->assertStatus(422)
            ->assertJson(['message' => 'La contraseña actual es incorrecta.']);

        Mail::assertNothingSent();
    }
}
