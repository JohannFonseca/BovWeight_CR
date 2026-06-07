@extends('layouts.admin')

@section('title', 'Dashboard - BovWeight CR Admin')

@section('content')
<div class="content-header">
    <div>
        <h1 class="page-title">Dashboard</h1>
        <div class="page-subtitle">Resumen general del estado de BovWeight CR</div>
    </div>
</div>

<!-- Grid de Métricas -->
<div class="metrics-grid">
    <div class="stat-card">
        <div class="stat-icon users">
            👥
        </div>
        <div class="stat-details">
            <h3>Usuarios</h3>
            <div class="stat-number">{{ $usuariosCount }}</div>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon fincas">
            🏡
        </div>
        <div class="stat-details">
            <h3>Fincas</h3>
            <div class="stat-number">{{ $fincasCount }}</div>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon bovinos">
            🐂
        </div>
        <div class="stat-details">
            <h3>Bovinos</h3>
            <div class="stat-number">{{ $animalesCount }}</div>
        </div>
    </div>
</div>

<!-- Tabla de últimos usuarios registrados -->
<div class="panel">
    <div class="panel-header">
        <h2 class="panel-title">Últimos Usuarios Registrados</h2>
        <a href="{{ route('admin.usuarios') }}" class="btn-secondary" style="font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            Ver todos
            <span>→</span>
        </a>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                </tr>
            </thead>
            <tbody>
                @forelse($ultimosUsuarios as $u)
                    <tr>
                        <td style="font-weight: 500;">{{ $u->nombre_completo ?? 'Sin nombre' }}</td>
                        <td>{{ $u->correo }}</td>
                        <td>
                            <span class="badge badge-role-{{ strtolower($u->rol->nombre) }}">
                                {{ $u->rol->nombre }}
                            </span>
                        </td>
                        <td>
                            @if($u->activo)
                                <span class="badge badge-success">Activo</span>
                            @else
                                <span class="badge badge-danger">Inactivo</span>
                            @endif
                        </td>
                        <td>{{ $u->created_at->format('d/m/Y') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 30px;">
                            No hay usuarios registrados en el sistema.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
