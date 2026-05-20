/**
 * =================================================================================
 * ADAPTADOR DE DATOS (ADAPTER PATTERN) - BOVWEIGHT CR
 * =================================================================================
 * 
 * APLICACIÓN DE PATRONES DE DISEÑO Y SOLID:
 * 
 * 1. PATRÓN DE DISEÑO: ADAPTADOR (Adapter Pattern)
 *    Las bases de datos externas (como Supabase) frecuentemente retornan datos en formatos
 *    físicos (ej. columnas con nombres snake_case como `numero_arete`, `contrasena_hash` o 
 *    fechas crudas ISO). La interfaz web de la aplicación necesita trabajar con objetos 
 *    limpios e independientes en formato camelCase (ej. `arete`, `historialPeso`, `pesoActual`).
 *    Este módulo actúa como el "Traductor" o "Adaptador" entre el esquema físico de la 
 *    base de datos y el modelo lógico de dominio requerido por la interfaz gráfica.
 * 
 * 2. PRINCIPIO SOLID: RESPONSABILIDAD ÚNICA (SRP - Single Responsibility Principle):
 *    Este archivo tiene una única y clara razón de existir: formatear, limpiar y transformar 
 *    estructuras de datos crudas en objetos de dominio fuertemente tipados. No realiza
 *    peticiones HTTP, no se conecta a bases de datos y no maneja lógica de enrutamiento web.
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
