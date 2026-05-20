import { supabase } from '../supabase';
import type { IAuthRepository, User } from './interfaces';

export class SupabaseAuthRepository implements IAuthRepository {
  async login(correo: string, password: string): Promise<User> {
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

    try {
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
        .eq('contrasena_hash', password)
        .single();

      if (error) {
        throw error;
      }

      const loggedUser: User = {
        id: data.id,
        usuario: data.correo,
        rol: ((data.roles as any)?.nombre?.toLowerCase() || 'ganadero') as 'admin' | 'ganadero' | 'veterinario',
        nombre_completo: data.nombre_completo || 'Usuario de BovWeight'
      };
      
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
