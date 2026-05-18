import { supabase } from './supabase';

export interface WeightRecord {
  fecha: string;
  peso: number;
}

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
 * SERVICIO REAL USANDO SUPABASE
 * ==========================================
 * Este servicio reemplaza a axios y a los datos falsos (mockData).
 * Conecta directamente la app a tu base de datos de Supabase.
 * 
 * Para que esto funcione, necesitas tener creadas las siguientes tablas en Supabase:
 * 
 * 1. Tabla: animales
 *    - id (int8, primary key)
 *    - nombre (text)
 *    - raza (text)
 *    - edad (text)
 *    - arete (text)
 *    - imagen (text)
 *    - pesoActual (numeric o int4)
 * 
 * 2. Tabla: historial_peso
 *    - id (int8, primary key)
 *    - animal_id (int8, foreign key a animales.id)
 *    - fecha (date o text)
 *    - peso (numeric o int4)
 */

export const animalService = {
  // Obtener un animal específico por su ID junto con su historial
  async getAnimalById(id: number): Promise<Animal> {
    const { data: animal, error: animalError } = await supabase
      .from('animales')
      .select('*')
      .eq('id', id)
      .single();

    if (animalError) {
      console.error('Error obteniendo animal:', animalError.message);
      throw new Error(animalError.message);
    }

    const { data: historial, error: historialError } = await supabase
      .from('historial_peso')
      .select('fecha, peso')
      .eq('animal_id', id)
      .order('fecha', { ascending: true });

    if (historialError) {
      console.error('Error obteniendo historial:', historialError.message);
    }

    return { 
      ...animal, 
      historialPeso: historial || [] 
    } as Animal;
  },

  // Obtener únicamente el historial de peso de un animal
  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const { data, error } = await supabase
      .from('historial_peso')
      .select('fecha, peso')
      .eq('animal_id', animalId)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error en historial de peso:', error.message);
      throw new Error(error.message);
    }
    return data as WeightRecord[];
  },

  // Obtener la lista de todos los animales (para mostrar en el dashboard)
  async getAllAnimals(): Promise<Animal[]> {
    const { data, error } = await supabase
      .from('animales')
      .select('*');

    if (error) {
      console.error('Error obteniendo todos los animales:', error.message);
      throw new Error(error.message);
    }
    return data as Animal[];
  },
};
