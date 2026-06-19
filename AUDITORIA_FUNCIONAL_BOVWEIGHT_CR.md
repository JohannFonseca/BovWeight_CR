# AUDITORIA FUNCIONAL BOVWEIGHT CR

Este documento detalla la auditoría funcional completa del sistema BovWeight CR, detallando las áreas revisadas, problemas de base de datos/roles resueltos, bitácora de correcciones y recomendaciones.

---

## 1. Funcionalidades Verificadas

Se realizó una inspección completa del backend (Laravel 11), frontend (Vue 3 + Ionic) y servicio de IA (Python), validando las siguientes áreas críticas:
1. **Flujo de Acceso y Cambio de Credenciales**: Login en línea/offline, flujo de cambio de contraseña temporal a definitiva y envío de notificaciones automáticas por correo electrónico.
2. **Control de Acceso Basado en Roles (RBAC)**: Restricciones de rutas del Administrador, accesos del Ganadero únicamente a sus registros y permisos del Veterinario restringidos a fincas/animales autorizados.
3. **Gestión de Fincas y Bovinos**: Listados de rebaños, registros médicos de pesajes, expediente zootécnico y carga de datos desde galería y cámara.
4. **Módulo de Estimaciones con IA**: Envío de imágenes al servicio Python, cálculo del peso por perímetro/longitud corporal e inserción de pesajes corregidos.
5. **Trabajo sin Conexión (Offline)**: Almacenamiento local en IndexedDB y sincronización diferida al detectar señal de red activa.

---

## 2. Funcionalidades Funcionando Correctamente

Tras la resolución de conflictos técnicos, las siguientes características operan de forma estable:
- **Autenticación e Interceptor**: Los tokens de Sanctum se guardan y transmiten correctamente. Al caducar el token (401), el interceptor expulsa de forma segura al usuario.
- **Auditoría Interna**: Bitácora del Administrador que registra de forma detallada las acciones ejecutadas en el backend.
- **Estimador Biométrico de Peso**: Envío y recepción de peso estimado mediante perímetro torácico y longitud corporal.
- **Envío de Correos Automáticos**: Recuperación y confirmación de claves temporales mediante SMTP de Gmail.

---

## 3. Funcionalidades con Errores Encontrados

- **Fuga de Datos al Cambiar de Sesión (Frontend)**: Al cerrar sesión con un usuario e iniciar sesión con otro, la aplicación móvil mantenía ciertos estados en memoria y cargaba datos de la sesión anterior si el servidor daba errores de consulta.
- **Incompatibilidad de Consultas PostgreSQL (Supabase)**: Laravel generaba errores 500 al evaluar columnas booleanas (como `activo` en tablas pivot e índices) utilizando enteros (`1` o `0`), provocando que las vistas del Veterinario y del Administrador estuvieran vacías o fallaran de forma silenciosa.
- **Cierre de Sesión Incompleto**: La acción de cerrar sesión en algunas páginas del Ganadero solo eliminaba la clave `usuario_sesion` de LocalStorage, dejando las claves `token` y `access_token` intactas.

---

## 4. Problemas de Seguridad Detectados

- **Falsificación potencial de X-User-Id**: El backend confiaba inicialmente en las cabeceras `X-User-Id` y `X-User-Role` enviadas desde el frontend.
  - *Mitigación*: Se reforzó el middleware `AttachAuthenticatedUserHeaders.php` para sobrescribir estas cabeceras en el servidor utilizando directamente los datos del token Sanctum validado.
- **Persistencia de Tokens Antiguos**: Los tokens anteriores de Sanctum permanecían activos tras múltiples logins sucesivos.
  - *Mitigación*: Se configuró `AuthController` para eliminar tokens anteriores al iniciar sesión (`$usuario->tokens()->delete()`).

---

## 5. Problemas de Datos Detectados

- **Mapeo de Tipos en Base de Datos**: Las columnas booleanas del pooler de Supabase no aceptaban comparaciones con enteros.
  - *Mitigación*: Se actualizaron las cláusulas Eloquent a expresiones nativas compatibles como `whereRaw` o booleanos puros.

---

## 6. Problemas de Interfaz Detectados

- **Estados de Carga Bloqueados**: Las pantallas de rebaño y dashboard del ganadero mostraban un spinner infinito si la API fallaba debido al error de compatibilidad SQL.
  - *Mitigación*: Se agregaron capturas de errores en los bloques `catch` de los componentes Vue para mostrar el botón de "Reintentar" y el estado offline correcto.

---

## 7. Problemas de Navegación Detectados

- **Persistencia de Estado del Enrutador**: Al usar `router.push('/login')` en el cierre de sesión, Vue 3 no recargaba las variables en caché del contexto global.
  - *Mitigación*: Se modificaron las funciones de logout de los componentes para limpiar LocalStorage por completo y realizar un redireccionamiento forzado con `window.location.href = '/login'`.

---

## 8. Correcciones Realizadas

1. **Middleware `EnsureVeterinarioAccess.php`**: Reemplazo de `wherePivot('activo', true)` por `whereRaw('finca_veterinario.activo = true')`.
2. **Controlador `VeterinarioDashboardController.php`**: Corrección de consulta pivot para adaptarla a booleanos nativos de PostgreSQL.
3. **Cierre de Sesión unificado**: Se actualizaron las vistas (`HomePage.vue`, `AjustesPage.vue`, `VeterinarioDashboard.vue`, etc.) para eliminar todas las claves de sesión residuales y forzar la recarga de página.
4. **Creación de CI/CD**: Archivo `.github/workflows/ci-cd.yml` para automatizar compilación y pruebas.
5. **Creación de Manuales**: Redacción de `documentacion_tecnica.md`, `manual_usuario.md` y `plan_pruebas.md` en el directorio `/docs`.
6. **Aislamiento de Caché Local (CacheManager)**: Se restauraron los prefijos de ID de usuario en las claves de caché de IndexedDB, previniendo filtraciones de datos cruzados al cambiar de cuenta.

---

## 9. Correcciones Pendientes

- **Revalidación offline en background**: La revalidación silenciosa de la caché en segundo plano de `CacheManager` debe omitirse si el servidor REST retorna errores de autorización (401) para evitar llamadas inútiles.

---

## 10. Recomendaciones antes de Generar Documentación Técnica

- Confirmar que los diagramas de entidad-relación y flujo de sincronización de la documentación coinciden con las especificaciones del microservicio de predicción de IA.
- Asegurar que la configuración del archivo `.env` del backend apunta a la URL correcta del pooler transaccional de Supabase en producción.

---

## 11. Recomendaciones antes de Generar Manual de Usuario

- Realizar un simulacro de uso offline con un dispositivo móvil físico en una zona rural sin datos para validar la facilidad de uso del indicador de cola de sincronización.
- Tomar capturas de pantalla de la interfaz de estimación de peso IA para ilustrar las pautas de enfoque y calidad de foto descritas en el manual.
