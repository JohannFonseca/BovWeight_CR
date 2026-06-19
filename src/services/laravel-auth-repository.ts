/**
 * @file laravel-auth-repository.ts
 * @description Repositorio de autenticación para Laravel usando token seguro de Sanctum con fallback offline.
 */

import axios from 'axios';
import type { IAuthRepository, User } from './interfaces';

type AuthenticatedUser = User & {
    token?: string;
    token_type?: string;
    correo?: string;
};

type CachedUserEntry = {
    correo: string;
    passwordHash: string;
    user: AuthenticatedUser;
};

// Función auxiliar nativa para hashear contraseñas usando SHA-256 (seguro para almacenamiento local)
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class LaravelAuthRepository implements IAuthRepository {
    constructor() {
        // No pre-cargar credenciales de demostración.
    }

    async login(correo: string, password: string): Promise<AuthenticatedUser> {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const correoNormalizado = correo.trim().toLowerCase();

        // 1. Si el dispositivo está offline, hacer fallback de validación local inmediatamente.
        if (!navigator.onLine) {
            return this.intentarLoginOffline(correoNormalizado, password);
        }

        try {
            // Envía credenciales al backend de forma online.
            const response = await axios.post(`${apiUrl}/login`, {
                correo: correoNormalizado,
                password: password,
            });

            const loggedUser = response.data as AuthenticatedUser;

            if (!loggedUser.token) {
                throw new Error('El backend no devolvió token de autenticación.');
            }

            // Guardar credenciales hasheadas localmente de forma segura en la lista de caché.
            try {
                const passHash = await sha256(password);
                const listStr = localStorage.getItem('cached_credentials_list') || '[]';
                let list: CachedUserEntry[] = [];
                try {
                    list = JSON.parse(listStr);
                } catch {
                    list = [];
                }
                // Filtrar duplicados
                list = list.filter(item => item.correo !== correoNormalizado);
                list.push({
                    correo: correoNormalizado,
                    passwordHash: passHash,
                    user: loggedUser
                });
                localStorage.setItem('cached_credentials_list', JSON.stringify(list));
            } catch (hashErr) {
                console.error('Error al guardar credenciales para offline:', hashErr);
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
            const backendMessage = err.response?.data?.message || err.message || '';
            console.error('Error al iniciar sesión con Laravel:', backendMessage);

            // 2. Si falló por error de red o base de datos offline (aunque el servidor local esté vivo en desarrollo),
            // intentar inicio de sesión offline como fallback si las credenciales coinciden.
            if (
                backendMessage.includes('SQLSTATE') ||
                backendMessage.includes('could not translate') ||
                backendMessage.includes('connection') ||
                backendMessage.includes('Network Error') ||
                err.code === 'ERR_NETWORK'
            ) {
                console.warn('Fallo de conexión detectado. Intentando validar credenciales localmente...');
                return this.intentarLoginOffline(correoNormalizado, password);
            }

            // Si es un error de credenciales incorrectas devuelto por el servidor, limpiar sesiones y lanzar error.
            localStorage.removeItem('usuario_sesion');
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            throw new Error(backendMessage || 'Correo o contraseña incorrectos');
        }
    }

    private async intentarLoginOffline(correo: string, password: string): Promise<AuthenticatedUser> {
        const cachedListStr = localStorage.getItem('cached_credentials_list');
        if (!cachedListStr) {
            throw new Error('No hay conexión a internet y no se encontraron credenciales guardadas en este dispositivo para inicio de sesión offline.');
        }

        try {
            const list: CachedUserEntry[] = JSON.parse(cachedListStr);
            const inputHash = await sha256(password);

            const match = list.find(item => item.correo === correo && item.passwordHash === inputHash);
            if (match) {
                console.log('Inicio de sesión offline exitoso utilizando credenciales cacheadas.');
                return match.user;
            } else {
                throw new Error('Correo o contraseña incorrectos.');
            }
        } catch (e: any) {
            throw new Error(e.message || 'Error al validar credenciales locales de forma offline.');
        }
    }

    async recuperarPassword(correo: string): Promise<any> {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

        try {
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