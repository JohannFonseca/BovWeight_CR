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
        'activo',
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
}
