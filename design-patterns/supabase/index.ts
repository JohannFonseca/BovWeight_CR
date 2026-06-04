/**
 * @file index.ts
 * @description Inicialización y configuración del cliente de Supabase.
 * Se encarga de leer las credenciales del entorno y exportar la instancia global para interactuar con la base de datos.
 */

import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Corrección dinámica para evitar problemas de caché agresiva en el navegador/Vite
if (supabaseUrl.includes('qbkixxkmezbzfjrfnngv')) {
  console.warn('⚠️ Detectado typo "nngv" en URL de Supabase en caché. Corrigiendo a "ongv"...');
  supabaseUrl = supabaseUrl.replace('qbkixxkmezbzfjrfnngv', 'qbkixxkmezbzfjrfongv');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Please check your .env file.');
}

// Instancia global de Supabase para realizar consultas y mutaciones en la base de datos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);