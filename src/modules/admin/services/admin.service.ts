/**
 * ============================================================
 * admin.service.ts — Servicio de Administración de BovWeight CR
 * ============================================================
 *
 * Este archivo actúa como el conector de la administración de BovWeight
 * con la API de Laravel (conectada a la base de datos real).
 */

import { laravelAdminService } from './laravel-admin-service';

/**
 * Rol — Representa un tipo de usuario en el sistema.
 */
export interface Rol {
  id: number;
  nombre: string;
}

/**
 * UsuarioInfo — Toda la info de un usuario que mostramos en la tabla.
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

/**
 * Finca — Representa una propiedad ganadera.
 */
export interface Finca {
  id: number;
  nombre: string;
  ubicacion: string;
  propietario_id: number;
  propietario_nombre?: string;
  encargado_nombre?: string;
  bovinos_count: number;
  creado_en?: string;
}

/**
 * Raza — Catálogo de razas bovinas (Brahman, Charolais, etc.)
 */
export interface Raza {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * AnimalInfo — Info completa de un bovino para mostrar en la tabla.
 */
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

/**
 * AnalisisPesos — Datos calculados para la sección de Análisis.
 */
export interface AnalisisPesos {
  labels: string[];
  pesosPromedio: number[];
  crecimientoMensual: number;
  pesoPromedioGeneral: number;
  bovinoMasPesado: { nombre: string; peso: number; raza: string } | null;
}

export const adminService = {
  async getRoles(): Promise<Rol[]> {
    return laravelAdminService.getRoles();
  },

  async getRazas(): Promise<Raza[]> {
    return laravelAdminService.getRazas();
  },

  async crearRaza(nombre: string, descripcion?: string): Promise<Raza> {
    return laravelAdminService.crearRaza(nombre, descripcion);
  },

  async getUsuarios(): Promise<UsuarioInfo[]> {
    return laravelAdminService.getUsuarios();
  },

  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string }): Promise<void> {
    return laravelAdminService.crearUsuario(usuario);
  },

  async editarUsuario(id: number, usuario: { correo: string; nombre_completo: string; contrasena?: string }): Promise<void> {
    return laravelAdminService.editarUsuario(id, usuario);
  },

  async eliminarUsuario(id: number): Promise<void> {
    return laravelAdminService.eliminarUsuario(id);
  },

  async toggleEstadoUsuario(id: number, nuevoEstado: boolean): Promise<void> {
    return laravelAdminService.toggleEstadoUsuario(id, nuevoEstado);
  },

  async getFincas(): Promise<Finca[]> {
    return laravelAdminService.getFincas();
  },

  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<void> {
    return laravelAdminService.crearFinca(finca);
  },

  async eliminarFinca(id: number): Promise<void> {
    return laravelAdminService.eliminarFinca(id);
  },

  async getGanadoCompleto(): Promise<AnimalInfo[]> {
    return laravelAdminService.getGanadoCompleto();
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
    return laravelAdminService.crearAnimal(animal);
  },

  async eliminarAnimal(id: number): Promise<void> {
    return laravelAdminService.eliminarAnimal(id);
  },

  async getDashboardStats(): Promise<{ personalActivo: number; bovinos: number; fincas: number }> {
    return laravelAdminService.getDashboardStats();
  },

  async getAnalisisPesajes(): Promise<AnalisisPesos> {
    return laravelAdminService.getAnalisisPesajes();
  },
};
