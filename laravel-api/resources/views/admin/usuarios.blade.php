@extends('layouts.admin')

@section('title', 'Gestión de Usuarios - BovWeight CR Admin')

@section('content')
<div class="content-header">
    <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <div class="page-subtitle">Crea, edita, activa o elimina cuentas de empleados y ganaderos</div>
    </div>
    <button type="button" class="btn-primary-action" onclick="openModal('create-modal')" style="display: inline-flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
        </svg>
        Registrar Usuario
    </button>
</div>

<!-- Tabla de Usuarios -->
<div class="panel">
    <div class="panel-header">
        <h2 class="panel-title">Lista de Usuarios</h2>
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
                    <th style="text-align: right;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($usuarios as $u)
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
                        <td>{{ $u->creado_en }}</td>
                        <td style="text-align: right;">
                            <div class="actions-group" style="justify-content: flex-end;">
                                <!-- Botón Toggle Activo -->
                                <form action="{{ route('admin.usuarios.toggle', $u->id) }}" method="POST" style="display: inline;">
                                    @csrf
                                    <button type="submit" class="btn-icon toggle-active" title="{{ $u->activo ? 'Desactivar Usuario' : 'Activar Usuario' }}">
                                        @if($u->activo)
                                            🔒
                                        @else
                                            🔓
                                        @endif
                                    </button>
                                </form>

                                <!-- Botón Editar -->
                                <button type="button" class="btn-icon edit" title="Editar Datos"
                                        onclick="openEditModal({{ json_encode([
                                            'id' => $u->id,
                                            'correo' => $u->correo,
                                            'nombre_completo' => $u->nombre_completo ?? ''
                                        ]) }})">
                                    ✏️
                                </button>

                                <!-- Botón Eliminar -->
                                <form action="{{ route('admin.usuarios.eliminar', $u->id) }}" method="POST" style="display: inline;" onsubmit="return confirm('¿Estás completamente seguro de eliminar este usuario? Esta acción es irreversible.');">
                                    @csrf
                                    <button type="submit" class="btn-icon delete" title="Eliminar Usuario">
                                        🗑️
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 30px;">
                            No hay usuarios registrados en el sistema.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- MODAL CREAR USUARIO -->
<div id="create-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Registrar Nuevo Usuario</h3>
            <button class="modal-close" onclick="closeModal('create-modal')">&times;</button>
        </div>
        <form action="{{ route('admin.usuarios.crear') }}" method="POST">
            @csrf
            <div class="modal-body">
                <div class="form-group">
                    <label for="nombre_completo" class="form-label" style="color: var(--color-text-dark);">Nombre Completo</label>
                    <input type="text" name="nombre_completo" id="nombre_completo" class="form-control" placeholder="Juan Pérez" value="{{ old('nombre_completo') }}" required>
                </div>
                <div class="form-group">
                    <label for="correo_create" class="form-label" style="color: var(--color-text-dark);">Correo Electrónico</label>
                    <input type="email" name="correo" id="correo_create" class="form-control" placeholder="ejemplo@correo.com" value="{{ old('correo') }}" required>
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label for="contrasena" class="form-label" style="color: var(--color-text-dark);">Contraseña</label>
                        <input type="password" name="contrasena" id="contrasena" class="form-control" placeholder="Mínimo 4 caracteres" required>
                    </div>
                    <div class="form-group">
                        <label for="rol_id" class="form-label" style="color: var(--color-text-dark);">Rol Asignado</label>
                        <select name="rol_id" id="rol_id" class="select-control" required>
                            @foreach($roles as $r)
                                <option value="{{ $r->id }}" {{ old('rol_id') == $r->id ? 'selected' : '' }}>
                                    {{ ucfirst($r->nombre) }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('create-modal')">Cancelar</button>
                <button type="submit" class="btn-primary-action">Guardar Usuario</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL EDITAR USUARIO -->
<div id="edit-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Editar Usuario</h3>
            <button class="modal-close" onclick="closeModal('edit-modal')">&times;</button>
        </div>
        <form id="edit-form" method="POST">
            @csrf
            <div class="modal-body">
                <div class="form-group">
                    <label for="edit_nombre_completo" class="form-label" style="color: var(--color-text-dark);">Nombre Completo</label>
                    <input type="text" name="nombre_completo" id="edit_nombre_completo" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="edit_correo" class="form-label" style="color: var(--color-text-dark);">Correo Electrónico</label>
                    <input type="email" name="correo" id="edit_correo" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="edit_contrasena" class="form-label" style="color: var(--color-text-dark);">Nueva Contraseña (Opcional)</label>
                    <input type="password" name="contrasena" id="edit_contrasena" class="form-control" placeholder="Dejar en blanco para conservar actual">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('edit-modal')">Cancelar</button>
                <button type="submit" class="btn-primary-action">Actualizar Datos</button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    function openEditModal(user) {
        // Cargar los datos del usuario en el formulario del modal
        document.getElementById('edit_nombre_completo').value = user.nombre_completo;
        document.getElementById('edit_correo').value = user.correo;
        document.getElementById('edit_contrasena').value = '';
        
        // Modificar dinámicamente la acción de envío del formulario
        const baseUrl = "{{ route('admin.usuarios.editar', ':id') }}";
        document.getElementById('edit-form').action = baseUrl.replace(':id', user.id);
        
        // Abrir el modal
        openModal('edit-modal');
    }

    // Cerrar los modales haciendo clic fuera del contenido
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
</script>
@endsection
