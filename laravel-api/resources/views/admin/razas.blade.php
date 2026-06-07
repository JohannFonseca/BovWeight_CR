@extends('layouts.admin')

@section('title', 'Gestión de Razas - BovWeight CR Admin')

@section('content')
<div class="content-header">
    <div>
        <h1 class="page-title">Gestión de Razas</h1>
        <div class="page-subtitle">Registra nuevas razas de ganado para su uso en la estimación de peso</div>
    </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
    <!-- Formulario para Registrar Nueva Raza -->
    <div class="panel">
        <div class="panel-header">
            <h2 class="panel-title">Registrar Raza</h2>
        </div>
        <form action="{{ route('admin.razas.crear') }}" method="POST">
            @csrf
            <div class="modal-body" style="padding: 20px;">
                <div class="form-group">
                    <label for="nombre" class="form-label" style="color: var(--color-text-dark);">Nombre de la Raza</label>
                    <input type="text" name="nombre" id="nombre" class="form-control" placeholder="Ej. Brahman, Holstein" value="{{ old('nombre') }}" required>
                    @if($errors->has('nombre'))
                        <span style="color: #f87171; font-size: 13px; margin-top: 4px; display: block;">{{ $errors->first('nombre') }}</span>
                    @endif
                </div>
                <div class="form-group">
                    <label for="descripcion" class="form-label" style="color: var(--color-text-dark);">Descripción</label>
                    <textarea name="descripcion" id="descripcion" class="form-control" placeholder="Escribe detalles o características de la raza..." style="min-height: 120px; resize: vertical;">{{ old('descripcion') }}</textarea>
                    @if($errors->has('descripcion'))
                        <span style="color: #f87171; font-size: 13px; margin-top: 4px; display: block;">{{ $errors->first('descripcion') }}</span>
                    @endif
                </div>
                <button type="submit" class="btn-primary-action" style="width: 100%; justify-content: center; margin-top: 10px;">
                    Guardar Raza
                </button>
            </div>
        </form>
    </div>

    <!-- Lista de Razas existentes -->
    <div class="panel">
        <div class="panel-header">
            <h2 class="panel-title">Razas del Sistema</h2>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 30%;">Nombre</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($razas as $r)
                        <tr>
                            <td style="font-weight: 600; color: var(--color-accent);">{{ $r->nombre }}</td>
                            <td style="color: var(--color-text-muted);">{{ $r->descripcion ?? 'Sin descripción disponible.' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="2" style="text-align: center; color: var(--color-text-muted); padding: 30px;">
                                No hay razas registradas en el sistema.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
