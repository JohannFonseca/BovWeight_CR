<template>
  <ion-page>
    <!-- MOBILE-OPTIMIZED HEADER -->
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
          <!-- BELL NOTIFICATION ICON -->
          <button @click="openNotifications" class="bell-btn-custom animate-fade-in" title="Centro de Alertas">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount }}</span>
          </button>

          <div v-if="isOffline" class="offline-indicator animate-pulse">
            <ion-icon :icon="cloudOfflineOutline"></ion-icon>
            <span>Sin Conexión</span>
          </div>
          <div v-else class="online-indicator">
            <span class="pulse-dot"></span>
            <span>Online</span>
          </div>
          <button @click="logout" class="logout-btn-custom" title="Cerrar Sesión">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <!-- CENTERED MOBILE CONTAINER -->
      <div class="mobile-app-container">
        
        <!-- BIENVENIDA & PERFIL -->
        <div class="user-greeting-card">
          <div class="greeting-info">
            <h1>Hola, {{ usuarioSesion?.nombre_completo || 'Ganadero' }}</h1>
            <p>Finca: <strong>{{ usuarioSesion?.usuario || 'Mi Finca' }}</strong></p>
          </div>
          <div class="greeting-avatar">
            {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'G' }}
          </div>
        </div>

        <!-- INDICADOR OFFLINE BANNER -->
        <div v-if="isOffline" class="offline-banner animate-fade-in">
          <div class="banner-icon">
            <ion-icon :icon="cloudOfflineOutline"></ion-icon>
          </div>
          <div class="banner-text">
            <h4>Modo Offline Activo</h4>
            <p>Puedes tomar fotografías en el campo. Se guardarán localmente y se calcularán automáticamente al detectar internet.</p>
          </div>
        </div>

        <!-- COLA DE ESTIMACIONES PENDIENTES -->
        <div v-if="offlineQueue.length > 0" class="panel-card pending-panel animate-fade-in">
          <div class="panel-header pending-header">
            <div class="header-title-group">
              <ion-icon :icon="cloudUploadOutline" class="pending-header-icon"></ion-icon>
              <h3>Estimaciones Pendientes ({{ pendingCount }})</h3>
            </div>
            <button v-if="hasCompletedItems" class="clear-btn" @click="clearCompleted">
              Limpiar
            </button>
          </div>
          
          <div class="panel-body no-padding">
            <div class="pending-list">
              <div v-for="item in offlineQueue" :key="item.id" class="pending-row">
                <div class="pending-thumb-wrapper">
                  <img :src="item.fotoBase64" class="pending-thumb" />
                  <span class="status-badge" :class="item.estado">
                    {{ getStatusLabel(item.estado) }}
                  </span>
                </div>
                
                <div class="pending-info">
                  <h4>{{ item.animalNombre }}</h4>
                  <p class="pending-meta">Arete: #{{ item.animalArete }} &middot; {{ item.fecha.split(',')[0] }}</p>
                  
                  <!-- Progress Bar -->
                  <div class="progress-wrapper" v-if="item.estado === 'sincronizando' || item.estado === 'procesando'">
                    <div class="progress-outer">
                      <div class="progress-inner" :style="{ width: item.progreso + '%' }"></div>
                    </div>
                    <span class="progress-val">{{ item.progreso }}%</span>
                  </div>

                  <!-- Error message -->
                  <span v-if="item.estado === 'error'" class="status-msg error-msg">
                    ⚠️ {{ item.mensajeError || 'Error al conectar' }}
                  </span>

                  <!-- Success result -->
                  <span v-if="item.estado === 'completado'" class="status-msg success-msg">
                    🎉 Estimado: <strong>{{ item.pesoEstimado }} kg</strong>
                  </span>
                </div>
                
                <div class="pending-actions">
                  <button 
                    v-if="item.estado === 'error'" 
                    class="action-icon-btn retry" 
                    @click="retrySync"
                    title="Reintentar"
                  >
                    <ion-icon :icon="refreshOutline"></ion-icon>
                  </button>
                  <button 
                    v-if="item.estado === 'pendiente_local' || item.estado === 'error' || item.estado === 'completado'" 
                    class="action-icon-btn delete" 
                    @click="removePending(item.id)"
                    title="Eliminar"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ACCIÓN RÁPIDA: ESTIMACIÓN IA -->
        <div class="action-card-container">
          <button class="big-action-card" @click="router.push('/ganado/estimacion-ia')">
            <div class="action-icon-bg">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
            <div class="action-text">
              <h3>Estimar Peso con IA</h3>
              <p>Toma una foto en campo o sube una imagen para calcular el peso</p>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="action-arrow"></ion-icon>
          </button>
        </div>

        <!-- PANEL DE TAREAS Y ESTADOS PENDIENTES -->
        <div class="panel-card pending-tasks-panel animate-fade-in">
          <div class="panel-header">
            <h3>Estado y Tareas de Finca</h3>
          </div>
          <div class="panel-body grid-2x2">
            <div class="task-indicator" @click="openNotifications">
              <div class="indicator-icon notification">
                <ion-icon :icon="notificationsOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.notificacionesSinLeer ?? 0 }}</span>
                <span class="label">Alertas sin leer</span>
              </div>
            </div>

            <div class="task-indicator" @click="goToAgenda">
              <div class="indicator-icon cita">
                <ion-icon :icon="calendarOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.citasProximas ?? 0 }}</span>
                <span class="label">Próximas citas</span>
              </div>
            </div>

            <div class="task-indicator" @click="goToAgendaPending">
              <div class="indicator-icon pendiente-confirmar">
                <ion-icon :icon="timeOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.citasPorConfirmar ?? 0 }}</span>
                <span class="label">Citas por confirmar</span>
              </div>
            </div>

            <div class="task-indicator" @click="goToReports">
              <div class="indicator-icon reporte">
                <ion-icon :icon="documentTextOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.reportesPendientes ?? 0 }}</span>
                <span class="label">Reportes clínicos</span>
              </div>
            </div>

            <div class="task-indicator" @click="goToWeightReminders">
              <div class="indicator-icon recordatorio">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.animalesPendientesPesaje ?? 0 }}</span>
                <span class="label">Sin pesaje (30d)</span>
              </div>
            </div>

            <div class="task-indicator" @click="goToHealthReminders">
              <div class="indicator-icon recordatorio-sanitario">
                <ion-icon :icon="calendarOutline"></ion-icon>
              </div>
              <div class="indicator-details">
                <span class="value">{{ dashboardStats.recordatoriosPendientes ?? 0 }}</span>
                <span class="label">Recordatorios</span>
              </div>
            </div>
          </div>
        </div>

        <!-- STATS GRID -->
        <div class="stats-grid">
          <div class="stat-card green">
            <div class="stat-icon-circle">
              <ion-icon :icon="pawOutline"></ion-icon>
            </div>
            <div class="stat-data">
              <span class="val">{{ animals.length || 0 }}</span>
              <span class="lbl">Total Bovinos</span>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon-circle">
              <ion-icon :icon="scaleOutline"></ion-icon>
            </div>
            <div class="stat-data">
              <span class="val">{{ pesoPromedio }} <small>kg</small></span>
              <span class="lbl">Peso Promedio</span>
            </div>
          </div>

          <div class="stat-card blue">
            <div class="stat-icon-circle">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
            <div class="stat-data">
              <span class="val">{{ pesajesHoy }}</span>
              <span class="lbl">Historial Pesos</span>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon-circle">
              <ion-icon :icon="homeOutline"></ion-icon>
            </div>
            <div class="stat-data">
              <span class="val">{{ dashboardStats.fincas ?? 0 }}</span>
              <span class="lbl">Mis Fincas</span>
            </div>
          </div>
        </div>

        <!-- SECCIÓN DE REBAÑO -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Mi Rebaño</h3>
            <button class="link-btn-custom" @click="router.push('/ganado/animales')">Ver todos</button>
          </div>
          
          <div class="panel-body no-padding">
            <div v-if="loading" class="loading-state-mobile">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Cargando rebaño...</p>
            </div>
            
            <div v-else-if="error" class="error-state-mobile">
              <ion-icon :icon="cloudOfflineOutline"></ion-icon>
              <p>{{ error }}</p>
              <button class="retry-btn-custom" @click="load">Reintentar</button>
            </div>

            <div v-else class="animal-list-mobile">
              <router-link
                v-for="a in animals.slice(0, 5)"
                :key="a.id"
                :to="`/animal/${a.id}`"
                class="animal-row-mobile"
              >
                <div class="animal-avatar-mobile">
                  <span class="avatar-emoji">🐂</span>
                </div>
                <div class="animal-info-mobile">
                  <h4>{{ a.nombre }}</h4>
                  <span>Arete: #{{ a.arete || 'N/A' }} &middot; {{ a.raza }}</span>
                </div>
                <div class="animal-weight-mobile">
                  <span class="weight-tag">{{ a.pesoActual > 0 ? `${a.pesoActual} kg` : 'S/P' }}</span>
                  <ion-icon :icon="chevronForwardOutline" class="row-arrow"></ion-icon>
                </div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- GRÁFICO EVOLUCIÓN -->
        <div class="panel-card chart-panel-mobile">
          <div class="panel-header">
            <h3>Evolución de Peso Promedio</h3>
          </div>
          <div class="panel-body">
            <div class="chart-wrapper">
              <LineChart :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Navigation always active -->
      <BottomNav />
      
      <!-- Notifications modal overlay -->
      <NotificationsModal 
        :is-open="isNotificationsOpen" 
        :notifications="notifications" 
        @close="isNotificationsOpen = false" 
        @refresh="loadNotificationsAndStats" 
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonSpinner, IonIcon
} from '@ionic/vue';
import { 
  cloudOfflineOutline, pawOutline, chevronForwardOutline, logOutOutline,
  cameraOutline, scaleOutline, cloudUploadOutline, trashOutline, refreshOutline,
  notificationsOutline, calendarOutline, documentTextOutline, homeOutline, timeOutline
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import NotificationsModal from '@/components/NotificationsModal.vue';
import { animalRepository, offlineSyncService, type Animal } from '@/services';
import type { Notificacion } from '@/services/interfaces';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

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

// Notificaciones y Estadísticas
const notifications = ref<Notificacion[]>([]);
const isNotificationsOpen = ref(false);
const dashboardStats = ref<any>({});

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.leido).length;
});

async function loadNotificationsAndStats() {
  try {
    notifications.value = await animalRepository.getNotificaciones();
    dashboardStats.value = await animalRepository.getDashboardStats();
  } catch (err) {
    console.error('Error al cargar alertas y estadísticas:', err);
  }
}

function openNotifications() {
  isNotificationsOpen.value = true;
}

function goToAgenda() {
  router.push('/ganado/personal?tab=citas&filter=aceptada');
}

function goToAgendaPending() {
  router.push('/ganado/personal?tab=citas&filter=pendiente');
}

function goToReports() {
  router.push('/ganado/personal?tab=reportes');
}

function goToWeightReminders() {
  router.push('/ganado/animales');
}

function goToHealthReminders() {
  router.push('/ganado/recordatorios');
}

// Conectividad
const isOffline = ref(!navigator.onLine);
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine;
};
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

// Cola offline
const offlineQueue = computed(() => offlineSyncService.queue.value);
const pendingCount = computed(() => offlineQueue.value.filter(item => item.estado !== 'completado').length);
const hasCompletedItems = computed(() => offlineQueue.value.some(item => item.estado === 'completado'));

function clearCompleted() {
  offlineSyncService.clearCompleted();
}

function removePending(id: string) {
  offlineSyncService.removeEstimation(id);
}

function retrySync() {
  offlineSyncService.syncQueue();
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pendiente_local': return 'Pendiente';
    case 'sincronizando': return 'Subiendo...';
    case 'procesando': return 'Procesando IA';
    case 'completado': return 'Listo';
    case 'error': return 'Error';
    default: return status;
  }
}

// Sesión usuario
const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

const pesoPromedio = computed(() => {
  const animalsWithWeight = animals.value.filter(a => a.pesoActual > 0);
  if (animalsWithWeight.length === 0) return 0;
  const total = animalsWithWeight.reduce((acc, curr) => acc + curr.pesoActual, 0);
  return Math.round(total / animalsWithWeight.length);
});

const pesajesHoy = computed(() => {
  return animals.value.reduce((acc, curr) => acc + (curr.historialPeso?.length || 0), 0);
});

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  router.push('/login');
};

async function load() {
  loading.value = true;
  error.value = null;
  try {
    animals.value = await animalRepository.getAllAnimals();
    await loadNotificationsAndStats();
  } catch (err: any) {
    error.value = err.message || 'Error al cargar animales';
  } finally {
    loading.value = false;
  }
}

async function silentLoad() {
  try {
    animals.value = await animalRepository.getAllAnimals();
    await loadNotificationsAndStats();
  } catch (err) {
    console.error('Error actualizando rebaño en background:', err);
  }
}

// Configurar refresco automático cada 15 segundos en segundo plano (silencioso)
useAutoRefresh(silentLoad, 15000);

// Escuchar cambios en la cola offline para refrescar el dashboard cuando termine una sincronización
watch(
  () => offlineQueue.value.map(item => item.estado),
  (newStates, oldStates) => {
    const hasNewCompletion = newStates.some((state, idx) => state === 'completado' && oldStates?.[idx] !== 'completado');
    if (hasNewCompletion) {
      silentLoad();
    }
  },
  { deep: true }
);

onMounted(() => {
  load();
});

// Gráfico
const chartData = computed(() => {
  const recordsByDate: { [key: string]: { total: number; count: number } } = {};
  
  animals.value.forEach(animal => {
    (animal.historialPeso || []).forEach(record => {
      const dateStr = record.fecha;
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = { total: 0, count: 0 };
      }
      recordsByDate[dateStr].total += record.peso;
      recordsByDate[dateStr].count += 1;
    });
  });

  const uniqueDates = Object.keys(recordsByDate).sort((a, b) => {
    const partsA = a.split('/');
    const partsB = b.split('/');
    const dateA = partsA.length === 3 ? new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0])) : new Date(a);
    const dateB = partsB.length === 3 ? new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0])) : new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  let labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  let data = [0, 0, 0, 0];

  if (uniqueDates.length > 0) {
    labels = uniqueDates.map(d => {
      const parts = d.split('/');
      if (parts.length === 3) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${parts[0]} ${months[parseInt(parts[1]) - 1]}`;
      }
      return d;
    });
    data = uniqueDates.map(d => Math.round(recordsByDate[d].total / recordsByDate[d].count));
  }

  return {
    labels,
    datasets: [
      {
        label: 'Peso (kg)',
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        borderColor: '#2E7D32',
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2E7D32',
        pointRadius: 4,
        fill: true,
        data,
        tension: 0.4
      }
    ]
  };
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: false, grid: { color: '#f2f2f2' } },
    x: { grid: { display: false } }
  }
});
</script>

<style scoped>
.dashboard-content {
  --background: #f4f6f0; /* Soft warm green-beige background */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* APP SHELL WRAPPER FOR MOBILE AND WIDE SCREENS */
.mobile-app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 16px 110px; /* safe bottom space for navigation */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* HEADER TOOLBAR */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.9);
  --min-height: 64px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0 12px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 22px;
}

.app-logo {
  font-weight: 800;
  color: #1B5E20;
  letter-spacing: -0.5px;
  font-size: 17px;
}

.badge-ganadero {
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  font-size: 8px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.logout-btn-custom {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #5c6e58;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
}

.logout-btn-custom:active {
  color: #c62828;
}

/* CONNECTIVITY INDICATORS */
.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #2e7d32;
  background: #eaf8eb;
  padding: 4px 8px;
  border-radius: 8px;
  margin-right: 8px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #2e7d32;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.5);
  animation: dot-pulse 1.8s infinite;
}

@keyframes dot-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(46, 125, 50, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
}

.offline-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #b75700;
  background: #fff3e0;
  padding: 4px 8px;
  border-radius: 8px;
  margin-right: 8px;
}

.animate-pulse {
  animation: pulse-op 1.5s infinite alternate;
}

@keyframes pulse-op {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

/* BIENVENIDA */
.user-greeting-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.greeting-info h1 {
  font-size: 20px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 4px;
}

.greeting-info p {
  margin: 0;
  font-size: 12px;
  color: #5c6e58;
}

.greeting-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.2);
}

/* OFFLINE BANNER */
.offline-banner {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 1px solid #ffcc80;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.banner-icon {
  font-size: 22px;
  color: #e65100;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-text h4 {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #e65100;
}

.banner-text p {
  margin: 0;
  font-size: 11px;
  color: #ef6c00;
  line-height: 1.4;
}

/* TOUCH-FRIENDLY BIG ACTION CARD */
.big-action-card {
  width: 100%;
  background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
  border: none;
  border-radius: 20px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: white;
  text-align: left;
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.25);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.big-action-card:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}

.action-icon-bg {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.action-text {
  flex-grow: 1;
}

.action-text h3 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.action-text p {
  margin: 0;
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.3;
}

.action-arrow {
  font-size: 18px;
  opacity: 0.8;
}

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.stat-icon-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.stat-card.green .stat-icon-circle { background: #eaf8eb; color: #2e7d32; }
.stat-card.orange .stat-icon-circle { background: #fff3e0; color: #e65100; }
.stat-card.blue .stat-icon-circle { background: #e3f2fd; color: #1565c0; }
.stat-card.purple .stat-icon-circle { background: #f3e5f5; color: #8e24aa; }

.stat-data {
  display: flex;
  flex-direction: column;
}

.stat-data .val {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
}

.stat-data .val small {
  font-size: 10px;
  font-weight: 600;
  color: #5c6e58;
}

.stat-data .lbl {
  font-size: 9px;
  font-weight: 700;
  color: #8fa086;
  margin-top: 1px;
}

/* PANELS AND LISTS */
.panel-card {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(46, 125, 50, 0.05);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid #f2f4ee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1B5E20;
}

.panel-body {
  padding: 16px;
}

.panel-body.no-padding {
  padding: 0;
}

/* ESTIMACIONES PENDIENTES COLA */
.pending-panel {
  border-color: #ffe0b2;
  background: #fdfbf7;
}

.pending-header {
  border-bottom-color: #ffe0b2;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-header-icon {
  font-size: 18px;
  color: #e65100;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #2e7d32;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  padding: 4px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  max-height: 280px;
  overflow-y: auto;
}

.pending-row {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #f6f3eb;
  gap: 12px;
}

.pending-row:last-child {
  border-bottom: none;
}

.pending-thumb-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.pending-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e2e7da;
}

.status-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-badge.pendiente_local { background-color: #795548; }
.status-badge.sincronizando { background-color: #ff9800; }
.status-badge.procesando { background-color: #2196f3; }
.status-badge.completado { background-color: #4caf50; }
.status-badge.error { background-color: #f44336; }

.pending-info {
  flex-grow: 1;
  min-width: 0;
}

.pending-info h4 {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pending-meta {
  margin: 0;
  font-size: 10px;
  color: #8fa086;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.progress-outer {
  flex-grow: 1;
  height: 4px;
  background: #e2e7da;
  border-radius: 2px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: #2e7d32;
  transition: width 0.3s ease;
}

.progress-val {
  font-size: 8px;
  font-weight: 700;
  color: #5c6e58;
}

.status-msg {
  font-size: 9px;
  display: block;
  margin-top: 4px;
}

.status-msg.error-msg { color: #d32f2f; font-weight: 600; }
.status-msg.success-msg { color: #2e7d32; }

.pending-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-icon-btn {
  background: #f0f3eb;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #5c6e58;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

.action-icon-btn:active {
  background: #e2e7da;
}

.action-icon-btn.retry { color: #e65100; background: #fff3e0; }
.action-icon-btn.delete { color: #c62828; background: #ffebee; }

/* REBAÑO LIST MOBILE */
.link-btn-custom {
  background: transparent;
  border: none;
  color: #2E7D32;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.animal-list-mobile {
  display: flex;
  flex-direction: column;
}

.animal-row-mobile {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4ee;
  text-decoration: none;
  color: inherit;
}

.animal-row-mobile:last-child {
  border-bottom: none;
}

.animal-row-mobile:active {
  background-color: #f7f9f4;
}

.animal-avatar-mobile {
  width: 36px;
  height: 36px;
  background: #eaf0e6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar-emoji {
  font-size: 16px;
}

.animal-info-mobile {
  flex-grow: 1;
  min-width: 0;
}

.animal-info-mobile h4 {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.animal-info-mobile span {
  font-size: 10px;
  color: #7c8e76;
}

.animal-weight-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weight-tag {
  font-size: 11px;
  font-weight: 800;
  color: #1B5E20;
  background: #eaf0e6;
  padding: 4px 8px;
  border-radius: 6px;
}

.row-arrow {
  color: #c0c5b1;
  font-size: 14px;
}

/* CHART PANEL */
.chart-panel-mobile {
  margin-bottom: 16px;
}

.chart-wrapper {
  height: 200px;
  position: relative;
}

/* LOADING & ERROR STATES */
.loading-state-mobile, .error-state-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  color: #7c8e76;
  gap: 12px;
  text-align: center;
}

.loading-state-mobile p, .error-state-mobile p {
  margin: 0;
  font-size: 11px;
}

.error-state-mobile ion-icon {
  font-size: 32px;
  color: #c62828;
}

.retry-btn-custom {
  background: #2E7D32;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.retry-btn-custom:active {
  background: #1b5e20;
}

/* ANIMATIONS */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* BELL BUTTON AND BADGE */
.bell-btn-custom {
  background: transparent;
  border: none;
  font-size: 22px;
  color: #5c6e58;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  position: relative;
  margin-right: 8px;
  outline: none;
}

.bell-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #c62828;
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  border: 1.5px solid #ffffff;
}

/* PENDING TASKS PANEL */
.pending-tasks-panel {
  background: #ffffff;
  border-color: rgba(46, 125, 50, 0.08);
}

.grid-2x2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px;
}

.task-indicator {
  background: #f4f6f0;
  border: 1px solid rgba(46, 125, 50, 0.03);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.task-indicator:active {
  transform: scale(0.97);
  background-color: #eaf0e6;
}

.indicator-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.indicator-icon.notification { background: #e8f5e9; color: #2e7d32; }
.indicator-icon.cita { background: #e3f2fd; color: #1565c0; }
.indicator-icon.pendiente-confirmar { background: #efebe9; color: #5d4037; }
.indicator-icon.reporte { background: #f3e5f5; color: #8e24aa; }
.indicator-icon.recordatorio { background: #fff3e0; color: #e65100; }
.indicator-icon.recordatorio-sanitario { background: #e8f5e9; color: #1B5E20; }

.indicator-details {
  display: flex;
  flex-direction: column;
}

.indicator-details .value {
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
  line-height: 1.2;
}

.indicator-details .label {
  font-size: 10px;
  font-weight: 700;
  color: #8fa086;
}
</style>
