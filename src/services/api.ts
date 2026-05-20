/**
 * @file api.ts
 * @description Servicios y definiciones de tipos heredados (legacy) para la comunicación directa con Supabase.
 * Proporciona compatibilidad con las vistas existentes que aún no se han migrado por completo al patrón de Repositorio.
 */

import { supabase } from '../supabase';

/**
 * Representa un usuario en el sistema.
 * Contiene el identificador, nombre de usuario (correo) y el rol asignado.
 */
export interface User {
  id: number;
  usuario: string;
  rol: 'admin' | 'ganadero' | 'veterinario';
}

/**
 * Representa un registro de peso individual de un animal con su fecha respectiva.
 */
export interface WeightRecord {
  fecha: string;
  peso: number;
}

/**
 * Representa la información completa de un animal, incluyendo su historial de peso.
 */
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
 * Servicio heredado para la gestión de datos de animales directamente con Supabase.
 * Proporciona métodos para obtener un animal por ID, su historial de pesos y la lista de todos los animales.
 */
export const animalService = {
  // Obtener un animal específico por su ID junto con su historial de peso estimado y corregido.
  async getAnimalById(id: number): Promise<Animal> {
    const { data: animal, error: animalError } = await supabase
      .from('animales')
      .select('*, razas(nombre)')
      .eq('id', id)
      .single();

    if (animalError) {
      console.error('Error obteniendo animal:', animalError.message);
      throw new Error(animalError.message);
    }

    const { data: historial, error: historialError } = await supabase
      .from('estimaciones_peso')
      .select('creado_en, peso_estimado_kg, peso_corregido_kg')
      .eq('animal_id', id)
      .order('creado_en', { ascending: true });

    if (historialError) {
      console.error('Error obteniendo historial:', historialError.message);
    }

    const historialPeso = (historial || []).map((h: any) => ({
      fecha: new Date(h.creado_en).toLocaleDateString('es-CR'),
      peso: h.peso_corregido_kg || h.peso_estimado_kg
    }));

    const pesoActual = historialPeso.length > 0 ? historialPeso[historialPeso.length - 1].peso : 0;

    return { 
      id: animal.id,
      nombre: animal.nombre || 'Sin nombre',
      raza: (animal.razas as any)?.nombre || 'Desconocida',
      edad: animal.fecha_nacimiento 
        ? `${new Date().getFullYear() - new Date(animal.fecha_nacimiento).getFullYear()} años` 
        : 'N/A',
      arete: animal.numero_arete,
      imagen: animal.observaciones || 'assets/cow-placeholder.png', // Fallback or using comments
      pesoActual,
      historialPeso
    } as Animal;
  },

  // Obtener únicamente el historial de peso de un animal específico.
  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const { data, error } = await supabase
      .from('estimaciones_peso')
      .select('creado_en, peso_estimado_kg, peso_corregido_kg')
      .eq('animal_id', animalId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('Error en historial de peso:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((h: any) => ({
      fecha: new Date(h.creado_en).toLocaleDateString('es-CR'),
      peso: h.peso_corregido_kg || h.peso_estimado_kg
    })) as WeightRecord[];
  },

  // Obtener la lista de todos los animales (para mostrar en el panel principal).
  async getAllAnimals(): Promise<Animal[]> {
    const { data, error } = await supabase
      .from('animales')
      .select(`
        *,
        razas(nombre),
        estimaciones_peso(peso_estimado_kg, peso_corregido_kg)
      `);

    if (error) {
      console.error('Error obteniendo todos los animales:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((a: any) => {
      const weights = a.estimaciones_peso || [];
      const latestWeight = weights.length > 0 
        ? (weights[weights.length - 1].peso_corregido_kg || weights[weights.length - 1].peso_estimado_kg) 
        : 0;

      return {
        id: a.id,
        nombre: a.nombre || 'Sin nombre',
        raza: a.razas?.nombre || 'Brahman',
        edad: a.fecha_nacimiento 
          ? `${new Date().getFullYear() - new Date(a.fecha_nacimiento).getFullYear()} años` 
          : 'N/A',
        arete: a.numero_arete,
        imagen: 'assets/cow-placeholder.png',
        pesoActual: latestWeight,
        historialPeso: []
      };
    }) as Animal[];
  },
};

/**
 * Servicio heredado para la autenticación de usuarios.
 * Permite iniciar sesión consultando directamente la tabla de usuarios en Supabase
 * o utilizando credenciales de prueba predefinidas como mecanismo de respaldo.
 */
export const authService = {
  // Función para iniciar sesión
  async login(correo: string, password: string): Promise<User> {
    // 1. Optimización: Verificación inmediata de cuentas de prueba (Fallback local)
    if (correo === 'admin@test.com' && password === '1234') {
      return { id: 1, usuario: 'admin', rol: 'admin' };
    }
    if (correo === 'ganadero@test.com' && password === '1234') {
      return { id: 2, usuario: 'ganadero', rol: 'ganadero' };
    }
    if (correo === 'vet@test.com' && password === '1234') {
      return { id: 3, usuario: 'vet', rol: 'veterinario' };
    }

    // 2. Si no es de prueba, intentar consultar Supabase
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          correo,
          roles (
            nombre
          )
        `)
        .eq('correo', correo)
        .eq('contrasena_hash', password)
        .single();

      if (error) {
        throw error;
      }

      // Mapear el resultado al objeto User que espera la aplicación
      return {
        id: data.id,
        usuario: data.correo,
        rol: (data.roles as any)?.nombre?.toLowerCase() || 'ganadero'
      } as User;
    } catch (err: any) {
      console.error('Error al iniciar sesión con Supabase:', err.message);
      throw new Error('Correo o contraseña incorrectos');
    }
  }
};
