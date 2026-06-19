# Plan de Pruebas Ejecutado (Unitarias + Integración) - BovWeight CR

Este documento detalla el plan de pruebas desarrollado y ejecutado para garantizar la estabilidad, consistencia de datos, seguridad por roles y precisión del sistema BovWeight CR.

---

## 1. Estrategia de Pruebas

La pirámide de pruebas del proyecto se divide en tres niveles para asegurar la calidad de la plataforma:

```
        / \
       /   \     Pruebas de Integración (Conexión API, AI Service, Base de Datos)
      /     \
     /=======\
    /         \  Pruebas Unitarias (Lógica de Modelos, Validaciones, Controladores)
   /___________\
```

1. **Pruebas Unitarias (Backend)**: Validan de forma aislada la lógica de negocio de los modelos Eloquent, las validaciones de formularios de registro y las respuestas básicas de los controladores de Laravel.
2. **Pruebas de Integración (Backend + AI + DB)**: Validan el flujo de autenticación seguro, el cumplimiento de restricciones de políticas de acceso por rol y la comunicación HTTP sincrónica entre Laravel y el microservicio de Inteligencia Artificial en Python.
3. **Pruebas Funcionales (Frontend / Offline)**: Validan el flujo de captura offline de estimaciones, la persistencia en IndexedDB y el comportamiento de la cola de sincronización.

---

## 2. Pruebas Unitarias (Backend Laravel)

Las pruebas unitarias se ejecutan utilizando el framework PHPUnit integrado en Laravel.

### Caso de Prueba U1: Validación de Correo Único en Usuarios
- **Objetivo**: Garantizar que el sistema no permita registrar dos usuarios con el mismo correo electrónico.
- **Entrada**: Registro de usuario con correo `ganadero@test.com` (ya existente en la base de datos).
- **Resultado Esperado**: Código de respuesta HTTP `409 Conflict` o `422 Unprocessable Entity` indicando que el correo ya está en uso.
- **Resultado Obtenido**: **Exitoso**. Código HTTP `409` con el mensaje: "Ya existe un usuario con el correo: ganadero@test.com".

### Caso de Prueba U2: Validación de Arete Único de Bovino
- **Objetivo**: Asegurar que cada animal tenga un número de arete identificador único a nivel nacional.
- **Entrada**: Intento de crear un animal con número de arete `CR-1001` (asignado previamente al animal 'Clara').
- **Resultado Esperado**: Error de validación de base de datos o controlador.
- **Resultado Obtenido**: **Exitoso**. Validación de Laravel retorna error indicando que el campo `numero_arete` ya ha sido registrado.

### Caso de Prueba U3: Expiración de Contraseña Temporal
- **Objetivo**: Comprobar que una contraseña temporal de recuperación expire pasadas las 24 horas.
- **Entrada**: Intento de inicio de sesión de un usuario con contraseña temporal cuya columna `password_expira_en` está en el pasado.
- **Resultado Esperado**: Código de estado HTTP `403 Forbidden` con mensaje indicando expiración.
- **Resultado Obtenido**: **Exitoso**. Laravel retorna: "Su contraseña temporal ha expirado. Contacte al administrador."

---

## 3. Pruebas de Integración y Seguridad

### Caso de Prueba I1: Control de Acceso por Roles (RBAC)
- **Objetivo**: Validar que un usuario con rol 'ganadero' o 'veterinario' no pueda acceder a las rutas de administración (`/api/admin/*`).
- **Entrada**: Petición GET a `/api/admin/usuarios` utilizando un token Bearer perteneciente a `ganadero@test.com`.
- **Resultado Esperado**: Código de respuesta HTTP `403 Forbidden` con mensaje de acceso denegado.
- **Resultado Obtenido**: **Exitoso**. El middleware `EnsureRole` intercepta la petición y responde con `403` "Acceso denegado. No tienes permisos para realizar esta acción."

### Caso de Prueba I2: Conexión con Microservicio de IA (Python)
- **Objetivo**: Confirmar la correcta llamada e interpretación de resultados del microservicio Python por parte de Laravel al estimar peso.
- **Entrada**: Petición POST a `/api/estimar-peso` con perímetros corporales (torácico: 180 cm, longitud: 150 cm).
- **Resultado Esperado**: Laravel debe realizar una petición POST interna a `AI_SERVICE_URL`, recibir el JSON y registrar el pesaje.
- **Resultado Obtenido**: **Exitoso**. Respuesta del microservicio decodificada correctamente, retornando un peso estimado aproximado de `415 kg`.

### Caso de Prueba I3: Permisos de Fincas para Veterinarios
- **Objetivo**: Validar que un veterinario no pueda ver animales de fincas que no le han sido explícitamente autorizadas.
- **Entrada**: Petición GET a `/api/animales/3` (animal 'Lola' en finca 'El Capulín') por un veterinario que solo tiene asignado el acceso a la finca 'La Ensenada'.
- **Resultado Esperado**: Código HTTP `403 Forbidden` bloqueando el expediente.
- **Resultado Obtenido**: **Exitoso**. El controlador verifica la tabla pivot `finca_veterinario` y restringe el acceso.

---

## 4. Pruebas Funcionales y de Sincronización Offline (Frontend SPA)

Estas pruebas se ejecutan directamente sobre la aplicación híbrida simulando condiciones reales de campo.

### Caso de Prueba F1: Captura de Peso en Modo Offline
- **Objetivo**: Comprobar que una estimación realizada sin red se guarde localmente de forma íntegra.
- **Pasos de Ejecución**:
  1. Activar el Modo Avión en el dispositivo de prueba.
  2. Abrir BovWeight CR y presionar "Estimar Peso con IA".
  3. Rellenar el formulario biométrico y presionar "Enviar a la IA".
- **Resultado Esperado**: La aplicación detecta la ausencia de internet, cancela la petición Axios y almacena el objeto en IndexedDB en estado `pendiente_local`. Muestra un indicador en pantalla.
- **Resultado Obtenido**: **Exitoso**. El pesaje aparece con estado "Pendiente" en el Dashboard.

### Caso de Prueba F2: Sincronización Automática al Volver Online
- **Objetivo**: Verificar que la cola offline se procese de manera desatendida cuando el internet retorne.
- **Pasos de Ejecución**:
  1. Contar con un elemento pendiente en la cola.
  2. Desactivar el Modo Avión (conectar a Wi-Fi/Datos).
- **Resultado Esperado**: El navegador dispara el evento `online`, el servicio `offlineSyncService` despierta, lee la cola local y realiza las peticiones pendientes una a una. Al finalizar, la UI se actualiza con los pesos finales y limpia la cola local.
- **Resultado Obtenido**: **Exitoso**. El elemento pasa de "Subiendo..." a "Procesando IA" y finalmente a "Listo", agregándose al historial del animal.

---

## 5. Reporte de Ejecución y Cobertura

### Comandos de Ejecución de Pruebas
Para correr la suite completa de pruebas unitarias y de integración en el backend:
```bash
cd laravel-api
php artisan test
```

### Resultados de la Suite Automatizada
```
PASS  Tests\Unit\UserTest
✓ validation of email uniqueness
✓ temporary password expiration check

PASS  Tests\Integration\AuthTest
✓ login with correct credentials returns sanctum token
✓ login with incorrect credentials returns 401
✓ role validation middleware redirects unauthorized users

PASS  Tests\Integration\AnimalEstimationTest
✓ animal creation validations
✓ weight estimation requests external python service correctly
✓ veterinario authorization constraints on animal profiles

Tests:    8 passed (14 assertions)
Duration: 2.14s
```

---

## 6. Integración en el Pipeline CI/CD

El plan de pruebas detallado anteriormente está integrado en el workflow de **GitHub Actions** (`.github/workflows/ci-cd.yml`). 
- Cada vez que se crea un Pull Request o se realiza un Push a la rama `main`, el pipeline descarga dependencias, levanta una base de datos PostgreSQL de prueba y ejecuta la suite de pruebas automatizadas.
- Si alguna prueba falla, el despliegue a **Railway** y **Supabase** se detiene inmediatamente para evitar subir código inestable a producción.
