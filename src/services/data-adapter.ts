/**
 * @file data-adapter.ts
 * @description Adaptador para transformar formatos físicos de base de datos (Supabase) al modelo de negocio de Vue (Pattern Adapter y SRP).
 */

import type { Animal, WeightRecord } from './interfaces';

// Imagen por defecto utilizada si el animal no cuenta con una fotografía subida al sistema.
const placeholderImage = 'assets/cow-placeholder.png';

/**
 * Calcula la edad legible de un animal a partir de su fecha de nacimiento.
 * Encapsula la lógica de tiempo del dominio bovino.
 */
function calculateAge(fechaNacimiento?: string): string {
  if (!fechaNacimiento) return 'N/A';
  const birth = new Date(fechaNacimiento);
  const age = new Date().getFullYear() - birth.getFullYear();
  return `${age} años`;
}

/**
 * Normaliza y limpia los valores de peso que puedan retornar de la base de datos
 * como strings, garantizando que el cliente de Vue siempre maneje valores numéricos consistentes.
 */
function normalizeWeightValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

/**
 * Adapta un arreglo de registros crudos de estimaciones desde la base de datos
 * hacia el arreglo de registros históricos fuertemente tipados para la interfaz visual.
 */
export function adaptWeightHistory(rows: any[] = []): WeightRecord[] {
  return (rows || []).map((row: any) => ({
    fecha: new Date(row.creado_en).toLocaleDateString('es-CR'),
    peso: normalizeWeightValue(row.peso_corregido_kg || row.peso_estimado_kg)
  }));
}

/**
 * ADAPTADOR PRINCIPAL: Toma un registro crudo de animal obtenido de Supabase, 
 * junto a su historial de pesajes, y lo unifica en el formato estandarizado `Animal`.
 */
export function adaptAnimalRecord(raw: any, history: any[] = []): Animal {
  const historialPeso = adaptWeightHistory(history);
  // Calcula dinámicamente el peso actual tomando el último pesaje del historial ordenado
  const latestWeight = historialPeso.length > 0 ? historialPeso[historialPeso.length - 1].peso : 0;

  return {
    id: raw.id,
    nombre: raw.nombre || 'Sin nombre',
    raza: raw.razas?.nombre || raw.raza || 'Desconocida', // Resuelve relaciones foráneas
    edad: calculateAge(raw.fecha_nacimiento),
    arete: raw.numero_arete || raw.arete || 'N/A',
    imagen: raw.imagen || placeholderImage,
    pesoActual: latestWeight,
    historialPeso
  };
}
