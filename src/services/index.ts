/**
 * Exportación unificada de servicios.
 * Selecciona automáticamente la API falsa o real según la bandera USE_MOCK.
 */
import { animalService } from './api';
import { mockAnimalService, USE_MOCK } from './mockData';

// Usa esto en toda la app — elegirá automáticamente el servicio correcto
export const dataService = USE_MOCK ? mockAnimalService : animalService;

export type { Animal, WeightRecord } from './api';
