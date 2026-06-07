import axios from 'axios';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  let token = '';
  if (sessionStr) {
    try {
      const user = JSON.parse(sessionStr);
      token = user.token || localStorage.getItem('token') || '';
    } catch (e) {
      console.error('Error parsing session in adminApi:', e);
    }
  }
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const adminApi = {
  // Dashboard
  async getDashboardStats() {
    try {
      const response = await axios.get(`${getApiUrl()}/admin/dashboard`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener estadísticas del dashboard',
      };
    }
  },

  // Usuarios
  async getUsuarios(page?: number, filters?: Record<string, any>) {
    try {
      const params: Record<string, any> = { ...filters };
      if (page) params.page = page;

      const response = await axios.get(`${getApiUrl()}/admin/usuarios`, {
        headers: getHeaders(),
        params,
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener usuarios',
      };
    }
  },

  async getUsuario(id: number | string) {
    try {
      const response = await axios.get(`${getApiUrl()}/admin/usuarios/${id}`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener detalles del usuario',
      };
    }
  },

  async toggleUsuarioStatus(id: number | string) {
    try {
      const response = await axios.patch(`${getApiUrl()}/admin/usuarios/${id}/status`, {}, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al cambiar estado del usuario',
      };
    }
  },

  // Fincas
  async getFincas(page?: number, filters?: Record<string, any>) {
    try {
      const params: Record<string, any> = { ...filters };
      if (page) params.page = page;

      const response = await axios.get(`${getApiUrl()}/admin/fincas`, {
        headers: getHeaders(),
        params,
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener fincas',
      };
    }
  },

  async getFinca(id: number | string) {
    try {
      const response = await axios.get(`${getApiUrl()}/admin/fincas/${id}`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener detalles de la finca',
      };
    }
  },

  // Reportes
  async getReportes() {
    try {
      const response = await axios.get(`${getApiUrl()}/admin/reportes`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener reportes',
      };
    }
  },

  // Obtener Roles
  async getRoles() {
    try {
      const response = await axios.get(`${getApiUrl()}/roles`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener roles',
      };
    }
  },

  // Crear Usuario
  async crearUsuario(userData: any) {
    try {
      const response = await axios.post(`${getApiUrl()}/admin/usuarios`, userData, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al crear usuario',
      };
    }
  },
};
