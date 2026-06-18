# Reporte de Tareas Pendientes y No Implementadas - BovWeight CR

Este documento consolida únicamente las funcionalidades faltantes, riesgos de seguridad y mejoras técnicas pendientes de implementación en el sistema **BovWeight CR** tras la última auditoría.

---

## 1. SEGURIDAD Y ACCESO (Prioridad: Alta)

### 🔴 Vulnerabilidad de Spoofing de Identidad (Suplantación)
*   **Estado:** No implementada / Pendiente
*   **Descripción:** El backend en Laravel confía en las cabeceras `X-User-Id` y `X-User-Role` enviadas por Axios en texto plano desde el frontend sin verificación criptográfica. Cualquier usuario malintencionado podría falsificar estas cabeceras para acceder como otro usuario o rol.
*   **Solución recomendada:** Implementar **Laravel Sanctum** o **JWT** para firmar y validar todas las solicitudes a la API a través de tokens seguros.


### 🟡 Logs de Auditoría e Intentos Fallidos
*   **Estado:** No implementada / Pendiente
*   **Descripción:** Falta registrar las actividades críticas en el sistema (quién creó/eliminó/modificó datos) e intentos de inicio de sesión fallidos para prevención de ataques de fuerza bruta.
*   **Solución recomendada:** Crear una tabla `auditorias` en Laravel para persistir logs de acciones de los usuarios y un middleware para registrar/bloquear IPs ante reiterados inicios de sesión fallidos.

---

## 2. SINCRONIZACIÓN Y MODO OFFLINE (Prioridad: Alta)

### 🔴 Riesgo de Desbordamiento de Cuota en LocalStorage
*   **Estado:** No implementada / Pendiente
*   **Descripción:** El sistema utiliza `LocalStorage` para almacenar temporalmente imágenes de pesajes en Base64 cuando no hay conexión. Debido a que el límite de almacenamiento de LocalStorage en navegadores y WebView es de ~5MB, acumular más de 40-50 fotos causará un colapso del almacenamiento y pérdida de datos.
*   **Solución recomendada:** Migrar la cola de sincronización offline a **IndexedDB**, que permite capacidades de almacenamiento prácticamente ilimitadas en el dispositivo móvil.

### 🟡 Notificaciones Push Nativas (OS)
*   **Estado:** No implementada / Pendiente
*   **Descripción:** Aunque la aplicación tiene un Centro de Notificaciones interno (campana en el header), no tiene soporte para notificaciones Push integradas al sistema operativo del dispositivo móvil (iOS/Android) cuando la aplicación está cerrada o en segundo plano.
*   **Solución recomendada:** Integrar Firebase Cloud Messaging (FCM) y APNS para despachar alertas push nativas sobre citas propuestas, rechazos o reportes clínicos.

---

## 3. MÓDULO CLÍNICO (VETERINARIO) (Prioridad: Media)

### 🟡 Descarga de Reportes Clínicos en PDF
*   **Estado:** No implementada / Pendiente
*   **Descripción:** A diferencia del ganadero, el veterinario no cuenta con una opción para exportar en formato PDF las fichas de diagnósticos y recomendaciones clínicas que emite.
*   **Solución recomendada:** Integrar la librería `jsPDF` en la pantalla `VeterinarioReportes.vue` para generar reportes clínicos en formato PDF descargable.

### 🟡 Detección Dinámica de Pérdida de Peso
*   **Estado:** No implementada / Pendiente
*   **Descripción:** La detección de anomalías de peso en `VeterinarioDashboard.vue` se basa en un umbral estático y rígido (si el animal pesa menos de 350kg), lo cual no es clínicamente representativo para hatos jóvenes o razas de diferente contextura.
*   **Solución recomendada:** Implementar un algoritmo dinámico que compare el último pesaje contra el histórico y alerte al veterinario si hay una pérdida de peso porcentual mayor al 10% en los últimos 30 días.

---

## 4. MÓDULO GANADERO (Prioridad: Media)

### 🟡 Recordatorios Sanitarios Parametrizables
*   **Estado:** No implementada / Pendiente
*   **Descripción:** El ganadero recibe alertas automáticas si hay animales sin pesajes, pero el sistema carece de un gestor de recordatorios sanitarios configurables por el usuario para programar eventos como vacunas, desparasitaciones o revisiones médicas periódicas.
*   **Solución recomendada:** Diseñar un modelo `RecordatorioSanitario` en Laravel, su CRUD correspondiente en el frontend y un proceso programado (cronjob) para disparar las notificaciones en las fechas límite.

---

## 5. INFRAESTRUCTURA Y OPTIMIZACIÓN (Prioridad: Baja)

### 🟢 Fallback de Inteligencia Artificial Rígido
*   **Estado:** No implementada / Pendiente
*   **Descripción:** En caso de caída de la API de IA, el backend ejecuta el comando global `python` directamente en el shell. Esto requiere que el PATH global del servidor tenga instaladas dependencias críticas como `ultralytics` y `scikit-learn`, lo cual dificulta la portabilidad y el mantenimiento del servidor.
*   **Solución recomendada:** Configurar y referenciar la ruta de ejecución dentro de un entorno virtual aislado (`virtualenv` de Python) configurado por variable de entorno.
