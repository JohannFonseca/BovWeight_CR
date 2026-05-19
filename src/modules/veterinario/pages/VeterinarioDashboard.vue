<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">BovWeight CR</span>
            <span class="badge-vet">VETERINARIO</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar vet">V</div>
            <div class="user-info">
              <span class="name">Ana Veterinaria</span>
              <span class="role">Lic. 15482</span>
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
              <ion-icon :icon="medkitOutline"></ion-icon>
              <span>Panel Clínico</span>
            </a>
            <a href="#" class="nav-item">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Animales Asignados</span>
            </a>
            <a href="#" class="nav-item">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>Agenda de Visitas</span>
            </a>
            <a href="#" class="nav-item">
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>Reportes Médicos</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Panel Clínico</h1>
              <p class="page-subtitle">Seguimiento de salud y peso de ganado autorizado</p>
            </div>
            <ion-button class="primary-btn">
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Nuevo Registro
            </ion-button>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper teal">
                <ion-icon :icon="pawOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">34</span>
                <span class="stat-label">Animales en Revisión</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper blue">
                <ion-icon :icon="businessOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">3</span>
                <span class="stat-label">Fincas Asignadas</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper orange">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">5</span>
                <span class="stat-label">Alertas de Bajo Peso</span>
              </div>
            </div>
          </div>

          <!-- Content Grid -->
          <div class="content-grid">
            <!-- Animals List -->
            <div class="panel-card animals-panel">
              <div class="panel-header">
                <h3>Animales en Seguimiento Prioritario</h3>
              </div>
              
              <div class="panel-body no-padding">
                <div class="animal-list">
                  <div class="animal-row">
                    <div class="animal-avatar warning">
                      <ion-icon :icon="alertOutline"></ion-icon>
                    </div>
                    <div class="animal-info">
                      <h4 class="animal-name">Toro #402 (Brahman)</h4>
                      <span class="animal-tag">Finca "El Rosario" | Último peso: 380 kg</span>
                    </div>
                    <ion-button fill="outline" size="small" color="primary">Ver Caso</ion-button>
                  </div>

                  <div class="animal-row">
                    <div class="animal-avatar normal">
                      <ion-icon :icon="checkmarkOutline"></ion-icon>
                    </div>
                    <div class="animal-info">
                      <h4 class="animal-name">Vaca #105 (Angus)</h4>
                      <span class="animal-tag">Finca "La pradera" | Último peso: 450 kg</span>
                    </div>
                    <ion-button fill="outline" size="small" color="primary">Ver Caso</ion-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Health Chart -->
            <div class="panel-card chart-panel">
              <div class="panel-header">
                <h3>Promedio Índice Corporal (Fincas)</h3>
              </div>
              <div class="panel-body">
                <LineChart :data="chartData" :options="chartOptions" class="chart-container" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonButtons
} from '@ionic/vue';
import { 
  logOutOutline, medkitOutline, pawOutline, calendarOutline, 
  documentTextOutline, addOutline, businessOutline, alertCircleOutline,
  alertOutline, checkmarkOutline
} from 'ionicons/icons';

// Chart.js imports
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const router = useRouter();

const logout = () => {
  router.push('/login');
};

// Chart Data Dummy
const chartData = ref({
  labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  datasets: [
    {
      label: 'Salud Promedio',
      backgroundColor: 'rgba(0, 137, 123, 0.1)',
      borderColor: '#00897B',
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#00897B',
      pointRadius: 4,
      fill: true,
      data: [85, 88, 86, 92],
      tension: 0.4
    }
  ]
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: false, grid: { color: '#f0f0f0' }, min: 50, max: 100 },
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

.logo-icon { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0, 137, 123, 0.2)); }
.app-logo { font-weight: 800; color: #00695C; letter-spacing: -0.5px; font-size: 20px; }
.badge-vet { background: #00897B; color: white; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }

.user-profile { display: flex; align-items: center; gap: 12px; margin-right: 16px; }
.avatar.vet { background: #00897B; color: white; border-radius: 10px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 600; color: #333; }
.user-info .role { font-size: 12px; color: #777; }
.logout-btn { --color: #555; }

/* ====== LAYOUT ====== */
.dashboard-layout { display: flex; min-height: 100%; }
.sidebar { width: 260px; background: #FFFFFF; border-right: 1px solid #EAEBEF; padding: 24px 16px; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; text-decoration: none; color: #555; font-weight: 500; transition: all 0.2s ease; }
.nav-item:hover { background: #F4F7F6; color: #00695C; }
.nav-item.active { background: #E0F2F1; color: #00897B; font-weight: 600; }
.nav-item ion-icon { font-size: 20px; }

/* MAIN CONTENT */
.main-content { flex: 1; padding: 32px; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 800; color: #111; margin: 0 0 8px; letter-spacing: -0.5px; }
.page-subtitle { font-size: 14px; color: #666; margin: 0; }

.primary-btn {
  --background: #00897B;
  --background-hover: #00695C;
  --border-radius: 12px;
  font-weight: 700;
}

/* ====== STATS GRID ====== */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px; }
.stat-card { background: #FFFFFF; border-radius: 16px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #F0F0F0; display: flex; align-items: center; gap: 16px; }
.stat-icon-wrapper { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
.stat-icon-wrapper.teal { background: #E0F2F1; color: #00897B; }
.stat-icon-wrapper.orange { background: #FFF3E0; color: #F57C00; }
.stat-icon-wrapper.blue { background: #E3F2FD; color: #1565C0; }

.stat-details { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 800; color: #222; }
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
.animal-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-right: 16px; }
.animal-avatar.warning { background: #FFF3E0; color: #F57C00; }
.animal-avatar.normal { background: #E8F5E9; color: #2E7D32; }
.animal-info { flex: 1; }
.animal-name { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #222; }
.animal-tag { font-size: 12px; color: #777; }

/* ====== RESPONSIVE ====== */
@media (max-width: 992px) {
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .main-content { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .user-info { display: none; }
}
</style>
