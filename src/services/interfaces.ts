/**
 * @file interfaces.ts
 * @description Contratos y abstracciones principales del sistema (DIP e ISP).
 * Desacopla la interfaz de usuario de las implementaciones concretas de persistencia.
 */

/**
 * Registro de pesaje individual de un animal.
 */
export interface WeightRecord {
  fecha: string; // Fecha en formato DD/MM/YYYY.
  peso: number;  // Peso en Kilogramos (kg).
}

/**
 * Ficha completa de un bovino consumida por la interfaz de usuario.
 */
export interface Animal {
  id: number;
  nombre: string;
  raza: string;
  edad: string;
  arete: string;
  imagen: string;
  pesoActual: number;
  historialPeso: WeightRecord[];
}

/**
 * Sesión del usuario autenticado en el sistema.
 */
export interface User {
  id: number;
  usuario: string;
  rol: 'admin' | 'ganadero' | 'veterinario';
  nombre_completo?: string;
}

/**
 * Interfaz para la gestión y consulta de datos de ganado (Animales).
 */
export interface IAnimalRepository {
  /** Obtiene la lista completa de animales con su historial de peso. */
  getAllAnimals(): Promise<Animal[]>;

  /** Obtiene un animal específico por su identificador. */
  getAnimalById(id: number): Promise<Animal>;

  /** Obtiene el historial de pesajes de un animal. */
  getWeightHistory(animalId: number): Promise<WeightRecord[]>;
}

/**
 * Interfaz para la autenticación y control de accesos.
 */
export interface IAuthRepository {
  /** Autentica a un usuario mediante credenciales. */
  login(correo: string, password: string): Promise<User>;
}

