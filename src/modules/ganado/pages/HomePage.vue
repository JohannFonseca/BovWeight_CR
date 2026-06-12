<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">BovWeight CR</span>
            <span class="badge-ganadero">GANADERO</span>
            <span v-if="isOffline" class="offline-badge">
              <ion-icon :icon="cloudOfflineOutline" style="margin-right: 4px; font-size: 14px;"></ion-icon>
              Offline
            </span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar ganadero">
              {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'G' }}
            </div>
            <div class="user-info">
              <span class="name">{{ usuarioSesion?.nombre_completo || 'Pedro Ganadero' }}</span>
              <span class="role">{{ usuarioSesion?.usuario || 'Finca "El Rosario"' }}</span>
            </div>
          </div>
          <ion-button @click="logout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar desktop-only">
          <nav class="nav-menu">
            <a href="#" class="nav-item active">
              <ion-icon :icon="gridOutline"></ion-icon>
              <span>Mi Finca</span>
            </a>
            <router-link to="/ganado/animales" class="nav-item">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Mis Animales</span>
            </router-link>
            <router-link to="/ganado/estimacion-ia" class="nav-item ai-highlight">
              <ion-icon :icon="cameraOutline"></ion-icon>
              <span>Estimar Peso IA</span>
            </router-link>
            <router-link to="/ganado/reportes" class="nav-item">
              <ion-icon :icon="barChartOutline"></ion-icon>
              <span>Reportes</span>
            </router-link>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Resumen de Finca</h1>
              <p class="page-subtitle">Monitorea la salud y el peso de tu rebaño</p>
            </div>
            <ion-button class="ai-primary-btn" router-link="/ganado/estimacion-ia">
              <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
              NUEVO PESAJE IA
            </ion-button>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card anim-1">
              <div class="stat-icon-wrapper green">
                <ion-icon :icon="pawOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ animals.length || 0 }}</span>
                <span class="stat-label">Total Animales</span>
              </div>
            </div>

            <div class="stat-card anim-2">
              <div class="stat-icon-wrapper orange">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ pesoPromedio }} <small>kg</small></span>
                <span class="stat-label">Peso Promedio</span>
              </div>
            </div>

            <div class="stat-card anim-3">
              <div class="stat-icon-wrapper blue">
                <ion-icon :icon="cameraOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ pesajesHoy }}</span>
                <span class="stat-label">Pesajes del Rebaño</span>
              </div>
            </div>
          </div>

          <div class="content-grid">
            <!-- Animals List -->
            <div class="panel-card animals-panel">
              <div class="panel-header">
                <h3>Mi Rebaño</h3>
                <ion-button fill="clear" size="small" router-link="/ganado/animales">Ver todos</ion-button>
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
                    v-for="a in animals.slice(0, 5)"
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
                      <span class="weight-val">{{ a.pesoActual > 0 ? `${a.pesoActual} kg` : 'S/P' }}</span>
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

      <!-- Bottom Navigation for mobile -->
      <BottomNav />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonButtons, IonSpinner
} from '@ionic/vue';
import { 
  cloudOfflineOutline, pawOutline, chevronForwardOutline, logOutOutline,
  gridOutline, cameraOutline, barChartOutline, scaleOutline
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';

import { animalRepository, type Animal } from '@/services';

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

// Conectividad sin conexión
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
  } catch (err: any) {
    error.value = err.message || 'Error al cargar animales';
  } finally {
    loading.value = false;
  }
}



onMounted(load);

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
        label: 'Peso Promedio (kg)',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderColor: '#2E7D32',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
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
    y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } }
  }
});
</script>

<style scoped>
/* ====== VARIABLES GLOBALES ====== */
.dashboard-content {
  --background: #f4f6f0; /* Soft warm green-beige */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ====== HEADER ====== */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  --min-height: 70px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0 16px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon { font-size: 26px; filter: drop-shadow(0 2px 4px rgba(46, 125, 50, 0.2)); }
.app-logo { font-weight: 800; color: #1B5E20; letter-spacing: -0.5px; font-size: 20px; }
.badge-ganadero { background: linear-gradient(135deg, #2E7D32, #1B5E20); color: white; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(46, 125, 50, 0.2); }

.user-profile { display: flex; align-items: center; gap: 12px; margin-right: 12px; }
.avatar.ganadero { background: linear-gradient(135deg, #2E7D32, #1B5E20); color: white; border-radius: 12px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; box-shadow: 0 4px 8px rgba(46,125,50,0.25); }
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 700; color: #1B5E20; }
.user-info .role { font-size: 12px; color: #5c6e58; font-weight: 500; }
.logout-btn { --color: #5c6e58; }

/* ====== LAYOUT ====== */
.dashboard-layout { display: flex; min-height: 100%; }
.sidebar { width: 260px; background: #FFFFFF; border-right: 1px solid #e2dcd0; padding: 24px 16px; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; text-decoration: none; color: #5c6e58; font-weight: 600; transition: all 0.2s ease; }
.nav-item:hover { background: #f4f1ea; color: #2c3e2d; }
.nav-item.active { background: #eaf0e6; color: #1B5E20; }
.nav-item.ai-highlight { background: #fdfbf7; color: #2E7D32; margin-top: 16px; border: 1px dashed #c0c5b1; }
.nav-item ion-icon { font-size: 22px; }

/* MAIN CONTENT */
.main-content { flex: 1; padding: 24px; overflow-y: auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.page-title { font-size: 30px; font-weight: 900; color: #1B5E20; margin: 0 0 6px; letter-spacing: -1px; }
.page-subtitle { font-size: 14px; color: #5c6e58; margin: 0; font-weight: 500; }

.ai-primary-btn {
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --border-radius: 14px;
  --box-shadow: 0 10px 20px -10px rgba(46, 125, 50, 0.4);
  font-weight: 700;
  letter-spacing: 0.5px;
  height: 48px;
}

/* ====== STATS GRID ====== */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px -10px rgba(0,0,0,0.04); display: flex; align-items: center; gap: 16px; transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid rgba(46, 125, 50, 0.05); }
.stat-card:active { transform: scale(0.98); }
.stat-card.anim-1 { background: linear-gradient(135deg, #eaf0e6 0%, #ffffff 100%); }
.stat-card.anim-2 { background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); }
.stat-card.anim-3 { background: linear-gradient(135deg, #f0f4f8 0%, #ffffff 100%); }

.stat-icon-wrapper { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.stat-icon-wrapper.green { background: #ffffff; color: #2E7D32; border: 1px solid rgba(46, 125, 50, 0.1); }
.stat-icon-wrapper.orange { background: #ffffff; color: #d97706; border: 1px solid rgba(217, 119, 6, 0.1); }
.stat-icon-wrapper.blue { background: #ffffff; color: #475569; border: 1px solid rgba(71, 85, 105, 0.1); }

.stat-details { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 800; color: #1B5E20; line-height: 1.2; }
.stat-value small { font-size: 13px; color: #5c6e58; font-weight: 600; }
.stat-label { font-size: 12px; color: #5c6e58; font-weight: 600; margin-top: 2px; }

/* ====== PANELS GRID ====== */
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.panel-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.03); display: flex; flex-direction: column; overflow: hidden; }
.panel-header { padding: 20px 24px; border-bottom: 1px solid #f4f1ea; display: flex; justify-content: space-between; align-items: center; }
.panel-header h3 { margin: 0; font-size: 17px; font-weight: 800; color: #1B5E20; }
.panel-body { padding: 20px; flex: 1; }
.panel-body.no-padding { padding: 12px; background: #fdfdfd; }
.chart-container { height: 260px; width: 100%; }

/* ====== ANIMAL LIST ====== */
.animal-list { display: flex; flex-direction: column; }
.animal-row { 
  display: flex; 
  align-items: center; 
  padding: 14px 16px; 
  background: #FFFFFF;
  border: 1px solid rgba(46, 125, 50, 0.06);
  border-radius: 16px;
  margin-bottom: 10px;
  text-decoration: none; 
  color: inherit; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
}
.animal-row:hover, .animal-row:active { 
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.08);
  border-color: #2E7D32;
}
.animal-row:last-child { margin-bottom: 0; }
.animal-avatar { width: 40px; height: 40px; border-radius: 12px; background: #eaf0e6; color: #2E7D32; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-right: 14px; }
.animal-info { flex: 1; }
.animal-name { margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1B5E20; }
.animal-tag { font-size: 12px; color: #5c6e58; font-weight: 500; }
.animal-weight { display: flex; align-items: center; gap: 8px; }
.weight-val { font-weight: 800; color: #1B5E20; font-size: 14px; background: #eaf0e6; padding: 4px 8px; border-radius: 8px; }
.go-icon { color: #c0c5b1; font-size: 18px; }

/* LOADING & ERROR */
.loading-state, .error-state { padding: 40px; text-align: center; color: #5c6e58; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.error-state ion-icon { font-size: 48px; color: #b71c1c; }

/* ====== RESPONSIVE ====== */
.mobile-only { display: none; }
.ai-fab { 
  --background: linear-gradient(135deg, #2E7D32, #1B5E20); 
  --box-shadow: 0 8px 24px rgba(46, 125, 50, 0.4); 
  animation: pulse-fab 2.5s infinite;
}

@keyframes pulse-fab {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7), 0 8px 24px rgba(46, 125, 50, 0.4);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(46, 125, 50, 0), 0 8px 24px rgba(46, 125, 50, 0.4);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0), 0 8px 24px rgba(46, 125, 50, 0.4);
  }
}

@media (max-width: 992px) {
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  .main-content { padding: 16px 16px 80px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
  .ai-primary-btn { display: none; }
  .user-info { display: none; }
  .page-title { font-size: 24px; }
  .stats-grid { gap: 12px; margin-bottom: 20px; }
  .content-grid { gap: 16px; }
}


.offline-badge {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  animation: pulse-offline 2s infinite alternate;
}

@keyframes pulse-offline {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}
</style>
