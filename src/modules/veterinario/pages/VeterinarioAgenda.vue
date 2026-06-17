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
            <span class="mobile-title mobile-only">Agenda de Citas</span>
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
        <!-- Sidebar Navigation (Desktop only) -->
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
            <a @click.prevent="router.push('/veterinario/agenda')" class="nav-item active">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>Agenda de Visitas</span>
            </a>
            <a @click.prevent="router.push('/veterinario/reportes')" class="nav-item">
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>Reportes Médicos</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Agenda de Citas</h1>
              <p class="page-subtitle">Gestiona tu calendario de visitas, solicitudes de ganaderos y propuestas de inspección</p>
            </div>
            <button class="primary-btn" @click="openProposeVisitModal">
              <ion-icon :icon="addOutline"></ion-icon>
              PROPONER VISITA
            </button>
          </div>

          <!-- FILTERS & TABS GRID -->
          <div class="agenda-layout-grid">
            <!-- Left side: Calendar status list -->
            <div class="agenda-list-section">
              <!-- Custom Segment Controls -->
              <div class="custom-segments">
                <button 
                  v-for="status in ['todos', 'pendiente', 'aceptada', 'rechazada', 'completada', 'propuesta_veterinario']" 
                  :key="status"
                  class="segment-btn"
                  :class="{ active: activeTab === status }"
                  @click="activeTab = status"
                >
                  {{ formatStatusText(status) }}
                </button>
              </div>

              <!-- Quick filters -->
              <div class="filters-row">
                <div class="search-box">
                  <ion-icon :icon="searchOutline"></ion-icon>
                  <input type="text" v-model="searchQuery" placeholder="Buscar por ganadero o motivo..." />
                </div>
                <div class="filter-box">
                  <select v-model="selectedFinca">
                    <option value="">Todas las fincas</option>
                    <option v-for="f in uniqueFincas" :key="f.id" :value="f.id">
                      {{ f.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- LOADING STATE -->
              <div v-if="loading" class="state-message">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Cargando agenda...</p>
              </div>

              <!-- EMPTY STATE -->
              <div v-else-if="filteredCitas.length === 0" class="state-message">
                <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
                <p>No se encontraron citas en esta categoría.</p>
              </div>

              <!-- CITAS CARDS GRID -->
              <div v-else class="citas-grid">
                <div 
                  v-for="c in filteredCitas" 
                  :key="c.id" 
                  class="cita-card"
                  :class="[c.estado, { selected: selectedCita?.id === c.id }]"
                  @click="selectCita(c)"
                >
                  <div class="cita-header">
                    <span class="status-badge" :class="c.estado">{{ formatStatusText(c.estado).toUpperCase() }}</span>
                    <span class="cita-time">📅 {{ formatDate(c.fecha) }} &middot; {{ c.hora }}</span>
                  </div>
                  <div class="cita-body">
                    <h4>{{ c.ganadero?.nombre_completo }}</h4>
                    <p class="meta-desc">🏡 Finca: <strong>{{ c.finca?.nombre }}</strong></p>
                    <p v-if="c.animal" class="meta-desc">🐄 Animal: <strong>{{ c.animal?.nombre }} (Arete: {{ c.animal?.numero_arete }})</strong></p>
                    <p class="motivo-snippet">"{{ c.motivo }}"</p>
                  </div>
                  <div class="cita-footer">
                    <span>Ver Detalles</span>
                    <ion-icon :icon="chevronForwardOutline"></ion-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right side: Detail Panel (Desktop only, or shown as modal/sheet on mobile) -->
            <div class="agenda-detail-section desktop-only">
              <div v-if="!selectedCita" class="no-selection-panel">
                <ion-icon :icon="calendarOutline" class="soon-icon"></ion-icon>
                <h3>Detalle de la Cita</h3>
                <p>Selecciona una cita de la lista de la izquierda para ver toda la información, consultar expedientes y aplicar acciones (aceptar, rechazar o reprogramar).</p>
              </div>

              <div v-else class="detail-panel-card animate-fade-in">
                <div class="panel-header-custom">
                  <h3>Detalle de Cita #{{ selectedCita.id }}</h3>
                  <span class="status-badge" :class="selectedCita.estado">{{ formatStatusText(selectedCita.estado).toUpperCase() }}</span>
                </div>

                <div class="panel-body-custom">
                  <div class="info-group">
                    <label>Ganadero solicitante</label>
                    <p class="value-title">{{ selectedCita.ganadero?.nombre_completo }}</p>
                    <p class="value-sub">{{ selectedCita.ganadero?.correo }}</p>
                  </div>

                  <div class="info-group">
                    <label>Finca</label>
                    <p class="value-text">🏡 {{ selectedCita.finca?.nombre }}</p>
                    <p class="value-sub">{{ selectedCita.finca?.ubicacion }}</p>
                  </div>

                  <div class="info-group" v-if="selectedCita.animal">
                    <label>Animal Asociado</label>
                    <p class="value-text">🐄 {{ selectedCita.animal?.nombre }} (Arete: {{ selectedCita.animal?.numero_arete }})</p>
                    <p class="value-sub">Raza: {{ selectedCita.animal?.raza?.nombre || 'Brahman' }}</p>
                    <button class="expediente-btn" @click="goToAnimalDetail(selectedCita.animal.id)">
                      Ver expediente clínico
                    </button>
                  </div>

                  <div class="info-group">
                    <label>Fecha & Hora</label>
                    <p class="value-text font-bold">📅 {{ formatDate(selectedCita.fecha) }} a las {{ selectedCita.hora }}</p>
                  </div>

                  <div class="info-group">
                    <label>Motivo de la Consulta</label>
                    <p class="motivo-quote">"{{ selectedCita.motivo }}"</p>
                  </div>

                  <div class="info-group" v-if="selectedCita.comentario_rechazo">
                    <label>Comentario de Rechazo</label>
                    <p class="rejection-comment">"{{ selectedCita.comentario_rechazo }}"</p>
                  </div>
                </div>

                <!-- ACTIONS FOOTER -->
                <div class="panel-actions-footer" v-if="selectedCita.estado === 'pendiente' || selectedCita.estado === 'propuesta_veterinario'">
                  <!-- Cuando la cita la solicita el ganadero -->
                  <template v-if="selectedCita.estado === 'pendiente'">
                    <button class="action-btn accept-btn" @click="updateCitaEstado('aceptada')">
                      Aceptar Solicitud
                    </button>
                    <button class="action-btn reject-btn-action" @click="openRejectDialog">
                      Rechazar
                    </button>
                    <button class="action-btn reschedule-btn" @click="openRescheduleDialog">
                      Reprogramar
                    </button>
                  </template>

                  <!-- Cuando la cita está como propuesta por el veterinario y espera al ganadero -->
                  <template v-else-if="selectedCita.estado === 'propuesta_veterinario'">
                    <div class="waiting-notice">
                      ⏳ Esperando confirmación o respuesta del ganadero.
                    </div>
                    <button class="action-btn reject-btn-action" @click="updateCitaEstado('rechazada', 'Cancelada por el veterinario')">
                      Cancelar Propuesta
                    </button>
                  </template>
                </div>
                
                <div class="panel-actions-footer" v-else-if="selectedCita.estado === 'aceptada'">
                  <button class="action-btn complete-btn" @click="updateCitaEstado('completada')">
                    Marcar como Completada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>

    <!-- MOBILE DIALOG SHEET FOR CITA DETAILS -->
    <div v-if="showMobileDetailModal && selectedCita" class="modal-overlay animate-fade-in mobile-only">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Detalle de Cita #{{ selectedCita.id }}</h3>
          <button class="close-btn" @click="showMobileDetailModal = false">×</button>
        </div>
        <div class="modal-body scrollable-modal-body">
          <div class="status-badge-container">
            <span class="status-badge" :class="selectedCita.estado">{{ formatStatusText(selectedCita.estado).toUpperCase() }}</span>
          </div>

          <div class="info-group">
            <label>Ganadero</label>
            <p class="value-title">{{ selectedCita.ganadero?.nombre_completo }}</p>
            <p class="value-sub">{{ selectedCita.ganadero?.correo }}</p>
          </div>

          <div class="info-group">
            <label>Finca</label>
            <p class="value-text">🏡 {{ selectedCita.finca?.nombre }}</p>
          </div>

          <div class="info-group" v-if="selectedCita.animal">
            <label>Animal Asociado</label>
            <p class="value-text">🐄 {{ selectedCita.animal?.nombre }} (Arete: {{ selectedCita.animal?.numero_arete }})</p>
            <button class="expediente-btn" @click="goToAnimalDetail(selectedCita.animal.id)">
              Ver expediente clínico
            </button>
          </div>

          <div class="info-group">
            <label>Fecha & Hora</label>
            <p class="value-text font-bold">📅 {{ formatDate(selectedCita.fecha) }} &middot; {{ selectedCita.hora }}</p>
          </div>

          <div class="info-group">
            <label>Motivo</label>
            <p class="motivo-quote">"{{ selectedCita.motivo }}"</p>
          </div>

          <div class="info-group" v-if="selectedCita.comentario_rechazo">
            <label>Comentario de Rechazo</label>
            <p class="rejection-comment">"{{ selectedCita.comentario_rechazo }}"</p>
          </div>
        </div>

        <div class="modal-footer" v-if="selectedCita.estado === 'pendiente' || selectedCita.estado === 'propuesta_veterinario'">
          <template v-if="selectedCita.estado === 'pendiente'">
            <button class="action-btn accept-btn" @click="updateCitaEstadoMobile('aceptada')">Aceptar</button>
            <button class="action-btn reject-btn-action" @click="openRejectDialogMobile">Rechazar</button>
            <button class="action-btn reschedule-btn" @click="openRescheduleDialogMobile">Reprogramar</button>
          </template>
          <template v-else>
            <button class="action-btn reject-btn-action" @click="updateCitaEstadoMobile('rechazada', 'Cancelada por el veterinario')">Cancelar</button>
          </template>
        </div>
        <div class="modal-footer" v-else-if="selectedCita.estado === 'aceptada'">
          <button class="action-btn complete-btn" @click="updateCitaEstadoMobile('completada')">Completar</button>
        </div>
      </div>
    </div>

    <!-- REJECT COMMENT DIALOG -->
    <div v-if="showRejectDialog" class="modal-overlay animate-fade-in z-index-top">
      <div class="modal-card">
        <div class="modal-header">
          <h3>🩺 Rechazar Cita</h3>
          <button class="close-btn" @click="showRejectDialog = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Por favor escribe el motivo del rechazo (Opcional):</label>
            <textarea 
              v-model="rejectComment" 
              placeholder="Ej: No tengo disponibilidad a esa hora / La finca queda fuera de mi zona de cobertura..." 
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="showRejectDialog = false">Cancelar</button>
          <button type="button" class="action-btn reject-btn" @click="confirmReject">Confirmar Rechazo</button>
        </div>
      </div>
    </div>

    <!-- RESCHEDULE DIALOG -->
    <div v-if="showRescheduleDialog" class="modal-overlay animate-fade-in z-index-top">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📅 Reprogramar Cita</h3>
          <button class="close-btn" @click="showRescheduleDialog = false">×</button>
        </div>
        <form @submit.prevent="confirmReschedule">
          <div class="modal-body">
            <p class="reschedule-info">Selecciona una nueva fecha y hora propuesta. Esto se le enviará al Ganadero para su aprobación.</p>
            <div class="form-group">
              <label class="form-label">Nueva Fecha *</label>
              <input type="date" v-model="rescheduleForm.fecha" required class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Nueva Hora *</label>
              <input type="time" v-model="rescheduleForm.hora" required class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="showRescheduleDialog = false">Cancelar</button>
            <button type="submit" class="submit-btn">Proponer Nueva Fecha</button>
          </div>
        </form>
      </div>
    </div>

    <!-- PROPOSE VISIT DIALOG (Flujo Inverso) -->
    <div v-if="showProposeVisitModal" class="modal-overlay animate-fade-in z-index-top">
      <div class="modal-card">
        <div class="modal-header">
          <h3>🩺 Proponer Nueva Visita</h3>
          <button class="close-btn" @click="closeProposeVisitModal">×</button>
        </div>
        <form @submit.prevent="saveProposedVisit">
          <div class="modal-body scrollable-modal-body">
            <p class="reschedule-info">Propón una visita a un ganadero sobre una de tus fincas autorizadas. El ganadero deberá aprobar la propuesta.</p>
            
            <div class="form-group">
              <label class="form-label">Finca Autorizada *</label>
              <select v-model="proposalForm.finca_id" required class="form-select" @change="onProposalFincaChange">
                <option value="" disabled>Selecciona una finca...</option>
                <option v-for="f in fincas" :key="f.id" :value="f.id">
                  {{ f.nombre }} (Propietario: {{ f.propietario?.nombre_completo || 'Ganadero' }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Animal Específico (Opcional)</label>
              <select v-model="proposalForm.animal_id" class="form-select" :disabled="!proposalForm.finca_id">
                <option :value="null">Ninguno (Revisión general de finca)</option>
                <option v-for="a in proposalAnimalOptions" :key="a.id" :value="a.id">
                  {{ a.nombre }} (Arete: {{ a.arete }})
                </option>
              </select>
            </div>

            <div class="form-group-row">
              <div class="form-group flex-1">
                <label class="form-label">Fecha Propuesta *</label>
                <input type="date" v-model="proposalForm.fecha" required class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Hora Propuesta *</label>
                <input type="time" v-model="proposalForm.hora" required class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Motivo Sugerido de Inspección *</label>
              <select v-model="proposalForm.motivo" required class="form-select">
                <option value="" disabled>Selecciona un motivo...</option>
                <option value="Revisión general">Revisión general</option>
                <option value="Inspección por pérdida de peso">Inspección por pérdida de peso</option>
                <option value="Variación anormal de peso">Variación anormal de peso</option>
                <option value="Vacunación / Control sanitario">Vacunación / Control sanitario</option>
                <option value="Consulta y seguimiento clínico">Consulta y seguimiento clínico</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="closeProposeVisitModal">Cancelar</button>
            <button type="submit" class="submit-btn" :disabled="savingProposal">
              <span v-if="savingProposal">Enviando propuesta...</span>
              <span v-else>Enviar Propuesta</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TOAST NOTIFICATIONS -->
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
  addOutline, arrowBackOutline, searchOutline, chevronForwardOutline, logOutOutline
} from 'ionicons/icons';
import { animalRepository } from '@/services';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

const router = useRouter();
const usuarioSesion = ref<any>(null);

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  router.push('/login');
};

// Variables de estado
const citas = ref<any[]>([]);
const fincas = ref<any[]>([]);
const animals = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedFinca = ref('');

// Pestañas e interfaz
const activeTab = ref<string>('pendiente');
const selectedCita = ref<any>(null);

// Control de Modales
const showMobileDetailModal = ref(false);
const showRejectDialog = ref(false);
const showRescheduleDialog = ref(false);
const showProposeVisitModal = ref(false);

const savingProposal = ref(false);
const rejectComment = ref('');

const rescheduleForm = ref({
  fecha: '',
  hora: ''
});

const proposalForm = ref({
  finca_id: '',
  animal_id: null as number | null,
  fecha: '',
  hora: '',
  motivo: ''
});

// Toast
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

// Cargar sesión
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {}
}

// Cargar datos del servidor
async function loadAgendaData() {
  loading.value = true;
  try {
    citas.value = await animalRepository.getCitas();
    fincas.value = await animalRepository.getFincas();
    animals.value = await animalRepository.getAllAnimals();
  } catch (e) {
    console.error('Error al cargar agenda:', e);
    showToast('Error al cargar datos de la agenda.', 'danger');
  } finally {
    loading.value = false;
  }
}

async function silentLoad() {
  try {
    const updatedCitas = await animalRepository.getCitas();
    citas.value = updatedCitas;
    if (selectedCita.value) {
      const up = updatedCitas.find(c => c.id === selectedCita.value.id);
      if (up) {
        selectedCita.value = up;
      }
    }
  } catch (e) {}
}

// Configurar refresco automático cada 10 segundos
useAutoRefresh(silentLoad, 10000);

onMounted(() => {
  loadAgendaData();
});

const goBack = () => {
  router.push('/veterinario');
};

const goToAnimalDetail = (id: number) => {
  router.push(`/veterinario/animal/${id}`);
  showMobileDetailModal.value = false;
};

// Selectores reactivos
const uniqueFincas = computed(() => {
  return fincas.value;
});

const proposalAnimalOptions = computed(() => {
  if (!proposalForm.value.finca_id) return [];
  return animals.value.filter(a => a.finca_id === Number(proposalForm.value.finca_id));
});

// Filtrar citas reactivamente
const filteredCitas = computed(() => {
  return citas.value.filter(c => {
    // Filtro por pestaña de estado
    const matchesTab = activeTab.value === 'todos' || c.estado === activeTab.value;
    
    // Filtro por Finca
    const matchesFinca = !selectedFinca.value || c.finca_id === Number(selectedFinca.value);
    
    // Filtro por búsqueda de texto
    const q = searchQuery.value.toLowerCase().trim();
    const matchesSearch = !q || 
      (c.ganadero?.nombre_completo || '').toLowerCase().includes(q) ||
      (c.motivo || '').toLowerCase().includes(q);
      
    return matchesTab && matchesFinca && matchesSearch;
  });
});

// Selección de citas (Móvil vs Escritorio)
const selectCita = (cita: any) => {
  selectedCita.value = cita;
  // En móvil abrimos modal sheet
  if (window.innerWidth <= 768) {
    showMobileDetailModal.value = true;
  }
};

// ACCIONES: Aceptar/Completar cita
const updateCitaEstado = async (nuevoEstado: string, comentario?: string) => {
  if (!selectedCita.value) return;
  try {
    const payload: any = { estado: nuevoEstado };
    if (comentario) payload.comentario_rechazo = comentario;
    
    const res = await animalRepository.actualizarCita(selectedCita.value.id, payload);
    selectedCita.value = res.cita;
    showToast(`Cita actualizada a estado ${formatStatusText(nuevoEstado)}.`);
    
    // Recargar citas locales
    citas.value = await animalRepository.getCitas();
  } catch (e: any) {
    showToast(e.message || 'Error al actualizar cita.', 'danger');
  }
};

const updateCitaEstadoMobile = async (nuevoEstado: string, comentario?: string) => {
  await updateCitaEstado(nuevoEstado, comentario);
  showMobileDetailModal.value = false;
};

// ACCIONES: Rechazar cita (con modal de comentario)
const openRejectDialog = () => {
  rejectComment.value = '';
  showRejectDialog.value = true;
};

const openRejectDialogMobile = () => {
  showMobileDetailModal.value = false;
  openRejectDialog();
};

const confirmReject = async () => {
  if (!selectedCita.value) return;
  showRejectDialog.value = false;
  await updateCitaEstado(
    'rechazada', 
    rejectComment.value.trim() ? rejectComment.value.trim() : 'Rechazada por el veterinario'
  );
};

// ACCIONES: Reprogramar cita
const openRescheduleDialog = () => {
  if (!selectedCita.value) return;
  rescheduleForm.value = {
    fecha: selectedCita.value.fecha,
    hora: selectedCita.value.hora
  };
  showRescheduleDialog.value = true;
};

const openRescheduleDialogMobile = () => {
  showMobileDetailModal.value = false;
  openRescheduleDialog();
};

const confirmReschedule = async () => {
  if (!selectedCita.value || !rescheduleForm.value.fecha || !rescheduleForm.value.hora) return;
  showRescheduleDialog.value = false;
  try {
    const res = await animalRepository.actualizarCita(selectedCita.value.id, {
      fecha: rescheduleForm.value.fecha,
      hora: rescheduleForm.value.hora,
      estado: 'propuesta_veterinario' // Pasa a propuesta esperando aprobación del ganadero
    });
    selectedCita.value = res.cita;
    showToast('Propuesta de reprogramación enviada al ganadero.');
    citas.value = await animalRepository.getCitas();
  } catch (e: any) {
    showToast(e.message || 'Error al reprogramar la cita.', 'danger');
  }
};

// ACCIONES: Proponer Visita (Flujo Inverso)
const openProposeVisitModal = () => {
  proposalForm.value = {
    finca_id: '',
    animal_id: null,
    fecha: '',
    hora: '',
    motivo: ''
  };
  showProposeVisitModal.value = true;
};

const closeProposeVisitModal = () => {
  showProposeVisitModal.value = false;
};

const onProposalFincaChange = () => {
  proposalForm.value.animal_id = null;
};

const saveProposedVisit = async () => {
  if (!proposalForm.value.finca_id || !proposalForm.value.fecha || !proposalForm.value.hora || !proposalForm.value.motivo) {
    showToast('Por favor completa todos los campos requeridos.', 'danger');
    return;
  }

  const selectedFincaObj = fincas.value.find(f => f.id === Number(proposalForm.value.finca_id));
  if (!selectedFincaObj) return;

  savingProposal.value = true;
  try {
    await animalRepository.crearCita({
      veterinario_id: usuarioSesion.value.id,
      finca_id: Number(proposalForm.value.finca_id),
      animal_id: proposalForm.value.animal_id ? Number(proposalForm.value.animal_id) : null,
      fecha: proposalForm.value.fecha,
      hora: proposalForm.value.hora,
      motivo: proposalForm.value.motivo,
      estado: 'propuesta_veterinario'
    });

    showToast('Propuesta de visita enviada al ganadero correctamente.');
    closeProposeVisitModal();
    activeTab.value = 'propuesta_veterinario';
    citas.value = await animalRepository.getCitas();
  } catch (e: any) {
    showToast(e.message || 'Error al proponer visita.', 'danger');
  } finally {
    savingProposal.value = false;
  }
};

// Formatos
const formatStatusText = (status: string): string => {
  const map: Record<string, string> = {
    todos: 'Todas',
    pendiente: 'Pendientes',
    aceptada: 'Aceptadas',
    rechazada: 'Rechazadas',
    completada: 'Completadas',
    propuesta_veterinario: 'Propuestas'
  };
  return map[status] || status;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};
</script>

<style scoped>
.dashboard-content {
  --background: #f4f1ea; /* Rust/beige layout */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Header */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  --min-height: 70px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
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
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 700; color: #2c3e2d; }
.user-info .role { font-size: 11px; color: #5c6e58; }

.dashboard-layout { display: flex; height: 100%; }

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
.nav-item icon-icon { font-size: 22px; }

/* MAIN CONTENT */
.main-content {
  flex: 1; padding: 32px; overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-title {
  font-size: 30px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 6px;
  letter-spacing: -1px;
}

.page-subtitle { font-size: 14px; color: #5c6e58; margin: 0; font-weight: 500; }

.primary-btn {
  background: linear-gradient(135deg, #8ba888, #556b2f);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 6px 15px -5px rgba(139, 168, 136, 0.4);
}

/* AGENDA LAYOUT GRID */
.agenda-layout-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
  align-items: start;
}

@media(max-width: 992px) {
  .agenda-layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Left list section */
.agenda-list-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-segments {
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  padding: 4px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.02);
  overflow-x: auto;
  scrollbar-width: none;
}

.custom-segments::-webkit-scrollbar { display: none; }

.segment-btn {
  flex-shrink: 0;
  background: transparent;
  border: none;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 800;
  color: #5c6e58;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.segment-btn.active {
  background: white;
  color: #2c3e2d;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* Filters */
.filters-row {
  display: flex;
  gap: 12px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  padding: 0 12px;
}

.search-box ion-icon {
  color: #8ba888;
  font-size: 18px;
  margin-right: 8px;
}

.search-box input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 0;
  outline: none;
  font-size: 13px;
  color: #2c3e2d;
}

.filter-box select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2dcd0;
  background: white;
  outline: none;
  font-size: 13px;
  color: #2c3e2d;
  cursor: pointer;
  height: 100%;
  min-width: 160px;
}

/* Citas List cards */
.citas-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cita-card {
  background: white;
  border-radius: 18px;
  padding: 16px;
  border: 1px solid #e2dcd0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cita-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.03);
}

.cita-card.selected {
  border-color: #8ba888;
  background: #fdfbf7;
}

.cita-card.pendiente { border-left: 4px solid #d97706; }
.cita-card.aceptada { border-left: 4px solid #2e7d32; }
.cita-card.rechazada { border-left: 4px solid #c62828; }
.cita-card.completada { border-left: 4px solid #455a64; }
.cita-card.propuesta_veterinario { border-left: 4px solid #00897b; }

.cita-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
}

.status-badge.pendiente { background: #fff7ed; color: #d97706; }
.status-badge.aceptada { background: #eaf8eb; color: #2e7d32; }
.status-badge.rechazada { background: #ffebee; color: #c62828; }
.status-badge.completada { background: #eceff1; color: #455a64; }
.status-badge.propuesta_veterinario { background: #e0f2f1; color: #00897b; }

.cita-time {
  font-size: 11px;
  color: #7a8a73;
  font-weight: 600;
}

.cita-body h4 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: #2c3e2d;
}

.meta-desc {
  font-size: 11px;
  color: #5c6e58;
  margin: 0 0 2px;
}

.motivo-snippet {
  font-size: 12px;
  color: #5c6e58;
  font-style: italic;
  margin: 4px 0 0;
  background: #fcfbf9;
  padding: 6px 10px;
  border-radius: 8px;
}

.cita-footer {
  border-top: 1px solid #f4f1ea;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8ba888;
  font-weight: 700;
}

.cita-footer ion-icon { font-size: 14px; }

/* Right detail panel */
.agenda-detail-section {
  position: sticky;
  top: 16px;
}

.no-selection-panel {
  background: white;
  border-radius: 24px;
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed #c0c5b1;
  color: #5c6e58;
}

.soon-icon {
  font-size: 48px;
  color: #8ba888;
  margin-bottom: 16px;
}

.no-selection-panel h3 {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 8px;
}

.no-selection-panel p {
  font-size: 12px;
  line-height: 1.5;
  max-width: 300px;
  margin: 0 auto;
}

.detail-panel-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.02);
  border: 1px solid #e2dcd0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header-custom {
  padding: 20px 24px;
  border-bottom: 1px solid #f4f1ea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header-custom h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
}

.panel-body-custom {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 55vh;
  overflow-y: auto;
}

.info-group label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #8a9883;
  display: block;
  margin-bottom: 4px;
}

.value-title {
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0;
}

.value-text {
  font-size: 13px;
  font-weight: 700;
  color: #2c3e2d;
  margin: 0;
}

.value-sub {
  font-size: 11px;
  color: #7a8a73;
  margin: 1px 0 0;
}

.font-bold { font-weight: 800; color: #00897b; }

.motivo-quote {
  font-size: 13px;
  font-style: italic;
  color: #5c6e58;
  background: #fbfbf9;
  padding: 10px 14px;
  border-radius: 12px;
  margin: 0;
  border-left: 3px solid #8ba888;
}

.rejection-comment {
  font-size: 12px;
  color: #c62828;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 0;
}

.expediente-btn {
  margin-top: 8px;
  background: #f0f5f0;
  color: #2e7d32;
  border: 1px solid #a3cfa3;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
}

.panel-actions-footer {
  padding: 16px 24px;
  border-top: 1px solid #f4f1ea;
  background: #fdfbf7;
  display: flex;
  gap: 10px;
}

.waiting-notice {
  font-size: 11px;
  font-weight: 700;
  color: #00897b;
  flex: 1;
}

.action-btn {
  flex: 1;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.action-btn.accept-btn {
  background: #2e7d32;
  color: white;
}

.action-btn.reject-btn-action {
  background: #ffebee;
  color: #c62828;
}

.action-btn.reschedule-btn {
  background: white;
  border: 1px solid #c0c5b1;
  color: #5c6e58;
}

.action-btn.complete-btn {
  background: #455a64;
  color: white;
}

.state-message {
  padding: 40px;
  text-align: center;
  color: #5c6e58;
}

.empty-icon { font-size: 32px; margin-bottom: 8px; color: #8ba888; }

/* MODALS */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(18, 28, 18, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media(min-width: 576px) {
  .modal-overlay {
    align-items: center;
    padding: 16px;
  }
}

.modal-card {
  background: white;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  width: 100%;
  max-height: 85vh;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media(min-width: 576px) {
  .modal-card {
    border-radius: 24px;
    max-width: 440px;
    max-height: 75vh;
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f2f4ee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #2c3e2d;
}

.close-btn {
  background: #f0f3eb;
  border: none;
  font-size: 22px;
  color: #5c6e58;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.scrollable-modal-body {
  max-height: calc(85vh - 140px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-badge-container {
  margin-bottom: 16px;
}

/* Forms */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group-row {
  display: flex;
  gap: 12px;
}

.flex-1 { flex: 1; }

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e2d;
}

.form-input {
  border: 1px solid #cbd4c3;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: #fdfdfd;
}

.form-textarea {
  border: 1px solid #cbd4c3;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: #fdfdfd;
  resize: vertical;
}

.form-select {
  background: white;
  border: 1px solid #cbd4c3;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #2c3e2d;
  outline: none;
  width: 100%;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f2f4ee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fdfdfd;
}

.cancel-btn {
  background: transparent;
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #5c6e58;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(135deg, #8ba888, #556b2f);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
}

.reschedule-info {
  font-size: 12px;
  color: #5c6e58;
  margin-bottom: 16px;
  line-height: 1.4;
}

.z-index-top { z-index: 2000 !important; }

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (min-width: 769px) { .mobile-only { display: none !important; } }
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .main-content { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .page-title { font-size: 24px; }
  .filters-row { flex-direction: column; }
  .filter-box select { width: 100%; }
}
.logout-btn { --color: #5c6e58; }
</style>
