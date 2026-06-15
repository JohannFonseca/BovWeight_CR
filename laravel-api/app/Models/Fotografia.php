<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fotografia extends Model
{
    use HasFactory;

    protected $table = 'fotografias';

    protected $fillable = [
        'animal_id',
        'ruta_imagen',
        'fecha_captura',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }

    public function estimacionesPeso(): HasMany
    {
        return $this->hasMany(EstimacionPeso::class, 'fotografia_id');
    }
}
