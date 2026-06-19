/**
 * @file auth-interceptor.ts
 * @description Configura Axios para enviar el token seguro de Laravel Sanctum.
 */

import axios from 'axios';

function getSessionToken(): string {
    // Lee la sesión guardada en localStorage.
    const sessionStr = localStorage.getItem('usuario_sesion');

    if (!sessionStr) {
        return '';
    }

    try {
        // Extrae el token guardado después del login.
        const session = JSON.parse(sessionStr);
        return session?.token ? String(session.token) : '';
    } catch (error) {
        // Limpia sesión dañada.
        localStorage.removeItem('usuario_sesion');
        return '';
    }
}

axios.interceptors.request.use((config) => {
    // Obtiene el token actual.
    const token = getSessionToken();

    config.headers = config.headers || {};
    config.headers.Accept = 'application/json';

    // Envía el token en cada petición.
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        // Si el token ya no sirve, limpia la sesión local.
        if (status === 401) {
            localStorage.removeItem('usuario_sesion');
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
        }

        return Promise.reject(error);
    }
);