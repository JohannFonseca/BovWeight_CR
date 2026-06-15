<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="goBack" class="back-btn">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
            Volver
          </ion-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="app-logo">Detalle Clínico</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <div v-if="isLoading" class="loading-state">
        Cargando expediente...
      </div>
      <div v-else-if="error" class="error-state">
        <ion-icon :icon="warningOutline" class="error-icon"></ion-icon>
        <p>{{ error }}</p>
        <ion-button @click="goBack" fill="outline" color="primary" class="mt-4">Regresar</ion-button>
      </div>
      <div v-else-if="animal" class="main-content">
        <!-- Información General -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Información General del Animal</h3>
          </div>
          <div class="panel-body info-grid">
            <div class="info-item">
              <span class="label">Arete</span>
              <span class="value">#{{ animal.numero_arete }}</span>
            </div>
            <div class="info-item">
              <span class="label">Nombre</span>
              <span class="value">{{ animal.nombre }}</span>
            </div>
            <div class="info-item">
              <span class="label">Raza</span>
              <span class="value">{{ animal.raza?.nombre || 'No especificada' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Finca</span>
              <span class="value">{{ animal.finca?.nombre || 'Sin finca' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Sexo</span>
              <span class="value">{{ animal.sexo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Estado</span>
              <span class="value">{{ animal.estado }}</span>
            </div>
          </div>
        </div>

        <!-- Gráfica de Crecimiento -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Evolución de Peso</h3>
          </div>
          <div class="panel-body">
            <div class="chart-container" v-if="chartData.labels.length > 0">
              <LineChart :data="chartData" :options="chartOptions" />
            </div>
            <div v-else class="no-data">
              No hay suficientes registros de estimación de peso para graficar.
            </div>

            <!-- Aviso Legal Permanente -->
            <div class="legal-notice">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              <span>Peso estimado aproximado mediante inteligencia artificial</span>
            </div>
          </div>
        </div>

        <!-- Historial y Visor de Fotografías -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Historial de Registros y Fotografías</h3>
          </div>
          <div class="panel-body no-padding">
            <div class="history-list">
              <div v-if="!animal.estimaciones_peso || animal.estimaciones_peso.length === 0" class="no-data">
                Sin registros históricos.
              </div>
              <template v-else>
                <div class="history-row" v-for="est in animal.estimaciones_peso" :key="est.id">
                  <div class="history-date">
                    <ion-icon :icon="timeOutline"></ion-icon>
                    {{ formatDate(est.created_at) }}
                  </div>
                  
                  <div class="history-photo">
                    <img v-if="est.ruta_imagen" :src="est.ruta_imagen" alt="Foto del pesaje" />
                    <div v-else class="empty-photo">
                      <ion-icon :icon="imageOutline"></ion-icon>
                    </div>
                  </div>

                  <div class="history-weight">
                    <div class="weight-main">{{ est.peso_estimado_kg }} kg</div>
                    <div class="weight-label">Estimado</div>
                  </div>
                  
                  <div class="history-correction" v-if="est.peso_corregido_kg">
                    <div class="weight-main corrected">{{ est.peso_corregido_kg }} kg</div>
                    <div class="weight-label">Corregido</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonButtons 
} from '@ionic/vue';
import { 
  arrowBackOutline, informationCircleOutline, warningOutline,
  timeOutline, imageOutline
} from 'ionicons/icons';

// Chart.js imports
import { Line as LineChart } from 'vue-chartjs';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

const animalId = route.params.id;
const animal = ref<any>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const chartData = ref<any>({ labels: [], datasets: [] });
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } }
  }
});

const goBack = () => {
  router.push('/veterinario');
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const prepareChartData = () => {
  if (!animal.value || !animal.value.estimaciones_peso) return;
  const estimaciones = animal.value.estimaciones_peso;
  
  const labels = estimaciones.map((e: any) => new Date(e.created_at).toLocaleDateString());
  const dataPoints = estimaciones.map((e: any) => parseFloat(e.peso_estimado_kg));

  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Evolución de Peso (kg)',
        backgroundColor: 'rgba(0, 137, 123, 0.1)',
        borderColor: '#00897B',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#00897B',
        pointRadius: 4,
        fill: true,
        data: dataPoints,
        tension: 0.4
      }
    ]
  };
};

const fetchAnimalDetail = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const sessionStr = localStorage.getItem('usuario_sesion');
    let userId = '';
    let userRole = '';
    if (sessionStr) {
      try {
        const parsedSession = JSON.parse(sessionStr);
        userId = parsedSession.id;
        userRole = parsedSession.rol || 'veterinario';
      } catch(e) {}
    }
    
    if (!userId) {
      error.value = 'No se encontró una sesión activa.';
      isLoading.value = false;
      return;
    }
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const response = await axios.get(`${apiUrl}/veterinario/animal/${animalId}`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Role': userRole,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.success) {
      animal.value = response.data.data;
      prepareChartData();
    }
  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      error.value = 'Acceso denegado. Este animal pertenece a una finca no autorizada para tu perfil.';
    } else {
      error.value = err.response?.data?.message || 'Error al cargar los detalles del animal.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAnimalDetail();
});
</script>

<style scoped>
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', -apple-system, sans-serif;
}

.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 0 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.app-logo {
  font-weight: 800; 
  color: #2c3e2d; 
  letter-spacing: -0.5px; 
  font-size: 20px;
}

.back-btn {
  --color: #5c6e58;
  font-weight: 600;
}

.main-content {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.panel-card {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
  margin-bottom: 24px;
  overflow: hidden;
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid #f4f1ea;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
}

.panel-body {
  padding: 24px;
}

.panel-body.no-padding {
  padding: 0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  color: #5c6e58;
  font-weight: 600;
  text-transform: uppercase;
}

.value {
  font-size: 16px;
  color: #2c3e2d;
  font-weight: 700;
  margin-top: 4px;
}

/* Chart */
.chart-container {
  height: 280px;
  width: 100%;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
}

.history-row {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f4f1ea;
  gap: 20px;
}

.history-row:last-child {
  border-bottom: none;
}

.history-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5c6e58;
  font-size: 14px;
  font-weight: 600;
  width: 160px;
}

.history-photo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  background: #f4f1ea;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-photo {
  font-size: 24px;
  color: #a3a69d;
}

.history-weight {
  display: flex;
  flex-direction: column;
}

.weight-main {
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
}

.weight-main.corrected {
  color: #00897B;
}

.weight-label {
  font-size: 12px;
  color: #5c6e58;
  font-weight: 500;
}

/* Legal Notice */
.legal-notice {
  background: #fff7ed;
  color: #d97706;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-top: 24px;
  border: 1px solid rgba(217, 119, 6, 0.1);
}

.legal-notice ion-icon {
  font-size: 20px;
}

/* States */
.loading-state, .error-state, .no-data {
  padding: 40px;
  text-align: center;
  color: #5c6e58;
  font-size: 16px;
  font-weight: 500;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #d97706;
}

.error-icon {
  font-size: 48px;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .history-row {
    flex-wrap: wrap;
  }
  .history-date {
    width: 100%;
  }
}
</style>
