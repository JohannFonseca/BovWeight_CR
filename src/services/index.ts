/**
 * @file index.ts
 * @description Punto de exportación centralizado para todos los servicios, repositorios e interfaces.
 * Se encarga de instanciar y exponer los repositorios de Laravel.
 */

import { createAnimalRepository } from './repository-factory';
import { LaravelAuthRepository } from './laravel-auth-repository';
import type {
  Animal,
  WeightRecord,
  User,
  IAnimalRepository,
  IAuthRepository
} from './interfaces';

// Repositorio instanciado para la gestión de animales y pesajes (usando el patrón Factory)
export const animalRepository: IAnimalRepository = createAnimalRepository();

// Repositorio instanciado para la gestión de autenticación y sesiones
export const authRepository: IAuthRepository = new LaravelAuthRepository();

// Exponer el servicio adminApi para llamadas administrativas de Laravel
export { adminApi } from './adminApi';

// Alias de compatibilidad para el servicio de datos
export const dataService = animalRepository;

export type { Animal, WeightRecord, User, IAnimalRepository, IAuthRepository };
