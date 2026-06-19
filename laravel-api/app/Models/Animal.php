<?php
// app/Models/Animal.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Animal extends Model
{
    use HasFactory, Auditable;

    protected $table = 'animales';

    protected $fillable = [
        'nombre',
        'numero_arete',
        'fecha_nacimiento',
        'sexo',
        'color',
        'estado',
        'finca_id',
        'raza_id',
        'observaciones',
    ];

    public function finca(): BelongsTo
    {
        return $this->belongsTo(Finca::class, 'finca_id');
    }

    public function raza(): BelongsTo
    {
        return $this->belongsTo(Raza::class, 'raza_id');
    }

    public function estimacionesPeso(): HasMany
    {
        return $this->hasMany(EstimacionPeso::class, 'animal_id');
    }

}
