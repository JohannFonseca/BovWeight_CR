/**
 * @file index.ts
 * @description Punto de exportación centralizado para todos los servicios, repositorios e interfaces.
 * Se encarga de instanciar y exponer los repositorios reales que utilizará la aplicación,
 * manteniendo además la compatibilidad con el código heredado.
 */

import { createAnimalRepository } from './repository-factory';
import { SupabaseAuthRepository } from './supabase-auth-repository';
import { animalService, authService } from './api';
import type {
  Animal,
  WeightRecord,
  User,
  IAnimalRepository,
  IAuthRepository
} from './interfaces';

// Repositorio instanciado para la gestión de animales y pesajes (usando el patrón Factory)
export const animalRepository: IAnimalRepository = createAnimalRepository();

// Repositorio instanciado para la gestión de autenticación y sesiones con Supabase
export const authRepository: IAuthRepository = new SupabaseAuthRepository();

// Alias de compatibilidad para el servicio de datos
export const dataService = animalRepository;

// Exportación de compatibilidad para servicios legacy y tipos/interfaces del sistema
export { animalService, authService };
export type { Animal, WeightRecord, User, IAnimalRepository, IAuthRepository };

