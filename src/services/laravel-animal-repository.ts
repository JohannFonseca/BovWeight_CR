/**
 * @file laravel-animal-repository.ts
 * @description Repositorio de animales para el backend de Laravel.
 */

import axios from 'axios';
import type { Animal, WeightRecord, IAnimalRepository } from './interfaces';

export class LaravelAnimalRepository implements IAnimalRepository {
  private getHeaders() {
    const sessionStr = localStorage.getItem('usuario_sesion');
    let userId = '';
    let userRole = '';
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr);
        userId = user.id ? String(user.id) : '';
        userRole = user.rol ? String(user.rol) : '';
      } catch (e) {
        console.error('Error al parsear la sesión de usuario:', e);
      }
    }
    return {
      'X-User-Id': userId,
      'X-User-Role': userRole,
    };
  }

  async getAllAnimals(): Promise<Animal[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/animales`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getAllAnimals con Laravel:', err.message);
      throw new Error('Error al obtener la lista de animales');
    }
  }

  async getAnimalById(id: number): Promise<Animal> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/animales/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getAnimalById con Laravel:', err.message);
      throw new Error('Error al obtener el animal');
    }
  }

  async getWeightHistory(animalId: number): Promise<WeightRecord[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/animales/${animalId}/historial-peso`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getWeightHistory con Laravel:', err.message);
      throw new Error('Error al obtener el historial de pesos');
    }
  }

  async estimateWeight(animalId: number | null, girth: number | null, length: number | null, imageFile?: File | File[]): Promise<{ peso_estimado: number; model: string; largo_detectado?: number; perimetro_detectado?: number; confianza?: number }> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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
        confianza: response.data.estimacion.confianza
      };
    } catch (err: any) {
      console.error('Error en estimateWeight con Laravel:', err.message);
      throw new Error('Error al estimar el peso con IA');
    }
  }

  async saveWeightRecord(animalId: number, pesoEstimado: number, pesoCorregido?: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/animales/${animalId}/registrar-peso`, {
        peso_estimado_kg: pesoEstimado,
        peso_corregido_kg: pesoCorregido,
      }, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en saveWeightRecord con Laravel:', err.message);
      throw new Error('Error al registrar el peso del animal');
    }
  }

  async getFincas(): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/fincas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getFincas con Laravel:', err.message);
      throw new Error('Error al obtener la lista de fincas');
    }
  }

  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/fincas`, finca, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en crearFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al crear la finca');
    }
  }

  async crearAnimal(animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; observaciones?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/animales`, animal, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en crearAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar el animal');
    }
  }

  async getRazas(): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/razas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getRazas con Laravel:', err.message);
      throw new Error('Error al obtener la lista de razas');
    }
  }

  async getUsuarios(rolNombre?: string): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const params = rolNombre ? { rol_nombre: rolNombre } : {};
      const response = await axios.get(`${apiUrl}/usuarios`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getUsuarios con Laravel:', err.message);
      throw new Error('Error al obtener la lista de usuarios');
    }
  }

  async eliminarAnimal(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.delete(`${apiUrl}/animales/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el animal');
    }
  }

  async eliminarFinca(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.delete(`${apiUrl}/fincas/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar la finca');
    }
  }

  async getUsuarioDetalle(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/admin/usuarios/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getUsuarioDetalle con Laravel:', err.message);
      throw new Error('Error al obtener los detalles del usuario');
    }
  }

  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string; ganadero_id?: number | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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

  async editarUsuario(id: number, data: { correo: string; nombre_completo: string; contrasena?: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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
}
