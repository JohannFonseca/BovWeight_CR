/**
 * @file supabase-auth-repository.ts
 * @description Repositorio de autenticación de Supabase (Repository Pattern, SRP y DIP).
 */

import { supabase } from '../supabase';
import type { IAuthRepository, User } from './interfaces';

/**
 * Proveedor de autenticación sobre Supabase con soporte para cuentas de fallback.
 */
export class SupabaseAuthRepository implements IAuthRepository {
  
  /**
   * Realiza la validación de credenciales. Cuenta con soporte híbrido de
   * cuentas de prueba de forma estática para facilitar demostraciones rápidas, 
   * y conexión real para usuarios registrados en base de datos.
   */
  async login(correo: string, password: string): Promise<User> {
    // ---- VERIFICACIONES DE PRUEBA LOCALES (FALLBACK DE ALTA DISPONIBILIDAD) ----
    if (correo === 'admin@test.com' && password === '1234') {
      const user: User = { id: 1, usuario: 'admin', rol: 'admin', nombre_completo: 'Administrador' };
      import('../modules/admin/services/admin.service').then(({ adminService }) => {
        adminService.registrarLogin(user.id, correo, user.rol).catch(console.error);
      }).catch(err => console.error('Error al cargar adminService dinámicamente:', err));
      return user;
    }
    if (correo === 'ganadero@test.com' && password === '1234') {
      const user: User = { id: 2, usuario: 'ganadero', rol: 'ganadero', nombre_completo: 'Pedro Ganadero' };
      import('../modules/admin/services/admin.service').then(({ adminService }) => {
        adminService.registrarLogin(user.id, correo, user.rol).catch(console.error);
      }).catch(err => console.error('Error al cargar adminService dinámicamente:', err));
      return user;
    }
    if (correo === 'vet@test.com' && password === '1234') {
      const user: User = { id: 3, usuario: 'vet', rol: 'veterinario', nombre_completo: 'Ana Veterinaria' };
      import('../modules/admin/services/admin.service').then(({ adminService }) => {
        adminService.registrarLogin(user.id, correo, user.rol).catch(console.error);
      }).catch(err => console.error('Error al cargar adminService dinámicamente:', err));
      return user;
    }

    // ---- CONSULTA DE IDENTIFICACIÓN REMOTA EN SUPABASE ----
    try {
      // Realiza una consulta uniendo la tabla 'usuarios' con 'roles' en base al correo
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          correo,
          nombre_completo,
          roles (
            nombre
          )
        `)
        .eq('correo', correo)
        .eq('contrasena_hash', password) // En producción formal se implementa hash (ej. bcrypt/crypto)
        .single();

      if (error) {
        throw error;
      }

      // Estructura al usuario autenticado para la sesión web
      const loggedUser: User = {
        id: data.id,
        usuario: data.correo,
        rol: ((data.roles as any)?.nombre?.toLowerCase() || 'ganadero') as 'admin' | 'ganadero' | 'veterinario',
        nombre_completo: data.nombre_completo || 'Usuario de BovWeight'
      };
      
      // Registra el inicio de sesión exitoso en la bitácora de auditoría (logs de seguridad)
      import('../modules/admin/services/admin.service').then(({ adminService }) => {
        adminService.registrarLogin(loggedUser.id, loggedUser.usuario, loggedUser.rol).catch(console.error);
      }).catch(err => console.error('Error al cargar adminService dinámicamente:', err));

      return loggedUser;
    } catch (err: any) {
      console.error('Error al iniciar sesión con Supabase:', err.message);
      throw new Error('Correo o contraseña incorrectos');
    }
  }
}
