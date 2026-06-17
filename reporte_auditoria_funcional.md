# Reporte de Auditoría Funcional Completa - BovWeight CR

Este documento detalla el diagnóstico del estado actual de implementación de las funcionalidades del proyecto **BovWeight CR**, evaluando la aplicación móvil híbrida (Vue.js + Ionic), el backend (Laravel) y el microservicio de Inteligencia Artificial (Flask + YOLOv8).

---

## 1. MÓDULO LOGIN Y AUTENTICACIÓN
Verifica el acceso y control de seguridad en el sistema.

| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Inicio de sesión** | ✅ Implementada | Autenticación básica contra base de datos en `LoginPage.vue` y `LaravelAuthRepository`. |
| **Cierre de sesión** | ✅ Implementada | Limpieza de `usuario_sesion` de LocalStorage y redirección a login. Se unificó e integró la opción en todas las pantallas principales (Dashboard, Animales, Agenda, Reportes) de ganadero y veterinario. |
| **Validación de credenciales** | ✅ Implementada | Verificación básica de coincidencia de correo y contraseñas (hash MD5/bcrypt en Laravel). |
| **Redirección según rol** | ✅ Implementada | Manejado mediante guardias de navegación (`beforeEach`) en `src/router/index.ts`. |
| **Persistencia de sesión** | ✅ Implementada | Conservación del estado en el dispositivo local mediante LocalStorage. |
| **Recuperación de acceso** | ❌ No implementada | No hay enlaces en frontend para recuperar credenciales ni servicios/endpoints de restablecimiento en Laravel. |
| **Cambio de contraseña** | ✅ Implementada | Vista en `AjustesPage.vue` con envío de datos para cambio en BD. |
| **Control de permisos** | 🟡 Parcialmente implementada | **Riesgo Crítico:** Frontend envía cabeceras en texto plano `X-User-Id` y `X-User-Role` en Axios, que el backend lee directamente sin token firmado. |
| **Restricción por rol** | 🟡 Parcialmente implementada | El middleware `EnsureVeterinarioAccess` opera sobre las cabeceras vulnerables enviadas por el cliente. |

### Flujo de Credenciales Temporales Requerido
*   **El usuario NO se registra por sí mismo:** ✅ Implementado (Solo el administrador crea cuentas).
*   **El Administrador crea la cuenta:** ✅ Implementado (CRUD de usuarios en el panel administrativo).
*   **El sistema genera una contraseña temporal:** ❌ No implementado (El administrador debe digitar manualmente la contraseña inicial).
*   **El sistema envía las credenciales por correo:** ❌ No implementado (Falta configurar servicio de e-mail / SMTP y lógica de envío).
*   **La contraseña temporal vence en 24 horas:** ❌ No implementado (No existen campos en la tabla `usuarios` como `temporal_password_expires_at`).
*   **En el primer ingreso se obliga a cambiar contraseña:** ❌ No implementado (No hay una bandera de "primer_ingreso" o "cambio_obligatorio" en base de datos).
*   **Si la contraseña temporal vence, debe solicitar nuevas:** ❌ No implementado.

*   **Pantallas involucradas:** `src/modules/auth/pages/LoginPage.vue`, `src/modules/ganado/pages/AjustesPage.vue`
*   **Componentes involucrados:** `IonPage`, `IonInput`, `IonButton`.
*   **Servicios involucrados:** `LaravelAuthRepository` (`authRepository`), `localStorage` (`usuario_sesion`).
*   **Problemas encontrados:** Vulnerabilidad crítica de Spoofing (suplantación) de identidad debido al uso de cabeceras sin firmar (`X-User-Id` y `X-User-Role`) para autorizar peticiones en el backend.
*   **Recomendaciones técnicas:** Integrar **Laravel Sanctum** o **JWT** para firmar las peticiones con tokens criptográficos. Añadir columnas en la tabla `usuarios` para manejar contraseñas temporales (`contrasena_temporal`, `expires_at`, `debe_cambiar`).
*   **Prioridad:** **Alta**

---

## 2. MÓDULO ADMINISTRADOR
Panel de control para la gobernanza del hato y de los usuarios.

### Gestión de Usuarios y Veterinarios
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Crear usuarios (Ganadero/Vet)** | ✅ Implementada | Formulario de creación con asignación de roles en `AdminUsuarios.vue`. |
| **Editar usuarios** | ❌ No implementada | No hay interfaz ni endpoints para modificar datos de un usuario existente. |
| **Activar / Desactivar usuarios** | ✅ Implementada | Control a través de un switch/toggle de estado `activo` que bloquea accesos. |
| **Asignar roles** | ✅ Implementada | Selección de rol en el modal de creación (Ganadero o Veterinario). |
| **Restablecer acceso** | ❌ No implementada | No existe flujo administrativo para blanquear contraseñas de terceros. |
| **Registrar veterinarios** | ✅ Implementada | El administrador los crea vinculándolos a un Ganadero responsable. |
| **Editar/Consultar veterinarios** | 🟡 Parcialmente implementada | Se pueden consultar en el listado, pero no se pueden editar los datos de vinculación. |

### Seguridad e Información General
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Consultar logs / actividad** | ❌ No implementada | No hay base de datos de auditoría ni logs de acciones en el backend. |
| **Intentos fallidos / accesos** | ❌ No implementada | No hay registro de bloqueos de IP ni intentos de login infructuosos. |
| **Estadísticas generales** | ✅ Implementada | Dashboard muestra conteos de fincas, usuarios, animales y pesajes. |
| **Consultar reportes generados** | ✅ Implementada | Pantalla `AdminReportes.vue` permite visualizar informes del sistema. |
| **Flujos de contraseñas temporales** | ❌ No implementada | No hay automatización de credenciales temporales ni vencimiento en 24h. |

*   **Pantallas involucradas:** Carpeta `src/modules/admin/pages/*` (`AdminDashboard.vue`, `AdminUsuarios.vue`, `AdminFincas.vue`, `AdminReportes.vue`).
*   **Componentes involucrados:** `AdminLayout.vue`, `LineChart` (vue-chartjs), modales de creación.
*   **Servicios involucrados:** `adminApi` (`adminApi.ts` llamando a `/api/admin/*`).
*   **Problemas encontrados:** Falta de robustez en la seguridad general, carencia de auditoría física (logs) en BD y falta de opción para editar usuarios (solo permite togglear estado activo/bloqueado).
*   **Recomendaciones técnicas:** Desarrollar una tabla de logs (`auditorias` o `system_logs`) en Laravel para registrar inicios de sesión y modificaciones de datos. Agregar vista de edición para usuarios y veterinarios.
*   **Prioridad:** **Media**

---

## 3. MÓDULO VETERINARIO
Módulo clínico de seguimiento clínico y planificación de visitas.

### Acceso Autorizado y Gestión
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Consultar fincas y animales asignados** | ✅ Implementada | El dashboard y la sección `VeterinarioAnimales.vue` listan los hatos con acceso autorizado. |
| **Consultar expediente y evolución de peso** | ✅ Implementada | Detalle del bovino con gráficos evolutivos en `VeterinarioAnimalDetail.vue`. |
| **Consultar y visualizar reportes** | ✅ Implementada | Historial de reportes clínicos listados en `VeterinarioReportes.vue`. |
| **Descargar reportes clínicos** | ❌ No implementada | No se ha integrado `jsPDF` en las pantallas del Veterinario para exportar los diagnósticos. |

### Agenda y Seguimiento Clínico
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Consultar solicitudes de citas** | ✅ Implementada | Interfaz interactiva para el calendario de citas en `VeterinarioAgenda.vue`. |
| **Aceptar / Rechazar citas** | ✅ Implementada | Permite cambiar estado y adjuntar comentarios de rechazo. Se notifica automáticamente al Ganadero responsable. |
| **Reprogramar citas / Proponer visitas** | ✅ Implementada | Flujo donde el veterinario sugiere fecha/hora que espera confirmación del ganadero, con notificaciones automáticas en tiempo real en la app. |
| **Finalizar visitas** | ✅ Implementada | Marcar cita como "completada" en la agenda. |
| **Generar recomendaciones clínicas** | ✅ Implementada | El veterinario crea reportes clínicos vinculados a un animal. Se notifica automáticamente al Ganadero e indexa en su Centro de Notificaciones y expedientes. |
| **Detección de anomalías de peso** | 🟡 Parcialmente implementada | En `VeterinarioDashboard.vue` se listan alertas si el peso promedio del animal baja de 350kg, pero carece de análisis dinámico o porcentual. |

*   **Pantallas involucradas:** Carpeta `src/modules/veterinario/pages/*` (`VeterinarioDashboard.vue`, `VeterinarioAnimales.vue`, `VeterinarioAnimalDetail.vue`, `VeterinarioAgenda.vue`, `VeterinarioReportes.vue`).
*   **Componentes involucrados:** Modales de citas, tabs de filtros de estados, `LineChart` para tendencias de peso.
*   **Servicios involucrados:** `animalRepository` llamando a `/api/veterinario/*` y `/api/citas/*` y tabla pivote `finca_veterinario` con permisos JSON.
*   **Problemas encontrados:** Falta de descarga de reportes clínicos en PDF y carencia de un algoritmo robusto de pérdida de peso (basado en la pendiente de la curva en lugar de un umbral fijo de 350kg).
*   **Recomendaciones técnicas:** Implementar la exportación PDF para los reportes de salud del veterinario. Diseñar una alerta que compute el porcentaje de pérdida de peso en base al último pesaje del animal (ej: caída > 10% en un mes).
*   **Prioridad:** **Media**

---

## 4. MÓDULO GANADERO
Módulo de gestión diaria del hato, pesaje interactivo con IA e informes.

### Gestión de Fincas y Animales
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **CRUD de Fincas** | ✅ Implementada | Registro y edición de fincas del ganadero. |
| **CRUD de Animales** | ✅ Implementada | Alta de bovinos con arete único, nombre, raza, sexo y estado. |
| **Marcar como vendido o fallecido** | ✅ Implementada | Cambio de estado que los excluye del hato activo pero preserva su histórico. |
| **Búsqueda y filtros** | ✅ Implementada | Buscador por arete y filtros por raza/sexo en listados. |

### Estimación y Calibración por IA
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Captura y almacenamiento de fotos** | ✅ Implementada | Admite carga directa desde cámara o galería de imágenes de bovinos. |
| **Estimación de peso por IA** | ✅ Implementada | Envía la foto al microservicio Flask que procesa YOLOv8 y Random Forest para predecir peso y confianza. |
| **Fallback local (CLI)** | ✅ Implementada | Si el microservicio Flask falla, Laravel ejecuta localmente `predict_weight.py` por CLI. |
| **Medición manual alternativa** | ✅ Implementada | Carga manual de perímetro torácico y largo del animal como alternativa. |
| **Corrección de peso (Calibración)** | ✅ Implementada | El ganadero puede modificar el peso estimado por la IA si posee una báscula real y guardar la calibración. |

### Historial, Gráficos y Reportes
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Historial completo de pesajes/fotos** | ✅ Implementada | Línea de tiempo visualizable en el expediente del animal. |
| **Gráficos evolutivos** | ✅ Implementada | Representación gráfica del histórico con `vue-chartjs`. |
| **Recordatorios sanitarios/pesajes** | 🟡 Parcialmente implementada | El backend genera recordatorios automáticos en el Centro de Notificaciones cuando hay animales sin pesajes en los últimos 30 días, aunque faltan recordatorios sanitarios personalizables (vacunas, etc.). |
| **Visualizar reportes clínicos** | ✅ Implementada | El ganadero puede visualizar en su panel principal los diagnósticos y recomendaciones clínicas del veterinario. |
| **Generación de informes PDF** | ✅ Implementada | Exportación en `ReportsPage.vue` con jsPDF. |
| **Generar reportes en Excel/CSV** | ❌ Excluido | Desestimado de mutuo acuerdo para priorizar el formato estructurado de Ficha Técnica PDF con fotografías. |
| **Compartir reportes** | ✅ Implementada | Se integraron botones interactivos de WhatsApp y Email tanto en el listado de reportes guardados como en la vista previa del modal, permitiendo compartir los detalles del lote. |

### Sinergia y Citas
| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Consultar y vincular veterinarios** | ✅ Implementada | El ganadero asocia un veterinario a su finca y restringe qué animales puede consultar. |
| **Solicitar citas y consultar agenda** | ✅ Implementada | Peticiones directas de visitas técnicas. |
| **Aceptar/Rechazar propuestas del Vet** | ✅ Implementada | Flujo de aprobación para las visitas sugeridas. |

*   **Pantallas involucradas:** `src/modules/ganado/pages/*` (`AiEstimationPage.vue`, `AnimalDetailPage.vue`, `FincasPage.vue`, `RegistrarPage.vue`, `PersonalPage.vue`), `src/modules/reportes/pages/ReportsPage.vue`.
*   **Componentes involucrados:** Modales de calibración, visualizadores de gráficos, canvas de compresión de imágenes.
*   **Servicios involucrados:** `LaravelAnimalRepository` y Microservicio Flask (puerto 5001).
*   **Problemas encontrados:** Carencia absoluta de recordatorios sanitarios, y falta de exportación en formatos planos de hoja de cálculo (Excel/CSV).
*   **Recomendaciones técnicas:** Diseñar la tabla `recordatorios` y su respectiva interfaz. Agregar librerías como `xlsx` en frontend para habilitar descargas en Excel.
*   **Prioridad:** **Media**

---

## 5. FUNCIONES EXTRA DEL SISTEMA
Sincronización, modo offline, reportabilidad de red y notificaciones.

| Funcionalidad | Estado | Descripción |
| :--- | :---: | :--- |
| **Detección de red (On/Off)** | ✅ Implementada | Escucha eventos de red y notifica visualmente mediante banners. |
| **Guardado de fotos offline** | ✅ Implementada | Almacena fotos temporalmente en formato Base64. |
| **Cola de sincronización offline** | ✅ Implementada | Mantiene en cola los pesajes realizados sin conexión. |
| **Sincronización automática** | ✅ Implementada | Al recuperar conexión, el servicio `offlineSyncService` sube la cola y estima los pesos automáticamente en BD. |
| **Notificaciones en tiempo real** | ✅ Implementada | Centro de Notificaciones integrado con soporte para alertas de citas, reportes veterinarios y alertas de pesaje con contador dinámico en el header. |
| **Actualización en segundo plano** | 🟡 Parcialmente implementada | Existen temporizadores (polling) para refrescar notificaciones y citas en segundo plano, a falta de WebSockets / Server-Sent Events. |

*   **Pantallas involucradas:** General (Banner superior de estado de red), `src/services/offlineSyncService.ts`.
*   **Componentes involucrados:** Indicadores de señal, barra de progreso de carga.
*   **Servicios involucrados:** LocalStorage, `offlineSyncService`, `window.addEventListener('online')`.
*   **Problemas encontrados:**
    1.  **Límite de LocalStorage:** Al almacenar imágenes Base64 offline en LocalStorage (límite de 5MB), acumular más de 40-50 pesajes sin conexión corromperá el almacenamiento local del dispositivo.
    2.  **Notificaciones Push Nativas Faltantes:** Si bien hay notificaciones internas (campana en el header), no hay notificaciones Push (APNS/FCM) al sistema operativo del dispositivo móvil si la app está cerrada.
*   **Recomendaciones técnicas:**
    1.  **Migrar a IndexedDB:** Cambiar LocalStorage por IndexedDB en la cola offline para disponer de almacenamiento prácticamente ilimitado.
    2.  **Configurar Notificaciones Push:** Utilizar servicios Firebase Cloud Messaging (FCM) o APNS para notificar eventos cuando la app se encuentre inactiva.
*   **Prioridad:** **Alta** (Debido a la limitación crítica de almacenamiento local offline).

---

## RESUMEN DE DIAGNÓSTICO FINAL

### 🔴 Lista de Errores Encontrados (Bugs / Vulnerabilidades)
1.  **Vulnerabilidad de Spoofing (Seguridad - Alta):** El backend confía ciegamente en las cabeceras `X-User-Id` y `X-User-Role` enviadas por Axios en texto plano sin token firmado criptográficamente.
2.  **Riesgo de Desbordamiento de Cuota (Offline - Alta):** Uso de `LocalStorage` para almacenar imágenes offline comprimidas, lo que limita el almacenamiento a ~5MB y causará fallos si se acumulan fotos en campo.
3.  **Fallback de IA rígido (Infraestructura - Media):** Ejecución directa del comando global `python` en Laravel mediante `shell_exec`, que depende de que el servidor tenga instaladas dependencias como `ultralytics` y `scikit-learn` en el PATH global de forma no aislada.
4.  **Carga de Imágenes Base64 en Tabla de Usuarios (Optimización - Baja):** Almacenar la foto de perfil en base64 directamente en la fila del usuario en la base de datos incrementa drásticamente el peso de las consultas.

### 📋 Lista de Funcionalidades Faltantes
1.  **Sistema de recuperación de acceso (Login):** No hay flujo de "Olvidé mi contraseña" ni restablecimiento vía token por correo.
2.  **Flujo de Contraseña Temporal de 24 horas (Login):** No se auto-generan claves iniciales en la creación del usuario, ni expiran, ni hay obligación de cambio en el primer inicio de sesión.
3.  **Recordatorios Sanitarios parametrizables (Ganadero):** Faltan alertas sanitarias avanzadas configurables por el usuario (ej. vacunas, desparasitaciones), aunque el sistema ya cuenta con avisos automáticos de pesajes pendientes.
4.  **Exportación a Excel / CSV (Ganadero):** Excluido (Se priorizó la descarga de Ficha Técnica PDF con fotografías).
5.  **Descarga de Reportes Clínicos (Veterinario):** El veterinario no puede exportar a PDF los reportes médicos generados.
6.  **Notificaciones Push Nativa/OS:** Falta notificar al usuario en el sistema operativo mediante Push cuando la aplicación esté en segundo plano u offline.

### 🛠️ Lista de Mejoras Recomendadas
1.  **Implementar Laravel Sanctum o JWT:** Proteger las llamadas de la API con autenticación criptográfica robusta.
2.  **Migrar de LocalStorage a IndexedDB:** Para la cola de sincronización offline con fotos.
3.  **Implementar flujo de invitaciones para Veterinarios:** El veterinario debería registrarse ingresando su propia contraseña mediante un correo de invitación del ganadero, en lugar de ser creado directamente por este último.
4.  **Migrar Base64 a Laravel Storage (Simbólicos):** Guardar fotos de perfil e imágenes del hato como archivos estáticos en disco público en vez de binarios base64 en la base de datos.
5.  **Uso de WebSockets (Laravel Reverb / Pusher):** Reemplazar el "polling" de red por comunicación interactiva en tiempo real.

---

## 🚦 TABLA DE PRIORIZACIÓN DE TAREAS PENDIENTES

| Nivel de Prioridad | Tarea Pendiente | Módulo |
| :--- | :--- | :---: |
| **Alta** | Implementar Autenticación Criptográfica (Laravel Sanctum/JWT) | Seguridad |
| **Alta** | Migrar cola offline a IndexedDB para evitar fallos de cuota | Offline |
| **Alta** | Desarrollar flujo de vencimiento de contraseña temporal y cambio obligatorio | Login / Admin |
| **Media** | Desarrollar el sistema de recuperación de acceso por correo | Login |
| **Media** | Implementar recordatorios sanitarios parametrizables (vacunas/tratamientos) | Ganadero |
| **Media** | Habilitar descarga de reportes clínicos en PDF | Veterinario |
| **Media** | Refinar el CLI de fallback IA configurando virtualenv parametrizado | IA |
| **Baja** | Implementar notificaciones Push nativas (FCM/APNS) | General |
| **Baja** | Cambiar flujo de registro de Veterinarios a sistema de invitación | Veterinario |
| **Baja** | Migrar fotos Base64 de la BD a archivos físicos con links simbólicos | Optimización |
| **Baja** | Añadir base de datos y visor de logs de auditoría general | Admin |
