import axios from 'axios';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';

const getHeaders = () => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  let token = '';
  let userId = '';
  let userRole = '';
  if (sessionStr) {
    try {
      const user = JSON.parse(sessionStr);
      token = user.token || localStorage.getItem('token') || '';
      userId = user.id ? String(user.id) : '';
      userRole = user.rol ? String(user.rol) : '';
    } catch (e) {
      console.error('Error parsing session in adminApi:', e);
    }
  }
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-User-Role': userRole,
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

  // Editar Usuario
  async editarUsuario(id: number | string, userData: any) {
    try {
      const response = await axios.put(`${getApiUrl()}/usuarios/${id}`, userData, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al editar usuario',
      };
    }
  },

  // Reenviar Credenciales
  async reenviarCredenciales(id: number | string) {
    try {
      const response = await axios.post(`${getApiUrl()}/usuarios/${id}/reenviar-credenciales`, {}, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al reenviar credenciales',
      };
    }
  },

  // Eliminar Usuario
  async eliminarUsuario(id: number | string) {
    try {
      const response = await axios.delete(`${getApiUrl()}/usuarios/${id}`, {
        headers: getHeaders(),
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al eliminar usuario',
      };
    }
  },

  // Auditorías (Bitácora)
  async getAuditLogs(page?: number, filters?: Record<string, any>) {
    try {
      const params: Record<string, any> = { ...filters };
      if (page) params.page = page;

      const response = await axios.get(`${getApiUrl()}/admin/auditorias`, {
        headers: getHeaders(),
        params,
      });
      return { data: response.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: err.response?.data?.message || err.message || 'Error al obtener bitácora de auditoría',
      };
    }
  },
};
