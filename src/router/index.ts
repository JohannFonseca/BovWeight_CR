/**
 * @file index.ts (Router)
 * @description Rutas de la aplicación y protección por roles.
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
    component: () => import('../modules/admin/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../modules/admin/pages/AdminDashboard.vue'),
      },
      {
        path: 'usuarios',
        name: 'AdminUsuarios',
        component: () => import('../modules/admin/pages/AdminUsuarios.vue'),
      },
      {
        path: 'usuarios/:id',
        name: 'AdminUsuarioDetalle',
        component: () => import('../modules/admin/pages/AdminUsuarioDetalle.vue'),
      },
      {
        path: 'fincas',
        name: 'AdminFincas',
        component: () => import('../modules/admin/pages/AdminFincas.vue'),
      },
      {
        path: 'fincas/:id',
        name: 'AdminFincaDetalle',
        component: () => import('../modules/admin/pages/AdminFincaDetalle.vue'),
      },
      {
        path: 'reportes',
        name: 'AdminReportes',
        component: () => import('../modules/admin/pages/AdminReportes.vue'),
      },
    ]
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
    path: '/ganado/estimacion-ia',
    name: 'AiEstimation',
    component: () => import('../modules/ganado/pages/AiEstimationPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ganadero', 'admin'] }
  },
  {
    path: '/ganado/registrar',
    name: 'RegistrarGanado',
    component: () => import('../modules/ganado/pages/RegistrarPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ganadero', 'admin'] }
  },
  {
    path: '/ganado/personal',
    name: 'PersonalGanado',
    component: () => import('../modules/ganado/pages/PersonalPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ganadero', 'admin'] }
  },
  {
    path: '/ganado/ajustes',
    name: 'AjustesGanado',
    component: () => import('../modules/ganado/pages/AjustesPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ganadero', 'admin'] }
  },
  {
    path: '/animal/:id',
    name: 'AnimalDetail',
    component: () => import('../modules/ganado/pages/AnimalDetailPage.vue'),
    meta: { requiresAuth: true }
  },
];

// Crear el router usando historial web
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Guardián para verificar permisos de acceso antes de entrar a cada ruta
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

