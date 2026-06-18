/**
 * @file laravel-auth-repository.ts
 * @description Repositorio de autenticación para el backend de Laravel.
 */

import axios from 'axios';
import type { IAuthRepository, User } from './interfaces';

export class LaravelAuthRepository implements IAuthRepository {
  async login(correo: string, password: string): Promise<User> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    try {
      const response = await axios.post(`${apiUrl}/login`, {
        correo: correo,
        password: password,
      });

      const loggedUser: User = response.data;

      // Optional: if registrarLogin is added in the future
      import('../modules/admin/services/admin.service')
        .then(({ adminService }) => {
          if (adminService && (adminService as any).registrarLogin) {
            (adminService as any).registrarLogin(loggedUser.id, loggedUser.usuario, loggedUser.rol).catch(console.error);
          }
        })
        .catch(err => console.error('Error al cargar adminService dinámicamente:', err));

      return loggedUser;
    } catch (err: any) {
      console.error('Error al iniciar sesión con Laravel:', err.response?.data?.message || err.message);
      throw new Error(err.response?.data?.message || 'Correo o contraseña incorrectos');
    }
  }

  async recuperarPassword(correo: string): Promise<any> {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.post(`${apiUrl}/recuperar-password`, {
        correo: correo,
      });
      return response.data;
    } catch (err: any) {
      console.error('Error al solicitar recuperación de contraseña con Laravel:', err.response?.data?.message || err.message);
      throw new Error(err.response?.data?.message || 'Error al procesar la solicitud de recuperación');
    }
  }
}
