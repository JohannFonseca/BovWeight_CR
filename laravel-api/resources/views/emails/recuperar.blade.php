<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - BovWeight CR</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f0;
            color: #2c3e2d;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(44, 62, 45, 0.05);
            border: 1px solid rgba(85, 107, 47, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1b5e20;
        }
        .message {
            font-size: 15px;
            color: #5c6e58;
            margin-bottom: 30px;
        }
        .credentials-card {
            background-color: #fdfbf7;
            border: 1px dashed #e2dcd0;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 30px;
        }
        .credential-item {
            margin-bottom: 12px;
            font-size: 15px;
        }
        .credential-item:last-child {
            margin-bottom: 0;
        }
        .credential-label {
            font-weight: 800;
            color: #8ba888;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
        }
        .credential-value {
            font-size: 16px;
            color: #2c3e2d;
            font-weight: 600;
        }
        .credential-value.password {
            font-family: 'Courier New', Courier, monospace;
            background-color: #eaf0e6;
            color: #2e7d32;
            padding: 4px 8px;
            border-radius: 6px;
            display: inline-block;
            font-weight: 800;
            letter-spacing: 1px;
        }
        .alert-box {
            background-color: #fff8e1;
            border-left: 4px solid #ffb300;
            border-radius: 4px 12px 12px 4px;
            padding: 16px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #5d4037;
        }
        .alert-box p {
            margin: 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #8da28a;
            border-top: 1px solid #f1f3f0;
        }
        .footer p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BovWeight CR</h1>
            <p>Recuperación de Acceso</p>
        </div>
        <div class="content">
            <div class="greeting">¡Hola, {{ $nombre }}!</div>
            <div class="message">
                Hemos recibido una solicitud para restablecer la contraseña de su cuenta en BovWeight CR. A continuación encontrará sus nuevas credenciales de acceso temporal.
            </div>
            
            <div class="credentials-card">
                <div class="credential-item">
                    <span class="credential-label">Correo Electrónico</span>
                    <span class="credential-value">{{ $correo }}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Contraseña Temporal de Recuperación</span>
                    <span class="credential-value password">{{ $passwordTemporal }}</span>
                </div>
            </div>
 
            <div class="alert-box">
                <p><strong>⚠️ Importante:</strong> Esta contraseña temporal expirará en 24 horas y al iniciar sesión se le solicitará cambiarla obligatoriamente por motivos de seguridad.</p>
            </div>
            
            <p class="message" style="font-size: 13px; color: #8da28a; margin-top: 20px;">
                Si usted no solicitó este cambio, por favor ignore este correo o póngase en contacto con el administrador del sistema para asegurar su cuenta.
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} BovWeight CR. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
