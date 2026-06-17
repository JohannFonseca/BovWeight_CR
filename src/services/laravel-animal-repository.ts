/**
 * @file laravel-animal-repository.ts
 * @description Repositorio de animales para el backend de Laravel.
 */

import axios from 'axios';
import type { Animal, WeightRecord, IAnimalRepository, Cita, ReporteVeterinario } from './interfaces';

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

  async estimateWeight(animalId: number | null, girth: number | null, length: number | null, imageFile?: File | File[]): Promise<{ peso_estimado: number; model: string; largo_detectado?: number; perimetro_detectado?: number; confianza?: number; ruta_imagen?: string | null }> {
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
        confianza: response.data.estimacion.confianza,
        ruta_imagen: response.data.estimacion.ruta_imagen || null
      };
    } catch (err: any) {
      console.error('Error en estimateWeight con Laravel:', err.message);
      throw new Error('Error al estimar el peso con IA');
    }
  }

  async saveWeightRecord(animalId: number, pesoEstimado: number, pesoCorregido?: number, rutaImagen?: string): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/animales/${animalId}/registrar-peso`, {
        peso_estimado_kg: pesoEstimado,
        peso_corregido_kg: pesoCorregido,
        ruta_imagen: rutaImagen,
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

  async editarFinca(id: number, finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.put(`${apiUrl}/fincas/${id}`, finca, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en editarFinca con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al editar la finca');
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

  async editarAnimal(id: number, animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; estado?: string | null; observaciones?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.put(`${apiUrl}/animales/${id}`, animal, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en editarAnimal con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al editar el animal');
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

  async getReportesGanadero(): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/reportes-ganadero`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getReportesGanadero con Laravel:', err.message);
      throw new Error('Error al obtener los reportes');
    }
  }

  async guardarReporteGanadero(reporte: { titulo: string; descripcion?: string | null; destinatario?: string | null; animal_ids: number[] }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/reportes-ganadero`, reporte, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en guardarReporteGanadero con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al guardar el reporte');
    }
  }

  async getReporteDetalleGanadero(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/reportes-ganadero/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getReporteDetalleGanadero con Laravel:', err.message);
      throw new Error('Error al obtener el detalle del reporte');
    }
  }

  async eliminarReporteGanadero(id: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.delete(`${apiUrl}/reportes-ganadero/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en eliminarReporteGanadero con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al eliminar el reporte');
    }
  }

  async getVeterinariosGanadero(): Promise<any[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/ganadero/veterinarios`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getVeterinariosGanadero con Laravel:', err.message);
      throw new Error('Error al obtener veterinarios del ganadero');
    }
  }

  async asignarFincaVeterinario(payload: { veterinario_id: number; finca_id: number }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/ganadero/veterinarios/asignar-finca`, payload, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en asignarFincaVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al asignar veterinario a la finca');
    }
  }

  async guardarPermisosVeterinario(payload: { veterinario_id: number; finca_id: number; animales_ids: number[] }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/ganadero/veterinarios/guardar-permisos`, payload, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en guardarPermisosVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al guardar permisos del veterinario');
    }
  }

  async revocarFincaVeterinario(vetId: number, fincaId: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.delete(`${apiUrl}/ganadero/veterinarios/${vetId}/revocar-finca/${fincaId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en revocarFincaVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al revocar acceso a la finca');
    }
  }

  async toggleEstadoVeterinario(vetId: number): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.put(`${apiUrl}/ganadero/veterinarios/${vetId}/toggle-estado`, {}, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en toggleEstadoVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al cambiar estado del veterinario');
    }
  }

  async getCitas(): Promise<Cita[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/citas`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getCitas con Laravel:', err.message);
      throw new Error('Error al obtener la lista de citas');
    }
  }

  async crearCita(cita: { veterinario_id: number; finca_id: number; animal_id?: number | null; fecha: string; hora: string; motivo: string; estado?: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/citas`, cita, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en crearCita con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar la cita');
    }
  }

  async actualizarCita(id: number, payload: { fecha?: string; hora?: string; estado?: string; comentario_rechazo?: string | null }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.put(`${apiUrl}/citas/${id}`, payload, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en actualizarCita con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al actualizar la cita');
    }
  }

  async getReportesVeterinarios(animalId?: number): Promise<ReporteVeterinario[]> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const params = animalId ? { animal_id: animalId } : {};
      const response = await axios.get(`${apiUrl}/reportes-veterinarios`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en getReportesVeterinarios con Laravel:', err.message);
      throw new Error('Error al obtener los reportes veterinarios');
    }
  }

  async crearReporteVeterinario(reporte: { animal_id: number; observaciones: string; diagnostico_preliminar: string; recomendaciones: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad: string; estado: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/reportes-veterinarios`, reporte, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en crearReporteVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al registrar el reporte veterinario');
    }
  }

  async actualizarReporteVeterinario(id: number, payload: { observaciones?: string; diagnostico_preliminar?: string; recomendaciones?: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad?: string; estado?: string }): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.put(`${apiUrl}/reportes-veterinarios/${id}`, payload, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (err: any) {
      console.error('Error en actualizarReporteVeterinario con Laravel:', err.message);
      throw new Error(err.response?.data?.message || 'Error al actualizar el reporte veterinario');
    }
  }
}

