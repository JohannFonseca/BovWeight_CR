<?php
// app/Http/Controllers/NotificacionController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notificacion;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones del usuario autenticado.
     */
    public function index(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $notificaciones = Notificacion::where('usuario_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notificaciones);
    }

    /**
     * Marcar una notificación como leída.
     */
    public function read(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $notificacion = Notificacion::where('usuario_id', $userId)->find($id);
        if (!$notificacion) {
            return response()->json(['message' => 'Notificación no encontrada'], 404);
        }

        $notificacion->leido = true;
        $notificacion->save();

        return response()->json([
            'message' => 'Notificación marcada como leída.',
            'notificacion' => $notificacion
        ]);
    }

    /**
     * Marcar todas las notificaciones del usuario como leídas.
     */
    public function readAll(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        Notificacion::where('usuario_id', $userId)
            ->where('leido', false)
            ->update(['leido' => true]);

        return response()->json([
            'message' => 'Todas las notificaciones marcadas como leídas.'
        ]);
    }

    /**
     * Eliminar una notificación.
     */
    public function destroy(Request $request, $id)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $notificacion = Notificacion::where('usuario_id', $userId)->find($id);
        if (!$notificacion) {
            return response()->json(['message' => 'Notificación no encontrada'], 404);
        }

        $notificacion->delete();

        return response()->json([
            'message' => 'Notificación eliminada exitosamente.'
        ]);
    }
}
