<?php
// app/Models/RecordatorioSanitario.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecordatorioSanitario extends Model
{
    use HasFactory;

    protected $table = 'recordatorios_sanitarios';

    protected $fillable = [
        'usuario_id',
        'finca_id',
        'animal_id',
        'titulo',
        'descripcion',
        'tipo',
        'fecha_programada',
        'estado',
        'notificado'
    ];

    protected $casts = [
        'fecha_programada' => 'date:Y-m-d',
        'notificado' => 'boolean'
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
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
