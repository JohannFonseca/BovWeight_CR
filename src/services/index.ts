/**
 * Exportación unificada de servicios.
 * Ahora usamos únicamente el servicio real de Supabase (hemos eliminado los mock data).
 */
import { animalService } from './api';

// Exportamos 'dataService' para que el resto de componentes (App, HomePage) lo sigan usando sin romperse.
export const dataService = animalService;

export type { Animal, WeightRecord } from './api';
