<?php
// routes/console.php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\RecordatorioSanitario;
use App\Models\Notificacion;
use Carbon\Carbon;

Artisan::command('inspire', function () {
    $this->comment(\Illuminate\Foundation\Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Comando para verificar recordatorios sanitarios y disparar notificaciones
 */
Artisan::command('recordatorios:notificar', function () {
    $this->info('Iniciando verificación de recordatorios sanitarios...');
    
    $hoy = Carbon::now()->toDateString();
    
    // Obtener recordatorios pendientes que no han sido notificados y cuya fecha es hoy o anterior
    $recordatorios = RecordatorioSanitario::with(['finca', 'animal'])
        ->where('estado', 'pendiente')
        ->where('notificado', false)
        ->whereDate('fecha_programada', '<=', $hoy)
        ->get();
        
    $count = $recordatorios->count();
    $this->info("Se encontraron {$count} recordatorios pendientes por notificar.");
    
    foreach ($recordatorios as $recordatorio) {
        $tipoStr = '';
        switch ($recordatorio->tipo) {
            case 'vacuna':
                $tipoStr = 'Vacunación';
                break;
            case 'desparasitacion':
                $tipoStr = 'Desparasitación';
                break;
            case 'revision_medica':
                $tipoStr = 'Revisión Médica';
                break;
            default:
                $tipoStr = 'Recordatorio';
                break;
        }

        $animalStr = $recordatorio->animal ? " para {$recordatorio->animal->nombre} (Arete: {$recordatorio->animal->numero_arete})" : "";
        $fincaStr = $recordatorio->finca ? " en finca {$recordatorio->finca->nombre}" : "";
        
        $descripcion = "Hoy se cumple el evento de {$tipoStr}: '{$recordatorio->titulo}'{$animalStr}{$fincaStr}.";
        if ($recordatorio->descripcion) {
            $descripcion .= " Notas: {$recordatorio->descripcion}";
        }
        
        // Crear la notificación en base de datos
        Notificacion::create([
            'usuario_id' => $recordatorio->usuario_id,
            'titulo' => "Recordatorio Sanitario: {$recordatorio->titulo}",
            'descripcion' => $descripcion,
            'tipo' => 'recordatorio',
            'leido' => false,
        ]);
        
        // Marcar como notificado para no repetir
        $recordatorio->notificado = true;
        $recordatorio->save();
        
        $this->info("Notificado: {$recordatorio->titulo} al usuario ID {$recordatorio->usuario_id}");
    }
    
    $this->info('Verificación de recordatorios completada.');
})->purpose('Verifica y dispara notificaciones de recordatorios sanitarios vencidos o para hoy');

// Programar la ejecución diaria a las 6:00 AM
Schedule::command('recordatorios:notificar')->dailyAt('06:00');
