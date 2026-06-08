<template>
  <ion-page>
      <!-- Header principal -->
      <ion-header class="ion-no-border">
        <ion-toolbar class="header-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>
            <div class="brand">
              <span class="logo-icon">🐄</span>
              <span class="app-logo">BovWeight CR</span>
              <span class="badge-admin">ADMIN</span>
            </div>
          </ion-title>
          <ion-buttons slot="end">
            <ion-button @click="logout" class="logout-btn">
              <ion-icon :icon="logOutOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Título y subtítulo -->
        <div class="page-header">
          <h1 class="page-title">Panel General</h1>
          <p class="page-subtitle">Monitoreo y rendimiento global de la plataforma</p>
        </div>

        <!-- Estado de Carga -->
        <div v-if="loading" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando estadísticas del sistema...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error al cargar datos</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchStats">
            Intentar nuevamente
          </ion-button>
        </div>

        <!-- Grid de Estadísticas (Cargado) -->
        <div v-else>
          <ion-grid class="no-padding">
            <ion-row>
              <!-- Tarjeta 1: Usuarios -->
              <ion-col size="12" size-md="6" size-lg="4">
                <ion-card class="stat-card">
                  <ion-card-content class="stat-card-body">
                    <div class="stat-icon-wrapper blue">
                      <ion-icon :icon="peopleOutline"></ion-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats.totalUsuarios }}</span>
                      <span class="stat-label">Usuarios Registrados</span>
                    </div>
                    <div class="card-badge neutral">
                      <span>Cuentas</span>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Tarjeta 2: Fincas -->
              <ion-col size="12" size-md="6" size-lg="4">
                <ion-card class="stat-card">
                  <ion-card-content class="stat-card-body">
                    <div class="stat-icon-wrapper orange">
                      <ion-icon :icon="businessOutline"></ion-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats.totalFincas }}</span>
                      <span class="stat-label">Fincas Registradas</span>
                    </div>
                    <div class="card-badge neutral">
                      <span>Propiedades</span>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Tarjeta 3: Animales -->
              <ion-col size="12" size-md="6" size-lg="4">
                <ion-card class="stat-card">
                  <ion-card-content class="stat-card-body">
                    <div class="stat-icon-wrapper green">
                      <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats.totalAnimales }}</span>
                      <span class="stat-label">Animales Registrados</span>
                    </div>
                    <div class="card-badge positive">
                      <span>Hato Activo</span>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Tarjeta 4: Pesajes/Estimaciones -->
              <ion-col size="12" size-md="6" size-lg="4">
                <ion-card class="stat-card">
                  <ion-card-content class="stat-card-body">
                    <div class="stat-icon-wrapper teal">
                      <ion-icon :icon="statsChartOutline"></ion-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ stats.totalPesajes }}</span>
                      <span class="stat-label">Pesajes Realizados</span>
                    </div>
                    <div class="card-badge positive">
                      <span>Estimaciones</span>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <!-- Tarjeta 5: Nuevos Usuarios 30d -->
              <ion-col size="12" size-md="6" size-lg="4">
                <ion-card class="stat-card highlight-card">
                  <ion-card-content class="stat-card-body">
                    <div class="stat-icon-wrapper gold">
                      <ion-icon :icon="trendingUpOutline"></ion-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">+{{ stats.nuevosUsuarios30Dias }}</span>
                      <span class="stat-label">Nuevos Usuarios (30d)</span>
                    </div>
                    <div class="card-badge trend-positive">
                      <span>Recientes</span>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Sección de Acciones Rápidas -->
          <div class="quick-actions-section">
            <h2 class="section-title">Navegación del Administrador</h2>
            <ion-grid class="no-padding">
              <ion-row>
                <ion-col size="6" size-md="4">
                  <div class="action-box" @click="irARuta('/admin/usuarios')">
                    <span class="action-icon">👥</span>
                    <span class="action-title">Gestionar Usuarios</span>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="4">
                  <div class="action-box" @click="irARuta('/admin/fincas')">
                    <span class="action-icon">🏡</span>
                    <span class="action-title">Ver Fincas</span>
                  </div>
                </ion-col>
                <ion-col size="12" size-md="4">
                  <div class="action-box" @click="irARuta('/admin/reportes')">
                    <span class="action-icon">📊</span>
                    <span class="action-title">Reportes & Análisis</span>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonGrid, IonRow, IonCol,
  IonSpinner, IonText, IonButtons, IonButton, IonIcon,
  IonMenuButton
} from '@ionic/vue';
import {
  logOutOutline, peopleOutline, businessOutline, shieldCheckmarkOutline,
  statsChartOutline, trendingUpOutline
} from 'ionicons/icons';
import { adminApi } from '@/services';

const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);

const stats = ref({
  totalUsuarios: 0,
  totalFincas: 0,
  totalAnimales: 0,
  totalPesajes: 0,
  nuevosUsuarios30Dias: 0
});

const fetchStats = async () => {
  loading.value = true;
  error.value = null;
  const { data, error: apiError } = await adminApi.getDashboardStats();

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    stats.value = {
      totalUsuarios: data.totalUsuarios ?? 0,
      totalFincas: data.totalFincas ?? 0,
      totalAnimales: data.totalAnimales ?? 0,
      totalPesajes: data.totalPesajes ?? 0,
      nuevosUsuarios30Dias: data.nuevosUsuarios30Dias ?? 0
    };
  }
  loading.value = false;
};

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  router.push('/login');
};

const irARuta = (ruta: string) => {
  router.push(ruta);
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
/* ====== TEMA GENERAL (Rústico/Beige/Verde) ====== */
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 8px;
}

/* ====== HEADER Y MARCA ====== */
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

.badge-admin {
  background: linear-gradient(135deg, #2c3e2d, #1a241a);
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  margin-left: 4px;
}

.logout-btn {
  --color: #5c6e58;
}

/* ====== ENCABEZADO DE PAGINA ====== */
.page-header {
  margin-bottom: 24px;
  padding-left: 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #5c6e58;
  margin: 0;
  font-weight: 500;
}

/* ====== CARGANDO / ERROR ====== */
.center-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 30px rgba(44, 62, 45, 0.04);
  border: 1px solid rgba(85, 107, 47, 0.05);
}

.custom-spinner {
  color: #556b2f;
  transform: scale(1.5);
  margin-bottom: 16px;
}

.loading-text {
  color: #5c6e58;
  font-weight: 600;
  font-size: 15px;
}

.error-box {
  border: 1px solid rgba(183, 28, 28, 0.15);
}

.error-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.error-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 6px;
}

.error-msg {
  color: #5c6e58;
  margin: 0 0 20px;
  font-size: 14px;
}

.retry-btn {
  --border-radius: 12px;
  font-weight: 700;
  --color: #556b2f;
  --border-color: #556b2f;
}

/* ====== TARJETAS DE ESTADÍSTICAS ====== */
.stat-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 25px -5px rgba(44, 62, 45, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.01);
  margin: 8px;
  overflow: visible;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-card-body {
  display: flex;
  align-items: center;
  padding: 20px !important;
  position: relative;
}

.stat-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  flex-shrink: 0;
}

/* Paletas HSL para los iconos */
.stat-icon-wrapper.blue { background: #f0f4f8; color: #475569; }
.stat-icon-wrapper.orange { background: #fff7ed; color: #d97706; }
.stat-icon-wrapper.green { background: #eaf0e6; color: #556b2f; }
.stat-icon-wrapper.teal { background: #fdfbf7; color: #6b8e23; }
.stat-icon-wrapper.gold { background: #fef9c3; color: #a16207; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #2c3e2d;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #8ba888;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 10px;
  font-weight: 750;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
}

.card-badge.neutral { background: #f4f1ea; color: #5c6e58; }
.card-badge.positive { background: #eaf0e6; color: #3e4f24; }
.card-badge.trend-positive { background: #fef9c3; color: #a16207; }

.no-padding {
  --ion-grid-padding: 0px;
  padding: 0;
}

/* ====== ACCIONES RÁPIDAS ====== */
.quick-actions-section {
  margin-top: 32px;
  padding: 0 8px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
  margin-bottom: 16px;
}

.action-box {
  background: #ffffff;
  border: 1px solid #e2dcd0;
  border-radius: 18px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  margin: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(44, 62, 45, 0.02);
}

.action-box:hover {
  transform: translateY(-2px);
  border-color: #556b2f;
  box-shadow: 0 8px 20px rgba(85, 107, 47, 0.08);
}

.action-box:active {
  transform: scale(0.97);
}

.action-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.action-title {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e2d;
}
</style>
