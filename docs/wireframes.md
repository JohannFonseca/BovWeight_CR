# Prototipo de Alta Fidelidad para BovWeight CR

Este documento describe las pantallas clave del sistema y su navegación, además de proponer un diseño visual moderno para la aplicación.

## 1. Pantalla de Login

- Fondo degradado cálido con formas suaves difuminadas.
- Tarjeta de acceso centrada con:
  - Icono de marca (vaca) grande.
  - Título del producto: `BovWeightCR`.
  - Campos tipo email y contraseña.
  - Botón principal `INICIAR SESIÓN` con color verde oscuro y radio amplio.
  - Ayuda de cuentas demo debajo.

### Elementos clave
- Título visible, tipografía moderna.
- Campos accesibles con iconos laterales.
- Feedback de error inmediato.

## 2. Dashboard de Ganadero

- Layout de dos columnas en escritorio:
  - Sidebar de navegación a la izquierda.
  - Contenido principal con estadísticas y lista de animales a la derecha.
- Cabecera translucida con usuario, rol y botón `logout`.
- Tarjetas de estadísticas con sombras suaves y colores distintivos.
- Panel de animales y panel de gráfico de peso.
- Botón flotante en móvil para registrar nuevo pesaje.

## 3. Detalle del Animal

- Encabezado con botón `Atrás` y título.
- Tarjeta hero con imagen o avatar del animal.
- Chips de raza y edad.
- Tarjeta de resumen de peso con color de éxito/advertencia.
- Gráfico de tendencia de peso.
- Botones de acciones: `Registrar Nuevo Peso` y `Ver Historial Completo`.

## 4. Navegación entre pantallas

- Login -> Dashboard Ganadero.
- Dashboard -> Detalle del Animal.
- Sidebar con accesos directos a métricas y pesajes IA.

## Wireframe en formato Mermaid

```mermaid
flowchart LR
  A[Login] --> B[Dashboard Ganadero]
  B --> C[Detalle del Animal]
  B --> D[Reporte de Peso]
  B --> E[Pesaje IA]
  C --> B
```

## Comentario visual

El prototipo usa dos bloques de contenido:
- `Sidebar` + `Main content` para mantener claridad.
- `Stat cards` y `panel cards` con bordes redondeados y fondo blanco.
- Uso de iconografía y espaciado generoso para que la interfaz sea táctil y legible.

## Conexión con los patrones aplicados

- `Repository` y `Adapter` en la capa de datos permiten que la interfaz consuma datos normalizados sin depender de la forma de la base de datos.
- `Factory` permite cambiar el origen de datos entre mock y Supabase sin modificar componentes.
- `Strategy` separa la lógica de estado de peso del UI.

## Justificación de los patrones de diseño

- `Repository`: facilita la separación entre la lógica de la aplicación y el acceso a datos. Los componentes de Vue consumen `IAnimalRepository` y no conocen si los datos vienen de Supabase o de datos mock, lo que mejora la mantenibilidad, reduce el acoplamiento y permite pruebas unitarias o e2e con datos controlados.
- `Adapter`: convierte los objetos crudos de Supabase en modelos internos estables (`Animal`, `WeightRecord`). Esto evita que cambios en la estructura de la base de datos o en los nombres de campos afecten directamente a la UI, y centraliza la normalización de datos en un solo lugar.
- `Factory`: encapsula la creación del repositorio correcto según el entorno (`VITE_USE_MOCK`), centralizando la configuración de origen de datos. Así no es necesario modificar el código de los componentes para alternar entre datos reales y de prueba, lo que acelera el desarrollo y permite probar distintas fuentes sin riesgo.
- `Strategy`: maneja la evaluación de estado de peso mediante reglas explícitas y priorizadas. La lógica de resultados como “Crecimiento acelerado”, “Crecimiento estable”, “Peso estable” o “Pérdida de peso” queda aislada en `useWeightStatus`, lo que facilita su extensión, mantenimiento y reutilización en otras partes de la aplicación.

Adicionalmente, estos patrones contribuyen a una arquitectura más robusta:
- la capa de datos es independiente de la presentación,
- la conversión de formatos es predecible y reutilizable,
- la configuración del origen de datos es fácil de cambiar,
- y las reglas de negocio de peso son mantenibles sin mezclar UI con cálculos.
