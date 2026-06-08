<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">Registros BovWeight</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="registrar-content">
      <div class="page-container">
        <!-- Segmento / Selector de Sección -->
        <div class="segment-container">
          <button 
            class="segment-button" 
            :class="{ active: activeTab === 'fincas' }"
            @click="activeTab = 'fincas'"
          >
            🏡 Mis Fincas
          </button>
          <button 
            class="segment-button" 
            :class="{ active: activeTab === 'ganado' }"
            @click="activeTab = 'ganado'"
          >
            🐂 Mi Ganado
          </button>
        </div>

        <!-- SECCIÓN DE FINCAS -->
        <div v-if="activeTab === 'fincas'" class="section-content animate-fade-in">
          <div class="section-header">
            <div>
              <h2 class="section-title">Fincas Registradas</h2>
              <p class="section-subtitle">Gestión de fincas y propiedades agrícolas</p>
            </div>
            <button class="primary-btn" @click="openFincaModal">
              <ion-icon :icon="addOutline"></ion-icon>
              NUEVA FINCA
            </button>
          </div>

          <div v-if="loadingFincas" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando fincas...</p>
          </div>

          <div v-else-if="fincas.length === 0" class="empty-state">
            <span class="empty-icon">🏡</span>
            <h3>No tienes fincas registradas</h3>
            <p>Comienza agregando tu primera finca para poder asociar ganado a ella.</p>
            <button class="primary-btn" @click="openFincaModal">Agregar Finca</button>
          </div>

          <div v-else class="finca-grid">
            <div v-for="f in fincas" :key="f.id" class="finca-card">
              <div class="finca-card-header">
                <div class="finca-avatar">🏡</div>
                <div class="finca-meta">
                  <h3>{{ f.nombre }}</h3>
                  <span class="location"><ion-icon :icon="locationOutline"></ion-icon> {{ f.ubicacion }}</span>
                </div>
              </div>
              <div class="finca-details">
                <div class="detail-pill">
                  <strong>{{ f.bovinos_count || 0 }}</strong> animales
                </div>
                <button 
                  class="delete-icon-btn" 
                  @click="confirmDeleteFinca(f)"
                  title="Eliminar Finca"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN DE GANADO -->
        <div v-if="activeTab === 'ganado'" class="section-content animate-fade-in">
          <div class="section-header">
            <div>
              <h2 class="section-title">Rebaño Bovino</h2>
              <p class="section-subtitle">Inventario de animales y aretes identificadores</p>
            </div>
            <button class="primary-btn" @click="openAnimalModal">
              <ion-icon :icon="addOutline"></ion-icon>
              NUEVO ANIMAL
            </button>
          </div>

          <div v-if="loadingAnimals" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando rebaño...</p>
          </div>

          <div v-else-if="animals.length === 0" class="empty-state">
            <span class="empty-icon">🐂</span>
            <h3>No tienes animales registrados</h3>
            <p>Registra tus bovinos para realizar estimaciones de peso inteligentes y hacer seguimiento.</p>
            <button class="primary-btn" @click="openAnimalModal">Agregar Animal</button>
          </div>

          <div v-else class="animal-list">
            <div v-for="a in animals" :key="a.id" class="animal-row-item">
              <div class="animal-row-left">
                <div class="animal-avatar">🐂</div>
                <div class="animal-meta">
                  <h3>{{ a.nombre }}</h3>
                  <span class="animal-tag">Arete: #{{ a.arete || 'N/A' }} | Raza: {{ a.raza }}</span>
                  <span class="animal-sub">Edad: {{ a.edad }} | Sexo: {{ a.sexo }}</span>
                </div>
              </div>
              <div class="animal-row-right">
                <span class="weight-tag" v-if="a.pesoActual > 0">{{ a.pesoActual }} kg</span>
                <button 
                  class="delete-icon-btn" 
                  @click="confirmDeleteAnimal(a)"
                  title="Eliminar Animal"
                >
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

    <!-- MODAL: CREAR FINCA -->
    <div v-if="showFincaModal" class="modal-overlay animate-fade-in">
      <div class="modal-card">
        <div class="modal-header">
          <h3>🏡 Nueva Finca</h3>
          <button class="close-btn" @click="closeFincaModal">×</button>
        </div>
        <form @submit.prevent="saveFinca">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre de la Finca *</label>
              <input 
                type="text" 
                v-model="fincaForm.nombre" 
                required 
                placeholder="Ej. Finca El Rosario" 
                class="form-input" 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Ubicación / Dirección *</label>
              <input 
                type="text" 
                v-model="fincaForm.ubicacion" 
                required 
                placeholder="Ej. San Carlos, Alajuela" 
                class="form-input" 
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="closeFincaModal">Cancelar</button>
            <button type="submit" class="submit-btn" :disabled="savingFinca">
              <span v-if="savingFinca">Guardando...</span>
              <span v-else>Guardar Finca</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: CREAR ANIMAL -->
    <div v-if="showAnimalModal" class="modal-overlay animate-fade-in">
      <div class="modal-card max-width-md">
        <div class="modal-header">
          <h3>🐂 Registrar Nuevo Animal</h3>
          <button class="close-btn" @click="closeAnimalModal">×</button>
        </div>
        <form @submit.prevent="saveAnimal">
          <div class="modal-body scrollable-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Nombre del Animal *</label>
                <input 
                  type="text" 
                  v-model="animalForm.nombre" 
                  required 
                  placeholder="Ej. Clara, Lola" 
                  class="form-input" 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Número de Arete / Tag *</label>
                <input 
                  type="text" 
                  v-model="animalForm.numero_arete" 
                  required 
                  placeholder="Ej. CR-1004" 
                  class="form-input" 
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Finca Asignada *</label>
                <div class="select-wrapper">
                  <select v-model="animalForm.finca_id" required class="custom-select">
                    <option :value="null" disabled>-- Selecciona una finca --</option>
                    <option v-for="f in fincas" :key="f.id" :value="f.id">
                      {{ f.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Raza (Opcional)</label>
                <div class="select-wrapper">
                  <select v-model="animalForm.raza_id" class="custom-select">
                    <option :value="null">-- Selecciona una raza (Opcional) --</option>
                    <option v-for="r in razas" :key="r.id" :value="r.id">
                      {{ r.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Sexo</label>
                <div class="select-wrapper">
                  <select v-model="animalForm.sexo" class="custom-select">
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha de Nacimiento (Opcional)</label>
                <input 
                  type="date" 
                  v-model="animalForm.fecha_nacimiento" 
                  class="form-input" 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Color (Opcional)</label>
                <input 
                  type="text" 
                  v-model="animalForm.color" 
                  placeholder="Ej. Blanco, Café" 
                  class="form-input" 
                />
              </div>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Observaciones (Opcional)</label>
              <textarea 
                v-model="animalForm.observaciones" 
                rows="3" 
                placeholder="Detalles de salud, señas particulares, vacunas..." 
                class="form-textarea"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="closeAnimalModal">Cancelar</button>
            <button type="submit" class="submit-btn" :disabled="savingAnimal">
              <span v-if="savingAnimal">Guardando...</span>
              <span v-else>Guardar Animal</span>
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
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonSpinner, IonIcon, IonToast
} from '@ionic/vue';
import { 
  addOutline, trashOutline, locationOutline 
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository } from '@/services';

// Variables de estado
const activeTab = ref<'fincas' | 'ganado'>('fincas');
const fincas = ref<any[]>([]);
const animals = ref<any[]>([]);
const razas = ref<any[]>([]);
const loadingFincas = ref(true);
const loadingAnimals = ref(true);

// Datos de sesión del usuario logueado
const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

// Configuración de notificaciones toast
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

// Control de modales
const showFincaModal = ref(false);
const savingFinca = ref(false);
const fincaForm = ref({
  nombre: '',
  ubicacion: ''
});

const showAnimalModal = ref(false);
const savingAnimal = ref(false);
const animalForm = ref<{
  nombre: string;
  numero_arete: string;
  finca_id: number | null;
  raza_id: number | null;
  sexo: string;
  fecha_nacimiento: string;
  color: string;
  observaciones: string;
}>({
  nombre: '',
  numero_arete: '',
  finca_id: null,
  raza_id: null,
  sexo: 'macho',
  fecha_nacimiento: '',
  color: '',
  observaciones: ''
});

// Funciones para cargar datos desde la API
async function fetchFincas() {
  loadingFincas.value = true;
  try {
    fincas.value = await animalRepository.getFincas();
  } catch (e: any) {
    showToast('Error al cargar fincas: ' + e.message, 'danger');
  } finally {
    loadingFincas.value = false;
  }
}

async function fetchAnimals() {
  loadingAnimals.value = true;
  try {
    animals.value = await animalRepository.getAllAnimals();
  } catch (e: any) {
    showToast('Error al cargar ganado: ' + e.message, 'danger');
  } finally {
    loadingAnimals.value = false;
  }
}

async function fetchRazas() {
  try {
    razas.value = await animalRepository.getRazas();
  } catch (e) {
    console.error('Error cargando razas:', e);
  }
}

// Acciones para fincas
const openFincaModal = () => {
  fincaForm.value = { nombre: '', ubicacion: '' };
  showFincaModal.value = true;
};

const closeFincaModal = () => {
  showFincaModal.value = false;
};

const saveFinca = async () => {
  if (!usuarioSesion.value?.id) {
    showToast('Sesión no válida. Inicia sesión de nuevo.', 'danger');
    return;
  }
  savingFinca.value = true;
  try {
    await animalRepository.crearFinca({
      nombre: fincaForm.value.nombre,
      ubicacion: fincaForm.value.ubicacion,
      propietario_id: usuarioSesion.value.id
    });
    showToast('Finca creada exitosamente.');
    closeFincaModal();
    await fetchFincas();
  } catch (e: any) {
    showToast(e.message || 'Error al guardar finca.', 'danger');
  } finally {
    savingFinca.value = false;
  }
};

const confirmDeleteFinca = async (finca: any) => {
  if (finca.bovinos_count > 0) {
    showToast(`No puedes eliminar la finca "${finca.nombre}" porque tiene animales asignados.`, 'danger');
    return;
  }
  
  if (confirm(`¿Estás seguro de eliminar la finca "${finca.nombre}"?`)) {
    try {
      await animalRepository.eliminarFinca(finca.id);
      showToast('Finca eliminada exitosamente.');
      await fetchFincas();
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar finca.', 'danger');
    }
  }
};

// Acciones para animales
const openAnimalModal = () => {
  animalForm.value = {
    nombre: '',
    numero_arete: '',
    finca_id: fincas.value.length > 0 ? fincas.value[0].id : null,
    raza_id: null,
    sexo: 'macho',
    fecha_nacimiento: '',
    color: '',
    observaciones: ''
  };
  showAnimalModal.value = true;
};

const closeAnimalModal = () => {
  showAnimalModal.value = false;
};

const saveAnimal = async () => {
  if (!animalForm.value.finca_id) {
    showToast('Debes seleccionar una finca para el animal.', 'danger');
    return;
  }
  savingAnimal.value = true;
  try {
    await animalRepository.crearAnimal({
      nombre: animalForm.value.nombre,
      numero_arete: animalForm.value.numero_arete,
      finca_id: animalForm.value.finca_id,
      raza_id: animalForm.value.raza_id,
      sexo: animalForm.value.sexo,
      fecha_nacimiento: animalForm.value.fecha_nacimiento || null,
      color: animalForm.value.color || null,
      observaciones: animalForm.value.observaciones || null
    });
    showToast('Animal registrado exitosamente.');
    closeAnimalModal();
    await fetchAnimals();
    // reload fincas to update count
    await fetchFincas();
  } catch (e: any) {
    showToast(e.message || 'Error al guardar animal.', 'danger');
  } finally {
    savingAnimal.value = false;
  }
};

const confirmDeleteAnimal = async (animal: any) => {
  if (confirm(`¿Estás seguro de eliminar a "${animal.nombre}" (Arete: #${animal.arete}) del rebaño?`)) {
    try {
      await animalRepository.eliminarAnimal(animal.id);
      showToast('Animal eliminado exitosamente.');
      await fetchAnimals();
      await fetchFincas(); // update finca animal counter
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar animal.', 'danger');
    }
  }
};

onMounted(() => {
  fetchFincas();
  fetchAnimals();
  fetchRazas();
});
</script>

<style scoped>
.registrar-content {
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

/* Segment switcher */
.segment-container {
  display: flex;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(46, 125, 50, 0.1);
  padding: 4px;
  border-radius: 16px;
  margin-bottom: 24px;
  backdrop-filter: blur(8px);
}

.segment-button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #5c6e58;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.segment-button.active {
  background: white;
  color: #1B5E20;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.08);
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 22px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.section-subtitle {
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
}

.primary-btn:active {
  transform: scale(0.98);
}

/* Loading & Empty states */
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
  margin: 0 auto 20px;
  max-width: 300px;
  line-height: 1.5;
}

.empty-state .primary-btn {
  margin: 0 auto;
}

/* Finca Grid */
.finca-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.finca-card {
  background: white;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.finca-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.finca-avatar {
  font-size: 24px;
  width: 44px;
  height: 44px;
  background: #eaf0e6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.finca-meta h3 {
  font-size: 16px;
  font-weight: 850;
  color: #1B5E20;
  margin: 0 0 2px;
}

.finca-meta .location {
  font-size: 12px;
  color: #5c6e58;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.finca-meta .location ion-icon {
  font-size: 14px;
  color: #2E7D32;
}

.finca-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f4f6f0;
  padding-top: 12px;
}

.detail-pill {
  font-size: 11px;
  font-weight: 700;
  color: #1B5E20;
  background: #eaf0e6;
  padding: 4px 10px;
  border-radius: 8px;
}

.delete-icon-btn {
  background: transparent;
  border: none;
  color: #c0c5b1;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
  outline: none;
}

.delete-icon-btn:active, .delete-icon-btn:hover {
  background: #fff5f5;
  color: #d32f2f;
}

/* Animal List */
.animal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.animal-row-item {
  background: white;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(46, 125, 50, 0.06);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.01);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.animal-row-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.animal-row-left .animal-avatar {
  font-size: 22px;
  width: 42px;
  height: 42px;
  background: #fdfbf7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(46, 125, 50, 0.08);
}

.animal-meta h3 {
  font-size: 15px;
  font-weight: 800;
  color: #1B5E20;
  margin: 0 0 2px;
}

.animal-meta span {
  display: block;
}

.animal-tag {
  font-size: 11px;
  color: #5c6e58;
  font-weight: 600;
}

.animal-sub {
  font-size: 10px;
  color: #8c9c88;
  font-weight: 500;
  margin-top: 1px;
}

.animal-row-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weight-tag {
  font-size: 12px;
  font-weight: 800;
  color: #1B5E20;
  background: #eaf0e6;
  padding: 4px 8px;
  border-radius: 8px;
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

.modal-card.max-width-md {
  max-width: 500px;
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

.modal-body.scrollable-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group.full-width {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #1B5E20;
}

.form-input, .custom-select, .form-textarea {
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

.form-input:focus, .custom-select:focus, .form-textarea:focus {
  border-color: #2E7D32;
  background: white;
}

/* Select wrapper styling for custom icon */
.select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  padding-right: 36px;
}

.select-wrapper::after {
  content: "▼";
  font-size: 10px;
  color: #5c6e58;
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
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
