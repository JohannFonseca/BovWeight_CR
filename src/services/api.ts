import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// URL base configurable — apuntará al backend real más adelante
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de peticiones ──
apiClient.interceptors.request.use(
  (config) => {
    // Futuro: adjuntar token de autenticación aquí
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de respuestas ──
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.warn('[API] No autorizado — redirigir a login');
      } else if (status === 404) {
        console.warn('[API] Recurso no encontrado');
      } else if (status >= 500) {
        console.error('[API] Error del servidor:', error.response.data);
      }
    } else if (error.request) {
      console.error('[API] Sin respuesta del servidor — revise su conexión');
    } else {
      console.error('[API] Error de configuración:', error.message);
    }
    return Promise.reject(error);
  }
);

// ── Métodos de API tipados ──
export interface WeightRecord {
  fecha: string;
  peso: number;
}

export interface Animal {
  id: number;
  nombre: string;
  raza: string;
  edad: string;
  arete: string;
  imagen: string;
  pesoActual: number;
  historialPeso: WeightRecord[];
}

export const animalService = {
  async getAnimalById(id: number): Promise<Animal> {
    const response = await apiClient.get<Animal>(`/animales/${id}`);
    return response.data;
  },

  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const response = await apiClient.get<WeightRecord[]>(`/animales/${animalId}/peso`);
    return response.data;
  },

  async getAllAnimals(): Promise<Animal[]> {
    const response = await apiClient.get<Animal[]>('/animales');
    return response.data;
  },
};

export default apiClient;
