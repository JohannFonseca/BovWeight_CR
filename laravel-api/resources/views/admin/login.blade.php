<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - BovWeight CR Admin</title>
    <link rel="stylesheet" href="{{ asset('css/admin.css') }}">
</head>
<body class="login-body">
    <div class="login-card">
        <div class="login-header">
            <div class="login-logo">
                <span>🐂</span> BovWeightCR
            </div>
            <div class="login-title">Panel de Administración</div>
        </div>

        @if($errors->has('login_error'))
            <div class="alert alert-danger">
                {{ $errors->first('login_error') }}
            </div>
        @endif

        @if($errors->has('auth'))
            <div class="alert alert-danger">
                {{ $errors->first('auth') }}
            </div>
        @endif

        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        <form action="{{ route('admin.login.submit') }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="correo" class="form-label">Correo Electrónico</label>
                <input type="email" name="correo" id="correo" class="form-control" placeholder="admin@test.com" value="{{ old('correo') }}" required autofocus>
                @if($errors->has('correo'))
                    <span style="color: #f87171; font-size: 13px; margin-top: 4px; display: block;">{{ $errors->first('correo') }}</span>
                @endif
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Contraseña</label>
                <input type="password" name="password" id="password" class="form-control" placeholder="••••••••" required>
                @if($errors->has('password'))
                    <span style="color: #f87171; font-size: 13px; margin-top: 4px; display: block;">{{ $errors->first('password') }}</span>
                @endif
            </div>

            <button type="submit" class="btn-primary" style="margin-top: 10px;">
                Ingresar al Sistema
            </button>
        </form>

        <!-- Acceso Rápido Demo -->
        <div class="demo-accounts" style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
            <div style="font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 12px; text-align: center; font-weight: 500;">
                Acceso Rápido (Demo)
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                <button type="button" onclick="fillCredentials('admin@test.com', '1234')" style="background: rgba(67, 160, 71, 0.15); border: 1px solid rgba(67, 160, 71, 0.3); color: #4ade80; padding: 10px; font-size: 14px; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; width: 100%; transition: var(--transition);">
                    <span>👑 Administrador (Acceso)</span>
                    <span style="font-size: 12px; opacity: 0.8; font-weight: normal;">1234</span>
                </button>
                <button type="button" onclick="fillCredentials('ganadero@test.com', '1234')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255,255,255,0.8); padding: 10px; font-size: 14px; font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; width: 100%; transition: var(--transition);">
                    <span>🏡 Ganadero (Denegado)</span>
                    <span style="font-size: 12px; opacity: 0.5; font-weight: normal;">1234</span>
                </button>
                <button type="button" onclick="fillCredentials('vet@test.com', '1234')" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255,255,255,0.8); padding: 10px; font-size: 14px; font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; width: 100%; transition: var(--transition);">
                    <span>🩺 Veterinario (Denegado)</span>
                    <span style="font-size: 12px; opacity: 0.5; font-weight: normal;">1234</span>
                </button>
            </div>
        </div>

        <script>
            function fillCredentials(email, password) {
                document.getElementById('correo').value = email;
                document.getElementById('password').value = password;
                document.getElementById('correo').focus();
            }
        </script>
    </div>
</body>
</html>
