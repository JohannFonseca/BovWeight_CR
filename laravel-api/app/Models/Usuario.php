<?php
// app/Models/Usuario.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'usuarios';

    protected $fillable = [
        'correo',
        'contrasena_hash',
        'nombre_completo',
        'rol_id',
        'ganadero_id',
        'activo',
        'debe_cambiar_password',
        'password_expira_en',
        'foto_url',
    ];

    protected $hidden = [
        'contrasena_hash',
    ];

    /**
     * Get the password for the user (Laravel authentication compatibility).
     */
    public function getAuthPassword()
    {
        return $this->contrasena_hash;
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'rol_id');
    }

    public function fincas(): HasMany
    {
        return $this->hasMany(Finca::class, 'propietario_id');
    }

    public function ganadero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'ganadero_id');
    }

    public function veterinarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'ganadero_id');
    }

    public function fincasAsignadas(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Finca::class, 'finca_veterinario', 'veterinario_id', 'finca_id')
                    ->using(FincaVeterinario::class)
                    ->withPivot('activo', 'animales_autorizados')
                    ->withTimestamps();
    }

    public function isVeterinario(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'veterinario';
    }
}
