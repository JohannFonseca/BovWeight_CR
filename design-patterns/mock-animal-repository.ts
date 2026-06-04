/**
 * @file mock-animal-repository.ts
 * @description Repositorio simulado en memoria para pruebas y desarrollo local (Repository Pattern y LSP).
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
