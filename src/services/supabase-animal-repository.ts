/**
 * @file supabase-animal-repository.ts
 * @description Repositorio de animales para Supabase (Repository Pattern, DIP y SRP).
 */

import { supabase } from '../supabase';
import { adaptAnimalRecord, adaptWeightHistory } from './data-adapter';
import type { Animal, WeightRecord, IAnimalRepository } from './interfaces';

/**
 * Implementación de persistencia real utilizando Supabase.
 */
export class SupabaseAnimalRepository implements IAnimalRepository {
  
  /**
   * Obtiene la ficha de un único animal a partir de su ID,
   * incluyendo su raza y su historial completo de peso ordenado cronológicamente.
   */
  async getAnimalById(id: number): Promise<Animal> {
    // 1. Obtiene el registro básico del animal y su relación con la raza
    const { data: rawAnimal, error: animalError } = await supabase
      .from('animales')
      .select('*, razas(nombre)')
      .eq('id', id)
      .single();

    if (animalError) {
      console.error('Error obteniendo animal:', animalError.message);
      throw new Error(animalError.message || 'Error al obtener el animal');
    }

    // 2. Obtiene el historial de pesajes estimados asociados a ese animal
    const { data: rawHistory, error: historyError } = await supabase
      .from('estimaciones_peso')
      .select('creado_en, peso_estimado_kg, peso_corregido_kg')
      .eq('animal_id', id)
      .order('creado_en', { ascending: true });

    if (historyError) {
      console.error('Error obteniendo historial:', historyError.message);
    }

    // 3. Adapta y unifica los resultados crudos en un modelo de dominio fuertemente tipado
    return adaptAnimalRecord(rawAnimal, rawHistory || []);
  }

  /**
   * Recupera de forma exclusiva la lista de pesajes de un animal, útil para renderizar gráficos rápidos.
   */
  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const { data, error } = await supabase
      .from('estimaciones_peso')
      .select('creado_en, peso_estimado_kg, peso_corregido_kg')
      .eq('animal_id', animalId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('Error en historial de peso:', error.message);
      throw new Error(error.message || 'Error al obtener historial de peso');
    }

    // Adapta el listado plano en objetos legibles por la vista del gráfico
    return adaptWeightHistory(data || []);
  }

  /**
   * Obtiene el rebaño completo registrado con sus pesos y relaciones en una sola petición.
   */
  async getAllAnimals(): Promise<Animal[]> {
    const { data, error } = await supabase
      .from('animales')
      .select(`
        *,
        razas(nombre),
        estimaciones_peso(creado_en, peso_estimado_kg, peso_corregido_kg)
      `);

    if (error) {
      console.error('Error obteniendo todos los animales:', error.message);
      throw new Error(error.message || 'Error al obtener los animales');
    }

    // Mapea y adapta concurrentemente toda la lista para retorno del cliente
    return (data || []).map((raw: any) => {
      const history = raw.estimaciones_peso || [];
      return adaptAnimalRecord(raw, history);
    }) as Animal[];
  }
}
