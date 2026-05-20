/**
 * =================================================================================
 * ARCHIVO DE ABSTRACCIONES E INTERFACES - BOVWEIGHT CR
 * =================================================================================
 * 
 * APLICACIÓN DE PRINCIPIOS SOLID:
 * 
 * 1. PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS (DIP - Dependency Inversion Principle):
 *    Este archivo representa el "núcleo de abstracciones" del sistema. Los componentes
 *    visuales de la interfaz de usuario (capa de alto nivel) no dependen directamente
 *    de las clases concretas que realizan consultas a la base de datos (capa de bajo nivel).
 *    En su lugar, ambos dependen de las interfaces aquí definidas (`IAnimalRepository`,
 *    `IAuthRepository`). Esto desacopla completamente la lógica del negocio del motor
 *    de persistencia (Supabase).
 * 
 * 2. PRINCIPIO DE SEGREGACIÓN DE INTERFACES (ISP - Interface Segregation Principle):
 *    Hemos diseñado interfaces específicas y cohesivas para cada contexto en lugar de una
 *    sola interfaz monolítica de base de datos. Por ejemplo, `IAnimalRepository` maneja
 *    exclusivamente la lógica del ganado, mientras que `IAuthRepository` maneja únicamente
 *    la autenticación de accesos. Esto evita que una vista dependa de métodos que no necesita.
 */

/**
 * Representa un registro histórico individual de pesaje de un animal.
 */
export interface WeightRecord {
  fecha: string; // Fecha formateada (usualmente DD/MM/YYYY) para consumo del cliente.
  peso: number;  // Peso registrado del animal expresado en Kilogramos (kg).
}

/**
 * Modelo de dominio principal para un Animal (Bovino) dentro del sistema.
 * Es la estructura adaptada y fuertemente tipada que la interfaz de usuario consume.
 */
export interface Animal {
  id: number;                   // Identificador único del animal en la base de datos.
  nombre: string;               // Nombre del animal (ej. "Toro #402").
  raza: string;                 // Nombre de la raza (ej. "Brahman", "Nelore").
  edad: string;                 // Edad calculada en base a la fecha de nacimiento (ej. "4 años").
  arete: string;                // Código de identificación física en la oreja del animal (número de arete).
  imagen: string;               // URL de la imagen del bovino o placeholder si no posee.
  pesoActual: number;           // Último peso registrado (calculado a partir de su historial).
  historialPeso: WeightRecord[]; // Listado histórico cronológico de todos sus pesajes estimados.
}

/**
 * Representa la sesión del usuario que ha ingresado al sistema.
 * Contiene la información mínima necesaria para el control de accesos e identidad del perfil.
 */
export interface User {
  id: number;                                // ID único del usuario.
  usuario: string;                           // Correo electrónico del usuario.
  rol: 'admin' | 'ganadero' | 'veterinario'; // Roles admitidos por el sistema para control de accesos (Route Guards).
  nombre_completo?: string;                  // Nombre completo del usuario.
}

/**
 * CONTRATO DE ACCESO A DATOS DE ANIMALES
 * 
 * Define las operaciones permitidas para el manejo de información de bovinos.
 * Al ser una interfaz, permite que los componentes de la interfaz gráfica desconozcan si los datos
 * provienen de una base de datos real (Supabase) o de datos simulados locales (Mock).
 */
export interface IAnimalRepository {
  /**
   * Obtiene la lista completa de animales registrados en la finca con sus respectivos historiales de peso.
   */
  getAllAnimals(): Promise<Animal[]>;

  /**
   * Recupera la ficha completa y detallada de un animal en base a su identificador único.
   */
  getAnimalById(id: number): Promise<Animal>;

  /**
   * Obtiene únicamente la lista histórica de mediciones de peso asociadas a un animal.
   */
  getWeightHistory(animalId: number): Promise<WeightRecord[]>;
}

/**
 * CONTRATO DE AUTENTICACIÓN
 * 
 * Define la operación de inicio de sesión del sistema, aislando la lógica de hash, tokens o
 * persistencia del flujo de navegación web del usuario.
 */
export interface IAuthRepository {
  /**
   * Realiza la autenticación del usuario mediante correo y contraseña.
   * Retorna un objeto User fuertemente tipado si las credenciales son válidas.
   */
  login(correo: string, password: string): Promise<User>;
}
