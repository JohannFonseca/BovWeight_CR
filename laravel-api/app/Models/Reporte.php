<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

class Reporte extends Model
{
    use Auditable;

    protected $table = 'reportes';

    protected $fillable = [
        'titulo',
        'descripcion',
        'usuario_id',
        'animal_ids',
        'destinatario',
    ];

    protected $casts = [
        'animal_ids' => 'array',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}

