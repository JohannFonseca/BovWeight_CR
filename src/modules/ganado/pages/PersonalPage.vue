<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🩺</span>
            <span class="app-logo">Personal Técnico</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="personal-content">
      <div class="page-container">
        <!-- PAGE HEADER -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Médicos Veterinarios</h1>
            <p class="page-subtitle">Administra los accesos y permisos del personal en tus fincas</p>
          </div>
          <button 
            v-if="usuarioSesion?.rol === 'ganadero' || usuarioSesion?.rol === 'admin'" 
            class="primary-btn" 
            @click="openAddVetModal"
          >
            <ion-icon :icon="addOutline"></ion-icon>
            NUEVO VET
          </button>
        </div>

        <!-- SEARCH BAR -->
        <div class="search-bar-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por nombre o correo..." 
            class="search-input"
          />
        </div>

        <!-- LOADING STATE -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando lista de veterinarios...</p>
        </div>

        <!-- EMPTY STATE -->
        <div v-else-if="filteredVeterinarios.length === 0" class="empty-state animate-fade-in">
          <span class="empty-icon">🩺</span>
          <h3>No se encontraron veterinarios</h3>
          <p>No hay veterinarios registrados, o no coinciden con los términos de búsqueda.</p>
        </div>

        <!-- VETERINARIOS LIST -->
        <div v-else class="vet-list-container animate-fade-in">
          <div 
            v-for="v in filteredVeterinarios" 
            :key="v.id" 
            class="vet-mobile-card"
            @click="openDetailModal(v)"
          >
            <div class="vet-card-header">
              <div class="vet-avatar">
                {{ v.nombre_completo ? v.nombre_completo.charAt(0).toUpperCase() : 'V' }}
              </div>
              <div class="vet-meta">
                <div class="vet-name-row">
                  <h3>{{ v.nombre_completo }}</h3>
                  <span class="status-indicator" :class="v.activo ? 'active' : 'inactive'"></span>
                </div>
                <span class="vet-email">{{ v.correo }}</span>
              </div>
              <ion-icon :icon="eyeOutline" class="view-details-icon"></ion-icon>
            </div>
            
            <div class="vet-card-stats">
              <div class="stat-box">
                <span class="stat-num">{{ v.fincas_count || 0 }}</span>
                <span class="stat-label">Fincas</span>
              </div>
              <div class="stat-box">
                <span class="stat-num">{{ v.animales_count || 0 }}</span>
                <span class="stat-label">Animales Autorizados</span>
              </div>
              <div class="stat-box">
                <span class="status-badge-inline" :class="v.activo ? 'active' : 'inactive'">
                  {{ v.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM NAV BAR -->
      <BottomNav />
    </ion-content>

    <!-- MODAL 1: CREAR VETERINARIO -->
    <div v-if="showAddVetModal" class="modal-overlay animate-fade-in">
      <div class="modal-card">
        <div class="modal-header">
          <h3>🩺 Nuevo Veterinario</h3>
          <button class="close-btn" @click="closeAddVetModal">×</button>
        </div>
        <form @submit.prevent="saveVeterinario">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre Completo *</label>
              <input 
                type="text" 
                v-model="vetForm.nombre_completo" 
                required 
                placeholder="Ej. Dr. Carlos Mendoza" 
                class="form-input" 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Correo Electrónico *</label>
              <input 
                type="email" 
                v-model="vetForm.correo" 
                required 
                placeholder="Ej. carlos@bovweight.com" 
                class="form-input" 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Contraseña *</label>
              <input 
                type="password" 
                v-model="vetForm.contrasena" 
                required 
                placeholder="Mínimo 4 caracteres"
                class="form-input" 
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="closeAddVetModal">Cancelar</button>
            <button type="submit" class="submit-btn" :disabled="saving">
              <span v-if="saving">Guardando...</span>
              <span v-else>Guardar Veterinario</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: DETALLE Y CONTROL DE ACCESO DEL VETERINARIO -->
    <div v-if="showDetailModal" class="modal-overlay animate-fade-in">
      <div class="modal-card detail-modal-card">
        <div class="modal-header">
          <h3>🩺 Perfil Veterinario</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        
        <div class="modal-body scrollable-modal-body">
          <!-- Vet Profile Summary -->
          <div class="vet-profile-summary">
            <div class="vet-avatar large-avatar">
              {{ selectedVet.nombre_completo ? selectedVet.nombre_completo.charAt(0).toUpperCase() : 'V' }}
            </div>
            <h2>{{ selectedVet.nombre_completo }}</h2>
            <p class="vet-email">{{ selectedVet.correo }}</p>
            
            <!-- Active Toggle -->
            <div class="toggle-container">
              <span class="toggle-label">Estado de Acceso:</span>
              <button 
                class="toggle-switch" 
                :class="{ 'switch-active': selectedVet.activo }" 
                @click="toggleVetStatus"
                :disabled="statusUpdating"
              >
                <span class="switch-handle"></span>
              </button>
              <span class="toggle-status-text" :class="selectedVet.activo ? 'text-active' : 'text-inactive'">
                {{ selectedVet.activo ? 'Permitido' : 'Bloqueado' }}
              </span>
            </div>
          </div>

          <hr class="divider" />

          <!-- Assigned Fincas list -->
          <div class="section-title-row">
            <h4>Fincas Asignadas ({{ selectedVet.fincas?.length || 0 }})</h4>
          </div>

          <div v-if="!selectedVet.fincas || selectedVet.fincas.length === 0" class="no-assignments">
            <ion-icon :icon="businessOutline" class="empty-asg-icon"></ion-icon>
            <p>Este veterinario no tiene fincas asignadas todavía.</p>
          </div>

          <div v-else class="assigned-fincas-list">
            <div v-for="fa in selectedVet.fincas" :key="fa.id" class="assigned-finca-card">
              <div class="asg-info">
                <h5>{{ fa.nombre }}</h5>
                <span class="auth-count">
                  {{ fa.animales_autorizados ? fa.animales_autorizados.length : 0 }} animales autorizados
                </span>
              </div>
              <div class="asg-actions">
                <button 
                  class="action-btn-outline" 
                  @click="openPermissionsModal(fa)"
                  title="Configurar ganado autorizado"
                >
                  <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                  Ganado
                </button>
                <button 
                  class="action-btn-danger" 
                  @click="revokeFinca(fa.id)"
                  title="Revocar acceso"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Finca Assignment form -->
          <div class="assign-new-finca-box">
            <h5>Asignar Nueva Finca</h5>
            <div class="assign-input-group">
              <select v-model="selectedFincaToAssign" class="form-select">
                <option value="" disabled>Seleccione una finca...</option>
                <option 
                  v-for="f in availableFincas" 
                  :key="f.id" 
                  :value="f.id"
                >
                  {{ f.nombre }}
                </option>
              </select>
              <button 
                class="assign-btn" 
                @click="assignFinca"
                :disabled="!selectedFincaToAssign || assigningFinca"
              >
                <span v-if="assigningFinca">...</span>
                <span v-else>Asignar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: CONFIGURAR GANADO AUTORIZADO -->
    <div v-if="showPermissionsModal" class="modal-overlay animate-fade-in z-index-top">
      <div class="modal-card permissions-modal-card">
        <div class="modal-header">
          <div>
            <h3>🛡️ Permisos de Ganado</h3>
            <p class="modal-subtitle">Finca: {{ selectedFincaForPermissions?.nombre }}</p>
          </div>
          <button class="close-btn" @click="closePermissionsModal">×</button>
        </div>

        <div class="modal-body scrollable-modal-body flex-column-body">
          <p class="perm-help-text">
            Selecciona qué animales de la finca podrá visualizar el médico veterinario:
          </p>

          <!-- Select All / Deselect All Row -->
          <div class="select-all-row">
            <button type="button" class="link-btn" @click="selectAllAnimals">Autorizar Todos</button>
            <button type="button" class="link-btn text-red" @click="deselectAllAnimals">Quitar Todos</button>
          </div>

          <!-- Animal list checklist -->
          <div class="animal-checklist">
            <div 
              v-for="a in fincaAnimals" 
              :key="a.id" 
              class="animal-checklist-item"
              :class="{ 'item-checked': selectedAnimalIds.includes(a.id) }"
              @click="toggleAnimalSelection(a.id)"
            >
              <div class="checkbox-box">
                <span class="checkbox-custom" :class="{ checked: selectedAnimalIds.includes(a.id) }">
                  <span v-if="selectedAnimalIds.includes(a.id)" class="checkmark-stem"></span>
                  <span v-if="selectedAnimalIds.includes(a.id)" class="checkmark-kick"></span>
                </span>
              </div>
              <div class="animal-info-row">
                <div class="animal-head">
                  <span class="animal-tag">Arete: {{ a.arete || 'N/A' }}</span>
                  <span class="animal-gender-badge" :class="a.sexo || 'macho'">
                    {{ a.sexo === 'hembra' ? '♀️' : '♂️' }}
                  </span>
                </div>
                <div class="animal-details">
                  <strong>{{ a.nombre || 'Sin nombre' }}</strong>
                  <span class="animal-sub">{{ a.raza }} &middot; {{ a.edad }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="closePermissionsModal">Cancelar</button>
          <button 
            type="button" 
            class="submit-btn" 
            @click="saveCattlePermissions"
            :disabled="savingPermissions"
          >
            <span v-if="savingPermissions">Guardando...</span>
            <span v-else>Guardar Permisos</span>
          </button>
        </div>
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
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonSpinner, IonIcon, IonToast
} from '@ionic/vue';
import { 
  addOutline, businessOutline, shieldCheckmarkOutline, 
  trashOutline, eyeOutline 
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository } from '@/services';
import { useAutoRefresh } from '@/composables/useAutoRefresh';

// Datos de la sesión actual
const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

// Variables de estado
const veterinarios = ref<any[]>([]);
const fincas = ref<any[]>([]);
const animals = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

// Modales
const showAddVetModal = ref(false);
const showDetailModal = ref(false);
const showPermissionsModal = ref(false);

const saving = ref(false);
const statusUpdating = ref(false);
const assigningFinca = ref(false);
const savingPermissions = ref(false);

// Formularios
const vetForm = ref({
  nombre_completo: '',
  correo: '',
  contrasena: ''
});

// Veterinario seleccionado
const selectedVet = ref<any>(null);
const selectedFincaToAssign = ref<string>('');

// Permisos de ganado
const selectedFincaForPermissions = ref<any>(null);
const selectedAnimalIds = ref<number[]>([]);

// Toast de notificaciones
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

// Cargar veterinarios asociados al ganadero actual
async function loadVeterinarios() {
  loading.value = true;
  try {
    const data = await animalRepository.getVeterinariosGanadero();
    veterinarios.value = data;
  } catch (e) {
    console.error('Error al cargar veterinarios del ganadero:', e);
    showToast('Error al cargar veterinarios.', 'danger');
  } finally {
    loading.value = false;
  }
}

// Cargar fincas y animales para selectores de asignación
async function loadFincasAndAnimals() {
  try {
    fincas.value = await animalRepository.getFincas();
    animals.value = await animalRepository.getAllAnimals();
  } catch (e) {
    console.error('Error al cargar fincas o animales:', e);
  }
}

async function silentLoad() {
  try {
    const data = await animalRepository.getVeterinariosGanadero();
    veterinarios.value = data;
    
    // Si el modal de detalle del veterinario está abierto, refrescar también sus datos reactivos
    if (showDetailModal.value && selectedVet.value) {
      const updatedVet = data.find((v: any) => v.id === selectedVet.value.id);
      if (updatedVet) {
        selectedVet.value = { ...updatedVet };
      }
    }
  } catch (e) {
    console.error('[PersonalPage] Error al actualizar silenciosamente en background:', e);
  }
}

// Configurar refresco automático cada 15 segundos en segundo plano (silencioso)
useAutoRefresh(silentLoad, 15000);

// Inicialización
onMounted(() => {
  loadVeterinarios();
  loadFincasAndAnimals();
});

// Filtrar veterinarios según búsqueda
const filteredVeterinarios = computed(() => {
  if (!searchQuery.value.trim()) return veterinarios.value;
  const query = searchQuery.value.toLowerCase();
  return veterinarios.value.filter(v => 
    (v.nombre_completo || '').toLowerCase().includes(query) ||
    (v.correo || '').toLowerCase().includes(query)
  );
});

// Fincas disponibles para asignar (aquellas que el vet no tiene asignadas aún)
const availableFincas = computed(() => {
  if (!selectedVet.value || !fincas.value) return [];
  const assignedIds = (selectedVet.value.fincas || []).map((f: any) => f.id);
  return fincas.value.filter(f => !assignedIds.includes(f.id));
});

// Animales de la finca seleccionada para configurar permisos
const fincaAnimals = computed(() => {
  if (!selectedFincaForPermissions.value || !animals.value) return [];
  return animals.value.filter(a => a.finca_id === selectedFincaForPermissions.value.id);
});

// ACCIONES: Crear Veterinario
const openAddVetModal = () => {
  vetForm.value = {
    nombre_completo: '',
    correo: '',
    contrasena: ''
  };
  showAddVetModal.value = true;
};

const closeAddVetModal = () => {
  showAddVetModal.value = false;
};

const saveVeterinario = async () => {
  if (vetForm.value.contrasena.length < 4) {
    showToast('La contraseña debe tener al menos 4 caracteres.', 'danger');
    return;
  }
  
  saving.value = true;
  try {
    const roles = await animalRepository.getRoles();
    const vetRole = roles.find((r: any) => r.nombre === 'veterinario');
    if (!vetRole) {
      throw new Error('El rol de veterinario no está registrado en el sistema.');
    }

    await animalRepository.crearUsuario({
      nombre_completo: vetForm.value.nombre_completo,
      correo: vetForm.value.correo,
      contrasena: vetForm.value.contrasena,
      rol_id: vetRole.id,
      ganadero_id: usuarioSesion.value?.id || null
    });

    showToast('Veterinario registrado con éxito.');
    closeAddVetModal();
    await loadVeterinarios();
  } catch (e: any) {
    showToast(e.message || 'Error al guardar veterinario.', 'danger');
  } finally {
    saving.value = false;
  }
};

// ACCIONES: Detalle y Asignar Fincas
const openDetailModal = (vet: any) => {
  selectedVet.value = { ...vet };
  selectedFincaToAssign.value = '';
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedVet.value = null;
};

// Activar / Desactivar Veterinario
const toggleVetStatus = async () => {
  if (!selectedVet.value) return;
  statusUpdating.value = true;
  try {
    await animalRepository.toggleEstadoVeterinario(selectedVet.value.id);
    selectedVet.value.activo = !selectedVet.value.activo;
    
    // Actualizar en la lista local
    const idx = veterinarios.value.findIndex(v => v.id === selectedVet.value.id);
    if (idx !== -1) {
      veterinarios.value[idx].activo = selectedVet.value.activo;
    }
    
    showToast(`Estado del veterinario actualizado.`);
  } catch (e: any) {
    showToast(e.message || 'Error al actualizar estado.', 'danger');
  } finally {
    statusUpdating.value = false;
  }
};

// Asignar Finca
const assignFinca = async () => {
  if (!selectedVet.value || !selectedFincaToAssign.value) return;
  assigningFinca.value = true;
  try {
    const fincaId = Number(selectedFincaToAssign.value);
    await animalRepository.asignarFincaVeterinario({
      veterinario_id: selectedVet.value.id,
      finca_id: fincaId
    });

    // Recargar datos locales
    await loadVeterinarios();
    
    // Actualizar modal local
    const updatedVet = veterinarios.value.find(v => v.id === selectedVet.value.id);
    if (updatedVet) {
      selectedVet.value = { ...updatedVet };
    }
    
    selectedFincaToAssign.value = '';
    showToast('Finca asignada correctamente.');
  } catch (e: any) {
    showToast(e.message || 'Error al asignar finca.', 'danger');
  } finally {
    assigningFinca.value = false;
  }
};

// Revocar Finca
const revokeFinca = async (fincaId: number) => {
  if (!selectedVet.value) return;
  try {
    await animalRepository.revocarFincaVeterinario(selectedVet.value.id, fincaId);
    
    // Recargar datos locales
    await loadVeterinarios();
    
    // Actualizar modal local
    const updatedVet = veterinarios.value.find(v => v.id === selectedVet.value.id);
    if (updatedVet) {
      selectedVet.value = { ...updatedVet };
    }
    
    showToast('Acceso a la finca revocado.');
  } catch (e: any) {
    showToast(e.message || 'Error al revocar acceso.', 'danger');
  }
};

// ACCIONES: Configurar Permisos Ganado
const openPermissionsModal = (fincaAssignment: any) => {
  selectedFincaForPermissions.value = fincaAssignment;
  // Clonar animales autorizados actuales
  selectedAnimalIds.value = [...(fincaAssignment.animales_autorizados || [])];
  showPermissionsModal.value = true;
};

const closePermissionsModal = () => {
  showPermissionsModal.value = false;
  selectedFincaForPermissions.value = null;
  selectedAnimalIds.value = [];
};

const toggleAnimalSelection = (animalId: number) => {
  const index = selectedAnimalIds.value.indexOf(animalId);
  if (index > -1) {
    selectedAnimalIds.value.splice(index, 1);
  } else {
    selectedAnimalIds.value.push(animalId);
  }
};

const selectAllAnimals = () => {
  selectedAnimalIds.value = fincaAnimals.value.map(a => a.id);
};

const deselectAllAnimals = () => {
  selectedAnimalIds.value = [];
};

const saveCattlePermissions = async () => {
  if (!selectedVet.value || !selectedFincaForPermissions.value) return;
  savingPermissions.value = true;
  try {
    await animalRepository.guardarPermisosVeterinario({
      veterinario_id: selectedVet.value.id,
      finca_id: selectedFincaForPermissions.value.id,
      animales_ids: selectedAnimalIds.value
    });

    // Recargar datos locales
    await loadVeterinarios();
    
    // Actualizar modal local
    const updatedVet = veterinarios.value.find(v => v.id === selectedVet.value.id);
    if (updatedVet) {
      selectedVet.value = { ...updatedVet };
    }

    closePermissionsModal();
    showToast('Permisos de ganado actualizados correctamente.');
  } catch (e: any) {
    showToast(e.message || 'Error al actualizar permisos.', 'danger');
  } finally {
    savingPermissions.value = false;
  }
};
</script>

<style scoped>
.personal-content {
  --background: #f4f6f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
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

.logo-icon { font-size: 26px; }
.app-logo { font-weight: 800; color: #1B5E20; letter-spacing: -0.5px; font-size: 20px; }

/* Page Shell Container */
.page-container {
  padding: 20px 16px 100px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 900;
  color: #1B5E20;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 13px;
  color: #5c6e58;
  margin: 0;
  font-weight: 500;
  line-height: 1.4;
}

.primary-btn {
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
  transition: transform 0.2s ease;
  white-space: nowrap;
}

.primary-btn:active {
  transform: scale(0.96);
}

/* Search Bar */
.search-bar-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  border: 1px solid #c0c5b1;
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #2E7D32;
  box-shadow: 0 4px 15px rgba(46, 125, 50, 0.08);
}

/* Loading & Empty States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #5c6e58;
}

.empty-state {
  background: white;
  border-radius: 24px;
  padding: 40px 24px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 17px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 13px;
  color: #5c6e58;
  margin: 0 auto;
  max-width: 300px;
  line-height: 1.5;
}

/* Vet list container */
.vet-list-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.vet-mobile-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  padding: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.vet-mobile-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
}

.vet-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.vet-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eaf0e6 0%, #d8e6d1 100%);
  color: #1B5E20;
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.05);
  flex-shrink: 0;
}

.vet-meta {
  flex-grow: 1;
  min-width: 0;
}

.vet-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vet-name-row h3 {
  font-size: 15px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.active { background-color: #2e7d32; }
.status-indicator.inactive { background-color: #c62828; }

.vet-email {
  font-size: 12px;
  color: #7a8a73;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.view-details-icon {
  font-size: 18px;
  color: #8fa086;
}

.vet-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f2f4ee;
  padding-top: 12px;
  gap: 8px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-size: 14px;
  font-weight: 800;
  color: #2e7d32;
}

.stat-label {
  font-size: 10px;
  font-weight: 600;
  color: #8a9883;
}

.status-badge-inline {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
}

.status-badge-inline.active {
  background: #eaf8eb;
  color: #2e7d32;
}

.status-badge-inline.inactive {
  background: #ffebee;
  color: #c62828;
}

/* MODAL OVERLAYS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(18, 28, 18, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: flex-end; /* Mobile bottom sheet style */
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

.detail-modal-card {
  max-height: 90vh;
}

@media(min-width: 576px) {
  .detail-modal-card {
    max-width: 500px;
  }
}

.permissions-modal-card {
  max-height: 92vh;
}

@media(min-width: 576px) {
  .permissions-modal-card {
    max-width: 480px;
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
  font-size: 17px;
  font-weight: 900;
  color: #1B5E20;
}

.modal-subtitle {
  font-size: 12px;
  color: #6d7e68;
  margin: 2px 0 0;
  font-weight: 500;
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
  line-height: 1;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.scrollable-modal-body {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.flex-column-body {
  display: flex;
  flex-direction: column;
}

/* Vet Profile Summary Inside Modal */
.vet-profile-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0;
}

.large-avatar {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  font-size: 28px;
  margin-bottom: 12px;
}

.vet-profile-summary h2 {
  font-size: 18px;
  font-weight: 900;
  color: #1B5E20;
  margin: 0 0 4px;
}

.vet-profile-summary .vet-email {
  font-size: 13px;
  color: #6a7c64;
  margin-bottom: 14px;
}

/* Switch Styles */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f7f9f4;
  padding: 8px 16px;
  border-radius: 16px;
  border: 1px solid #e2e7da;
}

.toggle-label {
  font-size: 12px;
  font-weight: 700;
  color: #4a5c46;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #cbd4c3;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 0;
}

.toggle-switch:focus {
  outline: none;
}

.switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-active {
  background-color: #2e7d32;
}

.switch-active .switch-handle {
  transform: translateX(20px);
}

.toggle-status-text {
  font-size: 12px;
  font-weight: 800;
}

.toggle-status-text.text-active { color: #2e7d32; }
.toggle-status-text.text-inactive { color: #c62828; }

.divider {
  border: 0;
  height: 1px;
  background: #e2e7da;
  margin: 20px 0;
}

/* Assigned Fincas List */
.section-title-row {
  margin-bottom: 14px;
}

.section-title-row h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1B5E20;
}

.no-assignments {
  text-align: center;
  padding: 24px 12px;
  background: #fbfcf9;
  border-radius: 16px;
  border: 1px dashed #c0c5b1;
  color: #7c8e76;
}

.empty-asg-icon {
  font-size: 28px;
  color: #a4b49e;
  margin-bottom: 8px;
}

.no-assignments p {
  font-size: 12px;
  margin: 0;
}

.assigned-fincas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.assigned-finca-card {
  background: #fbfcf9;
  border: 1px solid #e2e7da;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.asg-info h5 {
  font-size: 13px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 2px;
}

.auth-count {
  font-size: 11px;
  color: #5c6e58;
  font-weight: 600;
}

.asg-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn-outline {
  background: white;
  border: 1px solid #2E7D32;
  color: #2E7D32;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-btn-danger {
  background: #ffebee;
  border: 1px solid #ffebee;
  color: #c62828;
  border-radius: 10px;
  padding: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Assign Finca Box */
.assign-new-finca-box {
  background: #f0f4ec;
  border: 1px solid #d5ddcb;
  border-radius: 20px;
  padding: 14px;
  margin-top: 16px;
}

.assign-new-finca-box h5 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  color: #1B5E20;
}

.assign-input-group {
  display: flex;
  gap: 8px;
}

.form-select {
  flex-grow: 1;
  background: white;
  border: 1px solid #c0c5b1;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #2c3e2d;
  outline: none;
}

.assign-btn {
  background: #2E7D32;
  border: none;
  color: white;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

/* Permissions Modal Custom Checklist */
.perm-help-text {
  font-size: 12px;
  color: #5c6e58;
  margin: 0 0 14px;
  line-height: 1.4;
}

.select-all-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f4ee;
}

.link-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #2e7d32;
  padding: 0;
  cursor: pointer;
}

.link-btn.text-red {
  color: #c62828;
}

.animal-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex-grow: 1;
}

.animal-checklist-item {
  background: #fbfcf9;
  border: 1px solid #e2e7da;
  border-radius: 14px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.animal-checklist-item.item-checked {
  background: #f0f7f0;
  border-color: #a3cfa3;
}

/* Custom Checkbox */
.checkbox-box {
  flex-shrink: 0;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #b0b8a6;
  border-radius: 6px;
  display: block;
  position: relative;
  transition: all 0.15s ease;
}

.checkbox-custom.checked {
  background: #2e7d32;
  border-color: #2e7d32;
}

.checkmark-stem {
  position: absolute;
  width: 2px;
  height: 9px;
  background-color: white;
  left: 9px;
  top: 3px;
  transform: rotate(45deg);
}

.checkmark-kick {
  position: absolute;
  width: 5px;
  height: 2px;
  background-color: white;
  left: 5px;
  top: 9px;
  transform: rotate(45deg);
}

.animal-info-row {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.animal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.animal-tag {
  font-size: 11px;
  font-weight: 700;
  color: #5c6e58;
}

.animal-gender-badge {
  font-size: 11px;
}

.animal-details {
  display: flex;
  flex-direction: column;
}

.animal-details strong {
  font-size: 13px;
  color: #1B5E20;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.animal-sub {
  font-size: 10px;
  color: #7c8e76;
  font-weight: 500;
}

/* Forms */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #1B5E20;
}

.form-input {
  border: 1px solid #c0c5b1;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: #fdfdfd;
}

.form-input:focus {
  border-color: #2E7D32;
  background: white;
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
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.15);
}

.submit-btn:disabled {
  opacity: 0.7;
}

/* Custom top index overlays */
.z-index-top {
  z-index: 2000 !important;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
