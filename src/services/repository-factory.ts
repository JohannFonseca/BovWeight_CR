/**
 * @file repository-factory.ts
 * @description Fábrica para la creación del repositorio de animales (Pattern Factory).
 */

import { LaravelAnimalRepository } from './laravel-animal-repository';
import type { IAnimalRepository } from './interfaces';

/**
 * Crea e instancia el repositorio de animales utilizando Laravel.
 */
export function createAnimalRepository(): IAnimalRepository {
  console.log('🔌 [BovWeight Factory] Conectando a Laravel API (Production Mode)');
  return new LaravelAnimalRepository();
}
