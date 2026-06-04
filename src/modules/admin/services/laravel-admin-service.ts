/**
 * @file laravel-admin-service.ts
 * @description Implementación del servicio de administración utilizando la API de Laravel.
 */

import axios from 'axios';
import type { Rol, Raza, UsuarioInfo, Finca, AnimalInfo, AnalisisPesos } from './admin.service';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  let userId = '';
  let userRole = '';
  if (sessionStr) {
    try {
      const user = JSON.parse(sessionStr);
      userId = user.id ? String(user.id) : '';
      userRole = user.rol ? String(user.rol) : '';
    } catch (e) {
      console.error('Error parsing session in laravelAdminService:', e);
    }
  }
  return {
    'X-User-Id': userId,
    'X-User-Role': userRole,
  };
};

export const laravelAdminService = {
  async getRoles(): Promise<Rol[]> {
    const response = await axios.get(`${getApiUrl()}/roles`);
    return response.data;
  },

  async getRazas(): Promise<Raza[]> {
    const response = await axios.get(`${getApiUrl()}/razas`);
    return response.data;
  },

  async crearRaza(nombre: string, descripcion?: string): Promise<Raza> {
    const response = await axios.post(`${getApiUrl()}/razas`, { nombre, descripcion });
    return response.data;
  },

  async getUsuarios(): Promise<UsuarioInfo[]> {
    const response = await axios.get(`${getApiUrl()}/usuarios`, { headers: getHeaders() });
    return response.data;
  },

  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string }): Promise<void> {
    await axios.post(`${getApiUrl()}/usuarios`, usuario, { headers: getHeaders() });
  },

  async editarUsuario(id: number, usuario: { correo: string; nombre_completo: string; contrasena?: string }): Promise<void> {
    await axios.put(`${getApiUrl()}/usuarios/${id}`, usuario, { headers: getHeaders() });
  },

  async eliminarUsuario(id: number): Promise<void> {
    await axios.delete(`${getApiUrl()}/usuarios/${id}`, { headers: getHeaders() });
  },

  async toggleEstadoUsuario(id: number, nuevoEstado: boolean): Promise<void> {
    await axios.put(`${getApiUrl()}/usuarios/${id}/toggle-activo`, { activo: nuevoEstado }, { headers: getHeaders() });
  },

  async getFincas(): Promise<Finca[]> {
    const response = await axios.get(`${getApiUrl()}/fincas`, { headers: getHeaders() });
    return response.data;
  },

  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<void> {
    await axios.post(`${getApiUrl()}/fincas`, finca, { headers: getHeaders() });
  },

  async eliminarFinca(id: number): Promise<void> {
    try {
      await axios.delete(`${getApiUrl()}/fincas/${id}`, { headers: getHeaders() });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar finca');
    }
  },

  async getGanadoCompleto(): Promise<AnimalInfo[]> {
    const response = await axios.get(`${getApiUrl()}/ganado-completo`, { headers: getHeaders() });
    return response.data;
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
    await axios.post(`${getApiUrl()}/animales`, animal, { headers: getHeaders() });
  },

  async eliminarAnimal(id: number): Promise<void> {
    await axios.delete(`${getApiUrl()}/animales/${id}`, { headers: getHeaders() });
  },

  async getDashboardStats(): Promise<{ personalActivo: number; bovinos: number; fincas: number }> {
    const response = await axios.get(`${getApiUrl()}/dashboard-stats`, { headers: getHeaders() });
    return response.data;
  },

  async getAnalisisPesajes(): Promise<AnalisisPesos> {
    const response = await axios.get(`${getApiUrl()}/analisis-pesajes`, { headers: getHeaders() });
    return response.data;
  },
};
