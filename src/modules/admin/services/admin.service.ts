/**
 * @file admin.service.ts
 * @description Servicio encargado de las operaciones administrativas del sistema.
 * Gestiona el control de usuarios (creación, eliminación, bloqueo), la consulta de roles,
 * el registro y lectura de bitácoras de auditoría (logs de inicio de sesión) y las métricas del panel administrativo.
 */

import { supabase } from '@/supabase';

/**
 * Representa un rol dentro del sistema (ej. admin, ganadero, veterinario).
 */
export interface Rol {
  id: number;
  nombre: string;
}

/**
 * Representa la información detallada de un usuario en el panel administrativo.
 */
export interface UsuarioInfo {
  id: number;
  correo: string;
  nombre_completo: string;
  activo: boolean;
  rol_id: number;
  rol_nombre?: string;
  creado_en?: string;
}

export interface Finca {
  id: number;
  nombre: string;
  ubicacion: string;
  propietario_id: number;
  propietario_nombre?: string;
  bovinos_count: number;
  creado_en?: string;
}

export interface Raza {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface AnimalInfo {
  id: number;
  nombre: string;
  raza: string;
  raza_id?: number;
  numero_arete: string;
  fecha_nacimiento: string;
  sexo?: string;
  color?: string;
  estado?: string;
  finca_id?: number;
  finca_nombre?: string;
  peso_actual: number;
  observaciones?: string;
}

export interface AnalisisPesos {
  labels: string[];
  pesosPromedio: number[];
  crecimientoMensual: number;
  pesoPromedioGeneral: number;
  bovinoMasPesado: { nombre: string; peso: number; raza: string } | null;
}

// Helper para manejar errores de RLS
function handleRLSError(error: any, operacion: string): never {
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    throw new Error(
      `Permiso denegado al ${operacion}. ` +
      `Las políticas de seguridad (RLS) de Supabase bloquean esta operación. ` +
      `Ve al Dashboard de Supabase → tabla correspondiente → Policies → y agrega una política que permita INSERT/UPDATE/DELETE para el rol "anon".`
    );
  }
  throw new Error(`Error al ${operacion}: ${error.message}`);
}

export const adminService = {
  // ==========================================
  // ROLES
  // ==========================================
  async getRoles(): Promise<Rol[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre')
      .order('id');
      
    if (error) {
      console.error('Error fetching roles:', error.message);
    }

    if (!data || data.length === 0) {
      console.warn('La tabla roles está vacía o protegida. Cargando roles base...');
      return [
        { id: 1, nombre: 'admin' },
        { id: 2, nombre: 'ganadero' },
        { id: 3, nombre: 'veterinario' }
      ];
    }
    return data as Rol[];
  },

  // ==========================================
  // RAZAS
  // ==========================================
  async getRazas(): Promise<Raza[]> {
    const { data, error } = await supabase
      .from('razas')
      .select('id, nombre, descripcion')
      .order('nombre');
      
    if (error) {
      console.error('Error fetching razas:', error.message);
      return [];
    }
    return (data || []) as Raza[];
  },

  async crearRaza(nombre: string, descripcion?: string): Promise<Raza> {
    const { data, error } = await supabase
      .from('razas')
      .insert([{ nombre, descripcion: descripcion || null }])
      .select()
      .single();
      
    if (error) handleRLSError(error, 'crear raza');
    return data as Raza;
  },

  // ==========================================
  // USUARIOS (Empleados)
  // ==========================================
  async getUsuarios(): Promise<UsuarioInfo[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        correo,
        nombre_completo,
        activo,
        rol_id,
        creado_en
      `)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error fetching usuarios:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((u: any) => {
      let nombreRol = '';
      if (u.rol_id === 1) nombreRol = 'admin';
      else if (u.rol_id === 2) nombreRol = 'ganadero';
      else if (u.rol_id === 3) nombreRol = 'veterinario';

      return {
        id: u.id,
        correo: u.correo,
        nombre_completo: u.nombre_completo || 'Sin nombre',
        activo: u.activo,
        rol_id: u.rol_id,
        rol_nombre: nombreRol,
        creado_en: new Date(u.creado_en).toLocaleDateString('es-CR')
      };
    });
  },

  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string }): Promise<void> {
    if (!usuario.correo || !usuario.correo.includes('@')) {
      throw new Error('El correo electrónico no es válido.');
    }
    if (!usuario.contrasena || usuario.contrasena.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres.');
    }
    if (!usuario.nombre_completo || usuario.nombre_completo.trim().length === 0) {
      throw new Error('El nombre completo es requerido.');
    }

    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', usuario.correo)
      .maybeSingle();

    if (existente) {
      throw new Error(`Ya existe un usuario con el correo: ${usuario.correo}`);
    }

    const { error } = await supabase
      .from('usuarios')
      .insert([
        { 
          correo: usuario.correo, 
          contrasena_hash: usuario.contrasena,
          rol_id: usuario.rol_id,
          nombre_completo: usuario.nombre_completo,
          activo: true
        }
      ]);
      
    if (error) handleRLSError(error, 'crear usuario');
  },

  async eliminarUsuario(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
      
    if (error) handleRLSError(error, 'eliminar usuario');
  },

  async toggleEstadoUsuario(id: number, nuevoEstado: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', id);
      
    if (error) handleRLSError(error, 'actualizar estado del usuario');
  },

  // ==========================================
  // FINCAS - CRUD COMPLETO
  // ==========================================
  async getFincas(): Promise<Finca[]> {
    try {
      // Obtener fincas
      const { data: fincas, error } = await supabase
        .from('fincas')
        .select('*')
        .order('nombre');
        
      if (error) throw error;
      
      if (!fincas || fincas.length === 0) {
        return [];
      }

      // Obtener usuarios para mapear propietarios
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre_completo');

      const usuariosMap: Record<number, string> = {};
      (usuarios || []).forEach((u: any) => {
        usuariosMap[u.id] = u.nombre_completo;
      });

      // Contar animales por finca
      const { data: animales } = await supabase
        .from('animales')
        .select('finca_id');

      const conteoAnimales: Record<number, number> = {};
      (animales || []).forEach((a: any) => {
        if (a.finca_id) {
          conteoAnimales[a.finca_id] = (conteoAnimales[a.finca_id] || 0) + 1;
        }
      });

      return fincas.map((f: any) => ({
        id: f.id,
        nombre: f.nombre,
        ubicacion: f.ubicacion || 'Sin ubicación',
        propietario_id: f.propietario_id,
        propietario_nombre: usuariosMap[f.propietario_id] || 'Sin asignar',
        bovinos_count: conteoAnimales[f.id] || 0,
        creado_en: f.creado_en
      }));
    } catch (e: any) {
      console.error('Error al cargar fincas:', e);
      return [];
    }
  },

  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<void> {
    if (!finca.nombre || finca.nombre.trim().length === 0) {
      throw new Error('El nombre de la finca es requerido.');
    }
    if (!finca.ubicacion || finca.ubicacion.trim().length === 0) {
      throw new Error('La ubicación de la finca es requerida.');
    }

    const { error } = await supabase
      .from('fincas')
      .insert([{
        nombre: finca.nombre.trim(),
        ubicacion: finca.ubicacion.trim(),
        propietario_id: finca.propietario_id
      }]);
      
    if (error) handleRLSError(error, 'crear finca');
  },

  async eliminarFinca(id: number): Promise<void> {
    // Primero verificar si tiene animales
    const { count } = await supabase
      .from('animales')
      .select('*', { count: 'exact', head: true })
      .eq('finca_id', id);

    if (count && count > 0) {
      throw new Error(`No se puede eliminar esta finca porque tiene ${count} animales asignados. Elimine o reasigne los animales primero.`);
    }

    const { error } = await supabase
      .from('fincas')
      .delete()
      .eq('id', id);
      
    if (error) handleRLSError(error, 'eliminar finca');
  },

  // ==========================================
  // GANADO - CRUD COMPLETO
  // ==========================================
  async getGanadoCompleto(): Promise<AnimalInfo[]> {
    try {
      const { data, error } = await supabase
        .from('animales')
        .select(`
          id,
          nombre,
          numero_arete,
          fecha_nacimiento,
          sexo,
          color,
          estado,
          finca_id,
          raza_id,
          observaciones,
          razas (
            nombre
          ),
          fincas (
            nombre
          ),
          estimaciones_peso (
            peso_estimado_kg,
            peso_corregido_kg,
            creado_en
          )
        `);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }

      return data.map((a: any) => {
        const weights = a.estimaciones_peso || [];
        weights.sort((x: any, y: any) => new Date(y.creado_en).getTime() - new Date(x.creado_en).getTime());
        
        const latestWeight = weights.length > 0
          ? (weights[0].peso_corregido_kg || weights[0].peso_estimado_kg || 0)
          : 0;
          
        return {
          id: a.id,
          nombre: a.nombre || 'Sin nombre',
          raza: a.razas?.nombre || 'Sin raza',
          raza_id: a.raza_id,
          numero_arete: a.numero_arete || 'N/A',
          fecha_nacimiento: a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString('es-CR') : 'N/A',
          sexo: a.sexo || 'N/A',
          color: a.color || '',
          estado: a.estado || 'activo',
          finca_id: a.finca_id,
          finca_nombre: a.fincas?.nombre || 'Sin finca',
          peso_actual: latestWeight > 0 ? Number(latestWeight.toFixed(1)) : 0,
          observaciones: a.observaciones || ''
        };
      });
    } catch (e) {
      console.error('Error al cargar ganado completo:', e);
      return [];
    }
  },

  async crearAnimal(animal: {
    nombre: string;
    numero_arete: string;
    fecha_nacimiento?: string;
    sexo: string;
    raza_id: number | null;
    finca_id: number;
    color?: string;
    observaciones?: string;
  }): Promise<void> {
    if (!animal.nombre || animal.nombre.trim().length === 0) {
      throw new Error('El nombre del animal es requerido.');
    }
    if (!animal.numero_arete || animal.numero_arete.trim().length === 0) {
      throw new Error('El número de arete es requerido.');
    }
    if (!animal.finca_id) {
      throw new Error('Debe seleccionar una finca para el animal.');
    }

    const insertData: any = {
      nombre: animal.nombre.trim(),
      numero_arete: animal.numero_arete.trim(),
      sexo: animal.sexo || 'macho',
      finca_id: animal.finca_id,
      estado: 'activo'
    };

    if (animal.fecha_nacimiento) {
      insertData.fecha_nacimiento = animal.fecha_nacimiento;
    }
    if (animal.raza_id) {
      insertData.raza_id = animal.raza_id;
    }
    if (animal.color) {
      insertData.color = animal.color.trim();
    }
    if (animal.observaciones) {
      insertData.observaciones = animal.observaciones.trim();
    }

    const { error } = await supabase
      .from('animales')
      .insert([insertData]);
      
    if (error) handleRLSError(error, 'crear animal');
  },

  async eliminarAnimal(id: number): Promise<void> {
    const { error } = await supabase
      .from('animales')
      .delete()
      .eq('id', id);
      
    if (error) handleRLSError(error, 'eliminar animal');
  },

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats(): Promise<{ personalActivo: number, bovinos: number, fincas: number }> {
    const { count: personalCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('activo', true);
    const { count: bovinosCount } = await supabase.from('animales').select('*', { count: 'exact', head: true });
    const { count: fincasCount } = await supabase.from('fincas').select('*', { count: 'exact', head: true });

    return {
      personalActivo: personalCount || 0,
      bovinos: bovinosCount || 0,
      fincas: fincasCount || 0
    };
  },

  // ==========================================
  // ANÁLISIS DE PESAJES (Datos reales)
  // ==========================================
  async getAnalisisPesajes(): Promise<AnalisisPesos> {
    const hoy = new Date();
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(hoy.getMonth() - i);
      labels.push(d.toLocaleString('es-CR', { month: 'short' }).toUpperCase());
    }

    try {
      const { data: animales, error } = await supabase
        .from('animales')
        .select(`
          id,
          nombre,
          numero_arete,
          razas(nombre),
          estimaciones_peso (
            peso_estimado_kg,
            peso_corregido_kg,
            creado_en
          )
        `);
        
      if (error) throw error;
      
      if (!animales || animales.length === 0) {
        return {
          labels,
          pesosPromedio: [0, 0, 0, 0, 0, 0],
          crecimientoMensual: 0,
          pesoPromedioGeneral: 0,
          bovinoMasPesado: null
        };
      }
      
      const pesosPorMes: { [key: number]: number[] } = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
      let totalPesoActual = 0;
      let countPesosActuales = 0;
      let maxPeso = 0;
      let heaviestBovino: any = null;
      
      animales.forEach((a: any) => {
        const weights = a.estimaciones_peso || [];
        if (weights.length === 0) return;
        
        weights.sort((x: any, y: any) => new Date(x.creado_en).getTime() - new Date(y.creado_en).getTime());
        
        const latestWeight = weights[weights.length - 1].peso_corregido_kg || weights[weights.length - 1].peso_estimado_kg || 0;
        if (latestWeight > 0) {
          totalPesoActual += latestWeight;
          countPesosActuales++;
          if (latestWeight > maxPeso) {
            maxPeso = latestWeight;
            heaviestBovino = {
              nombre: a.nombre || `Arete: ${a.numero_arete}`,
              peso: Number(latestWeight.toFixed(1)),
              raza: a.razas?.nombre || 'Sin raza'
            };
          }
        }
        
        weights.forEach((w: any) => {
          const date = new Date(w.creado_en);
          const pesoVal = w.peso_corregido_kg || w.peso_estimado_kg || 0;
          if (pesoVal <= 0) return;
          
          const monthDiff = (hoy.getFullYear() - date.getFullYear()) * 12 + hoy.getMonth() - date.getMonth();
          if (monthDiff >= 0 && monthDiff < 6) {
            pesosPorMes[5 - monthDiff].push(pesoVal);
          }
        });
      });
      
      const pesosPromedio: number[] = [0, 0, 0, 0, 0, 0];
      
      for (let i = 0; i < 6; i++) {
        const arr = pesosPorMes[i];
        if (arr && arr.length > 0) {
          const sum = arr.reduce((sumVal, val) => sumVal + val, 0);
          pesosPromedio[i] = Number((sum / arr.length).toFixed(1));
        }
      }
      
      const pesoUltimo = pesosPromedio[5];
      const pesoPenultimo = pesosPromedio[4];
      const dif = pesoUltimo - pesoPenultimo;
      const crecimientoMensual = pesoPenultimo > 0 ? Number(((dif / pesoPenultimo) * 100).toFixed(1)) : 0;
      
      const pesoPromedioGeneral = countPesosActuales > 0 ? Number((totalPesoActual / countPesosActuales).toFixed(1)) : 0;
      
      return {
        labels,
        pesosPromedio,
        crecimientoMensual,
        pesoPromedioGeneral,
        bovinoMasPesado: heaviestBovino
      };
    } catch (e) {
      console.error('Error al calcular análisis de pesajes:', e);
      return {
        labels,
        pesosPromedio: [0, 0, 0, 0, 0, 0],
        crecimientoMensual: 0,
        pesoPromedioGeneral: 0,
        bovinoMasPesado: null
      };
    }
  }
};
