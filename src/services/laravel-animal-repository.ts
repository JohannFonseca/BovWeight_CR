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
}
