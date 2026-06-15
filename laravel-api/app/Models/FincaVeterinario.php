<?php
// app/Models/FincaVeterinario.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FincaVeterinario extends Pivot
{
    use HasFactory;

    protected $table = 'finca_veterinario';

    protected $fillable = [
        'finca_id',
        'veterinario_id',
        'animales_autorizados',
        'activo',
    ];

    protected $casts = [
        'animales_autorizados' => 'array',
        'activo' => 'boolean',
    ];

    public function finca(): BelongsTo
    {
        return $this->belongsTo(Finca::class, 'finca_id');
    }

    public function veterinario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'veterinario_id');
    }
}
