/**
 * =================================================================================
 * FÁBRICA DE REPOSITORIOS (FACTORY PATTERN) - BOVWEIGHT CR
 * =================================================================================
 * 
 * APLICACIÓN DE PATRONES DE DISEÑO Y SOLID:
 * 
 * 1. PATRÓN DE DISEÑO: FÁBRICA SIMPLE (Simple Factory Pattern)
 *    Esta función centraliza y encapsula la toma de decisiones para crear y devolver
 *    la instancia concreta de persistencia apropiada. La interfaz gráfica llama a esta
 *    fábrica sin preocuparse de si los datos provienen de Supabase o de un Mock en memoria.
 * 
 * 2. PRINCIPIO SOLID: ABIERTO / CERRADO (OCP - Open/Closed Principle):
 *    Si en el futuro deseamos añadir un tercer tipo de almacenamiento (por ejemplo,
 *    una base de datos SQLite local en el dispositivo para modo desconectado offline),
 *    únicamente creamos la clase `SqliteAnimalRepository` que implemente la interfaz, 
 *    y agregamos una condición aquí en la fábrica. El resto del código de la interfaz 
 *    de usuario queda intacto y cerrado a modificaciones, protegiéndolo de efectos secundarios.
 */

import { MockAnimalRepository } from './mock-animal-repository';
import { SupabaseAnimalRepository } from './supabase-animal-repository';
import type { IAnimalRepository } from './interfaces';

/**
 * Función de fabricación que crea y retorna el repositorio de animales configurado.
 * Lee las variables de entorno (`VITE_USE_MOCK`) para determinar qué clase concreta
 * instanciar de forma totalmente transparente para el cliente de alto nivel.
 */
export function createAnimalRepository(): IAnimalRepository {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  if (useMock) {
    console.log('🔌 [BovWeight Factory] Cargando repositorio simulado (Mock Mode)');
    return new MockAnimalRepository();
  }

  console.log('🔌 [BovWeight Factory] Conectando a Supabase (Production Database Mode)');
  return new SupabaseAnimalRepository();
}
