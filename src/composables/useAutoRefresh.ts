/**
 * @file useAutoRefresh.ts
 * @description Composable para manejar actualizaciones en segundo plano silenciosas y optimizadas.
 * Soporta pausado automático si el tab está oculto o el dispositivo está offline, y refresco inmediato al reconectar.
 */

import { onMounted, onUnmounted, ref } from 'vue';

/**
 * Hook composable para auto-refresco en segundo plano.
 * @param callback Función asíncrona a ejecutar para refrescar los datos.
 * @param intervalMs Intervalo en milisegundos (por defecto 15 segundos).
 */
export function useAutoRefresh(callback: () => Promise<void> | void, intervalMs = 15000) {
  let timer: any = null;
  const isRefreshing = ref(false);

  const performRefresh = async () => {
    // Evitar llamadas duplicadas, si está offline o el tab está en segundo plano (ahorro de batería/datos)
    if (isRefreshing.value || !navigator.onLine || document.visibilityState !== 'visible') {
      return;
    }
    isRefreshing.value = true;
    try {
      await callback();
    } catch (e) {
      console.error('[AutoRefresh] Error en la actualización de fondo:', e);
    } finally {
      isRefreshing.value = false;
    }
  };

  const start = () => {
    stop();
    timer = setInterval(performRefresh, intervalMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      performRefresh();
      start();
    } else {
      stop();
    }
  };

  const handleOnline = () => {
    // Refrescar inmediatamente al recuperar internet
    performRefresh();
  };

  onMounted(() => {
    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
  });

  onUnmounted(() => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
  });

  return {
    isRefreshing,
    triggerRefresh: performRefresh
  };
}
