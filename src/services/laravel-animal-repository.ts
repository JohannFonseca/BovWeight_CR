/**
 * @file laravel-animal-repository.ts
 * @description Repositorio de animales para el backend de Laravel con soporte de caché offline mediante IndexedDB.
 */

import axios from 'axios';
import type { Animal, WeightRecord, IAnimalRepository, Cita, ReporteVeterinario, Notificacion } from './interfaces';

class CacheManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'BovWeightCacheDB';
  private readonly STORE_NAME = 'cache_lecturas';
  private readonly TTL = 1000 * 60 * 60 * 2; // 2 horas de vida útil para las copias locales en caché

  private getUserId(): string {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'guest';
    }
    const sessionStr = localStorage.getItem('usuario_sesion');
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr);
        return user.id ? String(user.id) : 'guest';
      } catch {
        return 'guest';
      }
    }
    return 'guest';
  }

  private getScopedKey(key: string): string {
    return `user_${this.getUserId()}_${key}`;
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async get(key: string): Promise<any | null> {
    try {
      if (!this.db) this.db = await this.initDB();
      const scopedKey = this.getScopedKey(key);
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(scopedKey);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  public async put(key: string, data: any): Promise<void> {
    try {
      if (!this.db) this.db = await this.initDB();
      const transaction = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const scopedKey = this.getScopedKey(key);
      store.put({
        id: scopedKey,
        data,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error('[CacheManager] Error guardando en cache:', e);
    }
  }

  public async invalidate(key: string): Promise<void> {
    try {
      if (!this.db) this.db = await this.initDB();
      const transaction = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const scopedKey = this.getScopedKey(key);
      store.delete(scopedKey);
    } catch (e) {
      console.error('[CacheManager] Error invalidando cache:', e);
    }
  }

  public async isExpired(key: string): Promise<boolean> {
    try {
      if (!this.db) this.db = await this.initDB();
      const scopedKey = this.getScopedKey(key);
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(scopedKey);
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(true);
          } else {
            const age = Date.now() - result.updatedAt;
            resolve(age > this.TTL);
          }
        };
        request.onerror = () => resolve(true);
      });
    } catch (e) {
      return true;
    }
  }
}

export class LaravelAnimalRepository implements IAnimalRepository {
  private cache = new CacheManager();

  private async handleCachedQuery<T>(
    cacheKey: string,
    fetchFromServer: () => Promise<T>
  ): Promise<T> {
    // 1. Si no hay red, servir copia local si existe
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log(`[OfflineCache] Sin conexión de red. Usando copia local de: ${cacheKey}`);
        return cached;
      }
      throw new Error('Sin conexión a Internet y sin copia local guardada.');
    }

    // 2. Si hay conexión pero el cache es reciente, servir de inmediato y revalidar silenciosamente en background
    const expired = await this.cache.isExpired(cacheKey);
    if (!expired) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        fetchFromServer().then(data => {
          this.cache.put(cacheKey, data);
        }).catch(err => {
          console.warn(`[OfflineCache] Revalidación en background falló para: ${cacheKey}`, err.message);
        });
        return cached;
      }
    }

    // 3. Si expiró o no existe cache, pedir al servidor y guardar copia
    try {
      const data = await fetchFromServer();
      await this.cache.put(cacheKey, data);
      return data;
    } catch (err: any) {
      console.error(`[OfflineCache] Falló la petición online para ${cacheKey}:`, err.message);
      // Fallback final si la llamada online falla (red inestable, caída de servidor, etc)
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        console.log(`[OfflineCache] Usando copia local como fallback para: ${cacheKey}`);
        return cached;
      }
      throw err;
    }
  }

  private getHeaders() {
    const sessionStr = localStorage.getItem('usuario_sesion');
    let userId = '';
    let userRole = '';
    let token = '';
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr);
        userId = user.id ? String(user.id) : '';
        userRole = user.rol ? String(user.rol) : '';
        token = user.token ? String(user.token) : '';
      } catch (e) {
        console.error('Error al parsear la sesión de usuario:', e);
      }
    }
    return {
      'X-User-Id': userId,
      'X-User-Role': userRole,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async getAllAnimals(): Promise<Animal[]> {
    return this.handleCachedQuery<Animal[]>('animals_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/animales`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async getAnimalById(id: number): Promise<Animal> {
    return this.handleCachedQuery<Animal>(`animal_detail_${id}`, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/animales/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    return this.handleCachedQuery<WeightRecord[]>(`weight_history_${animalId}`, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/animales/${animalId}/historial-peso`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async estimateWeight(animalId: number | null, girth: number | null, length: number | null, imageFile?: File | File[]): Promise<{ peso_estimado: number; model: string; largo_detectado?: number; perimetro_detectado?: number; confianza?: number; ruta_imagen?: string | null }> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      let data: any;
      const headers: any = this.getHeaders();

      if (imageFile) {
        data = new FormData();
        if (Array.isArray(imageFile)) {
          imageFile.forEach((file) => {
            data.append('imagen[]', file);
          });
        } else {
          data.append('imagen', imageFile);
        }
        if (animalId !== null) {
          data.append('animal_id', String(animalId));
        }
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        data = {
          animal_id: animalId,
          perimetro_toracico_cm: girth,
          largo_cuerpo_cm: length,
        };
      }

      const response = await axios.post(`${apiUrl}/estimar-peso`, data, { headers });
      
      return {
        peso_estimado: response.data.estimacion.peso_estimado_kg,
        model: response.data.metadata.modelo_utilizado,
        largo_detectado: response.data.estimacion.largo_cuerpo_cm,
        perimetro_detectado: response.data.estimacion.perimetro_toracico_cm,
        confianza: response.data.estimacion.confianza,
        ruta_imagen: response.data.estimacion.ruta_imagen || null
      };
    } catch (err: any) {
      console.error('Error en estimateWeight con Laravel:', err.message);
      throw new Error('Error al estimar el peso con IA');
    }
  }

  async saveWeightRecord(animalId: number, pesoEstimado: number, pesoCorregido?: number, rutaImagen?: string): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/animales/${animalId}/registrar-peso`, {
        peso_estimado_kg: pesoEstimado,
        peso_corregido_kg: pesoCorregido,
        ruta_imagen: rutaImagen,
      }, {
        headers: this.getHeaders(),
      });
      // Invalidar caches relacionados para forzar recargas frescas
      await this.cache.invalidate(`weight_history_${animalId}`);
      await this.cache.invalidate('animals_list');
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en saveWeightRecord con Laravel:', err.message);
      throw new Error('Error al registrar el peso del animal');
    }
  }

  async getFincas(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('fincas_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/fincas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/fincas`, finca, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('fincas_list');
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en crearFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al crear la finca');
    }
  }

  async editarFinca(id: number, finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/fincas/${id}`, finca, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('fincas_list');
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en editarFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al editar la finca');
    }
  }

  async crearAnimal(animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; observaciones?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/animales`, animal, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('animals_list');
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en crearAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar el animal');
    }
  }

  async editarAnimal(id: number, animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; estado?: string | null; observaciones?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/animales/${id}`, animal, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('animals_list');
      await this.cache.invalidate(`animal_detail_${id}`);
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en editarAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al editar el animal');
    }
  }

  async getRazas(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('razas_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/razas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async getUsuarios(rolNombre?: string): Promise<any[]> {
    const key = rolNombre ? `usuarios_${rolNombre}` : 'usuarios_all';
    return this.handleCachedQuery<any[]>(key, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const params = rolNombre ? { rol_nombre: rolNombre } : {};
      const response = await axios.get(`${apiUrl}/usuarios`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    });
  }

  async eliminarAnimal(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/animales/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('animals_list');
      await this.cache.invalidate(`animal_detail_${id}`);
      await this.cache.invalidate(`weight_history_${id}`);
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el animal');
    }
  }

  async eliminarFinca(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/fincas/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('fincas_list');
      await this.cache.invalidate('dashboard_stats');
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar la finca');
    }
  }

  async getUsuarioDetalle(id: number): Promise<any> {
    return this.handleCachedQuery<any>(`usuario_detail_${id}`, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/admin/usuarios/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string; ganadero_id?: number | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/usuarios`, usuario, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en crearUsuario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al crear el usuario');
    }
  }

  async getRoles(): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.get(`${apiUrl}/roles`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getRoles con Laravel:', err.message);
      throw new Error('Error al obtener los roles');
    }
  }

  async editarUsuario(id: number, data: { correo: string; nombre_completo: string; contrasena?: string; foto_base64?: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/usuarios/${id}`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en editarUsuario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al editar el usuario');
    }
  }

  async reenviarCredenciales(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/usuarios/${id}/reenviar-credenciales`, {}, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en reenviarCredenciales con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al reenviar credenciales');
    }
  }

  async cambiarPassword(id: number, passwordActual: string, nuevoPassword: string): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/cambiar-password`, {
        id,
        password_actual: passwordActual,
        nuevo_password: nuevoPassword
      }, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en cambiarPassword con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  }

  async getReportesGanadero(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('reportes_ganadero_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/reportes-ganadero`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async guardarReporteGanadero(reporte: { titulo: string; descripcion?: string | null; destinatario?: string | null; animal_ids: number[] }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/reportes-ganadero`, reporte, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('reportes_ganadero_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en guardarReporteGanadero con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al guardar el reporte');
    }
  }

  async getReporteDetalleGanadero(id: number): Promise<any> {
    return this.handleCachedQuery<any>(`reporte_ganadero_detail_${id}`, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/reportes-ganadero/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async eliminarReporteGanadero(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/reportes-ganadero/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('reportes_ganadero_list');
      await this.cache.invalidate(`reporte_ganadero_detail_${id}`);
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarReporteGanadero con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el reporte');
    }
  }

  async getVeterinariosGanadero(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('veterinarios_ganadero_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/ganadero/veterinarios`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async asignarFincaVeterinario(payload: { veterinario_id: number; finca_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/ganadero/veterinarios/asignar-finca`, payload, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('veterinarios_ganadero_list');
      await this.cache.invalidate('fincas_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en asignarFincaVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al asignar veterinario a la finca');
    }
  }

  async guardarPermisosVeterinario(payload: { veterinario_id: number; finca_id: number; animales_ids: number[] }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/ganadero/veterinarios/guardar-permisos`, payload, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('veterinarios_ganadero_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en guardarPermisosVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al guardar permisos del veterinario');
    }
  }

  async revocarFincaVeterinario(vetId: number, fincaId: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/ganadero/veterinarios/${vetId}/revocar-finca/${fincaId}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('veterinarios_ganadero_list');
      await this.cache.invalidate('fincas_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en revocarFincaVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al revocar acceso a la finca');
    }
  }

  async toggleEstadoVeterinario(vetId: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/ganadero/veterinarios/${vetId}/toggle-estado`, {}, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('veterinarios_ganadero_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en toggleEstadoVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al cambiar estado del veterinario');
    }
  }

  async getCitas(): Promise<Cita[]> {
    return this.handleCachedQuery<Cita[]>('citas_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/citas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async crearCita(cita: { veterinario_id: number; finca_id: number; animal_id?: number | null; fecha: string; hora: string; motivo: string; estado?: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/citas`, cita, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('citas_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en crearCita con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar la cita');
    }
  }

  async actualizarCita(id: number, payload: { fecha?: string; hora?: string; estado?: string; comentario_rechazo?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/citas/${id}`, payload, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('citas_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en actualizarCita con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al actualizar la cita');
    }
  }

  async getReportesVeterinarios(animalId?: number): Promise<ReporteVeterinario[]> {
    const key = animalId ? `reportes_vet_${animalId}` : 'reportes_vet_all';
    return this.handleCachedQuery<ReporteVeterinario[]>(key, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const params = animalId ? { animal_id: animalId } : {};
      const response = await axios.get(`${apiUrl}/reportes-veterinarios`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    });
  }

  async crearReporteVeterinario(reporte: { animal_id: number; observaciones: string; diagnostico_preliminar: string; recomendaciones: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad: string; estado: string; visita_recomendada?: boolean; cita_id?: number | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/reportes-veterinarios`, reporte, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('reportes_vet_all');
      await this.cache.invalidate(`reportes_vet_${reporte.animal_id}`);
      return response.data;
    } catch (err: any) {
      console.error('Error en crearReporteVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar el reporte veterinario');
    }
  }

  async actualizarReporteVeterinario(id: number, payload: { observaciones?: string; diagnostico_preliminar?: string; recomendaciones?: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad?: string; estado?: string; visita_recomendada?: boolean; cita_id?: number | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/reportes-veterinarios/${id}`, payload, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('reportes_vet_all');
      return response.data;
    } catch (err: any) {
      console.error('Error en actualizarReporteVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al actualizar el reporte veterinario');
    }
  }

  async getNotificaciones(): Promise<Notificacion[]> {
    return this.handleCachedQuery<Notificacion[]>('notificaciones_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/notificaciones`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async marcarNotificacionLeida(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/notificaciones/${id}/leer`, {}, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('notificaciones_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en marcarNotificacionLeida con Laravel:', err.message);
      throw new Error('Error al marcar la notificación como leída');
    }
  }

  async marcarTodasNotificacionesLeidas(): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/notificaciones/leer-todas`, {}, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('notificaciones_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en marcarTodasNotificacionesLeidas con Laravel:', err.message);
      throw new Error('Error al marcar todas las notificaciones como leídas');
    }
  }

  async eliminarNotificacion(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/notificaciones/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('notificaciones_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarNotificacion con Laravel:', err.message);
      throw new Error('Error al eliminar la notificación');
    }
  }

  async getDashboardStats(): Promise<any> {
    return this.handleCachedQuery<any>('dashboard_stats', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/dashboard-stats`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async getRecordatoriosSanitarios(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('recordatorios_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/recordatorios-sanitarios`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async crearRecordatorioSanitario(recordatorio: {
    titulo: string;
    descripcion?: string | null;
    tipo: 'vacuna' | 'desparasitacion' | 'revision_medica' | 'otro';
    fecha_programada: string;
    finca_id?: number | null;
    animal_id?: number | null;
    estado?: 'pendiente' | 'completado';
  }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/recordatorios-sanitarios`, recordatorio, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('recordatorios_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en crearRecordatorioSanitario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al crear el recordatorio sanitario');
    }
  }

  async actualizarRecordatorioSanitario(id: number, payload: {
    titulo?: string;
    descripcion?: string | null;
    tipo?: 'vacuna' | 'desparasitacion' | 'revision_medica' | 'otro';
    fecha_programada?: string;
    finca_id?: number | null;
    animal_id?: number | null;
    estado?: 'pendiente' | 'completado';
  }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.put(`${apiUrl}/recordatorios-sanitarios/${id}`, payload, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('recordatorios_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en actualizarRecordatorioSanitario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al actualizar el recordatorio sanitario');
    }
  }

  async eliminarRecordatorioSanitario(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/recordatorios-sanitarios/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('recordatorios_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarRecordatorioSanitario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el recordatorio sanitario');
    }
  }

  async runRecordatoriosCheck(): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/recordatorios-sanitarios/run-check`, {}, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en runRecordatoriosCheck con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al ejecutar verificación de recordatorios');
    }
  }

  async getAyudantes(): Promise<any[]> {
    return this.handleCachedQuery<any[]>('ayudantes_list', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/ganadero/ayudantes`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async crearAyudante(ayudante: { correo: string; nombre_completo: string; contrasena: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.post(`${apiUrl}/ganadero/ayudantes`, ayudante, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('ayudantes_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en crearAyudante con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar el ayudante');
    }
  }

  async eliminarAyudante(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
    try {
      const response = await axios.delete(`${apiUrl}/ganadero/ayudantes/${id}`, {
        headers: this.getHeaders(),
      });
      await this.cache.invalidate('ayudantes_list');
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarAyudante con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el ayudante');
    }
  }

  async getVeterinarioDashboard(): Promise<any> {
    return this.handleCachedQuery<any>('veterinario_dashboard', async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/veterinario/dashboard`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }

  async getVeterinarioAnimalDetail(id: number): Promise<any> {
    return this.handleCachedQuery<any>(`veterinario_animal_detail_${id}`, async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
      const response = await axios.get(`${apiUrl}/veterinario/animal/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    });
  }
}

