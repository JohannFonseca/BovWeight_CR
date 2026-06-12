<?php
// app/Models/EstimacionPeso.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimacionPeso extends Model
{
    use HasFactory;

    protected $table = 'estimaciones_peso';

    protected $fillable = [
        'animal_id',
        'peso_estimado_kg',
        'peso_corregido_kg',
        'ruta_imagen',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }
}
