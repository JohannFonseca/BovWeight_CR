<?php
// app/Models/ReporteVeterinario.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReporteVeterinario extends Model
{
    use HasFactory;

    protected $table = 'reportes_veterinarios';

    protected $fillable = [
        'veterinario_id',
        'ganadero_id',
        'finca_id',
        'animal_id',
        'observaciones',
        'diagnostico_preliminar',
        'recomendaciones',
        'medicamentos_sugeridos',
        'proxima_revision',
        'prioridad',
        'estado'
    ];

    public function veterinario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'veterinario_id');
    }

    public function ganadero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'ganadero_id');
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
