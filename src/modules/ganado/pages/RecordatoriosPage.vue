<template>
  <ion-page>
    <!-- HEADER -->
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <button @click="router.push('/home')" class="back-btn-custom" title="Regresar">
            <span class="back-icon">←</span>
          </button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon">📅</span>
            <span class="app-logo">Recordatorios Sanitarios</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <button @click="runCheck" class="action-header-btn" :disabled="runningCheck" title="Procesar Notificaciones">
            <ion-icon :icon="refreshOutline" :class="{ 'animate-spin': runningCheck }"></ion-icon>
            <span class="btn-text">Verificar Alertas</span>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- CONTENT -->
    <ion-content class="recordatorios-content">
      <div class="page-container">
        
        <!-- INTRO CARD -->
        <div class="intro-card animate-fade-in">
          <div class="intro-text">
            <h2>Gestión Sanitaria</h2>
            <p>Agenda vacunas, desparasitaciones o revisiones médicas. El sistema enviará alertas automáticamente cuando se cumpla la fecha programada.</p>
          </div>
          <button class="add-btn-main" @click="openCreateModal">
            <ion-icon :icon="addOutline"></ion-icon>
            Nuevo Recordatorio
          </button>
        </div>

        <!-- FILTROS -->
        <div class="filter-panel animate-fade-in">
          <div class="status-tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.value" 
              class="tab-btn" 
              :class="{ active: activeTab === tab.value }"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="type-filter">
            <label>Filtrar por tipo:</label>
            <select v-model="filterType" class="filter-select">
              <option value="todos">Todos los tipos</option>
              <option value="vacuna">Vacunación 💉</option>
              <option value="desparasitacion">Desparasitación 💊</option>
              <option value="revision_medica">Revisión Médica 🩺</option>
              <option value="otro">Otro 📋</option>
            </select>
          </div>
        </div>

        <!-- LOADING STATE -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando recordatorios...</p>
        </div>

        <!-- EMPTY STATE -->
        <div v-else-if="filteredRecordatorios.length === 0" class="empty-state animate-fade-in">
          <div class="empty-icon">📅</div>
          <h3>No hay recordatorios</h3>
          <p>No se encontraron recordatorios sanitarios que coincidan con los filtros seleccionados.</p>
          <button class="add-btn-empty" @click="openCreateModal">Crear el primero</button>
        </div>

        <!-- TIMELINE LIST -->
        <div v-else class="timeline-container animate-fade-in">
          <div 
            v-for="rec in filteredRecordatorios" 
            :key="rec.id" 
            class="timeline-card"
            :class="[rec.estado, getOverdueClass(rec)]"
          >
            <!-- Badge de Tipo e Icono -->
            <div class="card-icon-wrapper" :class="rec.tipo">
              <ion-icon :icon="getTypeIcon(rec.tipo)"></ion-icon>
            </div>

            <!-- Contenido principal -->
            <div class="card-content">
              <div class="card-header-row">
                <span class="type-badge" :class="rec.tipo">{{ getTypeLabel(rec.tipo) }}</span>
                <span class="status-date-badge" :class="[rec.estado, getOverdueClass(rec)]">
                  {{ getStatusText(rec) }}
                </span>
              </div>

              <h3 class="card-title" :class="{ completed: rec.estado === 'completado' }">
                {{ rec.titulo }}
              </h3>

              <p v-if="rec.descripcion" class="card-description">
                {{ rec.descripcion }}
              </p>

              <!-- Relaciones Finca / Animal -->
              <div class="card-meta">
                <div v-if="rec.finca" class="meta-item">
                  <ion-icon :icon="homeOutline"></ion-icon>
                  <span>Finca: {{ rec.finca.nombre }}</span>
                </div>
                <div v-if="rec.animal" class="meta-item">
                  <ion-icon :icon="pawOutline"></ion-icon>
                  <span>Bovino: {{ rec.animal.nombre }} (#{{ rec.animal.numero_arete || 'S/A' }})</span>
                </div>
                <div class="meta-item date">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  <span>Programado: <strong>{{ formatDate(rec.fecha_programada) }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="card-actions">
              <!-- Completar Checkbox -->
              <button 
                class="action-btn toggle-status" 
                :class="{ completed: rec.estado === 'completado' }"
                @click="toggleRecordatorioStatus(rec)"
                title="Cambiar estado"
              >
                <ion-icon :icon="rec.estado === 'completado' ? checkmarkCircleOutline : ellipseOutline"></ion-icon>
              </button>

              <div class="action-buttons-group">
                <button class="action-btn edit" @click="openEditModal(rec)" title="Editar">
                  <ion-icon :icon="createOutline"></ion-icon>
                </button>
                <button class="action-btn delete" @click="confirmDelete(rec.id)" title="Eliminar">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- BOTTOM NAV BAR -->
      <BottomNav />
    </ion-content>

    <!-- MODAL CREACIÓN / EDICIÓN -->
    <ion-modal :is-open="modalOpen" @didDismiss="closeModal" class="custom-modal">
      <div class="modal-header">
        <h2>{{ editingId ? 'Editar Recordatorio' : 'Nuevo Recordatorio' }}</h2>
        <button @click="closeModal" class="close-modal-btn">
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="saveRecordatorio">
          <div class="form-group">
            <label class="form-label">Título / Asunto *</label>
            <input 
              type="text" 
              v-model="form.titulo" 
              required 
              placeholder="Ej. Vacuna contra Aftosa, Desparasitación general"
              class="form-input" 
            />
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label class="form-label">Tipo de Evento *</label>
              <select v-model="form.tipo" required class="form-select">
                <option value="vacuna">Vacunación 💉</option>
                <option value="desparasitacion">Desparasitación 💊</option>
                <option value="revision_medica">Revisión Médica 🩺</option>
                <option value="otro">Otro / General 📋</option>
              </select>
            </div>

            <div class="form-group half">
              <label class="form-label">Fecha Programada *</label>
              <input 
                type="date" 
                v-model="form.fecha_programada" 
                required 
                class="form-input" 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Finca (Opcional)</label>
            <select v-model="form.finca_id" class="form-select" @change="onFincaChanged">
              <option :value="null">Ninguna finca</option>
              <option v-for="f in fincas" :key="f.id" :value="f.id">
                {{ f.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Animal / Bovino (Opcional)</label>
            <select v-model="form.animal_id" class="form-select" :disabled="!form.finca_id">
              <option :value="null">Ningún animal (Recordatorio grupal)</option>
              <option v-for="a in filteredAnimals" :key="a.id" :value="a.id">
                {{ a.nombre }} (#{{ a.arete || 'S/A' }}) - {{ a.raza }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Observaciones / Notas adicionales</label>
            <textarea 
              v-model="form.descripcion" 
              rows="3" 
              placeholder="Detalles sobre dosis, lote de medicamento o sintomatología..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group" v-if="editingId">
            <label class="form-label">Estado</label>
            <select v-model="form.estado" class="form-select">
              <option value="pendiente">Pendiente ⏳</option>
              <option value="completado">Completado ✅</option>
            </select>
          </div>

          <button type="submit" class="submit-btn" :disabled="saving">
            <span v-if="saving">Guardando...</span>
            <span v-else>{{ editingId ? 'Actualizar Recordatorio' : 'Crear Recordatorio' }}</span>
          </button>
        </form>
      </div>
    </ion-modal>

    <!-- TOAST -->
    <ion-toast
      :is-open="toast.show"
      :message="toast.message"
      :color="toast.color"
      :duration="3000"
      @didDismiss="toast.show = false"
    ></ion-toast>

    <!-- ALERT CONFIRM DELETE -->
    <ion-alert
      :is-open="alertDelete.show"
      header="Confirmar Eliminación"
      message="¿Estás seguro de que deseas eliminar este recordatorio sanitario? Esta acción no se puede deshacer."
      :buttons="[
        { text: 'Cancelar', role: 'cancel', handler: () => { alertDelete.show = false } },
        { text: 'Eliminar', role: 'destructive', handler: deleteRecordatorio }
      ]"
      @didDismiss="alertDelete.show = false"
    ></ion-alert>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, 
  IonSpinner, IonToast, IonModal, IonAlert
} from '@ionic/vue';
import { 
  addOutline, trashOutline, createOutline, checkmarkCircleOutline, 
  calendarOutline, homeOutline, pawOutline, medkitOutline, refreshOutline,
  closeOutline, ellipseOutline, documentTextOutline, timeOutline
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository } from '@/services';
import type { RecordatorioSanitario } from '@/services/interfaces';

const router = useRouter();

// Listas
const recordatorios = ref<RecordatorioSanitario[]>([]);
const fincas = ref<any[]>([]);
const animals = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const runningCheck = ref(false);

// Tabs y Filtros
const tabs = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Completados', value: 'completado' }
];
const activeTab = ref('todos');
const filterType = ref('todos');

// Modal Form State
const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = ref<any>({
  titulo: '',
  descripcion: '',
  tipo: 'vacuna',
  fecha_programada: '',
  finca_id: null,
  animal_id: null,
  estado: 'pendiente'
});

// Toast
const toast = ref({
  show: false,
  message: '',
  color: 'success'
});

const showToast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
  toast.value.message = message;
  toast.value.color = color;
  toast.value.show = true;
};

// Alert Delete
const alertDelete = ref({
  show: false,
  idToDelete: null as number | null
});

// Filtrado de animales basado en la finca seleccionada en el formulario
const filteredAnimals = computed(() => {
  if (!form.value.finca_id) return [];
  // Laravel repo has animals list, we filter by finca_id
  return animals.value.filter(a => {
    // In our repository model, animals can have a finca_id field or finca object with id
    const animalFincaId = a.finca_id || a.finca?.id;
    return Number(animalFincaId) === Number(form.value.finca_id);
  });
});

// Resetear animal si cambia la finca seleccionada
const onFincaChanged = () => {
  form.value.animal_id = null;
};

// Filtrar la lista principal de recordatorios
const filteredRecordatorios = computed(() => {
  return recordatorios.value.filter(rec => {
    // Filtrar por tab (estado)
    if (activeTab.value !== 'todos' && rec.estado !== activeTab.value) {
      return false;
    }
    // Filtrar por tipo
    if (filterType.value !== 'todos' && rec.tipo !== filterType.value) {
      return false;
    }
    return true;
  });
});

// Obtener datos iniciales
const loadData = async () => {
  loading.value = true;
  try {
    const [recRes, fincasRes, animalsRes] = await Promise.all([
      animalRepository.getRecordatoriosSanitarios(),
      animalRepository.getFincas(),
      animalRepository.getAllAnimals()
    ]);
    recordatorios.value = recRes;
    fincas.value = fincasRes;
    animals.value = animalsRes;
  } catch (err: any) {
    showToast(err.message || 'Error al cargar los datos', 'danger');
  } finally {
    loading.value = false;
  }
};

// Helper clases y textos
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'vacuna': return 'Vacunación';
    case 'desparasitacion': return 'Desparasitación';
    case 'revision_medica': return 'Revisión Médica';
    default: return 'Otro';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'vacuna': return medkitOutline;
    case 'desparasitacion': return timeOutline; // pills or capsule
    case 'revision_medica': return medkitOutline; // Replaced stethoscope with medkit
    default: return documentTextOutline;
  }
};

// Check if a reminder is pending and scheduled for today or earlier (overdue)
const getOverdueClass = (rec: RecordatorioSanitario) => {
  if (rec.estado === 'completado') return '';
  
  const programmedDate = new Date(rec.fecha_programada);
  programmedDate.setHours(23, 59, 59, 999); // end of programmed day
  const today = new Date();
  
  return programmedDate < today ? 'overdue' : 'upcoming';
};

const getStatusText = (rec: RecordatorioSanitario) => {
  if (rec.estado === 'completado') return 'Completado';
  
  const overdueClass = getOverdueClass(rec);
  return overdueClass === 'overdue' ? 'Vencido' : 'Pendiente';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  // dateStr is Y-m-d from Eloquent cast
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Abrir Modales
const openCreateModal = () => {
  editingId.value = null;
  form.value = {
    titulo: '',
    descripcion: '',
    tipo: 'vacuna',
    fecha_programada: new Date().toISOString().split('T')[0],
    finca_id: fincas.value.length > 0 ? fincas.value[0].id : null,
    animal_id: null,
    estado: 'pendiente'
  };
  modalOpen.value = true;
};

const openEditModal = (rec: RecordatorioSanitario) => {
  editingId.value = rec.id;
  form.value = {
    titulo: rec.titulo,
    descripcion: rec.descripcion || '',
    tipo: rec.tipo,
    fecha_programada: rec.fecha_programada,
    finca_id: rec.finca_id || null,
    animal_id: rec.animal_id || null,
    estado: rec.estado
  };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
};

// Guardar Recordatorio
const saveRecordatorio = async () => {
  saving.value = true;
  try {
    const payload = {
      titulo: form.value.titulo,
      descripcion: form.value.descripcion || null,
      tipo: form.value.tipo,
      fecha_programada: form.value.fecha_programada,
      finca_id: form.value.finca_id || null,
      animal_id: form.value.animal_id || null,
      estado: form.value.estado
    };

    if (editingId.value) {
      await animalRepository.actualizarRecordatorioSanitario(editingId.value, payload);
      showToast('Recordatorio actualizado correctamente');
    } else {
      await animalRepository.crearRecordatorioSanitario(payload);
      showToast('Recordatorio creado correctamente');
    }
    
    closeModal();
    await loadData();
  } catch (err: any) {
    showToast(err.message || 'Error al guardar el recordatorio', 'danger');
  } finally {
    saving.value = false;
  }
};

// Toggle Estado
const toggleRecordatorioStatus = async (rec: RecordatorioSanitario) => {
  const nuevoEstado = rec.estado === 'completado' ? 'pendiente' : 'completado';
  try {
    await animalRepository.actualizarRecordatorioSanitario(rec.id, {
      estado: nuevoEstado
    });
    rec.estado = nuevoEstado;
    showToast(nuevoEstado === 'completado' ? 'Recordatorio completado 🎉' : 'Recordatorio marcado como pendiente ⏳');
    
    // Recargar datos para actualizar la UI correctamente
    await loadData();
  } catch (err: any) {
    showToast(err.message || 'Error al actualizar el estado', 'danger');
  }
};

// Confirmar y Eliminar
const confirmDelete = (id: number) => {
  alertDelete.value.idToDelete = id;
  alertDelete.value.show = true;
};

const deleteRecordatorio = async () => {
  if (!alertDelete.value.idToDelete) return;
  
  try {
    await animalRepository.eliminarRecordatorioSanitario(alertDelete.value.idToDelete);
    showToast('Recordatorio eliminado');
    await loadData();
  } catch (err: any) {
    showToast(err.message || 'Error al eliminar el recordatorio', 'danger');
  } finally {
    alertDelete.value.show = false;
    alertDelete.value.idToDelete = null;
  }
};

// Ejecutar Cronjob manual de pruebas
const runCheck = async () => {
  runningCheck.value = true;
  try {
    const res = await animalRepository.runRecordatoriosCheck();
    showToast(res.message || 'Verificación finalizada con éxito', 'success');
    if (res.output) {
      console.log('Cronjob output:', res.output);
    }
  } catch (err: any) {
    showToast(err.message || 'Error al ejecutar la verificación', 'danger');
  } finally {
    runningCheck.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.recordatorios-content {
  --background: #f4f6f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  --min-height: 70px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0 12px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon { font-size: 24px; }
.app-logo { font-weight: 800; color: #1B5E20; letter-spacing: -0.5px; font-size: 18px; }

.back-btn-custom {
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #1B5E20;
  cursor: pointer;
  padding: 8px 12px;
}

.action-header-btn {
  background: #eaf0e6;
  border: none;
  border-radius: 12px;
  color: #2E7D32;
  font-weight: 700;
  font-size: 12px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.action-header-btn:active {
  background: #dce7d7;
  transform: scale(0.95);
}

.action-header-btn ion-icon {
  font-size: 16px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .btn-text {
    display: none;
  }
  .action-header-btn {
    padding: 10px;
    border-radius: 50%;
  }
}

/* Page Shell Container */
.page-container {
  padding: 20px 16px 100px;
  max-width: 500px;
  margin: 0 auto;
}

/* Intro Card */
.intro-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro-text h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 850;
  color: #1B5E20;
}

.intro-text p {
  margin: 0;
  font-size: 12px;
  color: #5c6e58;
  line-height: 1.5;
}

.add-btn-main {
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(46, 125, 50, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.add-btn-main:active {
  transform: scale(0.97);
}

.add-btn-main ion-icon {
  font-size: 18px;
}

/* Filtros */
.filter-panel {
  background: white;
  border-radius: 20px;
  padding: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-tabs {
  display: flex;
  background: #f4f6f0;
  padding: 4px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #5c6e58;
  font-size: 12px;
  font-weight: 700;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: white;
  color: #1B5E20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.type-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.type-filter label {
  font-size: 11px;
  font-weight: 700;
  color: #1B5E20;
}

.filter-select {
  border: 1px solid #c0c5b1;
  background: #fdfdfd;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #2c3e2d;
  outline: none;
}

/* Loading & Empty States */
.loading-state {
  text-align: center;
  padding: 40px 0;
  color: #5c6e58;
}

.loading-state p {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  background: white;
  border-radius: 24px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 14px;
}

.empty-state h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
}

.empty-state p {
  margin: 0 0 20px;
  font-size: 12px;
  color: #5c6e58;
  line-height: 1.5;
}

.add-btn-empty {
  background: #eaf0e6;
  border: none;
  color: #2E7D32;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

/* Timeline Cards */
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  display: flex;
  gap: 14px;
  position: relative;
  transition: all 0.25s ease;
}

/* Overdue card border/background alert indicator */
.timeline-card.overdue {
  border-left: 5px solid #d32f2f;
}

.timeline-card.completado {
  opacity: 0.75;
  background: #fdfdfd;
}

.card-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  align-self: flex-start;
}

.card-icon-wrapper.vacuna { background: #eaf8eb; color: #2E7D32; }
.card-icon-wrapper.desparasitacion { background: #e3f2fd; color: #1976d2; }
.card-icon-wrapper.revision_medica { background: #fce4ec; color: #c2185b; }
.card-icon-wrapper.otro { background: #fff3e0; color: #f57c00; }

.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
}

.type-badge.vacuna { background: #eaf8eb; color: #2E7D32; }
.type-badge.desparasitacion { background: #e3f2fd; color: #1976d2; }
.type-badge.revision_medica { background: #fce4ec; color: #c2185b; }
.type-badge.otro { background: #fff3e0; color: #f57c00; }

.status-date-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}

.status-date-badge.completado { background: #eaf8eb; color: #2E7D32; }
.status-date-badge.overdue { background: #ffebee; color: #c2185b; }
.status-date-badge.upcoming { background: #f1f3ee; color: #5c6e58; }

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
  line-height: 1.3;
}

.card-title.completed {
  text-decoration: line-through;
  color: #8c9c89;
}

.card-description {
  margin: 0;
  font-size: 11px;
  color: #5c6e58;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid #f4f6f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #5c6e58;
}

.meta-item ion-icon {
  font-size: 13px;
  color: #2E7D32;
}

.meta-item.date ion-icon {
  color: #c2185b;
}

.meta-item.date.overdue ion-icon {
  color: #d32f2f;
}

/* Card Actions styling */
.card-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  border-left: 1px solid #f4f6f0;
  padding-left: 12px;
  flex-shrink: 0;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-btn.toggle-status {
  font-size: 22px;
  color: #c0c5b1;
  padding: 4px;
}

.action-btn.toggle-status.completed {
  color: #2E7D32;
}

.action-buttons-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-btn.edit { color: #2E7D32; }
.action-btn.edit:active { background: #eaf0e6; }
.action-btn.delete { color: #d32f2f; }
.action-btn.delete:active { background: #ffebee; }

/* Modal styling */
.custom-modal {
  --border-radius: 24px;
  --height: auto;
  --max-height: 90%;
  --width: 90%;
  --max-width: 440px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #f4f6f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 850;
  color: #1B5E20;
}

.close-modal-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #5c6e58;
  cursor: pointer;
  display: flex;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

/* Form controls */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.form-label {
  font-size: 11px;
  font-weight: 700;
  color: #1B5E20;
}

.form-input, .form-select, .form-textarea {
  border: 1px solid #c0c5b1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: #fdfdfd;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #2E7D32;
  background: white;
}

.form-textarea {
  resize: vertical;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
  margin-top: 10px;
  transition: all 0.2s ease;
}

.submit-btn:disabled {
  opacity: 0.7;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
