<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start" class="mobile-only">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon desktop-only">🐄</span>
            <span class="app-logo desktop-only">BovWeight CR</span>
            <span class="badge-vet desktop-only">VETERINARIO</span>
            <span class="mobile-title mobile-only">Reportes Médicos</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar vet">
              {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'V' }}
            </div>
            <div class="user-info desktop-only">
              <span class="name">{{ usuarioSesion?.nombre_completo || 'Ana Veterinaria' }}</span>
              <span class="role" style="font-size: 10px; color: #7c8e76;">{{ usuarioSesion?.usuario || 'veterinario@test.com' }}</span>
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
            <a @click.prevent="router.push('/veterinario')" class="nav-item">
              <ion-icon :icon="medkitOutline"></ion-icon>
              <span>Panel Clínico</span>
            </a>
            <a @click.prevent="router.push('/veterinario/animales')" class="nav-item">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Animales Asignados</span>
            </a>
            <a @click.prevent="router.push('/veterinario/agenda')" class="nav-item">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>Agenda de Visitas</span>
            </a>
            <a @click.prevent="router.push('/veterinario/reportes')" class="nav-item active">
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>Reportes Médicos</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="content-header">
            <div>
              <h1 class="page-title">Historial de Reportes Médicos</h1>
              <p class="page-subtitle">Visualiza y actualiza el seguimiento de tus diagnósticos profesionales</p>
            </div>
          </div>

          <!-- FILTERS CARD -->
          <div class="filters-card">
            <div class="search-box">
              <input 
                type="text" 
                v-model="search" 
                placeholder="Buscar por animal, arete o ganadero..." 
                class="form-input search-input" 
              />
            </div>
            <div class="filter-options">
              <div class="filter-group">
                <label class="filter-label">Prioridad</label>
                <select v-model="filterPriority" class="form-select">
                  <option value="all">Todas</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Estado</label>
                <select v-model="filterStatus" class="form-select">
                  <option value="all">Todos</option>
                  <option value="abierto">Abiertos</option>
                  <option value="en_seguimiento">En Seguimiento</option>
                  <option value="resuelto">Resueltos</option>
                </select>
              </div>
            </div>
          </div>

          <!-- LOADING STATE -->
          <div v-if="isLoading" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando reportes médicos...</p>
          </div>

          <!-- EMPTY STATE -->
          <div v-else-if="filteredReports.length === 0" class="empty-state">
            <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
            <h3>No se encontraron reportes</h3>
            <p>Intenta ajustar tus criterios de búsqueda o filtros.</p>
          </div>

          <!-- REPORT GRID -->
          <div v-else class="report-grid">
            <div 
              v-for="rep in filteredReports" 
              :key="rep.id" 
              class="report-card" 
              :class="rep.prioridad"
              @click="openReporteDetail(rep)"
            >
              <div class="report-card-header">
                <span class="prio-tag" :class="rep.prioridad">{{ rep.prioridad.toUpperCase() }}</span>
                <span class="date">{{ formatDateShort(rep.created_at) }}</span>
              </div>
              
              <div class="report-card-body">
                <h4 class="animal-name">🐄 {{ rep.animal?.nombre || 'Animal' }} <small>#{{ rep.animal?.numero_arete }}</small></h4>
                <p class="diagnostico">{{ rep.diagnostico_preliminar }}</p>
                <p class="ganadero"><strong>Ganadero:</strong> {{ rep.ganadero?.nombre_completo }}</p>
                <p class="observaciones">{{ rep.observaciones }}</p>
              </div>

              <div class="report-card-footer">
                <span class="status-tag" :class="rep.estado">{{ formatEstadoText(rep.estado) }}</span>
                <span class="read-more">Ver detalles &rarr;</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- DETAIL MODAL -->
      <div v-if="showDetailModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🩺 Detalle de Reporte Clínico</h3>
            <button class="close-btn" @click="closeReporteDetail">×</button>
          </div>
          <div class="modal-body" v-if="selectedReporte">
            <div class="info-grid-2">
              <div class="info-item">
                <span class="label">Animal</span>
                <span class="value">🐄 {{ selectedReporte.animal?.nombre }} (#{{ selectedReporte.animal?.numero_arete }})</span>
              </div>
              <div class="info-item">
                <span class="label">Finca</span>
                <span class="value">🏡 {{ selectedReporte.finca?.nombre }}</span>
              </div>
              <div class="info-item">
                <span class="label">Ganadero</span>
                <span class="value">👤 {{ selectedReporte.ganadero?.nombre_completo }}</span>
              </div>
              <div class="info-item">
                <span class="label">Fecha</span>
                <span class="value">📅 {{ formatDate(selectedReporte.created_at) }}</span>
              </div>
            </div>

            <div class="form-group mt-4">
              <label class="form-label">Diagnóstico Preliminar</label>
              <p class="value-highlight">{{ selectedReporte.diagnostico_preliminar }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <p class="value-text">"{{ selectedReporte.observaciones }}"</p>
            </div>

            <div class="form-group">
              <label class="form-label">Recomendaciones</label>
              <p class="value-text">{{ selectedReporte.recomendaciones }}</p>
            </div>

            <div class="form-group" v-if="selectedReporte.medicamentos_sugeridos">
              <label class="form-label">Medicamentos Sugeridos</label>
              <p class="value-box">
                {{ selectedReporte.medicamentos_sugeridos }}
              </p>
            </div>

            <div class="form-group" v-if="selectedReporte.proxima_revision">
              <label class="form-label">Próxima Revisión Sugerida</label>
              <p class="value-text">📅 {{ formatDate(selectedReporte.proxima_revision) }}</p>
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
                  :disabled="isUpdating"
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonButtons, IonSpinner, IonToast
} from '@ionic/vue';
import {
  medkitOutline, pawOutline, calendarOutline, documentTextOutline,
  arrowBackOutline, logOutOutline
} from 'ionicons/icons';
import { animalRepository } from '@/services';

const router = useRouter();

const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  router.push('/login');
};

const reports = ref<any[]>([]);
const isLoading = ref(true);
const isUpdating = ref(false);

const search = ref('');
const filterPriority = ref('all');
const filterStatus = ref('all');

const showDetailModal = ref(false);
const selectedReporte = ref<any>(null);
const currentUserId = ref<number | null>(null);

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

const goBack = () => {
  router.push('/veterinario');
};

const loadSession = () => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  if (sessionStr) {
    try {
      const parsedSession = JSON.parse(sessionStr);
      currentUserId.value = Number(parsedSession.id);
    } catch(e) {}
  }
};

const fetchReports = async () => {
  isLoading.value = true;
  try {
    reports.value = await animalRepository.getReportesVeterinarios();
  } catch (err: any) {
    console.error('Error al cargar reportes:', err);
    showToast('Error al cargar reportes médicos.', 'danger');
  } finally {
    isLoading.value = false;
  }
};

const filteredReports = computed(() => {
  return reports.value.filter(r => {
    const term = search.value.toLowerCase().trim();
    const matchesSearch = !term || 
      (r.animal?.nombre || '').toLowerCase().includes(term) ||
      (r.animal?.numero_arete || '').toLowerCase().includes(term) ||
      (r.ganadero?.nombre_completo || '').toLowerCase().includes(term) ||
      (r.diagnostico_preliminar || '').toLowerCase().includes(term);
    
    const matchesPriority = filterPriority.value === 'all' || r.prioridad === filterPriority.value;
    const matchesStatus = filterStatus.value === 'all' || r.estado === filterStatus.value;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });
});

const openReporteDetail = (rep: any) => {
  selectedReporte.value = rep;
  editForm.value.estado = rep.estado;
  showDetailModal.value = true;
};

const closeReporteDetail = () => {
  showDetailModal.value = false;
  selectedReporte.value = null;
};

const updateReportStatus = async () => {
  if (!selectedReporte.value) return;

  isUpdating.value = true;
  try {
    await animalRepository.actualizarReporteVeterinario(selectedReporte.value.id, {
      estado: editForm.value.estado
    });

    showToast('Estado del reporte actualizado con éxito.');
    closeReporteDetail();
    await fetchReports();
  } catch (err: any) {
    showToast(err.message || 'Error al actualizar el estado del reporte.', 'danger');
  } finally {
    isUpdating.value = false;
  }
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

onMounted(() => {
  loadSession();
  fetchReports();
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.brand { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 26px; }
.app-logo { font-weight: 800; color: #2c3e2d; font-size: 20px; }
.badge-vet {
  background: linear-gradient(135deg, #c0c5b1, #8ba888);
  color: #2c3e2d; font-size: 10px; font-weight: 800;
  padding: 4px 10px; border-radius: 8px;
}

.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar.vet {
  background: #8ba888; color: white; border-radius: 12px;
  width: 38px; height: 38px; display: flex; align-items: center;
  justify-content: center; font-weight: 700;
}
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 700; color: #2c3e2d; }
.user-info .role { font-size: 10px; color: #7c8e76; }

.dashboard-layout { display: flex; height: 100%; min-height: calc(100vh - 60px); }

/* SIDEBAR */
.sidebar {
  width: 260px; background: #FFFFFF; border-right: 1px solid #e2dcd0;
  padding: 24px 16px; display: flex; flex-direction: column;
}
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border-radius: 14px; text-decoration: none; color: #5c6e58;
  font-weight: 600; transition: all 0.2s ease; cursor: pointer;
}
.nav-item:hover { background: #f4f1ea; color: #2c3e2d; }
.nav-item.active { background: #fdfbf7; color: #8ba888; }
.nav-item ion-icon { font-size: 22px; }

/* MAIN CONTENT */
.main-content {
  flex: 1; padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 6px;
}

.page-subtitle {
  font-size: 14px;
  color: #5c6e58;
  margin: 0;
}

/* FILTERS CARD */
.filters-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-end;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.02);
}

.search-box {
  flex: 1;
}

.filter-options {
  display: flex;
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 140px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #5c6e58;
}

.form-input, .form-select {
  border: 1px solid #cbd4c3;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: white;
  transition: border-color 0.2s;
  width: 100%;
}

.form-input:focus, .form-select:focus {
  border-color: #8ba888;
}

/* REPORT GRID */
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.report-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
}

.report-card.baja { border-left: 4px solid #455a64; }
.report-card.media { border-left: 4px solid #00897b; }
.report-card.alta { border-left: 4px solid #d97706; }
.report-card.urgente { border-left: 4px solid #c62828; }

.report-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prio-tag {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

.prio-tag.baja { background: #eceff1; color: #455a64; }
.prio-tag.media { background: #e0f2f1; color: #00897b; }
.prio-tag.alta { background: #fff7ed; color: #d97706; }
.prio-tag.urgente { background: #ffebee; color: #c62828; }

.date {
  font-size: 11px;
  color: #7c8e78;
}

.report-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.animal-name {
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0;
}

.animal-name small {
  color: #7c8e78;
  font-weight: 500;
}

.diagnostico {
  font-size: 14px;
  font-weight: 700;
  color: #1B5E20;
  margin: 2px 0 0;
}

.ganadero {
  font-size: 12px;
  color: #5c6e58;
  margin: 0;
}

.observaciones {
  font-size: 12.5px;
  color: #5c6e58;
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f4f1ea;
  padding-top: 10px;
}

.status-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.status-tag.abierto { background: #e3f2fd; color: #1565c0; }
.status-tag.en_seguimiento { background: #fffde7; color: #f57f17; }
.status-tag.resuelto { background: #e8f5e9; color: #2e7d32; }

.read-more {
  font-size: 11px;
  font-weight: 700;
  color: #2e7d32;
}

/* MODAL OVERLAY */
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

/* Info Grid Modal */
.info-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background: #f4f6f0;
  padding: 16px;
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 10px;
  color: #5c6e58;
  font-weight: 600;
  text-transform: uppercase;
}

.value {
  font-size: 13.5px;
  color: #2c3e2d;
  font-weight: 700;
  margin-top: 2px;
}

.value-highlight {
  font-size: 15px;
  color: #1B5E20;
  font-weight: 800;
  margin: 0;
}

.value-text {
  font-size: 13.5px;
  color: #2c3e2d;
  margin: 0;
  font-weight: 500;
}

.value-box {
  background: #f4f6f0;
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #00897b;
  font-weight: 500;
  font-size: 13.5px;
  color: #2c3e2d;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #5c6e58;
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

/* Loading & Empty states */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #5c6e58;
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.02);
}

.empty-icon {
  font-size: 48px;
  color: #8ba888;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 13px;
  color: #7c8e78;
  margin: 0;
}

@media (min-width: 769px) { .mobile-only { display: none !important; } }
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .main-content { padding: 16px; }
  .filters-card {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-options {
    justify-content: space-between;
  }
  .filter-group {
    flex: 1;
  }
  .info-grid-2 {
    grid-template-columns: 1fr;
  }
}
.logout-btn { --color: #5c6e58; }
</style>
