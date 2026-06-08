<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">Personal Técnico</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="personal-content">
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">Médicos Veterinarios</h1>
            <p class="page-subtitle">Personal autorizado para el control médico del rebaño</p>
          </div>
          <!-- Botón de agregar veterinario (Visible para ganaderos y admins) -->
          <button 
            v-if="usuarioSesion?.rol === 'ganadero' || usuarioSesion?.rol === 'admin'" 
            class="primary-btn" 
            @click="openAddVetModal"
          >
            <ion-icon :icon="addOutline"></ion-icon>
            NUEVO VETERINARIO
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

        <!-- VETERINARIOS LIST -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando lista de veterinarios...</p>
        </div>

        <div v-else-if="filteredVeterinarios.length === 0" class="empty-state animate-fade-in">
          <span class="empty-icon">🩺</span>
          <h3>No se encontró personal veterinario</h3>
          <p>No hay veterinarios registrados que coincidan con la búsqueda, o no hay personal registrado en tu cuenta.</p>
        </div>

        <div v-else class="vet-grid animate-fade-in">
          <div v-for="v in filteredVeterinarios" :key="v.id" class="vet-card">
            <div class="vet-card-body">
              <div class="vet-header-info">
                <div class="vet-avatar">
                  {{ v.nombre_completo ? v.nombre_completo.charAt(0).toUpperCase() : 'V' }}
                </div>
                <div class="vet-meta">
                  <h3>{{ v.nombre_completo }}</h3>
                  <span class="vet-email">{{ v.correo }}</span>
                  <span class="vet-role">MÉDICO VETERINARIO</span>
                </div>
              </div>
              
              <div class="vet-footer-details">
                <div class="status-badge" :class="v.activo ? 'active' : 'inactive'">
                  <span class="dot"></span>
                  {{ v.activo ? 'Activo' : 'Inactivo' }}
                </div>
                <div class="reg-date">
                  Registrado: <strong>{{ v.creado_en || 'Reciente' }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM NAV BAR -->
      <BottomNav />
    </ion-content>

    <!-- MODAL: CREAR VETERINARIO -->
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
import { addOutline } from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository } from '@/services';

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
const loading = ref(true);
const searchQuery = ref('');

// Control de modales
const showAddVetModal = ref(false);
const saving = ref(false);
const vetForm = ref({
  nombre_completo: '',
  correo: '',
  contrasena: ''
});

// Notificaciones toast
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
    const allVets = await animalRepository.getUsuarios('veterinario');
    
    if (usuarioSesion.value && usuarioSesion.value.rol === 'ganadero') {
      // Obtener detalles del ganadero para saber cuáles veterinarios tiene asignados
      const detail = await animalRepository.getUsuarioDetalle(usuarioSesion.value.id);
      const linkedIds = (detail.veterinarios || []).map((v: any) => v.id);
      veterinarios.value = allVets.filter((v: any) => linkedIds.includes(v.id));
    } else {
      // Los administradores ven todos los veterinarios
      veterinarios.value = allVets;
    }
  } catch (e) {
    console.error('Error al cargar veterinarios, intentando fallback:', e);
    try {
      const allUsers = await animalRepository.getUsuarios();
      const allVets = allUsers.filter(u => u.rol_nombre === 'veterinario');
      if (usuarioSesion.value && usuarioSesion.value.rol === 'ganadero') {
        const detail = await animalRepository.getUsuarioDetalle(usuarioSesion.value.id);
        const linkedIds = (detail.veterinarios || []).map((v: any) => v.id);
        veterinarios.value = allVets.filter((v: any) => linkedIds.includes(v.id));
      } else {
        veterinarios.value = allVets;
      }
    } catch (err) {
      console.error('Fallback failed:', err);
    }
  } finally {
    loading.value = false;
  }
}

// Filtrar veterinarios según la búsqueda del usuario
const filteredVeterinarios = computed(() => {
  if (!searchQuery.value.trim()) return veterinarios.value;
  const query = searchQuery.value.toLowerCase();
  return veterinarios.value.filter(v => 
    (v.nombre_completo || '').toLowerCase().includes(query) ||
    (v.correo || '').toLowerCase().includes(query)
  );
});

// Acciones del modal
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
    // 1. Obtener los roles del sistema para buscar el de veterinario
    const roles = await animalRepository.getRoles();
    const vetRole = roles.find((r: any) => r.nombre === 'veterinario');
    if (!vetRole) {
      throw new Error('El rol de veterinario no está registrado en el sistema.');
    }

    // 2. Crear el nuevo usuario enlazado al ganadero actual
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

onMounted(loadVeterinarios);
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
  padding: 20px 16px 100px; /* space for bottom nav bar */
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 26px;
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
}

.primary-btn {
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}

.primary-btn:active {
  transform: scale(0.98);
}

/* Search Bar */
.search-bar-container {
  margin-bottom: 24px;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
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

/* Vet Grid */
.vet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.vet-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.vet-card:active {
  transform: translateY(-2px);
}

.vet-card-body {
  padding: 20px;
}

.vet-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.vet-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eaf0e6 0%, #d8e6d1 100%);
  color: #1B5E20;
  font-weight: 800;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.05);
}

.vet-meta h3 {
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 2px;
}

.vet-email {
  font-size: 12px;
  color: #5c6e58;
  display: block;
  word-break: break-all;
}

.vet-role {
  display: inline-block;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #2e7d32;
  background: #eaf0e6;
  padding: 2px 6px;
  border-radius: 6px;
  margin-top: 4px;
}

.vet-footer-details {
  border-top: 1px solid #f4f6f0;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.status-badge.active {
  background: #eaf8eb;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #c62828;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge.active .dot { background-color: #2e7d32; }
.status-badge.inactive .dot { background-color: #c62828; }

.reg-date {
  font-size: 11px;
  color: #8c9c88;
}

/* MODAL OVERLAYS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f4f6f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 850;
  color: #1B5E20;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 26px;
  color: #5c6e58;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
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
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: #2E7D32;
  background: white;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f4f6f0;
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
  transition: opacity 0.2s ease;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
