<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="Atrás"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Animal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="animal-detail-content">
      <!-- ═══ ESTADO CARGANDO ═══ -->
      <div v-if="loading" class="state-container">
        <div class="skeleton-card">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w40"></div>
            <div class="skeleton-line w80"></div>
          </div>
        </div>
        <div class="skeleton-chart"></div>
      </div>

      <!-- ═══ ESTADO ERROR ═══ -->
      <div v-else-if="error" class="state-container state-center">
        <ion-icon :icon="cloudOfflineOutline" class="state-icon error-icon"></ion-icon>
        <h2>Error al cargar datos</h2>
        <p class="state-message">{{ error }}</p>
        <ion-button expand="block" class="retry-btn" @click="loadAnimal">
          <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
          Reintentar
        </ion-button>
      </div>

      <!-- ═══ ESTADO VACÍO ═══ -->
      <div v-else-if="!animal" class="state-container state-center">
        <ion-icon :icon="pawOutline" class="state-icon empty-icon"></ion-icon>
        <h2>Animal no encontrado</h2>
        <p class="state-message">No se encontraron datos para este animal.</p>
        <ion-button expand="block" routerLink="/home" class="back-btn">
          <ion-icon :icon="homeOutline" slot="start"></ion-icon>
          Volver al inicio
        </ion-button>
      </div>

      <!-- ═══ ESTADO CON DATOS ═══ -->
      <div v-else class="detail-wrapper">
        <!-- Tarjeta principal del animal -->
        <div class="animal-hero-card">
          <div class="hero-image-section">
            <div class="animal-avatar">
              <img
                v-if="animal.imagen"
                :src="animal.imagen"
                :alt="animal.nombre"
              />
              <div v-else class="avatar-placeholder">
                <ion-icon :icon="pawOutline"></ion-icon>
              </div>
            </div>
            <div class="hero-badge">
              <ion-icon :icon="pricetagOutline"></ion-icon>
              {{ animal.arete }}
            </div>
          </div>

          <div class="hero-info">
            <h1 class="animal-name">{{ animal.nombre }}</h1>
            <div class="info-chips">
              <span class="info-chip">
                <ion-icon :icon="colorPaletteOutline"></ion-icon>
                {{ animal.raza }}
              </span>
              <span class="info-chip">
                <ion-icon :icon="calendarOutline"></ion-icon>
                {{ animal.edad }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tarjeta de resúmen de peso -->
        <div class="weight-summary-card">
          <div class="current-weight">
            <span class="weight-label">Peso Actual</span>
            <span class="weight-value">{{ animal.pesoActual }} <small>kg</small></span>
          </div>

          <div class="weight-diff" :class="diffClass">
            <ion-icon :icon="diffIcon"></ion-icon>
            <span class="diff-value">{{ diffText }}</span>
          </div>

          <div class="weight-status">
            <ion-icon :icon="pulseOutline"></ion-icon>
            <span>{{ statusMessage }}</span>
          </div>
        </div>

        <!-- Tarjeta del gráfico de peso -->
        <div class="chart-card">
          <h2 class="section-title">
            <ion-icon :icon="trendingUpOutline"></ion-icon>
            Evolución de Peso
          </h2>
          <WeightChart :weight-data="animal.historialPeso" />
        </div>

        <!-- Tarjeta de Reportes Veterinarios -->
        <div class="chart-card">
          <h2 class="section-title text-green-title">
            <ion-icon :icon="medkitOutline"></ion-icon>
            Reportes Veterinarios
          </h2>
          
          <div v-if="loadingReportes" class="loading-reportes">
            <ion-spinner name="crescent"></ion-spinner>
            <span>Cargando reportes clínicos...</span>
          </div>

          <div v-else-if="reportesVeterinarios.length === 0" class="no-reportes">
            <ion-icon :icon="documentTextOutline" class="no-rep-icon"></ion-icon>
            <p>No hay reportes de seguimiento registrados para este animal.</p>
          </div>

          <div v-else class="reportes-list">
            <div 
              v-for="rep in reportesVeterinarios" 
              :key="rep.id" 
              class="reporte-item-card"
              :class="rep.prioridad"
              @click="openReporteDetail(rep)"
            >
              <div class="rep-header">
                <span class="priority-badge" :class="rep.prioridad">{{ rep.prioridad.toUpperCase() }}</span>
                <span class="rep-date">{{ formatDateShort(rep.created_at) }}</span>
              </div>
              <div class="rep-body">
                <h5>🩺 {{ rep.veterinario?.nombre_completo || 'Veterinario' }}</h5>
                <p class="diag-text"><strong>Diag:</strong> {{ rep.diagnostico_preliminar }}</p>
              </div>
              <div class="rep-footer">
                <span class="status-indicator-badge" :class="rep.estado">{{ formatEstadoText(rep.estado) }}</span>
                <span class="read-more">Ver reporte completo &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="action-buttons">
          <ion-button expand="block" class="action-btn primary-action" size="large" :router-link="`/ganado/estimacion-ia?animalId=${animal.id}`">
            <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
            Registrar Nuevo Peso
          </ion-button>
          <ion-button expand="block" class="action-btn secondary-action" fill="outline" size="large" @click="showHistoryModal = true">
            <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
            Ver Historial Completo
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- MODAL DE HISTORIAL COMPLETO -->
    <ion-modal :is-open="showHistoryModal" @didDismiss="showHistoryModal = false">
      <ion-header>
        <ion-toolbar class="modal-toolbar">
          <ion-title>Historial de Pesajes</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showHistoryModal = false" class="close-modal-btn">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-history-content">
        <div v-if="animal" class="history-list-container">
          <div class="history-animal-info-card">
            <h3>{{ animal.nombre }}</h3>
            <p>Arete: <strong>#{{ animal.arete || 'Sin arete' }}</strong> | Raza: <strong>{{ animal.raza }}</strong></p>
          </div>
          
          <div class="table-responsive">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso Registrado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rec, index) in [...animal.historialPeso].reverse()" :key="index">
                  <td>{{ rec.fecha }}</td>
                  <td class="weight-col">{{ rec.peso }} kg</td>
                </tr>
                <tr v-if="!animal.historialPeso || animal.historialPeso.length === 0">
                  <td colspan="2" class="no-records">No hay registros de pesaje.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- MODAL DE DETALLE DE REPORTE VETERINARIO -->
    <ion-modal :is-open="showReporteModal" @didDismiss="showReporteModal = false">
      <ion-header>
        <ion-toolbar class="modal-toolbar font-vet">
          <ion-title>🩺 Reporte Clínico</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showReporteModal = false" class="close-modal-btn">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-history-content">
        <div v-if="selectedReporte" class="reporte-detail-container">
          <div class="reporte-meta-header" :class="selectedReporte.prioridad">
            <div class="prio-row">
              <span class="priority-badge" :class="selectedReporte.prioridad">PRIORIDAD {{ selectedReporte.prioridad.toUpperCase() }}</span>
              <span class="status-indicator-badge" :class="selectedReporte.estado">{{ formatEstadoText(selectedReporte.estado).toUpperCase() }}</span>
            </div>
            <h3>{{ selectedReporte.animal?.nombre }}</h3>
            <p class="meta-date">Fecha del reporte: {{ formatDateLong(selectedReporte.created_at) }}</p>
          </div>

          <div class="reporte-detail-body">
            <div class="detail-block">
              <label>Veterinario Responsable</label>
              <p class="value">Dr/a. {{ selectedReporte.veterinario?.nombre_completo }} ({{ selectedReporte.veterinario?.correo }})</p>
            </div>

            <div class="detail-block">
              <label>Observaciones Clínicas</label>
              <p class="value text-italic">"{{ selectedReporte.observaciones }}"</p>
            </div>

            <div class="detail-block">
              <label>Diagnóstico Preliminar</label>
              <p class="value highlight-text">{{ selectedReporte.diagnostico_preliminar }}</p>
            </div>

            <div class="detail-block">
              <label>Recomendaciones del Profesional</label>
              <p class="value">{{ selectedReporte.recomendaciones }}</p>
            </div>

            <div class="detail-block" v-if="selectedReporte.medicamentos_sugeridos">
              <label>Sugerencia de Medicamentos / Suplementación</label>
              <p class="value med-value">{{ selectedReporte.medicamentos_sugeridos }}</p>
            </div>

            <div class="detail-block" v-if="selectedReporte.proxima_revision">
              <label>Próxima Revisión Sugerida</label>
              <p class="value font-bold">📅 {{ formatDateLong(selectedReporte.proxima_revision) }}</p>
            </div>

            <!-- Integración con Citas -->
            <div 
              v-if="selectedReporte.prioridad === 'alta' || selectedReporte.prioridad === 'urgente'" 
              class="appointment-integration-box"
            >
              <p>⚠️ Este reporte tiene prioridad crítica. Se aconseja programar una revisión clínica formal.</p>
              <button class="request-visit-btn" @click="solicitarVisitaDesdeReporte(selectedReporte)">
                <ion-icon :icon="calendarOutline"></ion-icon>
                Solicitar Visita Veterinaria
              </button>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonModal,
  IonSpinner
} from '@ionic/vue';
import {
  cloudOfflineOutline,
  refreshOutline,
  pawOutline,
  homeOutline,
  pricetagOutline,
  colorPaletteOutline,
  calendarOutline,
  pulseOutline,
  trendingUpOutline,
  addCircleOutline,
  documentTextOutline,
  medkitOutline
} from 'ionicons/icons';

import WeightChart from '@/components/WeightChart.vue';
import { animalRepository, type Animal } from '@/services';
import { useWeightStatus } from '@/composables/useWeightStatus';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

// ── Ruta ──
const route = useRoute();
const router = useRouter();

// ── Estado ──
const animal = ref<Animal | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showHistoryModal = ref(false);

// ── Reportes Veterinarios ──
const reportesVeterinarios = ref<any[]>([]);
const loadingReportes = ref(true);
const showReporteModal = ref(false);
const selectedReporte = ref<any>(null);

async function loadReportes() {
  loadingReportes.value = true;
  try {
    const id = Number(route.params.id) || 1;
    reportesVeterinarios.value = await animalRepository.getReportesVeterinarios(id);
  } catch (err) {
    console.error('Error al cargar reportes veterinarios:', err);
  } finally {
    loadingReportes.value = false;
  }
}

// ── Cargar datos ──
async function loadAnimal() {
  loading.value = true;
  error.value = null;

  try {
    const id = Number(route.params.id) || 1;
    animal.value = await animalRepository.getAnimalById(id);
    await loadReportes();
  } catch (err: any) {
    error.value = err.message || 'Error al cargar los datos del animal';
    animal.value = null;
  } finally {
    loading.value = false;
  }
}

async function silentLoadAnimal() {
  try {
    const id = Number(route.params.id) || 1;
    const data = await animalRepository.getAnimalById(id);
    if (data) {
      animal.value = data;
    }
    // Cargar reportes silenciosamente en background
    const dataReps = await animalRepository.getReportesVeterinarios(id);
    reportesVeterinarios.value = dataReps;
  } catch (err) {
    console.error('[AnimalDetailPage] Error al actualizar animal en background:', err);
  }
}

// Configurar refresco automático cada 15 segundos en segundo plano (silencioso)
useAutoRefresh(silentLoadAnimal, 15000);

onMounted(loadAnimal);

const { weightDiff, diffIcon, diffText, statusMessage } = useWeightStatus(animal);

const diffClass = computed(() => ({
  gain: weightDiff.value > 0,
  loss: weightDiff.value < 0,
  stable: weightDiff.value === 0,
}));

const openReporteDetail = (reporte: any) => {
  selectedReporte.value = reporte;
  showReporteModal.value = true;
};

const solicitarVisitaDesdeReporte = (reporte: any) => {
  showReporteModal.value = false;
  router.push({
    path: '/ganado/personal',
    query: {
      action: 'solicitar_cita',
      vetId: String(reporte.veterinario_id),
      fincaId: String(reporte.finca_id),
      animalId: String(reporte.animal_id),
      motivo: `Revisión por reporte: ${reporte.diagnostico_preliminar}`
    }
  });
};

const formatEstadoText = (estado: string): string => {
  const map: Record<string, string> = {
    abierto: 'Abierto',
    en_seguimiento: 'En Seguimiento',
    resuelto: 'Resuelto'
  };
  return map[estado] || estado;
};

const formatDateShort = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

const formatDateLong = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.animal-detail-content {
  --background: #f4f6f0;
}

/* ── Contenedores de estado ── */
.state-container {
  padding: 24px 16px;
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.state-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-icon {
  color: #d32f2f;
}

.empty-icon {
  color: #9e9e9e;
}

.state-message {
  color: #757575;
  max-width: 280px;
  margin: 0 auto 24px;
}

/* ── Cargando (Esqueleto) ── */
.skeleton-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 16px;
  animation: shimmer 1.5s ease-in-out infinite alternate;
}

.skeleton-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }
.skeleton-line.w80 { width: 80%; }

.skeleton-chart {
  height: 200px;
  border-radius: 16px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Envoltorio de detalles ── */
.detail-wrapper {
  padding: 16px;
  padding-bottom: 40px;
}

/* ── Tarjeta principal ── */
.animal-hero-card {
  background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
  border-radius: 24px;
  padding: 24px;
  color: #fff;
  margin-top: 16px;
  margin-bottom: 16px;
  box-shadow: 0 12px 30px rgba(46, 125, 50, 0.22);
  position: relative;
  overflow: hidden;
}

.animal-hero-card::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.hero-image-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.animal-avatar {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.animal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: rgba(255, 255, 255, 0.85);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.22);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.animal-name {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.info-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* ── Resumen de peso ── */
.weight-summary-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(46, 125, 50, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.current-weight {
  flex: 1;
  min-width: 120px;
}

.weight-label {
  display: block;
  font-size: 12px;
  color: #7c8e78;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-weight: 700;
}

.weight-value {
  font-size: 36px;
  font-weight: 900;
  color: #1B5E20;
  line-height: 1;
}

.weight-value small {
  font-size: 16px;
  font-weight: 700;
  color: #5c6e58;
}

.weight-diff {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
}

.weight-diff.gain {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.15), rgba(46, 125, 50, 0.05));
  color: #2E7D32;
  border: 1px solid rgba(46, 125, 50, 0.1);
}

.weight-diff.loss {
  background: linear-gradient(135deg, rgba(211, 47, 47, 0.15), rgba(211, 47, 47, 0.05));
  color: #d32f2f;
  border: 1px solid rgba(211, 47, 47, 0.1);
}

.weight-diff.stable {
  background: linear-gradient(135deg, rgba(158, 158, 158, 0.15), rgba(158, 158, 158, 0.05));
  color: #757575;
  border: 1px solid rgba(158, 158, 158, 0.1);
}

.weight-diff ion-icon {
  font-size: 18px;
}

.weight-status {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fdfdfc;
  border-radius: 12px;
  font-size: 13.5px;
  color: #5c6e58;
  font-weight: 600;
  border: 1px solid rgba(46, 125, 50, 0.04);
}

.weight-status ion-icon {
  color: #2E7D32;
  font-size: 18px;
}

/* ── Tarjeta de gráfico ── */
.chart-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(46, 125, 50, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title ion-icon {
  color: #2E7D32;
}

/* ── Botones de acción ── */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.action-btn {
  --border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.3px;
  height: 50px;
}

.primary-action {
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --box-shadow: 0 8px 20px -5px rgba(46, 125, 50, 0.4);
}

.secondary-action {
  --border-color: #2E7D32;
  --color: #2E7D32;
}

/* ── Botones de reintentar / volver ── */
.retry-btn,
.back-btn {
  --border-radius: 14px;
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --box-shadow: 0 8px 16px -5px rgba(46, 125, 50, 0.3);
  margin-top: 8px;
  width: 100%;
  max-width: 280px;
}

/* ── Modal de Historial ── */
.modal-toolbar {
  --background: #2E7D32;
  --color: #ffffff;
}

.close-modal-btn {
  --color: #ffffff;
  font-weight: 700;
}

.modal-history-content {
  --background: #f4f6f0;
}

.history-animal-info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.08);
}

.history-animal-info-card h3 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #1B5E20;
}

.history-animal-info-card p {
  margin: 0;
  font-size: 14px;
  color: #5c6e58;
}

.table-responsive {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.08);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.history-table th {
  background: #eaf0e8;
  color: #1B5E20;
  font-weight: 700;
  padding: 14px 16px;
  font-size: 14px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.08);
}

.history-table td {
  padding: 14px 16px;
  font-size: 15px;
  color: #2c3e2d;
  border-bottom: 1px solid #f0f3ed;
}

.history-table tr:last-child td {
  border-bottom: none;
}

.weight-col {
  font-weight: 700;
  color: #2E7D32;
}

.no-records {
  text-align: center;
  color: #7c8e78;
  padding: 24px !important;
  font-style: italic;
}

/* ── Reportes Veterinarios ── */
.text-green-title {
  color: #1B5E20 !important;
}

.loading-reportes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #5c6e58;
}

.no-reportes {
  text-align: center;
  padding: 24px 16px;
  color: #7c8e78;
}

.no-rep-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #cbd4c3;
}

.reportes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.reporte-item-card {
  background: #fdfdfd;
  border: 1px solid #cbd4c3;
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reporte-item-card:active {
  transform: scale(0.98);
}

.reporte-item-card.baja { border-left: 4px solid #455a64; }
.reporte-item-card.media { border-left: 4px solid #00897b; }
.reporte-item-card.alta { border-left: 4px solid #d97706; }
.reporte-item-card.urgente { border-left: 4px solid #c62828; }

.rep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.priority-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 8px;
}

.priority-badge.baja { background: #eceff1; color: #455a64; }
.priority-badge.media { background: #e0f2f1; color: #00897b; }
.priority-badge.alta { background: #fff7ed; color: #d97706; }
.priority-badge.urgente { background: #ffebee; color: #c62828; }

.status-indicator-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.status-indicator-badge.abierto { background: #e3f2fd; color: #1565c0; }
.status-indicator-badge.en_seguimiento { background: #fffde7; color: #f57f17; }
.status-indicator-badge.resuelto { background: #e8f5e9; color: #2e7d32; }

.rep-date {
  font-size: 11px;
  color: #7c8e78;
}

.reporte-item-card h5 {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 800;
  color: #1B5E20;
}

.diag-text {
  font-size: 12px;
  color: #5c6e58;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rep-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f3ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.read-more {
  font-size: 11px;
  font-weight: 700;
  color: #2e7d32;
}

/* ── Detalle de Reporte Modal ── */
.font-vet {
  --background: #00897b;
  --color: #ffffff;
}

.reporte-detail-container {
  display: flex;
  flex-direction: column;
}

.reporte-meta-header {
  border-radius: 16px;
  padding: 16px;
  color: white;
  margin-bottom: 20px;
}

.reporte-meta-header.baja { background: linear-gradient(135deg, #455a64, #37474f); }
.reporte-meta-header.media { background: linear-gradient(135deg, #00897b, #00695c); }
.reporte-meta-header.alta { background: linear-gradient(135deg, #d97706, #b45309); }
.reporte-meta-header.urgente { background: linear-gradient(135deg, #c62828, #b71c1c); }

.prio-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.reporte-meta-header h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 900;
}

.meta-date {
  font-size: 12px;
  margin: 0;
  opacity: 0.9;
}

.reporte-detail-body {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid #cbd4c3;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-block label {
  font-size: 10px;
  font-weight: 800;
  color: #7c8e78;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

.detail-block .value {
  font-size: 13.5px;
  color: #2c3e2d;
  margin: 0;
  line-height: 1.4;
  font-weight: 600;
}

.detail-block .value.text-italic {
  font-style: italic;
  color: #5c6e58;
}

.detail-block .value.highlight-text {
  font-size: 14px;
  font-weight: 800;
  color: #1B5E20;
}

.detail-block .value.med-value {
  background: #f4f6f0;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #00897b;
}

.appointment-integration-box {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px dashed #cbd4c3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.appointment-integration-box p {
  margin: 0;
  font-size: 11.5px;
  color: #d97706;
  font-weight: 700;
  line-height: 1.4;
}

.request-visit-btn {
  background: linear-gradient(135deg, #00897b, #00695c);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 10px rgba(0, 137, 123, 0.2);
  cursor: pointer;
}
</style>
