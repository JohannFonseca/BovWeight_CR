/**
 * =================================================================================
 * REPOSITORIO SUPABASE PARA ANIMALES (REPOSITORY PATTERN) - BOVWEIGHT CR
 * =================================================================================
 * 
 * APLICACIÓN DE PATRONES DE DISEÑO Y SOLID:
 * 
 * 1. PATRÓN DE DISEÑO: REPOSITORIO (Repository Pattern)
 *    Esta clase encapsula por completo el acceso a los datos físicos de producción en Supabase.
 *    Centraliza las consultas SQL / API (`.select()`, `.eq()`, `.from()`) aislando al cliente 
 *    web de las complejidades de la conexión, estados de red o sintaxis propia del ORM/SDK de Supabase.
 * 
 * 2. PRINCIPIO SOLID: INVERSIÓN DE DEPENDENCIAS (DIP - Dependency Inversion Principle):
 *    `SupabaseAnimalRepository` implementa formalmente la interfaz `IAnimalRepository`. 
 *    Esto garantiza que el enrutador y las vistas de ganado dependan de la abstracción del contrato
 *    y no de este archivo concreto. Esto permite alternar entre bases de datos en memoria o físicas
 *    según el entorno.
 * 
 * 3. PRINCIPIO SOLID: RESPONSABILIDAD ÚNICA (SRP - Single Responsibility Principle):
 *    La única responsabilidad de esta clase es interactuar directamente con el SDK de Supabase 
 *    para obtener la información cruda de los animales y estimaciones de peso, delegando la
 *    transformación de datos en el adaptador (`data-adapter.ts`).
 */

import { supabase } from '../supabase';
import { adaptAnimalRecord, adaptWeightHistory } from './data-adapter';
import type { Animal, WeightRecord, IAnimalRepository } from './interfaces';

/**
 * Implementación de persistencia real utilizando la API y SDK oficial de Supabase.
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
