# Auditoría Funcional y Diagnóstico Técnico: BovWeight CR

Este documento presenta una auditoría funcional detallada y un diagnóstico del estado actual del sistema **BovWeight CR**. El análisis abarca tanto la aplicación móvil híbrida (Vue.js + Ionic) como el backend (Laravel) y el microservicio de estimación de peso por Inteligencia Artificial (Flask + YOLOv8 + Random Forest).

---

## Resumen de Estado General por Módulo

| Módulo Funcional | Estado de Implementación | Prioridad de Ajuste |
| :--- | :---: | :---: |
| **1. Login y Autenticación** | 🟡 Parcialmente implementado (Riesgo de Seguridad) | Alta |
| **2. Registro de Ganado y Fincas** | ✅ Implementado | Media |
| **3. Estimación de Peso por IA** | ✅ Implementado | Alta |
| **4. Expediente y Detalle del Animal** | ✅ Implementado | Baja |
| **5. Informes y Reportes** | ✅ Implementado | Media |
| **6. Perfil de Usuario y Ajustes** | 🟡 Parcialmente implementado | Baja |
| **7. Sincronización Offline** | 🟡 Parcialmente implementado (Limitación de Cuota) | Alta |
| **8. Administración del Sistema (Admin)** | ✅ Implementado | Media |
| **9. Portal y Permisos de Veterinarios** | 🟡 Parcialmente implementado (Varios placeholders) | Alta |

---

## 1. MÓDULO LOGIN Y AUTENTICACIÓN
Verifica el acceso y control de seguridad en el sistema.

*   **Inicio de sesión:** ✅ Implementado
*   **Cierre de sesión:** ✅ Implementado
*   **Validación de credenciales:** ✅ Implementado
*   **Redirección según rol:** ✅ Implementado
*   **Persistencia de sesión:** ✅ Implementado
*   **Recuperación de acceso (¿Olvidó contraseña?):** ❌ No implementado
*   **Cambio de contraseña:** ✅ Implementado
*   **Control de permisos/roles:** 🟡 Parcialmente implementado (Riesgo Crítico)

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/auth/pages/LoginPage.vue`, `src/modules/ganado/pages/AjustesPage.vue`
*   **Componentes involucrados:** `IonPage`, `IonInput`, `IonButton`
*   **Servicios involucrados:** `LaravelAuthRepository` (`authRepository`), `localStorage` (`usuario_sesion`)
*   **Problemas encontrados:**
    *   **Falta de Firma Criptográfica (Spoofing de Cabeceras):** El frontend almacena el objeto de sesión en `localStorage` y envía en cada petición Axios las cabeceras personalizadas `X-User-Id` y `X-User-Role`. El backend de Laravel lee directamente estas cabeceras para validar la identidad y el rol del usuario sin verificar un token firmado (como JWT o Laravel Sanctum). Esto permite que cualquier usuario malintencionado altere su `localStorage` o modifique las cabeceras HTTP para hacerse pasar por otro usuario (incluyendo administradores).
*   **Recomendaciones técnicas:**
    *   **Implementar Laravel Sanctum o JWT:** Reemplazar el envío de cabeceras en texto plano por un token Bearer firmado criptográficamente en el backend.
    *   **Añadir Recuperación de Contraseña:** Agregar en el login un enlace para solicitar un correo de restablecimiento y crear las rutas correspondientes en Laravel.
*   **Nivel de prioridad:** **Alta** (Urgente debido al riesgo de seguridad).

---

## 2. MÓDULO REGISTRO DE GANADO Y FINCAS
Permite registrar y estructurar el rebaño en fincas y razas.

*   **Formulario de alta de bovinos (arete, nombre, raza, sexo, etc.):** ✅ Implementado
*   **Asociación de animal a finca:** ✅ Implementado
*   **Selección de raza desde catálogo:** ✅ Implementado
*   **Validaciones de formulario:** ✅ Implementado
*   **Guardado en base de datos:** ✅ Implementado
*   **Manejo de estados (activo, vendido, fallecido):** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/ganado/pages/RegistrarPage.vue`
*   **Componentes involucrados:** `IonSegment`, formularios y selects dinámicos con clases personalizadas de Ionic.
*   **Servicios involucrados:** `LaravelAnimalRepository` (`animalRepository`) llamando a `/api/animales`, `/api/fincas` y `/api/razas`
*   **Problemas encontrados:**
    *   No hay soporte offline en el alta de fincas o registro inicial de bovinos; solo en la estimación de peso de bovinos existentes. Si el usuario intenta agregar un animal sin conexión, la app fallará.
*   **Recomendaciones técnicas:**
    *   Implementar cola de sincronización para el registro de nuevos animales y fincas de forma que el ranchero pueda dar de alta rebaños enteros en zonas sin cobertura.
*   **Nivel de prioridad:** **Media**

---

## 3. MÓDULO ESTIMACIÓN DE PESO POR IA (YOLOv8)
La funcionalidad insignia que calcula el peso de los bovinos a partir de imágenes o medidas manuales.

*   **Captura de foto con cámara o carga desde galería:** ✅ Implementado
*   **Visualización y previsualización de imagen:** ✅ Implementado
*   **Envío de imagen/datos al backend:** ✅ Implementado
*   **Procesamiento en servidor de IA (YOLOv8):** ✅ Implementado
*   **Cálculo de dimensiones corporales por visión:** ✅ Implementado
*   **Estimación de peso final (Random Forest / Crevat):** ✅ Implementado
*   **Calibración y peso corregido por el ganadero:** ✅ Implementado
*   **Fallback local por CLI si falla el microservicio Flask:** ✅ Implementado
*   **Carga manual de dimensiones (perímetro y largo):** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/ganado/pages/AiEstimationPage.vue`, `src/modules/ganado/pages/AnimalDetailPage.vue`
*   **Componentes involucrados:** Modales de calibración (`Registrar Peso Corregido`), tabs de cambio de cámara/carga manual.
*   **Servicios involucrados:** `LaravelAnimalRepository` (`estimateWeight` y `saveWeightRecord`), Microservicio de Flask (`python-ai-service/app.py` en puerto 5001).
*   **Problemas encontrados:**
    *   **Consumo y CLI Fallback Rígido:** La llamada fallback al script de Python local `predict_weight.py` usa `shell_exec`. Esto asume que el comando `python` está en el PATH global del sistema y que las dependencias (`ultralytics`, `scikit-learn`, `numpy`, `pillow`) están instaladas globalmente en el sistema, lo cual puede fallar en servidores web compartidos o configuraciones de producción.
*   **Recomendaciones técnicas:**
    *   **Aislamiento de Entorno (Virtualenv):** Configurar la ruta absoluta del intérprete de Python del entorno virtual (ej. `storage/ai/venv/bin/python`) en el archivo `.env` de Laravel para evitar dependencias globales.
    *   **Validación de Tamaño de Imagen antes de Subir:** Aunque el servicio comprime la imagen offline, la estimación directa online no comprime si se sube un archivo grande desde la galería de alta resolución, lo que causa latencia.
*   **Nivel de prioridad:** **Alta** (Crucial para garantizar la estabilidad del servicio principal).

---

## 4. MÓDULO EXPEDIENTE Y DETALLE DEL ANIMAL
Expediente médico e histórico de cada bovino.

*   **Detalle completo de información básica:** ✅ Implementado
*   **Gráfico de progresión de peso temporal:** ✅ Implementado
*   **Tabla histórica de pesajes realizados:** ✅ Implementado
*   **Visualización de fotos históricas tomadas:** ✅ Implementado
*   **Edición y eliminación del animal:** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/ganado/pages/AnimalDetailPage.vue`, `src/modules/veterinario/pages/VeterinarioAnimalDetail.vue`
*   **Componentes involucrados:** `LineChart` (de `vue-chartjs` y `chart.js`), modals de edición de ficha.
*   **Servicios involucrados:** `LaravelAnimalRepository` (`getAnimalById`, `getWeightHistory`, `eliminarAnimal`).
*   **Problemas encontrados:**
    *   Si se elimina un animal, los registros de peso asociados quedan huérfanos o causan errores en cascada si no se configuran adecuadamente en base de datos.
*   **Recomendaciones técnicas:**
    *   Asegurar que la migración en Laravel use `onDelete('cascade')` para las estimaciones de peso y auditorías clínicas.
*   **Nivel de prioridad:** **Baja**

---

## 5. MÓDULO DE INFORMES Y REPORTES
Generación de documentos PDF para la toma de decisiones.

*   **Generación de reportes PDF descargables:** ✅ Implementado
*   **Filtros de reportes (Fincas, fechas, razas, sexo):** ✅ Implementado
*   **Persistencia/Guardado de reportes en BD:** ✅ Implementado
*   **Gráficos evolutivos en el reporte:** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/reportes/pages/ReportsPage.vue`
*   **Componentes involucrados:** `jsPDF`, `html2canvas` para renderizar PDFs directamente en el cliente.
*   **Servicios involucrados:** `LaravelAnimalRepository` (`getReportesGanadero`, `guardarReporteGanadero`), API Proxy base64 para evitar errores CORS en fotos de animales.
*   **Problemas encontrados:**
    *   El reporte PDF se construye enteramente en el lado del cliente (frontend). Aunque el proxy base64 resuelve el problema de CORS para las imágenes, el renderizado de gráficos y tablas complejas en dispositivos de gama baja puede congelar la pestaña del navegador.
*   **Recomendaciones técnicas:**
    *   **Generación en Servidor (Opcional):** Si el rebaño es muy grande (>100 animales), se recomienda migrar la generación del PDF al backend usando una librería como `dompdf` o un microservicio de Node.js (Puppeteer) para reducir el procesamiento en el dispositivo del usuario.
*   **Nivel de prioridad:** **Media**

---

## 6. MÓDULO PERFIL DE USUARIO Y CONFIGURACIÓN (AJUSTES)
Gestión del perfil del ganadero y parámetros del sistema.

*   **Edición de información de perfil (nombre, correo):** ✅ Implementado
*   **Carga de foto de perfil (Base64):** ✅ Implementado
*   **Cambio de contraseña:** ✅ Implementado
*   **Ayuda, soporte y términos de servicio:** ❌ No implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/ganado/pages/AjustesPage.vue`
*   **Componentes involucrados:** Selectores de fotos, tarjetas de perfil.
*   **Servicios involucrados:** `LaravelAuthRepository` (`actualizarPerfil`, `cambiarContrasena`).
*   **Problemas encontrados:**
    *   La foto de perfil se almacena en base64 directamente en la tabla de usuarios, lo que incrementa el tamaño de la respuesta JSON en cada inicio de sesión o consulta de sesión.
*   **Recomendaciones técnicas:**
    *   Migrar el almacenamiento de la imagen de perfil a almacenamiento de archivos públicos (Laravel Storage con link simbólico) en lugar de guardar la cadena base64 en la base de datos relacional.
*   **Nivel de prioridad:** **Baja**

---

## 7. MÓDULO SINCRONIZACIÓN OFFLINE
Soporte técnico para el trabajo de campo del ranchero en zonas remotas sin señal.

*   **Cola de estimaciones pendientes (LocalStorage):** ✅ Implementado
*   **Compresión de fotografías en lienzo (Canvas):** ✅ Implementado (Comprime a un máximo de 800x800 a 70% de calidad, reduciendo a ~100KB).
*   **Detección automática de conectividad (Online/Offline):** ✅ Implementado
*   **Sincronización automática en segundo plano al recuperar señal:** ✅ Implementado
*   **Control y visualización de progreso de carga:** ✅ Implementado
*   **Reintentos y eliminación manual en cola:** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** `src/modules/ganado/pages/HomePage.vue` (Banners de estado y listado de la cola).
*   **Componentes involucrados:** Componentes visuales de progreso, indicadores de red en cabecera.
*   **Servicios involucrados:** `offlineSyncService` (`offlineSyncService.ts`), `window.addEventListener('online')` / `offline`.
*   **Problemas encontrados:**
    *   **Limitación de Espacio en LocalStorage:** LocalStorage tiene un límite estricto de **~5MB** por origen. Aunque la compresión a 100KB es muy eficiente, si un usuario realiza más de 40-50 pesajes offline sin sincronizar, superará la cuota del navegador, lo que provocará errores críticos de almacenamiento y pérdida de datos.
*   **Recomendaciones técnicas:**
    *   **Migrar a IndexedDB:** Utilizar IndexedDB para almacenar la cola offline. Esto amplía el límite de almacenamiento a cientos de megabytes (o hasta el 50% del espacio libre en disco del dispositivo), eliminando el riesgo de desbordamiento.
*   **Nivel de prioridad:** **Alta** (Crítico para la confiabilidad de los datos en campo).

---

## 8. MÓDULO ADMINISTRADOR DE SISTEMA
Panel de control para la gobernanza de la plataforma.

*   **Dashboard estadístico (usuarios, fincas, pesajes):** ✅ Implementado
*   **CRUD de Usuarios con asignación de roles y fincas:** ✅ Implementado
*   **CRUD de Fincas corporativas:** ✅ Implementado
*   **Auditoría de reportes y pesajes del sistema:** ✅ Implementado

### Detalles Técnicos
*   **Pantallas involucradas:** Carpeta `src/modules/admin/pages/*` (`AdminDashboard.vue`, `AdminUsuarios.vue`, `AdminFincas.vue`, `AdminReportes.vue`, etc.)
*   **Componentes involucrados:** Layouts administrativos específicos (`AdminLayout.vue`).
*   **Servicios involucrados:** `adminApi` (Axios centralizado para llamadas `/api/admin/*` y endpoints CRUD).
*   **Problemas encontrados:**
    *   El panel administrativo sufre del mismo problema de suplantación de identidad debido a que las cabeceras `X-User-Id` y `X-User-Role` no están autenticadas mediante tokens criptográficos.
*   **Recomendaciones técnicas:**
    *   Asegurar que todas las rutas administrativas en Laravel pasen por un middleware estricto que compruebe la autenticidad del token y el rol de administrador en base de datos.
*   **Nivel de prioridad:** **Media**

---

## 9. MÓDULO VETERINARIOS Y DELEGACIÓN DE ACCESO
Permite a los veterinarios consultar información de animales asignados específicamente por el ganadero titular.

*   **Registro de veterinarios por el ganadero:** 🟡 Parcialmente implementado (El ganadero los crea directamente; no hay sistema de invitación por correo electrónico).
*   **Habilitar/Deshabilitar acceso del veterinario:** ✅ Implementado
*   **Asignación de fincas autorizadas:** ✅ Implementado
*   **Permisos granulares por animal (Tabla pivote JSON):** ✅ Implementado
*   **Panel clínico del veterinario (Métricas y seguimiento):** ✅ Implementado
*   **Visualización de expediente por veterinario con restricciones:** ✅ Implementado
*   **Agenda de visitas veterinarias:** ❌ No implementado (Pantalla Coming Soon)
*   **Generación de reportes clínicos médicos:** ❌ No implementado (Pantalla Coming Soon)

### Detalles Técnicos
*   **Pantallas involucradas:**
    *   *Ganadero:* `src/modules/ganado/pages/PersonalPage.vue`
    *   *Veterinario:* Carpeta `src/modules/veterinario/pages/*` (`VeterinarioDashboard.vue`, `VeterinarioAnimales.vue`, `VeterinarioAnimalDetail.vue`, `VeterinarioAgenda.vue`, `VeterinarioReportes.vue`)
*   **Componentes involucrados:** Checkboxes de permisos por animal, badges de estado del veterinario.
*   **Servicios involucrados:**
    *   *Backend:* `VeterinarioDashboardController.php`, `VeterinarioAnimalController.php`.
    *   *Base de Datos:* Tabla pivote `finca_veterinario` con columna JSON `animales_autorizados`.
*   **Problemas encontrados:**
    *   **Pantallas Vacías (Coming Soon):** Los módulos de *Agenda de Visitas* y *Reportes Médicos* para veterinarios solo muestran interfaces de "Módulo en Desarrollo".
    *   **Proceso de Registro de Veterinario:** El ganadero debe ingresar manualmente la contraseña del veterinario al crearlo. Esto es una mala práctica de privacidad y seguridad.
*   **Recomendaciones técnicas:**
    *   **Flujo de Invitación:** Cambiar el registro directo de veterinarios por un flujo de invitación donde se introduzca únicamente el correo electrónico, y el veterinario reciba un enlace para crear su contraseña y completar su registro.
    *   **Completar Módulos Clínicos:** Desarrollar la base de datos y endpoints de visitas médicas y reportes clínicos para quitar las pantallas temporales.
*   **Nivel de prioridad:** **Alta** (Necesario para ofrecer una experiencia funcional de colaboración Ganadero-Veterinario).

---

## Conclusiones y Plan de Acción Sugerido

1.  **Fase 1: Seguridad y Confiabilidad (Prioridad Alta)**
    *   Implementar autenticación robusta mediante tokens firmados (Laravel Sanctum/JWT) en lugar de cabeceras HTTP configurables.
    *   Migrar la cola de sincronización offline de `LocalStorage` a `IndexedDB` para evitar cuotas de almacenamiento saturadas.
2.  **Fase 2: Colaboración y Permisos (Prioridad Media)**
    *   Modificar el sistema de invitaciones de veterinarios para que sea por correo electrónico/enlace de registro.
    *   Desarrollar el backend para la Agenda de Visitas y los Reportes Médicos del Veterinario.
3.  **Fase 3: Optimización y Limpieza (Prioridad Baja)**
    *   Mudar las imágenes base64 de la base de datos hacia almacenamiento local o en la nube (S3/Laravel Storage).
    *   Ajustar el CLI de Python para el fallback de la IA, asegurando entornos aislados parametrizables.
