<template>
  <ion-page>
      <ion-header class="ion-no-border">
        <ion-toolbar class="header-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>
            <div class="brand">
              <span class="logo-icon">📊</span>
              <span class="app-logo">Reportes y Estadísticas</span>
            </div>
          </ion-title>
        </ion-toolbar>
      </ion-header>

    <ion-content class="reportes-content ion-padding">
      <div class="main-container">
        
        <!-- Estado de Carga -->
        <div v-if="loading" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Generando reportes del sistema...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error al generar reportes</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchReportes">
            Reintentar
          </ion-button>
        </div>

        <!-- Dashboard de Reportes (Cargado) -->
        <div v-else-if="reportesData">
          <ion-grid class="reportes-grid">
            <ion-row>
              <!-- 1. Gráfica de Barras: Estimaciones por mes -->
              <ion-col size="12">
                <ion-card class="reporte-card chart-card-full">
                  <ion-card-header>
                    <div class="card-header-flex">
                      <div class="header-icon-wrapper bar-icon">
                        <ion-icon :icon="barChartOutline"></ion-icon>
                      </div>
                      <div>
                        <ion-card-title class="card-title-premium">Estimaciones de Peso Realizadas</ion-card-title>
                        <p class="card-subtitle-premium">Actividad mensual de pesajes en los últimos 6 meses</p>
                      </div>
                    </div>
                  </ion-card-header>
                  <ion-card-content class="chart-content">
                    <div class="chart-wrapper">
                      <BarChart :data="barChartData" :options="barChartOptions" />
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>

            <ion-row>
              <!-- 2. Tabla: Top 5 usuarios con más estimaciones -->
              <ion-col size="12" size-lg="7">
                <ion-card class="reporte-card equal-height-card">
                  <ion-card-header>
                    <div class="card-header-flex">
                      <div class="header-icon-wrapper trophy-icon">
                        <ion-icon :icon="trophyOutline"></ion-icon>
                      </div>
                      <div>
                        <ion-card-title class="card-title-premium">Top 5 Ganaderos</ion-card-title>
                        <p class="card-subtitle-premium">Usuarios con mayor cantidad de estimaciones registradas</p>
                      </div>
                    </div>
                  </ion-card-header>
                  <ion-card-content class="list-content">
                    <div v-if="!reportesData.topUsuarios || reportesData.topUsuarios.length === 0" class="empty-list-box">
                      <p>No se registran estimaciones de usuarios todavía.</p>
                    </div>
                    <ion-list v-else class="top-list">
                      <ion-item v-for="user in reportesData.topUsuarios" :key="user.posicion" class="top-item" lines="none">
                        <div class="top-row-content">
                          <div class="pos-badge" :class="'pos-' + user.posicion">
                            <span v-if="user.posicion === 1">🥇</span>
                            <span v-else-if="user.posicion === 2">🥈</span>
                            <span v-else-if="user.posicion === 3">🥉</span>
                            <span v-else>{{ user.posicion }}</span>
                          </div>
                          
                          <div class="user-details">
                            <h3 class="user-name">{{ user.nombre }}</h3>
                            <p class="user-email">{{ user.correo }}</p>
                          </div>
                          
                          <div class="count-badge">
                            <span class="count-number">{{ user.cantidad }}</span>
                            <small class="count-label">Pesajes</small>
                          </div>
                        </div>
                      </ion-item>
                    </ion-list>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- 3. Tarjeta: Porcentaje de usuarios activos vs inactivos -->
              <ion-col size="12" size-lg="5">
                <ion-card class="reporte-card equal-height-card">
                  <ion-card-header>
                    <div class="card-header-flex">
                      <div class="header-icon-wrapper people-icon">
                        <ion-icon :icon="peopleOutline"></ion-icon>
                      </div>
                      <div>
                        <ion-card-title class="card-title-premium">Estado de Usuarios</ion-card-title>
                        <p class="card-subtitle-premium">Distribución de cuentas activas e inactivas</p>
                      </div>
                    </div>
                  </ion-card-header>
                  <ion-card-content class="doughnut-content">
                    <div class="doughnut-layout">
                      <div class="doughnut-chart-wrapper">
                        <DoughnutChart :data="doughnutChartData" :options="doughnutChartOptions" />
                        <div class="doughnut-center-text">
                          <span class="total-users-num">{{ reportesData.usuariosEstado.activos + reportesData.usuariosEstado.inactivos }}</span>
                          <span class="total-users-lbl">Total</span>
                        </div>
                      </div>

                      <div class="doughnut-metrics">
                        <div class="metric-row">
                          <div class="metric-label-group">
                            <span class="color-dot active-dot"></span>
                            <span class="metric-name">Activos</span>
                          </div>
                          <div class="metric-value-group">
                            <ion-badge class="badge-active">{{ reportesData.usuariosEstado.activos }}</ion-badge>
                            <span class="metric-percentage">{{ reportesData.usuariosEstado.porcentajeActivos }}%</span>
                          </div>
                        </div>

                        <div class="metric-row">
                          <div class="metric-label-group">
                            <span class="color-dot inactive-dot"></span>
                            <span class="metric-name">Bloqueados</span>
                          </div>
                          <div class="metric-value-group">
                            <ion-badge class="badge-inactive">{{ reportesData.usuariosEstado.inactivos }}</ion-badge>
                            <span class="metric-percentage">{{ reportesData.usuariosEstado.porcentajeInactivos }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner, IonText, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonBadge,
  IonMenuButton
} from '@ionic/vue';
import { trophyOutline, barChartOutline, peopleOutline } from 'ionicons/icons';
import { adminApi } from '@/services';
import { Bar as BarChart, Doughnut as DoughnutChart } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js';

// Registro de componentes Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);
const reportesData = ref<any>(null);

const fetchReportes = async () => {
  loading.value = true;
  error.value = null;
  const { data, error: apiError } = await adminApi.getReportes();

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    reportesData.value = data;
  }
  loading.value = false;
};


onMounted(() => {
  fetchReportes();
});

// Configuración Gráfica de Barras
const barChartData = computed(() => {
  if (!reportesData.value) return { labels: [], datasets: [] };
  const items = reportesData.value.estimacionesPorMes || [];
  return {
    labels: items.map((i: any) => i.label),
    datasets: [
      {
        label: 'Estimaciones de Peso',
        backgroundColor: '#8ba888',
        hoverBackgroundColor: '#556b2f',
        borderRadius: 8,
        data: items.map((i: any) => i.count),
      }
    ]
  };
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f4f1ea' },
      ticks: {
        precision: 0,
        color: '#5c6e58',
        font: { family: 'Inter', size: 11 }
      }
    },
    x: {
      grid: { display: false },
      ticks: {
        color: '#5c6e58',
        font: { family: 'Inter', size: 11, weight: 'bold' as const }
      }
    }
  }
};

// Configuración Gráfica de Dona
const doughnutChartData = computed(() => {
  if (!reportesData.value) return { labels: [], datasets: [] };
  const estado = reportesData.value.usuariosEstado || { activos: 0, inactivos: 0 };
  return {
    labels: ['Activos', 'Bloqueados'],
    datasets: [
      {
        backgroundColor: ['#556b2f', '#c0c5b1'],
        borderWidth: 0,
        hoverBackgroundColor: ['#3e4f24', '#a8ad98'],
        data: [estado.activos, estado.inactivos]
      }
    ]
  };
});

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  cutout: '75%'
};
</script>

<style scoped>
/* ====== TEMA GENERAL ====== */
.reportes-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 8px;
}

.header-toolbar {
  --background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  --min-height: 65px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.app-logo {
  font-weight: 800;
  color: #2c3e2d;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.back-btn {
  --color: #5c6e58;
}

/* ====== TARJETAS PREMIUM ====== */
.reporte-card {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(85, 107, 47, 0.03);
  margin-bottom: 8px;
}

.equal-height-card {
  min-height: 380px;
  display: flex;
  flex-direction: column;
}

.equal-height-card .list-content,
.equal-height-card .doughnut-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header-flex {
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #f4f1ea;
  padding-bottom: 16px;
}

.header-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.bar-icon { background: #eaf0e6; color: #556b2f; }
.trophy-icon { background: #fdfbf7; color: #d97706; }
.people-icon { background: #f0f4f8; color: #475569; }

.card-title-premium {
  font-size: 16px;
  font-weight: 850;
  color: #2c3e2d;
  margin: 0;
  letter-spacing: -0.3px;
}

.card-subtitle-premium {
  font-size: 12px;
  color: #8ba888;
  margin: 2px 0 0;
  font-weight: 600;
}

/* ====== CONTENIDO GRÁFICAS ====== */
.chart-content {
  padding: 24px;
}

.chart-wrapper {
  height: 250px;
  position: relative;
}

/* ====== LISTADO TOP 5 ====== */
.list-content {
  padding: 8px 16px;
}

.top-list {
  background: transparent;
  padding: 0;
}

.top-item {
  --background: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
  border-bottom: 1px solid #fdfbf7;
}

.top-item:last-child {
  border-bottom: none;
}

.top-row-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 0;
}

.pos-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  margin-right: 14px;
  flex-shrink: 0;
  background: #f4f1ea;
  color: #5c6e58;
}

.pos-badge.pos-1 { background: #fffbeb; color: #d97706; }
.pos-badge.pos-2 { background: #f1f5f9; color: #475569; }
.pos-badge.pos-3 { background: #fef2f2; color: #b91c1c; }

.user-details {
  flex-grow: 1;
  min-width: 0;
  margin-right: 12px;
}

.user-name {
  font-size: 14px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: #8ba888;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.count-number {
  font-size: 16px;
  font-weight: 900;
  color: #556b2f;
}

.count-label {
  font-size: 10px;
  color: #8ba888;
  font-weight: 700;
  text-transform: uppercase;
}

.empty-list-box {
  text-align: center;
  color: #8ba888;
  padding: 24px;
  font-size: 14px;
}

/* ====== DONA Y METRICAS ====== */
.doughnut-content {
  padding: 24px;
}

.doughnut-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  justify-content: center;
  width: 100%;
}

.doughnut-chart-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
}

.doughnut-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.total-users-num {
  font-size: 26px;
  font-weight: 900;
  color: #2c3e2d;
  line-height: 1;
}

.total-users-lbl {
  font-size: 10px;
  color: #8ba888;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.doughnut-metrics {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fdfbf7;
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(85, 107, 47, 0.02);
}

.metric-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.active-dot { background-color: #556b2f; }
.inactive-dot { background-color: #c0c5b1; }

.metric-name {
  font-size: 13px;
  font-weight: 700;
  color: #5c6e58;
}

.metric-value-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-active {
  --background: #eaf0e6;
  --color: #556b2f;
  font-weight: 800;
  border-radius: 6px;
  padding: 4px 8px;
}

.badge-inactive {
  --background: #f4f1ea;
  --color: #8ba888;
  font-weight: 800;
  border-radius: 6px;
  padding: 4px 8px;
}

.metric-percentage {
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
  min-width: 44px;
  text-align: right;
}

/* ====== ESTADOS ====== */
.center-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  text-align: center;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(85, 107, 47, 0.04);
}

.custom-spinner {
  color: #556b2f;
  transform: scale(1.3);
  margin-bottom: 12px;
}

.loading-text {
  color: #5c6e58;
  font-weight: 600;
  font-size: 14px;
}

.error-box {
  border: 1px solid rgba(183, 28, 28, 0.15);
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.error-title {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 4px;
}

.error-msg {
  color: #5c6e58;
  margin: 0 0 16px;
  font-size: 13px;
}

.retry-btn {
  --border-radius: 10px;
  font-weight: 700;
  --color: #556b2f;
  --border-color: #556b2f;
  height: 36px;
}
</style>
