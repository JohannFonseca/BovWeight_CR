import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

// Usaremos lazy loading para mejorar la escalabilidad y tiempos de carga
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

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

