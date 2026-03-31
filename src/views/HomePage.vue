<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-logo">🐄 BovWeight CR</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="home-content">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            <span class="app-logo-large">🐄 BovWeight CR</span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Banner de bienvenida -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h2>Bienvenido, Ganadero</h2>
          <p>Gestiona el peso y salud de tu rebaño</p>
        </div>
        <div class="welcome-stats">
          <div class="stat-item">
            <span class="stat-number">{{ animals.length }}</span>
            <span class="stat-label">Animales</span>
          </div>
        </div>
      </div>

      <!-- Cargando -->
      <div v-if="loading" class="animals-loading">
        <div v-for="i in 3" :key="i" class="animal-card-skeleton">
          <div class="skeleton-circle"></div>
          <div class="skeleton-text">
            <div class="sk-line w50"></div>
            <div class="sk-line w70"></div>
          </div>
          <div class="skeleton-arrow"></div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-center">
        <ion-icon :icon="cloudOfflineOutline" class="state-icon" style="color: #d32f2f"></ion-icon>
        <p>{{ error }}</p>
        <ion-button @click="load" class="retry-btn">Reintentar</ion-button>
      </div>

      <!-- Lista de animales -->
      <div v-else class="animal-list">
        <router-link
          v-for="a in animals"
          :key="a.id"
          :to="`/animal/${a.id}`"
          class="animal-card"
        >
          <div class="card-avatar">
            <ion-icon :icon="pawOutline"></ion-icon>
          </div>
          <div class="card-info">
            <h3>{{ a.nombre }}</h3>
            <p>{{ a.raza }} · {{ a.edad }}</p>
          </div>
          <div class="card-weight">
            <span class="cw-value">{{ a.pesoActual }} <small>kg</small></span>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="card-arrow"></ion-icon>
        </router-link>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/vue';
import { cloudOfflineOutline, pawOutline, chevronForwardOutline } from 'ionicons/icons';

import { dataService, type Animal } from '@/services';

const animals = ref<Animal[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    animals.value = await dataService.getAllAnimals();
  } catch (err: any) {
    error.value = err.message || 'Error al cargar animales';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.home-content {
  --background: #f4f7f0;
}

.app-logo,
.app-logo-large {
  font-weight: 800;
  letter-spacing: -0.5px;
}

.app-logo-large {
  font-size: 28px;
}

/* ── Banner de bienvenida ── */
.welcome-banner {
  background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
  margin: 32px 16px 16px;
  border-radius: 20px;
  padding: 24px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(46, 125, 50, 0.25);
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
}

.welcome-text h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
}

.welcome-text p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

/* ── Lista de animales ── */
.animal-list {
  padding: 0 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.animal-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.animal-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(46, 125, 50, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2E7D32;
  font-size: 24px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #222;
}

.card-info p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #888;
}

.card-weight {
  text-align: right;
}

.cw-value {
  font-size: 18px;
  font-weight: 800;
  color: #1B5E20;
}

.cw-value small {
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.card-arrow {
  color: #ccc;
  font-size: 18px;
  flex-shrink: 0;
}

/* ── Esqueleto (Cargando) ── */
.animals-loading {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.animal-card-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  padding: 16px;
  border-radius: 16px;
}

.skeleton-circle {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.sk-line.w50 { width: 50%; }
.sk-line.w70 { width: 70%; }

.skeleton-arrow {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e8e8e8;
  flex-shrink: 0;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Estado centrado ── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  text-align: center;
  padding: 24px;
}

.state-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.retry-btn {
  --border-radius: 14px;
  --background: #2E7D32;
  margin-top: 12px;
}
</style>
