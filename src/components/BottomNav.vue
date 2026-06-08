<template>
  <div class="bottom-nav-container mobile-only">
    <div class="bottom-nav-bar">
      <!-- Pestaña Análisis -->
      <button 
        class="nav-tab" 
        :class="{ active: currentRoute === '/home' }" 
        @click="navigateTo('/home')"
      >
        <ion-icon :icon="barChartOutline"></ion-icon>
        <span>Análisis</span>
      </button>

      <!-- Pestaña Registrar -->
      <button 
        class="nav-tab" 
        :class="{ active: currentRoute === '/ganado/registrar' }" 
        @click="navigateTo('/ganado/registrar')"
      >
        <ion-icon :icon="addCircleOutline"></ion-icon>
        <span>Registrar</span>
      </button>

      <!-- Botón de Cámara (Estimación Peso) -->
      <div class="nav-camera-wrapper">
        <button 
          class="nav-camera-button" 
          @click="navigateTo('/ganado/estimacion-ia')"
        >
          <ion-icon :icon="cameraOutline"></ion-icon>
        </button>
        <span class="camera-label">Cámara</span>
      </div>

      <!-- Pestaña Personal -->
      <button 
        class="nav-tab" 
        :class="{ active: currentRoute === '/ganado/personal' }" 
        @click="navigateTo('/ganado/personal')"
      >
        <ion-icon :icon="peopleOutline"></ion-icon>
        <span>Personal</span>
      </button>

      <!-- Pestaña Ajustes -->
      <button 
        class="nav-tab" 
        :class="{ active: currentRoute === '/ganado/ajustes' }" 
        @click="navigateTo('/ganado/ajustes')"
      >
        <ion-icon :icon="settingsOutline"></ion-icon>
        <span>Ajustes</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { 
  barChartOutline, 
  addCircleOutline, 
  cameraOutline, 
  peopleOutline, 
  settingsOutline 
} from 'ionicons/icons';

const route = useRoute();
const router = useRouter();

const currentRoute = computed(() => route.path);

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.bottom-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 8px 16px 20px; /* extra bottom padding for mobile safe area */
  background: transparent;
  pointer-events: none; /* allow clicking through to anything underneath outside the bar */
}

.bottom-nav-bar {
  pointer-events: auto; /* enable clicks inside the bar */
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(46, 125, 50, 0.1);
  border-radius: 24px;
  height: 68px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 0 auto;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #5c6e58;
  flex: 1;
  height: 100%;
  font-size: 11px;
  font-weight: 600;
  gap: 4px;
  transition: all 0.2s ease;
  outline: none;
  cursor: pointer;
  padding: 0;
}

.nav-tab ion-icon {
  font-size: 22px;
  transition: transform 0.2s ease;
}

.nav-tab:active ion-icon {
  transform: scale(0.9);
}

.nav-tab.active {
  color: #2E7D32;
}

.nav-tab.active ion-icon {
  color: #2E7D32;
}

.nav-tab.logout:active {
  color: #D32F2F;
}

/* Botón de cámara flotante */
.nav-camera-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
  height: 100%;
  margin-top: -24px; /* overlap upwards */
  pointer-events: none;
}

.nav-camera-button {
  pointer-events: auto;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(46, 125, 50, 0.4);
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.nav-camera-button::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid #2E7D32;
  opacity: 0.4;
  animation: pulse-ring 2s infinite;
}

.nav-camera-button:active {
  transform: scale(0.95);
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3);
}

.nav-camera-button ion-icon {
  font-size: 26px;
}

.camera-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #1B5E20;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* En pantallas grandes no se muestra el menú inferior */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
}
</style>
