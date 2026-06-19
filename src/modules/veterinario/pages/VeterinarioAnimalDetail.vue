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

        <!-- Reportes Veterinarios de Seguimiento -->
        <div class="panel-card">
          <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <h3>Reportes Veterinarios de Seguimiento</h3>
            <button @click="openCreateReportModal" class="vet-action-btn">
              <ion-icon :icon="medkitOutline" style="font-size: 16px; margin-right: 6px;"></ion-icon>
              Generar Reporte Profesional
            </button>
          </div>
          <div class="panel-body no-padding">
            <div v-if="loadingReportes" class="loading-state">
              Cargando reportes clínicos...
            </div>
            <div v-else-if="reportes.length === 0" class="no-data">
              No hay reportes de seguimiento registrados para este animal.
            </div>
            <div v-else class="report-list">
              <div 
                v-for="rep in reportes" 
                :key="rep.id" 
                class="report-row" 
                :class="rep.prioridad"
                @click="openReporteDetail(rep)"
              >
                <div class="report-row-header">
                  <span class="prio-tag" :class="rep.prioridad">{{ rep.prioridad.toUpperCase() }}</span>
                  <span class="report-date">{{ formatDateShort(rep.created_at) }}</span>
                </div>
                <div class="report-row-body">
                  <div class="diag-title">🩺 {{ rep.diagnostico_preliminar }}</div>
                  <div class="diag-obs">Obs: {{ rep.observaciones }}</div>
                </div>
                <div class="report-row-footer">
                  <span class="status-tag" :class="rep.estado">{{ formatEstadoText(rep.estado) }}</span>
                  <span class="author-tag">Por: {{ rep.veterinario?.nombre_completo || 'M.V. Autorizado' }}</span>
                </div>
              </div>
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

      <!-- MODAL DE CREACIÓN DE REPORTE -->
      <div v-if="showCreateReportModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🩺 Generar Reporte Profesional</h3>
            <button class="close-btn" @click="closeCreateReportModal">×</button>
          </div>
          <form @submit.prevent="saveReport">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Diagnóstico Preliminar *</label>
                <input 
                  type="text" 
                  v-model="reportForm.diagnostico_preliminar" 
                  required 
                  placeholder="Ej. Sospecha de parásitos gastrointestinales" 
                  class="form-input" 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Observaciones Clínicas *</label>
                <textarea 
                  v-model="reportForm.observaciones" 
                  required 
                  placeholder="Describe los síntomas observados en el animal..." 
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Recomendaciones / Tratamiento *</label>
                <textarea 
                  v-model="reportForm.recomendaciones" 
                  required 
                  placeholder="Recomendaciones de cuidado, aislamiento o manejo..." 
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Medicamentos Sugeridos / Suplementación (Opcional)</label>
                <input 
                  type="text" 
                  v-model="reportForm.medicamentos_sugeridos" 
                  placeholder="Ej. Albendazol 10% - 10ml vía oral" 
                  class="form-input" 
                />
              </div>

              <div class="form-group-row">
                <div class="form-group flex-1">
                  <label class="form-label">Prioridad *</label>
                  <select v-model="reportForm.prioridad" required class="form-select">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label">Estado *</label>
                  <select v-model="reportForm.estado" required class="form-select">
                    <option value="abierto">Abierto</option>
                    <option value="en_seguimiento">En Seguimiento</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Próxima Revisión Sugerida (Opcional)</label>
                <input 
                  type="datetime-local" 
                  v-model="reportForm.proxima_revision" 
                  class="form-input" 
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="closeCreateReportModal">Cancelar</button>
              <button type="submit" class="submit-btn" :disabled="isSavingReport">
                <span v-if="isSavingReport">Guardando...</span>
                <span v-else>Guardar Reporte</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE DETALLE DE REPORTE -->
      <div v-if="showDetailReportModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🩺 Detalle de Reporte Clínico</h3>
            <button class="close-btn" @click="closeReporteDetail">×</button>
          </div>
          <div class="modal-body" v-if="selectedReporte">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Prioridad</span>
                <span class="value">
                  <span class="prio-tag" :class="selectedReporte.prioridad">{{ selectedReporte.prioridad.toUpperCase() }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="label">Fecha</span>
                <span class="value">{{ formatDate(selectedReporte.created_at) }}</span>
              </div>
            </div>

            <div class="form-group mt-4">
              <label class="form-label">Diagnóstico Preliminar</label>
              <p class="value" style="font-size: 15px; color: #1B5E20; font-weight: 800;">{{ selectedReporte.diagnostico_preliminar }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <p class="value" style="font-weight: 500; font-style: italic; white-space: pre-wrap;">"{{ selectedReporte.observaciones }}"</p>
            </div>

            <div class="form-group">
              <label class="form-label">Recomendaciones</label>
              <p class="value" style="font-weight: 500; white-space: pre-wrap;">{{ selectedReporte.recomendaciones }}</p>
            </div>

            <div class="form-group" v-if="selectedReporte.medicamentos_sugeridos">
              <label class="form-label">Medicamentos Sugeridos</label>
              <p class="value" style="background: #f4f6f0; padding: 10px; border-radius: 8px; border-left: 3px solid #00897b; font-weight: 500;">
                {{ selectedReporte.medicamentos_sugeridos }}
              </p>
            </div>

            <div class="form-group" v-if="selectedReporte.proxima_revision">
              <label class="form-label">Próxima Revisión Sugerida</label>
              <p class="value" style="font-weight: 500;">📅 {{ formatDate(selectedReporte.proxima_revision) }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">Veterinario Responsable</label>
              <p class="value" style="font-size: 13px; color: #5c6e58;">
                {{ selectedReporte.veterinario?.nombre_completo }} ({{ selectedReporte.veterinario?.correo }})
              </p>
            </div>

            <!-- Cambiar estado si es creador -->
            <div 
              class="form-group" 
              v-if="selectedReporte.veterinario_id === currentUserId"
              style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd4c3;"
            >
              <label class="form-label">Actualizar Estado de Seguimiento</label>
              <div style="display: flex; gap: 12px; align-items: center; margin-top: 6px;">
                <select v-model="editForm.estado" class="form-select" style="flex: 1;">
                  <option value="abierto">Abierto</option>
                  <option value="en_seguimiento">En Seguimiento</option>
                  <option value="resuelto">Resuelto</option>
                </select>
                <button 
                  type="button" 
                  class="submit-btn" 
                  @click="updateReportStatus"
                  :disabled="isUpdatingReport"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- TOAST DE NOTIFICACIONES -->
    <ion-toast
      :is-open="toast.show"
      :message="toast.message"
      :color="toast.color"
      :duration="3000"
      @didDismiss="toast.show = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonButtons, IonToast
} from '@ionic/vue';
import { 
  arrowBackOutline, informationCircleOutline, warningOutline,
  timeOutline, imageOutline, medkitOutline, addCircleOutline
} from 'ionicons/icons';
import { animalRepository } from '@/services';

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

// Reportes Clínicos
const reportes = ref<any[]>([]);
const loadingReportes = ref(false);
const showCreateReportModal = ref(false);
const showDetailReportModal = ref(false);
const isSavingReport = ref(false);
const isUpdatingReport = ref(false);
const selectedReporte = ref<any>(null);
const currentUserId = ref<number | null>(null);

const reportForm = ref({
  observaciones: '',
  diagnostico_preliminar: '',
  recomendaciones: '',
  medicamentos_sugeridos: '',
  proxima_revision: '',
  prioridad: 'baja',
  estado: 'abierto'
});

const editForm = ref({
  estado: 'abierto'
});

const toast = ref({
  show: false,
  message: '',
  color: 'success'
});

const showToast = (message: string, color: 'success' | 'danger' = 'success') => {
  toast.value.message = message;
  toast.value.color = color;
  toast.value.show = true;
};

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
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateShort = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

const formatEstadoText = (estado: string): string => {
  const map: Record<string, string> = {
    abierto: 'Abierto',
    en_seguimiento: 'En Seguimiento',
    resuelto: 'Resuelto'
  };
  return map[estado] || estado;
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

const fetchReportes = async () => {
  loadingReportes.value = true;
  try {
    reportes.value = await animalRepository.getReportesVeterinarios(Number(animalId));
  } catch (err: any) {
    console.error('Error al obtener reportes:', err);
  } finally {
    loadingReportes.value = false;
  }
};

const fetchAnimalDetail = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const sessionStr = localStorage.getItem('usuario_sesion');
    let userId = '';
    if (sessionStr) {
      try {
        const parsedSession = JSON.parse(sessionStr);
        userId = parsedSession.id;
        currentUserId.value = Number(parsedSession.id);
      } catch(e) {}
    }
    
    if (!userId) {
      error.value = 'No se encontró una sesión activa.';
      isLoading.value = false;
      return;
    }
    
    const response = await animalRepository.getVeterinarioAnimalDetail(Number(animalId));

    if (response && response.success) {
      animal.value = response.data;
      prepareChartData();
      await fetchReportes();
    }
  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      error.value = 'Acceso denegado. Este animal pertenece a una finca no autorizada para tu perfil.';
    } else {
      error.value = err.message || 'Error al cargar los detalles del animal.';
    }
  } finally {
    isLoading.value = false;
  }
};

const openCreateReportModal = () => {
  reportForm.value = {
    observaciones: '',
    diagnostico_preliminar: '',
    recomendaciones: '',
    medicamentos_sugeridos: '',
    proxima_revision: '',
    prioridad: 'baja',
    estado: 'abierto'
  };
  showCreateReportModal.value = true;
};

const closeCreateReportModal = () => {
  showCreateReportModal.value = false;
};

const saveReport = async () => {
  if (!reportForm.value.observaciones || !reportForm.value.diagnostico_preliminar || !reportForm.value.recomendaciones) {
    showToast('Por favor completa todos los campos requeridos.', 'danger');
    return;
  }

  isSavingReport.value = true;
  try {
    await animalRepository.crearReporteVeterinario({
      animal_id: Number(animalId),
      observaciones: reportForm.value.observaciones,
      diagnostico_preliminar: reportForm.value.diagnostico_preliminar,
      recomendaciones: reportForm.value.recomendaciones,
      medicamentos_sugeridos: reportForm.value.medicamentos_sugeridos || null,
      proxima_revision: reportForm.value.proxima_revision || null,
      prioridad: reportForm.value.prioridad,
      estado: reportForm.value.estado
    });

    showToast('Reporte veterinario guardado con éxito.');
    closeCreateReportModal();
    await fetchReportes();
  } catch (err: any) {
    showToast(err.message || 'Error al registrar el reporte veterinario.', 'danger');
  } finally {
    isSavingReport.value = false;
  }
};

const openReporteDetail = (rep: any) => {
  selectedReporte.value = rep;
  editForm.value.estado = rep.estado;
  showDetailReportModal.value = true;
};

const closeReporteDetail = () => {
  showDetailReportModal.value = false;
  selectedReporte.value = null;
};

const updateReportStatus = async () => {
  if (!selectedReporte.value) return;

  isUpdatingReport.value = true;
  try {
    await animalRepository.actualizarReporteVeterinario(selectedReporte.value.id, {
      estado: editForm.value.estado
    });

    showToast('Estado del reporte actualizado con éxito.');
    closeReporteDetail();
    await fetchReportes();
  } catch (err: any) {
    showToast(err.message || 'Error al actualizar el estado del reporte.', 'danger');
  } finally {
    isUpdatingReport.value = false;
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

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(46, 125, 50, 0.1);
}

.modal-header {
  padding: 16px 20px;
  background: #f4f6f0;
  border-bottom: 1px solid #cbd4c3;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1B5E20;
  font-weight: 800;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #5c6e58;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  padding: 16px 20px;
  background: #f4f6f0;
  border-top: 1px solid #cbd4c3;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #5c6e58;
}

.form-input, .form-select, .form-textarea {
  border: 1px solid #cbd4c3;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: white;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #00897B;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Buttons */
.cancel-btn {
  background: transparent;
  border: 1px solid #cbd4c3;
  color: #5c6e58;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.submit-btn {
  background: #00897B;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vet-action-btn {
  background: #00897B;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 137, 123, 0.15);
  transition: all 0.2s;
}

.vet-action-btn:hover {
  background: #00695c;
}

/* Report list styling */
.report-list {
  display: flex;
  flex-direction: column;
}

.report-row {
  padding: 16px 24px;
  border-bottom: 1px solid #f4f1ea;
  cursor: pointer;
  transition: background 0.2s;
}

.report-row:hover {
  background: #fbfbf9;
}

.report-row:last-child {
  border-bottom: none;
}

.report-row.baja { border-left: 4px solid #455a64; }
.report-row.media { border-left: 4px solid #00897b; }
.report-row.alta { border-left: 4px solid #d97706; }
.report-row.urgente { border-left: 4px solid #c62828; }

.report-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.prio-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.prio-tag.baja { background: #eceff1; color: #455a64; }
.prio-tag.media { background: #e0f2f1; color: #00897b; }
.prio-tag.alta { background: #fff7ed; color: #d97706; }
.prio-tag.urgente { background: #ffebee; color: #c62828; }

.report-date {
  font-size: 12px;
  color: #7c8e78;
}

.report-row-body {
  margin-bottom: 8px;
}

.diag-title {
  font-size: 15px;
  font-weight: 700;
  color: #2c3e2d;
}

.diag-obs {
  font-size: 13px;
  color: #5c6e58;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-row-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.status-tag {
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-tag.abierto { background: #e3f2fd; color: #1565c0; }
.status-tag.en_seguimiento { background: #fffde7; color: #f57f17; }
.status-tag.resuelto { background: #e8f5e9; color: #2e7d32; }

.author-tag {
  color: #7c8e78;
  font-style: italic;
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
