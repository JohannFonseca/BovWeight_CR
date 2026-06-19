# Reporte de Tareas Pendientes y No Implementadas - BovWeight CR

Este documento consolida únicamente las funcionalidades faltantes, riesgos de seguridad y mejoras técnicas pendientes de implementación en el sistema **BovWeight CR** tras la última auditoría.

---

## 1. SINCRONIZACIÓN Y MODO OFFLINE (Prioridad: Alta)

### 🔴 Riesgo de Desbordamiento de Cuota en LocalStorage
*   **Estado:** No implementada / Pendiente
*   **Descripción:** El sistema utiliza `LocalStorage` para almacenar temporalmente imágenes de pesajes en Base64 cuando no hay conexión. Debido a que el límite de almacenamiento de LocalStorage en navegadores y WebView es de ~5MB, acumular más de 40-50 fotos causará un colapso del almacenamiento y pérdida de datos.
*   **Solución recomendada:** Migrar la cola de sincronización offline a **IndexedDB**, que permite capacidades de almacenamiento prácticamente ilimitadas en el dispositivo móvil.

## 5. INFRAESTRUCTURA Y OPTIMIZACIÓN (Prioridad: Baja)

### 🟢 Fallback de Inteligencia Artificial Rígido
*   **Estado:** No implementada / Pendiente
*   **Descripción:** En caso de caída de la API de IA, el backend ejecuta el comando global `python` directamente en el shell. Esto requiere que el PATH global del servidor tenga instaladas dependencias críticas como `ultralytics` y `scikit-learn`, lo cual dificulta la portabilidad y el mantenimiento del servidor.
*   **Solución recomendada:** Configurar y referenciar la ruta de ejecución dentro de un entorno virtual aislado (`virtualenv` de Python) configurado por variable de entorno.
