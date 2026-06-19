/**
 * @file laravel-auth-repository.ts
 * @description Repositorio de autenticación para Laravel usando token seguro de Sanctum.
 */

import axios from 'axios';
import type { IAuthRepository, User } from './interfaces';

type AuthenticatedUser = User & {
    token?: string;
    token_type?: string;
};

export class LaravelAuthRepository implements IAuthRepository {
    async login(correo: string, password: string): Promise<AuthenticatedUser> {
        // URL base del backend Laravel.
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

        // Limpia el correo antes de enviarlo.
        const correoNormalizado = correo.trim().toLowerCase();

        // Limpia sesiones anteriores antes de iniciar sesión.
        localStorage.removeItem('usuario_sesion');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');

        try {
            // Envía credenciales al backend.
            const response = await axios.post(`${apiUrl}/login`, {
                correo: correoNormalizado,
                password: password,
            });

            const loggedUser = response.data as AuthenticatedUser;

            // Verifica que Laravel haya devuelto token.
            if (!loggedUser.token) {
                throw new Error('El backend no devolvió token de autenticación.');
            }

            // Registra actividad de login si el servicio está disponible.
            import('../modules/admin/services/admin.service')
                .then(({ adminService }) => {
                    if (adminService && (adminService as any).registrarLogin) {
                        (adminService as any)
                            .registrarLogin(loggedUser.id, loggedUser.usuario, loggedUser.rol)
                            .catch(console.error);
                    }
                })
                .catch(err => console.error('Error al cargar adminService dinámicamente:', err));

            return loggedUser;
        } catch (err: any) {
            // Limpia sesión si falla el login.
            localStorage.removeItem('usuario_sesion');
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');

            console.error('Error al iniciar sesión con Laravel:', err.response?.data?.message || err.message);
            throw new Error(err.response?.data?.message || err.message || 'Correo o contraseña incorrectos');
        }
    }

    async recuperarPassword(correo: string): Promise<any> {
        // URL base del backend Laravel.
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

        try {
            // Solicita recuperación al backend.
            const response = await axios.post(`${apiUrl}/recuperar-password`, {
                correo: correo.trim().toLowerCase(),
            });

            return response.data;
        } catch (err: any) {
            console.error('Error al solicitar recuperación de contraseña con Laravel:', err.response?.data?.message || err.message);
            throw new Error(err.response?.data?.message || 'Error al procesar la solicitud de recuperación');
        }
    }
}