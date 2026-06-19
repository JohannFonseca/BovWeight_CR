<?php
// app/Models/Cita.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

class Cita extends Model
{
    use HasFactory, Auditable;

    protected $table = 'citas';

    protected $fillable = [
        'ganadero_id',
        'veterinario_id',
        'finca_id',
        'animal_id',
        'fecha',
        'hora',
        'motivo',
        'estado',
        'comentario_rechazo'
    ];

    public function ganadero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'ganadero_id');
    }

    public function veterinario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'veterinario_id');
    }

    public function finca(): BelongsTo
    {
        return $this->belongsTo(Finca::class, 'finca_id');
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }
}
