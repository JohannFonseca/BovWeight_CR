/**
 * @file index.ts (Router)
 * @description Configuración del sistema de rutas del lado del cliente (Vue/Ionic Router).
 * Define las vistas disponibles, aplica carga perezosa (lazy-loading) y establece políticas
 * de seguridad y control de acceso según el estado de autenticación y los roles del usuario.
 */

import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

// Definición de las rutas de la aplicación con metadatos de acceso y roles permitidos
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../modules/auth/pages/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../modules/admin/pages/AdminDashboard.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  {
    path: '/veterinario',
    name: 'VeterinarioDashboard',
    component: () => import('../modules/veterinario/pages/VeterinarioDashboard.vue'),
    meta: { requiresAuth: true, allowedRoles: ['veterinario'] }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../modules/ganado/pages/HomePage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ganadero', 'admin'] }
  },
  {
    path: '/animal/:id',
    name: 'AnimalDetail',
    component: () => import('../modules/ganado/pages/AnimalDetailPage.vue'),
    meta: { requiresAuth: true }
  },
];

// Instanciación del enrutador con historial basado en la API de navegación del navegador
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * Guardián de navegación global (Navigation Guard).
 * Valida los permisos de acceso de cada ruta en base a la sesión del usuario guardada en localStorage
 * y redirige automáticamente al login o a la pantalla principal respectiva si no tiene permisos.
 */
router.beforeEach((to, from, next) => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  let userSession: any = null;
  if (sessionStr) {
    try {
      userSession = JSON.parse(sessionStr);
    } catch (e) {
      localStorage.removeItem('usuario_sesion');
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);
  const allowedRoles = to.meta.allowedRoles as string[] | undefined;

  if (requiresAuth) {
    if (!userSession) {
      next({ name: 'Login' });
    } else if (allowedRoles && !allowedRoles.includes(userSession.rol)) {
      if (userSession.rol === 'admin') {
        next({ name: 'AdminDashboard' });
      } else if (userSession.rol === 'veterinario') {
        next({ name: 'VeterinarioDashboard' });
      } else {
        next({ name: 'Home' });
      }
    } else {
      next();
    }
  } else {
    if (to.name === 'Login' && userSession) {
      if (userSession.rol === 'admin') {
        next({ name: 'AdminDashboard' });
      } else if (userSession.rol === 'veterinario') {
        next({ name: 'VeterinarioDashboard' });
      } else {
        next({ name: 'Home' });
      }
    } else {
      next();
    }
  }
});

export default router;

