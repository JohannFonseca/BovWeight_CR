<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">BovWeight CR</span>
            <span class="badge-ganadero">GANADERO</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar ganadero">G</div>
            <div class="user-info">
              <span class="name">Pedro Ganadero</span>
              <span class="role">Finca "El Rosario"</span>
            </div>
          </div>
          <ion-button @click="logout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="dashboard-content">
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar desktop-only">
          <nav class="nav-menu">
            <a href="#" class="nav-item active">
              <ion-icon :icon="gridOutline"></ion-icon>
              <span>Mi Finca</span>
            </a>
            <a href="#" class="nav-item">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Mis Animales</span>
            </a>
            <a href="#" class="nav-item ai-highlight">
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>Estimar Peso IA</span>
            </a>
            <a href="#" class="nav-item">
              <ion-icon :icon="barChartOutline"></ion-icon>
              <span>Reportes</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Resumen de Finca</h1>
              <p class="page-subtitle">Monitorea la salud y el peso de tu rebaño</p>
            </div>
            <ion-button class="ai-primary-btn">
              <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
              NUEVO PESAJE IA
            </ion-button>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper green">
                <ion-icon :icon="pawOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ animals.length || 0 }}</span>
                <span class="stat-label">Total Animales</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper orange">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">420 <small>kg</small></span>
                <span class="stat-label">Peso Promedio</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper blue">
                <ion-icon :icon="cameraOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">12</span>
                <span class="stat-label">Pesajes Hoy</span>
              </div>
            </div>
          </div>

          <div class="content-grid">
            <!-- Animals List -->
            <div class="panel-card animals-panel">
              <div class="panel-header">
                <h3>Mi Rebaño</h3>
                <ion-button fill="clear" size="small">Ver todos</ion-button>
              </div>
              
              <div class="panel-body no-padding">
                <div v-if="loading" class="loading-state">
                  <ion-spinner name="crescent"></ion-spinner>
                  <p>Cargando rebaño...</p>
                </div>
                
                <div v-else-if="error" class="error-state">
                  <ion-icon :icon="cloudOfflineOutline"></ion-icon>
                  <p>{{ error }}</p>
                  <ion-button @click="load" size="small" color="success">Reintentar</ion-button>
                </div>

                <div v-else class="animal-list">
                  <router-link
                    v-for="a in animals"
                    :key="a.id"
                    :to="`/animal/${a.id}`"
                    class="animal-row"
                  >
                    <div class="animal-avatar">
                      <ion-icon :icon="pawOutline"></ion-icon>
                    </div>
                    <div class="animal-info">
                      <h4 class="animal-name">{{ a.nombre }}</h4>
                      <span class="animal-tag">Arete: #{{ a.arete || 'N/A' }} | {{ a.raza }}</span>
                    </div>
                    <div class="animal-weight">
                      <span class="weight-val">{{ a.pesoActual }} kg</span>
                      <ion-icon :icon="chevronForwardOutline" class="go-icon"></ion-icon>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>

            <!-- AI Promotion / Chart -->
            <div class="panel-card chart-panel">
              <div class="panel-header">
                <h3>Evolución de Peso (Promedio)</h3>
              </div>
              <div class="panel-body">
                <LineChart :data="chartData" :options="chartOptions" class="chart-container" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- Mobile Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="mobile-only">
        <ion-fab-button class="ai-fab">
          <ion-icon :icon="cameraOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonButtons, IonSpinner, IonFab, IonFabButton
} from '@ionic/vue';
import { 
  cloudOfflineOutline, pawOutline, chevronForwardOutline, logOutOutline,
  gridOutline, cameraOutline, barChartOutline, scaleOutline
} from 'ionicons/icons';

import { dataService, type Animal } from '@/services';

// Chart.js imports
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const animals = ref<Animal[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

const logout = () => {
  router.push('/login');
};

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

// Chart Data Dummy
const chartData = ref({
  labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  datasets: [
    {
      label: 'Peso Promedio (kg)',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      borderColor: '#2E7D32',
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#2E7D32',
      pointRadius: 4,
      fill: true,
      data: [380, 395, 410, 420],
      tension: 0.4
    }
  ]
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } }
  }
});
</script>

<style scoped>
/* ====== VARIABLES GLOBALES ====== */
.dashboard-content {
  --background: #F4F7F6;
  font-family: 'Inter', sans-serif;
}

/* ====== HEADER ====== */
.header-toolbar {
  --background: #FFFFFF;
  --min-height: 70px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  padding: 0 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(46, 125, 50, 0.2)); }
.app-logo { font-weight: 800; color: #1B5E20; letter-spacing: -0.5px; font-size: 20px; }
.badge-ganadero { background: #2E7D32; color: white; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }

.user-profile { display: flex; align-items: center; gap: 12px; margin-right: 16px; }
.avatar.ganadero { background: #2E7D32; color: white; border-radius: 10px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 600; color: #333; }
.user-info .role { font-size: 12px; color: #777; }
.logout-btn { --color: #555; }

/* ====== LAYOUT ====== */
.dashboard-layout { display: flex; min-height: 100%; }
.sidebar { width: 260px; background: #FFFFFF; border-right: 1px solid #EAEBEF; padding: 24px 16px; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; text-decoration: none; color: #555; font-weight: 500; transition: all 0.2s ease; }
.nav-item:hover { background: #F4F7F6; color: #1B5E20; }
.nav-item.active { background: #E8F5E9; color: #2E7D32; font-weight: 600; }
.nav-item.ai-highlight { background: #E3F2FD; color: #1565C0; font-weight: 600; margin-top: 16px; border: 1px dashed #90CAF9;}
.nav-item ion-icon { font-size: 20px; }

/* MAIN CONTENT */
.main-content { flex: 1; padding: 32px; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 800; color: #111; margin: 0 0 8px; letter-spacing: -0.5px; }
.page-subtitle { font-size: 14px; color: #666; margin: 0; }

.ai-primary-btn {
  --background: #1B5E20;
  --background-hover: #2E7D32;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* ====== STATS GRID ====== */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px; }
.stat-card { background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #F0F0F0; display: flex; align-items: center; gap: 16px; }
.stat-icon-wrapper { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
.stat-icon-wrapper.green { background: #E8F5E9; color: #2E7D32; }
.stat-icon-wrapper.orange { background: #FFF3E0; color: #F57C00; }
.stat-icon-wrapper.blue { background: #E3F2FD; color: #1565C0; }

.stat-details { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 800; color: #222; }
.stat-value small { font-size: 14px; color: #777; }
.stat-label { font-size: 13px; color: #777; font-weight: 500; margin-top: 2px; }

/* ====== PANELS GRID ====== */
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.panel-card { background: #FFFFFF; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #F0F0F0; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { padding: 20px 24px; border-bottom: 1px solid #F0F0F0; display: flex; justify-content: space-between; align-items: center; }
.panel-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #111; }
.panel-body { padding: 24px; flex: 1; }
.panel-body.no-padding { padding: 0; }
.chart-container { height: 250px; width: 100%; }

/* ====== ANIMAL LIST ====== */
.animal-list { display: flex; flex-direction: column; }
.animal-row { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid #F8F9FA; text-decoration: none; color: inherit; transition: background 0.2s; }
.animal-row:hover { background: #F8F9FA; }
.animal-row:last-child { border-bottom: none; }
.animal-avatar { width: 40px; height: 40px; border-radius: 10px; background: #E8F5E9; color: #2E7D32; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-right: 16px; }
.animal-info { flex: 1; }
.animal-name { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #222; }
.animal-tag { font-size: 12px; color: #777; }
.animal-weight { display: flex; align-items: center; gap: 12px; }
.weight-val { font-weight: 700; color: #1B5E20; font-size: 15px; }
.go-icon { color: #CCC; font-size: 18px; }

/* LOADING & ERROR */
.loading-state, .error-state { padding: 40px; text-align: center; color: #777; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.error-state ion-icon { font-size: 40px; color: #d32f2f; }

/* ====== RESPONSIVE ====== */
.mobile-only { display: none; }
.ai-fab { --background: #1B5E20; --background-hover: #2E7D32; }

@media (max-width: 992px) {
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  .main-content { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .ai-primary-btn { display: none; } /* Show FAB instead */
  .user-info { display: none; }
}
</style>
