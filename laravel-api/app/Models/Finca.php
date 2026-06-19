<?php
// app/Models/Finca.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Finca extends Model
{
    use HasFactory, Auditable;

    protected $table = 'fincas';

    protected $fillable = ['nombre', 'ubicacion', 'propietario_id'];

    public function propietario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'propietario_id');
    }

    public function animales(): HasMany
    {
        return $this->hasMany(Animal::class, 'finca_id');
    }

    public function veterinariosAutorizados(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'finca_veterinario', 'finca_id', 'veterinario_id')
                    ->using(FincaVeterinario::class)
                    ->withTimestamps();
    }
}
