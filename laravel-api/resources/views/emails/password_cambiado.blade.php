<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Cambiada - BovWeight CR</title>
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
            margin-bottom: 20px;
        }
        .alert-box {
            background-color: #ffebee;
            border-left: 4px solid #d32f2f;
            border-radius: 4px 12px 12px 4px;
            padding: 16px;
            margin-bottom: 30px;
            font-size: 14px;
            color: #c62828;
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
            <p>Seguridad de la Cuenta</p>
        </div>
        <div class="content">
            <div class="greeting">¡Hola, {{ $nombre }}!</div>
            <div class="message">
                Le notificamos que la contraseña de acceso para su cuenta en **BovWeight CR** (asociada al correo: {{ $correo }}) ha sido modificada correctamente.
            </div>
            
            <div class="alert-box">
                <p><strong>⚠️ Si no realizó este cambio:</strong> Le recomendamos restablecer su contraseña de inmediato mediante la opción "Olvidé mi contraseña" en la pantalla de inicio o ponerse en contacto con el soporte administrativo.</p>
            </div>
            
            <p class="message">
                Si usted realizó esta modificación, no es necesario que realice ninguna acción adicional.
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} BovWeight CR. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
