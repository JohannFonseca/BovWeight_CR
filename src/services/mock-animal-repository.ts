/**
 * =================================================================================
 * REPOSITORIO MOCK/SIMULADO (REPOSITORY PATTERN) - BOVWEIGHT CR
 * =================================================================================
 * 
 * APLICACIÓN DE PATRONES DE DISEÑO Y SOLID:
 * 
 * 1. PATRÓN DE DISEÑO: REPOSITORIO SIMULADO (Mock Repository / In-Memory Store)
 *    Esta clase representa un almacén simulado en memoria. Es fundamental durante las
 *    primeras etapas de desarrollo, desarrollo offline o la ejecución de pruebas unitarias.
 *    Evita tener que conectarse a Supabase y previene el consumo de cuota de peticiones.
 * 
 * 2. PRINCIPIO SOLID: SUSTITUCIÓN DE LISKOV (LSP - Liskov Substitution Principle):
 *    Este archivo es el ejemplo perfecto de LSP. El sistema puede sustituir la clase
 *    `SupabaseAnimalRepository` por `MockAnimalRepository` de forma 100% transparente para
 *    la interfaz gráfica de la aplicación. Ambas clases son subtipos del contrato
 *    `IAnimalRepository` y pueden intercambiarse sin alterar la corrección del programa ni 
 *    introducir comportamientos inesperados en las pantallas del usuario.
 */

import type { Animal, WeightRecord, IAnimalRepository } from './interfaces';

// Banco de datos estático en memoria que emula las tablas relacionales.
const mockAnimals: Animal[] = [
  {
    id: 1,
    nombre: 'Toro #402',
    raza: 'Brahman',
    edad: '4 años',
    arete: '402',
    imagen: 'assets/cow-placeholder.png',
    pesoActual: 380,
    historialPeso: [
      { fecha: '01/04/2026', peso: 340 },
      { fecha: '15/04/2026', peso: 360 },
      { fecha: '30/04/2026', peso: 380 }
    ]
  }
];

/**
 * Implementación simulada de acceso a datos que opera directamente en la memoria RAM del cliente.
 */
export class MockAnimalRepository implements IAnimalRepository {
  
  /**
   * Retorna una copia de la lista simulada para evitar mutaciones directas de la base en memoria.
   */
  async getAllAnimals(): Promise<Animal[]> {
    return mockAnimals.map((animal) => ({ ...animal }));
  }

  /**
   * Busca linealmente un animal por su identificador en el listado mock local.
   */
  async getAnimalById(id: number): Promise<Animal> {
    const animal = mockAnimals.find((item) => item.id === id);
    if (!animal) {
      throw new Error('Animal de prueba no encontrado');
    }
    return animal;
  }

  /**
   * Resuelve el historial del animal mock filtrando por su identificador único.
   */
  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const animal = mockAnimals.find((item) => item.id === animalId);
    return animal?.historialPeso ?? [];
  }
}
