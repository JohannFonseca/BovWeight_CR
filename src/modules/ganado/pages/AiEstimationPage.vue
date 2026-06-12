<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="Atrás" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">Estimación de Peso IA</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="estimation-content">
      <div class="page-container">
        <!-- HEADER INFORMATIVO -->
        <div class="intro-section">
          <h1>Cálculo de Peso Inteligente</h1>
          <p>Toma una foto de tu animal en la finca o ingresa sus medidas para predecir su peso en segundos usando modelos de Visión por Computadora y Machine Learning.</p>
        </div>

        <div class="estimation-grid">
          <!-- PANEL DE FORMULARIO -->
          <div class="panel-card form-panel">
            <div class="panel-header">
              <h3><ion-icon :icon="scaleOutline" class="header-icon"></ion-icon> Parámetros de Estimación</h3>
            </div>
            
            <div class="panel-body">
              <!-- SELECCIONAR ANIMAL -->
              <div class="form-group">
                <label for="animal-select" class="form-label">1. Seleccionar Animal del Rebaño</label>
                <div class="select-wrapper">
                  <select id="animal-select" v-model="selectedAnimalId" @change="onAnimalChange" class="custom-select">
                    <option :value="null" disabled>-- Selecciona un animal --</option>
                    <option v-for="a in animals" :key="a.id" :value="a.id">
                      {{ a.nombre }} (Arete: #{{ a.arete || 'N/A' }} | {{ a.raza }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- MOSTRAR FICHA RAPIDA DEL ANIMAL -->
              <div v-if="selectedAnimal" class="animal-quick-card animate-fade-in">
                <div class="quick-avatar">
                  <img v-if="selectedAnimal.imagen" :src="selectedAnimal.imagen" :alt="selectedAnimal.nombre" />
                  <div v-else class="avatar-placeholder">🐄</div>
                </div>
                <div class="quick-details">
                  <h4>{{ selectedAnimal.nombre }}</h4>
                  <p>Raza: <strong>{{ selectedAnimal.raza }}</strong> | Edad: <strong>{{ selectedAnimal.edad }}</strong> | Sexo: <strong>{{ selectedAnimal.sexo || 'N/A' }}</strong></p>
                  <p v-if="selectedAnimal.pesoActual > 0">Último Peso: <strong class="green-text">{{ selectedAnimal.pesoActual }} kg</strong></p>
                </div>
              </div>

              <!-- METODO DE ESTIMACION (PESTAÑAS) -->
              <div class="form-group">
                <label class="form-label">2. Método de Estimación</label>
                <div class="tabs-container">
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: estimationMethod === 'photo' }" 
                    @click="setMethod('photo')"
                  >
                    📸 Estimación por Foto
                  </button>
                  <button 
                    type="button" 
                    class="tab-btn" 
                    :class="{ active: estimationMethod === 'manual' }" 
                    @click="setMethod('manual')"
                  >
                    📏 Medidas Manuales
                  </button>
                </div>
              </div>

              <!-- CONTENIDO DE PESTAÑA: FOTO -->
              <div v-if="estimationMethod === 'photo'" class="tab-content animate-fade-in">
                <div class="form-group">
                  <label class="form-label">Cargar Foto del Bovino</label>
                  
                  <!-- Contenedor del Preview / Scanner -->
                  <div class="photo-upload-zone" style="cursor: default; padding: 16px;">
                    <input 
                      type="file" 
                      ref="cameraInput" 
                      accept="image/*" 
                      capture="environment" 
                      @change="onCameraFileSelected" 
                      style="display: none;" 
                    />
                    <input 
                      type="file" 
                      ref="galleryInput" 
                      accept="image/*" 
                      multiple
                      @change="onGalleryFilesSelected" 
                      style="display: none;" 
                    />
                    
                    <!-- Estado Cargando / Escaneando -->
                    <div v-if="loadingEstimation" class="scanner-wrapper">
                      <img :src="imageUrls[0]" class="upload-preview" />
                      <div class="scanning-overlay"></div>
                      <div class="laser-line"></div>
                      <div class="scanning-badge">Escaneando {{ selectedFiles.length }} fotos con IA...</div>
                    </div>
                    
                    <!-- Previsualización de Galería -->
                    <div v-else-if="imageUrls.length > 0" class="preview-wrapper" style="flex-direction: column; width: 100%;">
                      <div class="gallery-grid">
                        <div v-for="(url, idx) in imageUrls" :key="idx" class="gallery-item-card">
                          <img :src="url" class="gallery-thumbnail" />
                          <button type="button" class="delete-photo-btn" @click.stop="removeFile(idx)" title="Eliminar foto">
                            <ion-icon :icon="trashOutline"></ion-icon>
                          </button>
                          <span class="photo-index-badge">Foto #{{ idx + 1 }}</span>
                        </div>
                        
                        <!-- Add Slot -->
                        <div class="gallery-add-card" @click="triggerGalleryInput">
                          <ion-icon :icon="addOutline" class="add-icon"></ion-icon>
                          <span>Galería</span>
                        </div>
                      </div>
                      
                      <div class="gallery-actions-row" style="width: 100%;">
                        <button type="button" class="gallery-sub-btn" @click="triggerCameraInput">
                          <ion-icon :icon="cameraOutline"></ion-icon> Tomar Foto
                        </button>
                        <button type="button" class="gallery-sub-btn" @click="triggerGalleryInput">
                          <ion-icon :icon="imageOutline"></ion-icon> Añadir Fotos
                        </button>
                      </div>
                    </div>
                    
                    <!-- Zona Vacía (Upload) -->
                    <div v-else class="upload-options-container">
                      <div class="upload-option-card" @click="triggerCameraInput">
                        <ion-icon :icon="cameraOutline" class="option-icon"></ion-icon>
                        <span class="option-title">Usar Cámara</span>
                        <span class="option-desc">Toma una foto en tiempo real</span>
                      </div>
                      <div class="upload-option-card" @click="triggerGalleryInput">
                        <ion-icon :icon="imageOutline" class="option-icon"></ion-icon>
                        <span class="option-title">Subir de Galería</span>
                        <span class="option-desc">Selecciona múltiples fotos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- BOTÓN ESTIMAR POR FOTO -->
                <ion-button 
                  expand="block" 
                  class="ai-action-btn" 
                  :disabled="imageUrls.length === 0 || !selectedAnimalId || loadingEstimation"
                  @click="performEstimation"
                >
                  <ion-spinner v-if="loadingEstimation" name="crescent" slot="start"></ion-spinner>
                  <ion-icon v-else :icon="sparklesOutline" slot="start"></ion-icon>
                  {{ loadingEstimation ? 'Procesando Imágenes con IA...' : 'ANALIZAR FOTOS Y ESTIMAR PESO' }}
                </ion-button>
              </div>

              <!-- CONTENIDO DE PESTAÑA: MANUAL -->
              <div v-else-if="estimationMethod === 'manual'" class="tab-content animate-fade-in">
                <div class="measurements-row">
                  <div class="form-group">
                    <label for="girth-input" class="form-label">Perímetro Torácico (cm)</label>
                    <div class="input-with-unit">
                      <input 
                        id="girth-input" 
                        type="number" 
                        v-model.number="perimetroToracico" 
                        placeholder="Ej. 180" 
                        min="50" 
                        max="300"
                        class="custom-input"
                      />
                      <span class="unit">cm</span>
                    </div>
                    <small class="help-text">Medida alrededor del pecho del animal.</small>
                  </div>

                  <div class="form-group">
                    <label for="length-input" class="form-label">Largo del Cuerpo (cm)</label>
                    <div class="input-with-unit">
                      <input 
                        id="length-input" 
                        type="number" 
                        v-model.number="largoCuerpo" 
                        placeholder="Ej. 150" 
                        min="50" 
                        max="300"
                        class="custom-input"
                      />
                      <span class="unit">cm</span>
                    </div>
                    <small class="help-text">Desde el hombro a la nalga.</small>
                  </div>
                </div>

                <!-- BOTÓN ESTIMAR MANUAL -->
                <ion-button 
                  expand="block" 
                  class="ai-action-btn" 
                  :disabled="!isValidManualForm || !selectedAnimalId || loadingEstimation"
                  @click="performEstimation"
                >
                  <ion-spinner v-if="loadingEstimation" name="crescent" slot="start"></ion-spinner>
                  <ion-icon v-else :icon="scaleOutline" slot="start"></ion-icon>
                  {{ loadingEstimation ? 'Procesando con IA...' : 'CALCULAR PESO CON IA' }}
                </ion-button>
              </div>

              <div v-if="error" class="error-msg animate-fade-in">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ error }}</span>
              </div>
            </div>
          </div>

          <!-- PANEL DE RESULTADOS / ILUSTRACIÓN -->
          <div class="panel-card helper-panel">
            <!-- VISTA DE RESULTADOS -->
            <div v-if="estimatedWeight !== null" class="result-container animate-fade-in">
              <div class="panel-header text-center">
                <h3>Resultado de Estimación IA</h3>
              </div>
              <div class="panel-body text-center">
                
                <!-- MÉTRICAS DETECTADAS SI FUE POR FOTO -->
                <div v-if="estimationMethod === 'photo' && detectedGirth" class="detected-metrics-card animate-fade-in">
                  <h4>Dimensiones Anatométricas Promedio</h4>
                  <div class="metrics-list">
                    <div class="metric-item">
                      <span>Perímetro Torácico:</span>
                      <span class="metric-val">{{ detectedGirth }} cm</span>
                    </div>
                    <div class="metric-item">
                      <span>Largo de Cuerpo:</span>
                      <span class="metric-val">{{ detectedLength }} cm</span>
                    </div>
                    <div class="metric-item">
                      <span>Confianza Promedio:</span>
                      <span class="metric-val green-text">{{ confidence }}%</span>
                    </div>
                    <div class="metric-item" v-if="processedImagesCount > 0">
                      <span>Fotos Procesadas:</span>
                      <span class="metric-val">{{ processedImagesCount }}</span>
                    </div>
                  </div>
                </div>

                <!-- GAUGE DE PESO -->
                <div class="weight-gauge-container">
                  <div class="weight-gauge-circle">
                    <div class="weight-value-big">
                      {{ estimatedWeight }}
                      <span class="kg-unit">kg</span>
                    </div>
                  </div>
                </div>

                <div class="warning-box">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  <span><strong>Peso estimado aproximado:</strong> La estimación por IA es una aproximación y no reemplaza a una báscula real calibrada.</span>
                </div>

                <div class="model-badge">
                  <span class="badge-icon">🧠</span>
                  <span>Modelo: <strong>{{ usedModel }}</strong></span>
                </div>

                <!-- SECCIÓN DE GUARDAR Y CORREGIR -->
                <div class="save-record-section">
                  <div class="form-group text-left">
                    <label for="corrected-input" class="form-label">
                      Peso Real de Báscula (Opcional, kg)
                    </label>
                    <div class="input-with-unit">
                      <input 
                        id="corrected-input" 
                        type="number" 
                        v-model.number="pesoCorregido" 
                        placeholder="Ej. 475" 
                        min="10"
                        class="custom-input"
                      />
                      <span class="unit">kg</span>
                    </div>
                    <small class="help-text">Si pesaste al animal en báscula física, ingresa el dato para calibrar.</small>
                  </div>

                  <div class="btn-group">
                    <ion-button 
                      expand="block" 
                      class="save-btn" 
                      :disabled="savingRecord || !selectedAnimalId"
                      @click="saveRecord"
                    >
                      <ion-spinner v-if="savingRecord" name="crescent" slot="start"></ion-spinner>
                      <ion-icon v-else :icon="checkmarkCircleOutline" slot="start"></ion-icon>
                      {{ savingRecord ? 'Guardando en BD...' : 'GUARDAR EN BASE DE DATOS' }}
                    </ion-button>

                    <ion-button 
                      fill="outline" 
                      expand="block" 
                      class="reset-btn"
                      @click="resetEstimation"
                    >
                      <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                      Nueva Estimación
                    </ion-button>
                  </div>
                </div>

              </div>
            </div>

            <!-- VISTA DE GUÍA ANATÓMICA -->
            <div v-else class="guide-container">
              <div class="panel-header">
                <h3>Guía de Toma de Medidas / Foto</h3>
              </div>
              <div class="panel-body text-center">
                <!-- SVG INTERACTIVO DE VACA CON INDICADORES -->
                <div class="svg-diagram-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" class="cow-svg">
                    <path d="M 50,150 C 45,150 40,145 40,135 C 40,120 45,115 50,110 C 60,105 70,110 80,95 C 90,80 110,65 130,75 C 145,80 160,82 175,82 C 210,82 240,78 270,85 C 290,90 310,85 330,90 C 350,95 365,108 370,125 C 372,135 375,145 370,165 C 365,175 358,180 355,185 C 352,190 355,210 350,225 C 347,230 342,230 340,225 C 335,215 338,195 335,185 C 300,187 270,188 260,185 C 255,195 258,215 252,228 C 250,232 245,232 242,228 C 238,220 240,195 240,185 C 180,185 140,185 125,185 C 120,195 122,215 118,228 C 115,232 110,232 108,228 C 104,220 106,195 106,185 C 95,185 85,183 75,180 C 70,190 73,210 68,225 C 66,230 61,230 59,225 C 55,215 58,195 56,170 C 50,168 50,150 50,150 Z" class="cow-silhouette" />
                    <path d="M 55,112 C 45,115 38,105 38,95 C 38,90 42,82 48,82 C 44,78 40,72 40,65 C 40,63 43,63 45,67 C 48,73 52,78 52,78 C 55,72 58,63 60,63 C 62,63 65,73 62,78" class="cow-head" />
                    <line x1="90" y1="110" x2="340" y2="120" class="measure-line length-line" />
                    <circle cx="90" cy="110" r="4" class="measure-point" />
                    <circle cx="340" cy="120" r="4" class="measure-point" />
                    <ellipse cx="140" cy="132" rx="16" ry="50" class="measure-line girth-line" />
                    <text x="215" y="102" class="diagram-label">1. Largo del Cuerpo</text>
                    <text x="140" y="202" class="diagram-label text-center">2. Perímetro Torácico</text>
                  </svg>
                </div>
                
                <div class="guide-steps">
                  <div class="warning-box" style="margin-top: 0; margin-bottom: 16px;">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                    <span><strong>Nota de campo:</strong> La estimación de la IA es aproximada. En campo, se recomienda calibrar con pesajes reales de báscula periódicamente.</span>
                  </div>
                  <div class="step">
                    <span class="step-num">📸</span>
                    <p><strong>Para estimar con Foto:</strong> Toma una foto de perfil del animal completo a una distancia aproximada de 2 a 3 metros. Asegúrate de que no haya obstáculos tapando las patas o el cuerpo del animal.</p>
                  </div>
                  <div class="step">
                    <span class="step-num">📏</span>
                    <p><strong>Para estimar Manual:</strong> Toma cinta métrica flexible y mide el **Largo del Cuerpo** (desde el hombro a la nalga) y el **Perímetro Torácico** (rodeando el pecho detrás de las patas delanteras).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Notificación Toast -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="3000"
      :color="toastColor"
      @didDismiss="showToast = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonButtons, IonBackButton, IonSpinner, IonToast
} from '@ionic/vue';
import { 
  scaleOutline, cameraOutline, alertCircleOutline, checkmarkCircleOutline,
  refreshOutline, sparklesOutline, trashOutline, addOutline, imageOutline
} from 'ionicons/icons';
import { animalRepository, type Animal } from '@/services';

const route = useRoute();
const router = useRouter();

// Configuración general
const animals = ref<Animal[]>([]);
const selectedAnimalId = ref<number | null>(null);

// Métodos de predicción
const estimationMethod = ref<'photo' | 'manual'>('photo');

// Entrada Manual
const perimetroToracico = ref<number | null>(null);
const largoCuerpo = ref<number | null>(null);

// Entrada Foto
const cameraInput = ref<HTMLInputElement | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const imageUrls = ref<string[]>([]);
const processedImagesCount = ref<number>(0);

// Resultados del cálculo
const estimatedWeight = ref<number | null>(null);
const pesoCorregido = ref<number | null>(null);
const usedModel = ref<string>('');

// Detalles extraídos de la foto
const detectedGirth = ref<number | null>(null);
const detectedLength = ref<number | null>(null);
const confidence = ref<number | null>(null);
const rutaImagen = ref<string | null>(null);

// Controladores de estado
const loadingEstimation = ref(false);
const savingRecord = ref(false);
const error = ref<string | null>(null);

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref('success');

async function loadAnimals() {
  try {
    animals.value = await animalRepository.getAllAnimals();
  } catch (err: any) {
    console.error('Error cargando animales:', err);
    error.value = 'No se pudo cargar la lista de animales del rebaño.';
  }
}

const selectedAnimal = computed(() => {
  if (!selectedAnimalId.value) return null;
  return animals.value.find(a => a.id === selectedAnimalId.value) || null;
});

const isValidManualForm = computed(() => {
  return (
    perimetroToracico.value !== null && perimetroToracico.value >= 50 && perimetroToracico.value <= 300 &&
    largoCuerpo.value !== null && largoCuerpo.value >= 50 && largoCuerpo.value <= 300
  );
});

function setMethod(method: 'photo' | 'manual') {
  estimationMethod.value = method;
  resetEstimation();
}

function onAnimalChange() {
  resetEstimation();
}

// Subida de imagen
function triggerCameraInput() {
  if (cameraInput.value) {
    cameraInput.value.click();
  }
}

function triggerGalleryInput() {
  if (galleryInput.value) {
    galleryInput.value.click();
  }
}

function addFiles(files: FileList | null) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    selectedFiles.value.push(file);
    imageUrls.value.push(URL.createObjectURL(file));
  }
  
  // Reset previous prediction when a new photo is loaded
  estimatedWeight.value = null;
  pesoCorregido.value = null;
  error.value = null;
  detectedGirth.value = null;
  detectedLength.value = null;
  confidence.value = null;
  processedImagesCount.value = 0;
}

function onCameraFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  addFiles(target.files);
  target.value = '';
}

function onGalleryFilesSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  addFiles(target.files);
  target.value = '';
}

function removeFile(index: number) {
  if (imageUrls.value[index]) {
    URL.revokeObjectURL(imageUrls.value[index]);
  }
  selectedFiles.value.splice(index, 1);
  imageUrls.value.splice(index, 1);
  
  // Reset prediction
  estimatedWeight.value = null;
  pesoCorregido.value = null;
  error.value = null;
  detectedGirth.value = null;
  detectedLength.value = null;
  confidence.value = null;
  processedImagesCount.value = 0;
}

// Ejecutar estimación
async function performEstimation() {
  loadingEstimation.value = true;
  error.value = null;
  estimatedWeight.value = null;

  try {
    let res: any;
    if (estimationMethod.value === 'photo') {
      if (selectedFiles.value.length === 0) {
        throw new Error('Por favor, selecciona o toma al menos una foto del animal.');
      }
      res = await animalRepository.estimateWeight(
        selectedAnimalId.value,
        null,
        null,
        selectedFiles.value
      );
      
      // Save detected dimensions
      detectedGirth.value = res.perimetro_detectado || null;
      detectedLength.value = res.largo_detectado || null;
      confidence.value = res.confianza || null;
      processedImagesCount.value = selectedFiles.value.length;
      rutaImagen.value = res.ruta_imagen || null;
    } else {
      if (!isValidManualForm.value) {
        throw new Error('Por favor, completa las medidas manualmente.');
      }
      res = await animalRepository.estimateWeight(
        selectedAnimalId.value,
        perimetroToracico.value!,
        largoCuerpo.value!
      );
    }

    estimatedWeight.value = res.peso_estimado;
    
    if (res.model.includes('random_forest') || res.model.includes('rf')) {
      usedModel.value = 'Random Forest AI';
    } else {
      usedModel.value = 'Regresión Multivariable BovWeight';
    }

    triggerToast('¡Estimación calculada exitosamente por la IA!', 'success');
  } catch (err: any) {
    error.value = err.message || 'Error al conectar con el motor de estimación IA.';
    triggerToast('Error en la estimación de peso.', 'danger');
  } finally {
    loadingEstimation.value = false;
  }
}

// Guardar registro
async function saveRecord() {
  if (estimatedWeight.value === null || !selectedAnimalId.value) return;
  savingRecord.value = true;
  error.value = null;

  try {
    await animalRepository.saveWeightRecord(
      selectedAnimalId.value,
      estimatedWeight.value,
      pesoCorregido.value || undefined,
      rutaImagen.value || undefined
    );
    
    triggerToast('¡Pesaje de IA guardado exitosamente en base de datos!', 'success');
    
    setTimeout(() => {
      router.push(`/animal/${selectedAnimalId.value}`);
    }, 1500);
  } catch (err: any) {
    error.value = err.message || 'Error al persistir el registro en la base de datos.';
    triggerToast('Error al guardar el registro.', 'danger');
  } finally {
    savingRecord.value = false;
  }
}

function resetEstimation() {
  estimatedWeight.value = null;
  pesoCorregido.value = null;
  perimetroToracico.value = null;
  largoCuerpo.value = null;
  
  // Revoke all URLs
  imageUrls.value.forEach(url => URL.revokeObjectURL(url));
  selectedFiles.value = [];
  imageUrls.value = [];
  processedImagesCount.value = 0;
  
  detectedGirth.value = null;
  detectedLength.value = null;
  confidence.value = null;
  error.value = null;
  rutaImagen.value = null;
}

function triggerToast(message: string, color: string = 'success') {
  toastMessage.value = message;
  toastColor.value = color;
  showToast.value = true;
}

onMounted(async () => {
  await loadAnimals();
  const animalIdParam = route.query.animalId;
  if (animalIdParam) {
    const id = Number(animalIdParam);
    if (!isNaN(id)) {
      selectedAnimalId.value = id;
    }
  }
});
</script>

<style scoped>
/* VARIABLES Y GENERALES */
.estimation-content {
  --background: #f4f1ea;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

/* HEADER */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  --min-height: 70px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 26px;
}

.app-logo {
  font-weight: 800;
  color: #2c3e2d;
  font-size: 20px;
  letter-spacing: -0.5px;
}

.back-btn {
  --color: #5c6e58;
}

/* INTRO */
.intro-section {
  margin-bottom: 32px;
  text-align: left;
}

.intro-section h1 {
  font-size: 32px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 8px;
  letter-spacing: -1px;
}

.intro-section p {
  font-size: 15px;
  color: #5c6e58;
  max-width: 800px;
  line-height: 1.5;
  margin: 0;
}

/* GRID LAYOUT */
.estimation-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}

.panel-card {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f4f1ea;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: #2E7D32;
  font-size: 22px;
}

.panel-body {
  padding: 24px;
}

/* PESTAÑAS TABS */
.tabs-container {
  display: flex;
  background: #f4f1ea;
  border-radius: 14px;
  padding: 4px;
  margin-top: 8px;
  border: 1px solid #e2dcd0;
}

.tab-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px;
  font-weight: 700;
  font-size: 14px;
  color: #5c6e58;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #2E7D32;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

/* FORMULARIO */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #2c3e2d;
  margin-bottom: 8px;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: #2c3e2d;
  background-color: #f9faf6;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  appearance: none;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s;
}

.custom-select:focus {
  border-color: #2E7D32;
}

.select-wrapper::after {
  content: '▼';
  font-size: 12px;
  color: #5c6e58;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* FICHA RÁPIDA */
.animal-quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fdfbf7;
  border: 1px solid #eaf0e6;
  border-radius: 16px;
  margin-bottom: 24px;
}

.quick-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #eaf0e6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 26px;
}

.quick-details h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
}

.quick-details p {
  margin: 0;
  font-size: 13px;
  color: #5c6e58;
}

.green-text {
  color: #2E7D32;
}

/* INPUTS CON UNIDAD */
.measurements-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-input {
  width: 100%;
  padding: 14px 45px 14px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e2d;
  background-color: #f9faf6;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s;
}

.custom-input:focus {
  border-color: #2E7D32;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}

.unit {
  position: absolute;
  right: 16px;
  font-weight: 700;
  color: #5c6e58;
  font-size: 14px;
}

.help-text {
  display: block;
  font-size: 12px;
  color: #7c8e78;
  margin-top: 4px;
}

/* ACCIÓN IA */
.ai-action-btn {
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --border-radius: 14px;
  --box-shadow: 0 10px 20px -10px rgba(46, 125, 50, 0.6);
  font-weight: 700;
  letter-spacing: 0.5px;
  height: 52px;
  margin-top: 24px;
}

/* ZONA DE CARGA FOTO */
.photo-upload-zone {
  border: 2px dashed #c0c5b1;
  border-radius: 18px;
  background: #fdfbf7;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.photo-upload-zone:hover {
  border-color: #2E7D32;
  background: #fbf9f4;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.upload-icon {
  font-size: 54px;
  color: #7c8e78;
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
}

.upload-title {
  font-size: 15px;
  font-weight: 700;
  color: #2c3e2d;
  margin: 0 0 4px;
}

.upload-subtitle {
  font-size: 12px;
  color: #7c8e78;
  margin: 0;
  max-width: 250px;
  line-height: 1.4;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-preview {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.change-photo-badge {
  position: absolute;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

/* EFECTO ESCANEO LÁSER */
.scanner-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(46, 125, 50, 0.12);
  border-radius: 12px;
  pointer-events: none;
}

.laser-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to bottom, transparent, #39ff14, transparent);
  box-shadow: 0 0 12px 3px #39ff14;
  animation: laserScan 2.5s infinite linear;
  pointer-events: none;
  z-index: 10;
}

@keyframes laserScan {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}

/* ERRORES */
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(211, 47, 47, 0.08);
  border: 1px solid rgba(211, 47, 47, 0.15);
  color: #d32f2f;
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 16px;
  font-size: 14px;
  font-weight: 600;
}

.error-msg ion-icon {
  font-size: 20px;
}

/* METRICAS DETECTADAS */
.detected-metrics-card {
  background: #fdfbf7;
  border: 1px solid #e2dcd0;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.detected-metrics-card h4 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #5c6e58;
}

.metric-val {
  font-weight: 700;
  color: #2c3e2d;
}

/* RESULTADO ESTIMACION */
.result-container {
  background: #ffffff;
  height: 100%;
}

.weight-gauge-container {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.weight-gauge-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 65%, #eaf0e6 66%, #2E7D32 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(46, 125, 50, 0.15);
  animation: pulse-ring 2s infinite ease-in-out;
}

.weight-value-big {
  font-size: 44px;
  font-weight: 900;
  color: #1B5E20;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.kg-unit {
  font-size: 16px;
  color: #5c6e58;
  font-weight: 700;
  margin-top: 4px;
}

.model-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f1f6ef;
  color: #2E7D32;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  margin-bottom: 24px;
}

.save-record-section {
  border-top: 1px solid #f4f1ea;
  padding-top: 24px;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
}

.save-btn {
  --background: #2E7D32;
  --border-radius: 14px;
  font-weight: 700;
  height: 48px;
}

.reset-btn {
  --border-color: #2E7D32;
  --color: #2E7D32;
  --border-radius: 14px;
  font-weight: 700;
  height: 48px;
}

/* DIAGRAMA DE AYUDA */
.cow-svg {
  width: 100%;
  max-width: 320px;
  height: auto;
  margin: 10px auto;
}

.cow-silhouette {
  fill: #e8ede4;
  stroke: #c0c5b1;
  stroke-width: 2px;
}

.cow-head {
  fill: #e8ede4;
  stroke: #c0c5b1;
  stroke-width: 2px;
}

.measure-line {
  stroke-width: 3px;
  stroke-dasharray: 4,4;
}

.length-line {
  stroke: #d97706;
}

.girth-line {
  stroke: #2E7D32;
  fill: none;
}

.measure-point {
  fill: #d97706;
  stroke: #ffffff;
  stroke-width: 1.5px;
}

.diagram-label {
  font-size: 11px;
  font-weight: 800;
  fill: #2c3e2d;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
  margin-top: 20px;
}

.step {
  display: flex;
  gap: 12px;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eaf0e6;
  color: #2E7D32;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.step p {
  margin: 0;
  font-size: 13.5px;
  color: #5c6e58;
  line-height: 1.4;
}

/* ANIMACIONES */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); box-shadow: 0 10px 30px rgba(46, 125, 50, 0.15); }
  50% { transform: scale(1.02); box-shadow: 0 10px 35px rgba(46, 125, 50, 0.25); }
  100% { transform: scale(1); box-shadow: 0 10px 30px rgba(46, 125, 50, 0.15); }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .estimation-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .intro-section h1 {
    font-size: 26px;
  }
  
  .measurements-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* DISEÑO DE SUBIDA MULTIPLE */
.upload-options-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.upload-option-card {
  background: #fdfbf7;
  border: 2px dashed #c0c5b1;
  border-radius: 18px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.25s ease;
}

.upload-option-card:hover {
  border-color: #2E7D32;
  background: #fbf9f4;
  transform: translateY(-2px);
}

.option-icon {
  font-size: 38px;
  color: #7c8e78;
  margin-bottom: 8px;
}

.option-title {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e2d;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 11px;
  color: #7c8e78;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;
}

.gallery-item-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2dcd0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.04);
}

.gallery-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(211, 47, 47, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  padding: 0;
  transition: transform 0.1s;
}

.delete-photo-btn:hover {
  transform: scale(1.1);
}

.delete-photo-btn ion-icon {
  font-size: 13px;
}

.photo-index-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(44, 62, 45, 0.85);
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
}

.gallery-add-card {
  aspect-ratio: 1;
  border: 2px dashed #c0c5b1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fdfbf7;
  cursor: pointer;
  transition: all 0.2s;
  color: #5c6e58;
  font-size: 11px;
  font-weight: 700;
  gap: 4px;
}

.gallery-add-card:hover {
  border-color: #2E7D32;
  color: #2E7D32;
  background: #fbf9f4;
}

.add-icon {
  font-size: 20px;
}

.gallery-actions-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.gallery-sub-btn {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2dcd0;
  color: #5c6e58;
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.gallery-sub-btn:hover {
  border-color: #2E7D32;
  color: #2E7D32;
  background: #fbf9f4;
}

.scanning-badge {
  position: absolute;
  bottom: 12px;
  background: rgba(46, 125, 50, 0.85);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  z-index: 20;
}

/* Warning disclaimer box */
.warning-box {
  background: #fff9e6;
  border: 1px solid #ffeeba;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 12px 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #856404;
  font-size: 13.5px;
  line-height: 1.4;
  text-align: left;
}

.warning-box ion-icon {
  font-size: 20px;
  color: #c59b27;
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
