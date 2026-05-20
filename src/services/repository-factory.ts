/**
 * @file repository-factory.ts
 * @description Fábrica para la creación dinámica del repositorio de animales (Pattern Factory y OCP).
 */

import { MockAnimalRepository } from './mock-animal-repository';
import { SupabaseAnimalRepository } from './supabase-animal-repository';
import type { IAnimalRepository } from './interfaces';

/**
 * Crea e instancia el repositorio apropiado según la configuración VITE_USE_MOCK.
 */
export function createAnimalRepository(): IAnimalRepository {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  if (useMock) {
    console.log('🔌 [BovWeight Factory] Cargando repositorio simulado (Mock Mode)');
    return new MockAnimalRepository();
  }

  console.log('🔌 [BovWeight Factory] Conectando a Supabase (Production Database Mode)');
  return new SupabaseAnimalRepository();
}
