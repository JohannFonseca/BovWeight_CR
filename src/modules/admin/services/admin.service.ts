import { supabase } from '@/supabase';

export interface Rol {
  id: number;
  nombre: string;
}

export interface UsuarioInfo {
  id: number;
  correo: string;
  nombre_completo: string;
  activo: boolean;
  rol_id: number;
  rol_nombre?: string;
  creado_en?: string;
}

export const adminService = {
  // Obtener todos los roles
  async getRoles(): Promise<Rol[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre')
      .order('id');
      
    if (error) {
      console.error('Error fetching roles:', error.message);
      throw new Error(error.message);
    }
    return data as Rol[];
  },

  // Obtener todos los usuarios
  async getUsuarios(): Promise<UsuarioInfo[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        correo,
        nombre_completo,
        activo,
        rol_id,
        creado_en,
        roles (
          nombre
        )
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error fetching usuarios:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      correo: u.correo,
      nombre_completo: u.nombre_completo || 'Sin nombre',
      activo: u.activo,
      rol_id: u.rol_id,
      rol_nombre: u.roles?.nombre,
      creado_en: new Date(u.creado_en).toLocaleDateString('es-CR')
    }));
  },

  // Crear un nuevo usuario manualmente
  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string }): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .insert([
        { 
          correo: usuario.correo, 
          contrasena_hash: usuario.contrasena, // Usando contrasena cruda en hash temporalmente por la tabla
          rol_id: usuario.rol_id,
          nombre_completo: usuario.nombre_completo,
          activo: true
        }
      ]);
      
    if (error) {
      console.error('Error creating user:', error.message);
      throw new Error(error.message);
    }
  },

  // Eliminar usuario
  async eliminarUsuario(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting user:', error.message);
      throw new Error(error.message);
    }
  },

  // Bloquear / Desbloquear usuario
  async toggleEstadoUsuario(id: number, nuevoEstado: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating user status:', error.message);
      throw new Error(error.message);
    }
  }
};
