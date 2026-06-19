<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="Atrás" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon">📊</span>
            <span class="app-logo">Reportes del Ganadero</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="reports-content">
      <div class="page-container">
        <!-- HEADER INFORMATIVO -->
        <div class="intro-section">
          <h1>Generador de Reportes de Pesaje</h1>
          <p>Selecciona los animales de tu rebaño, genera un reporte en formato PDF profesional para exportar y guárdalo en la base de datos para volver a exportarlo en el futuro con un solo clic.</p>
        </div>

        <!-- PESTAÑAS PRINCIPALES -->
        <div class="segment-container">
          <button 
            class="segment-button" 
            :class="{ active: activeTab === 'generate' }"
            @click="activeTab = 'generate'"
          >
            📋 Nuevo Reporte
          </button>
          <button 
            class="segment-button" 
            :class="{ active: activeTab === 'saved' }"
            @click="activeTab = 'saved'"
          >
            📂 Reportes Guardados ({{ savedReports.length }})
          </button>
        </div>

        <!-- 1. VISTA: GENERAR NUEVO REPORTE -->
        <div v-if="activeTab === 'generate'" class="section-content animate-fade-in">
          <div class="reports-grid">
            <!-- Columna Izquierda: Configuración del Reporte -->
            <div class="panel-card config-panel">
              <div class="panel-header">
                <h3>⚙️ Configuración del Reporte</h3>
              </div>
              <div class="panel-body">
                <form @submit.prevent="handleGenerateReport">
                  <div class="form-group">
                    <label class="form-label">Título del Reporte *</label>
                    <input 
                      type="text" 
                      v-model="newReport.titulo" 
                      required 
                      placeholder="Ej. Control de Peso - Lote Engorde" 
                      class="custom-input"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Descripción / Notas (Opcional)</label>
                    <textarea 
                      v-model="newReport.descripcion" 
                      rows="3" 
                      placeholder="Añade detalles sobre este grupo de animales, vacunas o alimentación..." 
                      class="custom-textarea"
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Dirigido a (Nombre de persona - Opcional)</label>
                    <input 
                      type="text" 
                      v-model="newReport.destinatario" 
                      placeholder="Ej. Juan Pérez" 
                      class="custom-input"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Filtrar por Finca</label>
                    <div class="select-wrapper">
                      <select v-model="selectedFincaId" class="custom-select">
                        <option :value="null">Todas las Fincas</option>
                        <option v-for="f in fincas" :key="f.id" :value="f.id">
                          {{ f.nombre }} ({{ f.bovinos_count || 0 }} animales)
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Info de Selección -->
                  <div class="selection-summary-card">
                    <div class="summary-item">
                      <span class="label">Animales Seleccionados:</span>
                      <span class="valueHighlight">{{ selectedAnimalIds.length }} / {{ filteredAnimals.length }}</span>
                    </div>
                    <div class="summary-item" v-if="selectedAnimalsWeightStats.count > 0">
                      <span class="label">Peso Promedio:</span>
                      <span class="value">{{ selectedAnimalsWeightStats.average }} kg</span>
                    </div>
                  </div>

                  <div class="button-group">
                    <ion-button 
                      type="submit" 
                      expand="block" 
                      class="btn-generate"
                      :disabled="selectedAnimalIds.length === 0 || generating"
                    >
                      <ion-spinner v-if="generating" name="crescent" slot="start"></ion-spinner>
                      <ion-icon v-else :icon="saveOutline" slot="start"></ion-icon>
                      {{ generating ? 'Guardando...' : 'GUARDAR Y DESCARGAR PDF' }}
                    </ion-button>

                    <ion-button 
                      type="button" 
                      fill="outline" 
                      expand="block" 
                      class="btn-preview"
                      :disabled="selectedAnimalIds.length === 0 || generating"
                      @click="downloadPdfOnly"
                    >
                      <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                      DESCARGAR PDF (SIN GUARDAR)
                    </ion-button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Columna Derecha: Selección de Animales -->
            <div class="panel-card animals-select-panel">
              <div class="panel-header header-with-actions">
                <h3>🐂 Seleccionar Animales</h3>
                <div class="header-actions">
                  <button class="btn-text-action" @click="toggleSelectAll">
                    {{ isAllSelected ? 'Desmarcar Todos' : 'Seleccionar Todos' }}
                  </button>
                </div>
              </div>
              <div class="panel-body no-padding">
                <div v-if="loadingAnimals" class="loading-state">
                  <ion-spinner name="crescent"></ion-spinner>
                  <p>Cargando rebaño...</p>
                </div>

                <div v-else-if="filteredAnimals.length === 0" class="empty-state-mini">
                  <span class="emoji">🐂</span>
                  <p>No hay animales disponibles para la finca seleccionada.</p>
                </div>

                <div v-else class="animals-check-list">
                  <div 
                    v-for="a in filteredAnimals" 
                    :key="a.id" 
                    class="animal-check-row"
                    :class="{ checked: selectedAnimalIds.includes(a.id) }"
                    @click="toggleAnimalSelection(a.id)"
                  >
                    <div class="checkbox-wrapper">
                      <div class="checkbox-custom" :class="{ active: selectedAnimalIds.includes(a.id) }">
                        <ion-icon :icon="checkmarkOutline" v-if="selectedAnimalIds.includes(a.id)"></ion-icon>
                      </div>
                    </div>
                    <div class="animal-check-info">
                      <div class="row-top">
                        <span class="name">{{ a.nombre }}</span>
                        <span class="arete">#{{ a.arete || 'Sin Arete' }}</span>
                      </div>
                      <div class="row-bottom">
                        <span>{{ a.raza }} | {{ a.edad }}</span>
                        <span class="finca-badge" v-if="!selectedFincaId">{{ getFincaName(a) }}</span>
                      </div>
                    </div>
                    <div class="animal-check-weight">
                      <span class="weight">{{ a.pesoActual > 0 ? `${a.pesoActual} kg` : 'N/A' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. VISTA: REPORTES ANTERIORES GUARDADOS -->
        <div v-if="activeTab === 'saved'" class="section-content animate-fade-in">
          <div v-if="loadingReports" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Cargando historial de reportes...</p>
          </div>

          <div v-else-if="savedReports.length === 0" class="empty-state">
            <span class="empty-icon">📂</span>
            <h3>No tienes reportes guardados</h3>
            <p>Crea tu primer reporte en la pestaña de "Nuevo Reporte" para guardarlo en la base de datos y tenerlo disponible para exportaciones rápidas.</p>
            <button class="primary-btn" @click="activeTab = 'generate'">Crear Nuevo Reporte</button>
          </div>

          <div v-else class="reports-list">
            <div v-for="r in savedReports" :key="r.id" class="report-card">
              <div class="report-card-main">
                <div class="report-icon-wrapper">
                  <span>📄</span>
                </div>
                <div class="report-info">
                  <h3>{{ r.titulo }}</h3>
                  <p class="description" v-if="r.descripcion">{{ r.descripcion }}</p>
                  <p class="meta">
                    📅 Creado: <strong>{{ r.fecha_creacion }}</strong> | 
                    🐂 Animales: <strong>{{ r.cant_animales }}</strong>
                    <span v-if="r.destinatario"> | 👤 Para: <strong>{{ r.destinatario }}</strong></span>
                  </p>
                </div>
              </div>
              <div class="report-card-actions" style="display: flex; gap: 4px; flex-wrap: wrap; width: 100%;">
                <ion-button 
                  size="small" 
                  fill="clear"
                  class="btn-action-view"
                  @click="openReportPreview(r)"
                >
                  <ion-icon :icon="eyeOutline" slot="start"></ion-icon>
                  VER
                </ion-button>
                <ion-button 
                  size="small" 
                  class="btn-action-export"
                  @click="reExportReport(r)"
                >
                  <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                  EXPORTAR
                </ion-button>
                <ion-button
                  size="small"
                  color="primary"
                  fill="clear"
                  @click="shareReportPdfFile(r)"
                  title="Compartir PDF"
                  style="--padding-start: 4px; --padding-end: 4px;"
                >
                  <ion-icon :icon="shareSocialOutline" slot="icon-only"></ion-icon>
                </ion-button>
                <button 
                  class="delete-report-btn" 
                  @click="confirmDeleteReport(r)"
                  title="Eliminar Reporte"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </ion-content>

    <!-- NOTIFICACIONES TOAST -->
    <ion-toast
      :is-open="toast.show"
      :message="toast.message"
      :color="toast.color"
      :duration="3000"
      @didDismiss="toast.show = false"
    ></ion-toast>

    <!-- MODAL DE VISTA PREVIA -->
    <ion-modal :is-open="showPreviewModal" @didDismiss="closePreviewModal" class="preview-modal">
      <div class="modal-wrapper">
        <div class="modal-header">
          <h2>👁️ Vista Previa de Reporte</h2>
          <button class="close-modal-btn" @click="closePreviewModal">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </div>
        
        <div v-if="loadingPreview" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando detalles del reporte...</p>
        </div>
        
        <div v-else-if="previewReport" class="modal-body">
          <div class="preview-report-header">
            <h1>{{ previewReport.titulo }}</h1>
            <p class="preview-date">📅 Creado el: <strong>{{ previewReport.fecha_creacion }}</strong></p>
            <p class="preview-desc" v-if="previewReport.destinatario">👤 Dirigido a: <strong>{{ previewReport.destinatario }}</strong></p>
            <p class="preview-desc" v-if="previewReport.descripcion">{{ previewReport.descripcion }}</p>
          </div>
          
          <!-- Estadísticas del Reporte -->
          <div class="preview-stats-grid">
            <div class="preview-stat-card">
              <span class="icon">🐂</span>
              <div class="stat-info">
                <span class="label">Total Animales</span>
                <span class="value">{{ previewReport.animales?.length || 0 }}</span>
              </div>
            </div>
            
            <div class="preview-stat-card" v-if="previewReportStats.average > 0">
              <span class="icon">⚖️</span>
              <div class="stat-info">
                <span class="label">Peso Promedio</span>
                <span class="value">{{ previewReportStats.average }} kg</span>
              </div>
            </div>

            <div class="preview-stat-card" v-if="previewReportStats.max > 0">
              <span class="icon">📈</span>
              <div class="stat-info">
                <span class="label">Peso Máximo</span>
                <span class="value">{{ previewReportStats.max }} kg</span>
              </div>
            </div>
          </div>
          
          <!-- Tabla de Animales -->
          <div class="preview-table-container">
            <h3>Lista de Animales en este Reporte</h3>
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Arete</th>
                  <th>Nombre</th>
                  <th>Raza</th>
                  <th>Sexo</th>
                  <th>Edad</th>
                  <th>Peso Actual</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in previewReport.animales" :key="a.id">
                  <td><span class="arete-badge">#{{ a.arete || 'N/A' }}</span></td>
                  <td><strong>{{ a.nombre }}</strong></td>
                  <td>{{ a.raza || 'Brahman' }}</td>
                  <td>{{ a.sexo === 'hembra' ? 'Hembra' : 'Macho' }}</td>
                  <td>{{ a.edad || 'N/A' }}</td>
                  <td><span class="weight-badge">{{ a.pesoActual > 0 ? `${a.pesoActual} kg` : 'N/A' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="modal-footer" style="flex-wrap: wrap; gap: 8px;">
          <ion-button fill="outline" @click="closePreviewModal" class="btn-footer-close" style="flex: 1; min-width: 100px;">
            Cerrar
          </ion-button>
          <ion-button @click="exportPreviewPdf" class="btn-footer-export" :disabled="!previewReport" style="flex: 1; min-width: 130px;">
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            Exportar PDF
          </ion-button>
          <ion-button v-if="previewReport" color="primary" @click="sharePreviewPdfFile" style="flex: 1; min-width: 130px;">
            <ion-icon :icon="shareSocialOutline" slot="start"></ion-icon>
            Compartir PDF
          </ion-button>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonButtons, IonBackButton, IonSpinner, IonToast, IonModal
} from '@ionic/vue';
import { 
  saveOutline, downloadOutline, checkmarkOutline, trashOutline, eyeOutline, closeOutline,
  logoWhatsapp, mailOutline, shareSocialOutline
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository, type Animal } from '@/services';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Estado de navegación y vistas
const activeTab = ref<'generate' | 'saved'>('generate');
const loadingAnimals = ref(true);
const loadingReports = ref(true);
const generating = ref(false);

// Estado para vista previa
const showPreviewModal = ref(false);
const loadingPreview = ref(false);
const previewReport = ref<any>(null);

const previewReportStats = computed(() => {
  if (!previewReport.value || !previewReport.value.animales) {
    return { average: 0, max: 0, min: 0 };
  }
  const weights = previewReport.value.animales.filter((a: any) => a.pesoActual > 0).map((a: any) => a.pesoActual);
  if (weights.length === 0) return { average: 0, max: 0, min: 0 };
  const total = weights.reduce((acc: number, curr: number) => acc + curr, 0);
  return {
    average: Math.round(total / weights.length),
    max: Math.max(...weights),
    min: Math.min(...weights)
  };
});

async function openReportPreview(report: any) {
  showPreviewModal.value = true;
  loadingPreview.value = true;
  previewReport.value = null;
  try {
    const detail = await animalRepository.getReporteDetalleGanadero(report.id);
    previewReport.value = detail;
  } catch (e: any) {
    showToast('Error al obtener el detalle del reporte: ' + e.message, 'danger');
    showPreviewModal.value = false;
  } finally {
    loadingPreview.value = false;
  }
}

function closePreviewModal() {
  showPreviewModal.value = false;
  previewReport.value = null;
}

async function exportPreviewPdf() {
  if (!previewReport.value) return;
  await doGeneratePdf(
    previewReport.value.titulo, 
    previewReport.value.descripcion || '', 
    previewReport.value.destinatario || '', 
    previewReport.value.animales || []
  );
}

// Datos cargados de la API
const fincas = ref<any[]>([]);
const animals = ref<Animal[]>([]);
const savedReports = ref<any[]>([]);

// Filtros y formulario de nuevo reporte
const selectedFincaId = ref<number | null>(null);
const selectedAnimalIds = ref<number[]>([]);
const newReport = ref({
  titulo: '',
  descripcion: '',
  destinatario: ''
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

// Datos del usuario actual de la sesión
const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

// Cargar información inicial
async function loadAllData() {
  await fetchFincas();
  await fetchAnimals();
  await fetchSavedReports();
}

async function fetchFincas() {
  try {
    fincas.value = await animalRepository.getFincas();
  } catch (e) {
    console.error('Error cargando fincas:', e);
  }
}

async function fetchAnimals() {
  loadingAnimals.value = true;
  try {
    animals.value = await animalRepository.getAllAnimals();
  } catch (e: any) {
    showToast('Error al obtener animales: ' + e.message, 'danger');
  } finally {
    loadingAnimals.value = false;
  }
}

async function fetchSavedReports() {
  loadingReports.value = true;
  try {
    savedReports.value = await animalRepository.getReportesGanadero();
  } catch (e: any) {
    console.error('Error cargando reportes:', e);
  } finally {
    loadingReports.value = false;
  }
}

// Animales filtrados según finca seleccionada
const filteredAnimals = computed(() => {
  if (!selectedFincaId.value) return animals.value;
  return animals.value.filter(a => (a as any).finca_id === selectedFincaId.value);
});

// Obtener el nombre de la finca del animal
function getFincaName(animal: any) {
  return animal.finca_nombre || 'Mi Finca';
}

// Estadísticas de los animales seleccionados
const selectedAnimalsWeightStats = computed(() => {
  const selected = animals.value.filter(a => selectedAnimalIds.value.includes(a.id));
  if (selected.length === 0) return { count: 0, average: 0 };
  const weights = selected.filter(a => a.pesoActual > 0).map(a => a.pesoActual);
  if (weights.length === 0) return { count: selected.length, average: 0 };
  const total = weights.reduce((acc, curr) => acc + curr, 0);
  return {
    count: selected.length,
    average: Math.round(total / weights.length)
  };
});

// Selección de animales
function toggleAnimalSelection(animalId: number) {
  const index = selectedAnimalIds.value.indexOf(animalId);
  if (index > -1) {
    selectedAnimalIds.value.splice(index, 1);
  } else {
    selectedAnimalIds.value.push(animalId);
  }
}

const isAllSelected = computed(() => {
  return filteredAnimals.value.length > 0 && selectedAnimalIds.value.length === filteredAnimals.value.length;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedAnimalIds.value = [];
  } else {
    selectedAnimalIds.value = filteredAnimals.value.map(a => a.id);
  }
}

// Helper para convertir una URL de imagen a base64 usando el proxy de Laravel (evita CORS)
async function getBase64ImageFromUrl(url: string): Promise<string> {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://bovweightcr-production.up.railway.app/api';
  const response = await fetch(`${apiUrl}/obtener-imagen-base64?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Error al obtener la imagen del servidor');
  }
  const data = await response.json();
  if (data && data.base64) {
    return data.base64;
  }
  throw new Error('Formato de imagen inválido devuelto por el servidor');
}

// Helper para generar el PDF a nivel cliente
async function generatePdfObject(title: string, description: string, destinatario: string, reportAnimals: any[]): Promise<jsPDF> {
  showToast('Generando reporte PDF con fotografías...');
  const doc = new jsPDF();
  const userName = usuarioSesion.value?.nombre_completo || 'Ganadero BovWeight';
  const currentDate = new Date().toLocaleDateString('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // --- PRIMERA PÁGINA: PORTADA/RESUMEN ---
  // Color principal: Verde bosque (#1B5E20)
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, 210, 38, 'F');

  // Texto del header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BovWeight CR', 14, 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Control y Estimación de Peso de Ganado Inteligente', 14, 25);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(`Generado el: ${currentDate}`, 140, 25);

  // --- CONTENIDO ---
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 48);

  if (description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const splitDesc = doc.splitTextToSize(description, 182);
    doc.text(splitDesc, 14, 55);
  }

  const lineY = description ? 68 : 56;
  doc.setDrawColor(226, 220, 208);
  doc.setLineWidth(0.5);
  doc.line(14, lineY, 196, lineY);

  // --- DATOS INFORMATIVOS ---
  const statsY = lineY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 94, 32);
  doc.text('INFORMACIÓN GENERAL DEL LOTE', 14, statsY);

  const totalAnimals = reportAnimals.length;
  const weights = reportAnimals.filter(a => a.pesoActual > 0).map(a => a.pesoActual);
  const averageWeight = weights.length > 0 
    ? Math.round(weights.reduce((sum, w) => sum + w, 0) / weights.length) 
    : 0;
  
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Propietario: ${userName}`, 14, statsY + 6);
  
  if (destinatario) {
    doc.text(`Dirigido a: ${destinatario}`, 14, statsY + 12);
    doc.text(`Cantidad de animales: ${totalAnimals}`, 14, statsY + 18);
  } else {
    doc.text(`Cantidad de animales: ${totalAnimals}`, 14, statsY + 12);
  }
  
  doc.text(`Peso promedio: ${averageWeight > 0 ? averageWeight + ' kg' : 'N/A'}`, 110, statsY + 6);
  if (weights.length > 0) {
    doc.text(`Peso máximo: ${maxWeight} kg  |  Peso mínimo: ${minWeight} kg`, 110, statsY + 12);
  }

  // --- TABLA DE DETALLES ---
  const tableY = statsY + (destinatario ? 28 : 22);
  const tableRows = reportAnimals.map((a, idx) => {
    return [
      idx + 1,
      a.arete || 'N/A',
      a.nombre || 'Sin nombre',
      a.raza || 'Brahman',
      a.sexo === 'hembra' ? 'Hembra' : 'Macho',
      a.edad || 'N/A',
      a.pesoActual > 0 ? `${a.pesoActual} kg` : 'N/A',
      a.finca_nombre || a.finca || 'Mi Finca'
    ];
  });

  autoTable(doc, {
    startY: tableY,
    head: [['N°', 'Arete/Tag', 'Nombre', 'Raza', 'Sexo', 'Edad', 'Peso Actual', 'Finca']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [27, 94, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [245, 248, 244]
    },
    margin: { left: 14, right: 14 }
  });

  // --- DETALLE INDIVIDUAL DE CADA ANIMAL ---
  for (const a of reportAnimals) {
    doc.addPage();
    
    // Encabezado del animal
    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, 210, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`FICHA TÉCNICA: ${a.nombre || 'Sin nombre'} (Arete/Tag: ${a.arete || 'N/A'})`, 14, 13);
    
    let currentY = 32;
    
    // Columna 1: Datos Generales
    doc.setTextColor(27, 94, 32);
    doc.setFontSize(11);
    doc.text('DATOS GENERALES', 14, currentY);
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Nombre: ${a.nombre || 'Sin nombre'}`, 14, currentY + 7);
    doc.text(`Número de Arete: ${a.arete || 'N/A'}`, 14, currentY + 13);
    doc.text(`Raza: ${a.raza || 'Brahman'}`, 14, currentY + 19);
    doc.text(`Edad: ${a.edad || 'N/A'}`, 14, currentY + 25);
    doc.text(`Sexo: ${a.sexo === 'hembra' ? 'Hembra' : 'Macho'}`, 14, currentY + 31);
    doc.text(`Color: ${a.color || 'No especificado'}`, 14, currentY + 37);
    doc.text(`Finca: ${a.finca_nombre || a.finca || 'Mi Finca'}`, 14, currentY + 43);
    doc.text(`Peso Actual: ${a.pesoActual > 0 ? a.pesoActual + ' kg' : 'Sin pesajes'}`, 14, currentY + 49);

    // Columna 2: Fotografía principal
    const imgX = 118;
    const imgY = 30;
    const imgW = 78;
    const imgH = 56;
    
    // Dibujar borde para el contenedor de la imagen
    doc.setDrawColor(210, 215, 205);
    doc.setLineWidth(0.5);
    
    if (a.imagen) {
      try {
        const base64 = await getBase64ImageFromUrl(a.imagen);
        doc.addImage(base64, 'JPEG', imgX, imgY, imgW, imgH);
      } catch (err) {
        console.error('Error al cargar imagen del bovino para PDF:', err);
        doc.rect(imgX, imgY, imgW, imgH);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text('Fotografía no disponible', imgX + 22, imgY + 30);
      }
    } else {
      doc.rect(imgX, imgY, imgW, imgH);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin fotografía registrada', imgX + 22, imgY + 30);
    }
    
    // Sección inferior: Historial de pesajes/estimaciones
    currentY = 96;
    doc.setTextColor(27, 94, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HISTORIAL DE ESTIMACIONES Y REGISTRO DE PESOS', 14, currentY);
    
    // Mapear los pesajes/estimaciones detallados
    const estRows = (a.estimaciones || []).map((est: any, eIdx: number) => {
      return [
        eIdx + 1,
        est.fecha,
        est.peso_estimado ? `${est.peso_estimado} kg` : 'N/A',
        est.peso_corregido ? `${est.peso_corregido} kg` : 'Sin corregir',
        est.peso_corregido ? 'Corregido por Báscula' : 'Estimación por Foto IA'
      ];
    });
    
    // Si no tiene registros en el campo estimaciones, usar el historialPeso por defecto
    if (estRows.length === 0 && a.historialPeso && a.historialPeso.length > 0) {
      a.historialPeso.forEach((hp: any, eIdx: number) => {
        estRows.push([
          eIdx + 1,
          hp.fecha,
          `${hp.peso} kg`,
          'N/A',
          'Registro Histórico'
        ]);
      });
    }

    if (estRows.length === 0) {
      estRows.push(['-', 'Sin registros de pesajes', '-', '-', '-']);
    }
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['N°', 'Fecha de Registro', 'Peso Estimado IA', 'Peso Báscula', 'Método/Tipo']],
      body: estRows,
      theme: 'striped',
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5
      },
      margin: { left: 14, right: 14 }
    });
  }

  // --- PIE DE PÁGINA ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(240, 240, 240);
    doc.line(14, 280, 196, 280);
    
    doc.text('BovWeight CR - Sistema de Monitoreo Pecuario Móvil', 14, 285);
    doc.text(`Página ${i} de ${pageCount}`, 180, 285);
  }

  return doc;
}

async function doGeneratePdf(title: string, description: string, destinatario: string, reportAnimals: any[]) {
  const doc = await generatePdfObject(title, description, destinatario, reportAnimals);
  if (!doc) return;
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `reporte_${safeTitle || 'ganado'}.pdf`;
      
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache
      });
      
      await Share.share({
        title: title || 'Reporte de Pesaje',
        text: 'Reporte de Pesaje PDF - BovWeight CR',
        url: writeResult.uri,
        dialogTitle: 'Exportar PDF'
      });
      
      showToast('Reporte generado para compartir o guardar.');
    } catch (err: any) {
      console.error('Error al exportar PDF nativo:', err);
      showToast('Error al exportar PDF: ' + err.message, 'danger');
    }
  } else {
    doc.save(`reporte_${safeTitle || 'ganado'}.pdf`);
    showToast('Reporte PDF descargado exitosamente.');
  }
}

// Acción: Descargar PDF sin persistir en BD
async function downloadPdfOnly() {
  if (selectedAnimalIds.value.length === 0) return;
  const reportAnimals = animals.value.filter(a => selectedAnimalIds.value.includes(a.id));
  const title = newReport.value.titulo.trim() || 'Reporte de Ganado';
  const desc = newReport.value.descripcion.trim();
  const dest = newReport.value.destinatario.trim();
  
  await doGeneratePdf(title, desc, dest, reportAnimals);
}

// Acción: Crear y guardar reporte en base de datos + Descargar PDF
async function handleGenerateReport() {
  if (selectedAnimalIds.value.length === 0) return;
  generating.value = true;
  
  const title = newReport.value.titulo.trim() || 'Reporte de Ganado';
  const desc = newReport.value.descripcion.trim();
  const dest = newReport.value.destinatario.trim();

  try {
    // 1. Guardar en la base de datos
    await animalRepository.guardarReporteGanadero({
      titulo: title,
      descripcion: desc || null,
      destinatario: dest || null,
      animal_ids: selectedAnimalIds.value
    });

    // 2. Filtrar animales seleccionados
    const reportAnimals = animals.value.filter(a => selectedAnimalIds.value.includes(a.id));

    // 3. Generar y descargar el PDF
    await doGeneratePdf(title, desc, dest, reportAnimals);

    // 4. Limpiar campos y refrescar
    newReport.value.titulo = '';
    newReport.value.descripcion = '';
    newReport.value.destinatario = '';
    selectedAnimalIds.value = [];
    
    // Refrescar listado
    await fetchSavedReports();
    
    // Cambiar a la pestaña de reportes guardados
    activeTab.value = 'saved';
    showToast('¡Reporte guardado y exportado exitosamente!');
  } catch (e: any) {
    showToast(e.message || 'Error al guardar el reporte.', 'danger');
  } finally {
    generating.value = false;
  }
}

// Acción: Re-exportar un reporte guardado (con pesos actuales)
async function reExportReport(report: any) {
  try {
    const detail = await animalRepository.getReporteDetalleGanadero(report.id);
    if (detail && detail.animales) {
      await doGeneratePdf(detail.titulo, detail.descripcion || '', detail.destinatario || '', detail.animales);
    } else {
      showToast('No se pudieron obtener los animales asociados al reporte.', 'danger');
    }
  } catch (e: any) {
    showToast('Error al re-exportar reporte: ' + e.message, 'danger');
  }
}

// Acción: Eliminar reporte guardado
async function confirmDeleteReport(report: any) {
  if (confirm(`¿Estás seguro de eliminar permanentemente el reporte "${report.titulo}"?`)) {
    try {
      await animalRepository.eliminarReporteGanadero(report.id);
      showToast('Reporte eliminado exitosamente.');
      await fetchSavedReports();
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar el reporte.', 'danger');
    }
  }
}
async function shareReportPdfFile(report: any) {
  let reportAnimals = report.animales;
  if (!reportAnimals) {
    try {
      const detail = await animalRepository.getReporteDetalleGanadero(report.id);
      reportAnimals = detail.animales;
    } catch (e: any) {
      showToast('Error al obtener los detalles del reporte: ' + e.message, 'danger');
      return;
    }
  }

  showToast('Preparando archivo PDF...');
  try {
    const doc = await generatePdfObject(report.titulo, report.descripcion || '', report.destinatario || '', reportAnimals);
    if (!doc) return;

    const safeTitle = report.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'reporte';

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `reporte_${safeTitle}.pdf`;
      
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache
      });
      
      await Share.share({
        title: report.titulo || 'Reporte de Pesaje',
        text: 'Te comparto el reporte de pesaje en PDF desde BovWeight CR.',
        url: writeResult.uri,
        dialogTitle: 'Compartir Reporte'
      });
      showToast('¡Reporte listo para compartir!');
    } else {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `reporte_${safeTitle}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: report.titulo || 'Reporte de Pesaje',
          text: 'Te comparto el reporte de pesaje en PDF desde BovWeight CR.'
        });
        showToast('¡Reporte compartido exitosamente!');
      } else {
        // Fallback: descargar el PDF
        doc.save(`reporte_${safeTitle}.pdf`);
        showToast('La API de compartir no está soportada en este navegador. Se ha descargado el PDF.', 'warning');
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      showToast('Error al compartir el archivo: ' + err.message, 'danger');
    }
  }
}

async function sharePreviewPdfFile() {
  if (!previewReport.value) return;
  await shareReportPdfFile(previewReport.value);
}

// Al montar el componente
onMounted(loadAllData);
</script>

<style scoped>
.reports-content {
  --background: #f4f6f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 16px 80px; /* space for mobile safe area */
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
.back-btn { --color: #5c6e58; }

/* Intro */
.intro-section {
  margin-bottom: 24px;
}

.intro-section h1 {
  font-size: 28px;
  font-weight: 900;
  color: #1B5E20;
  margin: 0 0 6px;
  letter-spacing: -0.8px;
}

.intro-section p {
  font-size: 14px;
  color: #5c6e58;
  margin: 0;
  line-height: 1.5;
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

/* GRID LAYOUT FOR GENERATE REPORT */
.reports-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr;
  gap: 20px;
  align-items: start;
}

.panel-card {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 18px 20px;
  border-bottom: 1px solid #f4f1ea;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
}

.panel-header.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-text-action {
  background: transparent;
  border: none;
  color: #2E7D32;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  outline: none;
}

.btn-text-action:hover {
  text-decoration: underline;
}

.panel-body {
  padding: 20px;
}

.panel-body.no-padding {
  padding: 0;
}

/* FORM STYLES */
.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #1B5E20;
  margin-bottom: 6px;
}

.custom-input, .custom-textarea, .custom-select {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  color: #2c3e2d;
  background-color: #fcfdfa;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.custom-input:focus, .custom-textarea:focus, .custom-select:focus {
  border-color: #2E7D32;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select {
  appearance: none;
  cursor: pointer;
}

/* Selection summary */
.selection-summary-card {
  background: #eaf0e6;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 20px;
  border: 1px solid rgba(46, 125, 50, 0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #2c3e2d;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  font-weight: 600;
}

.summary-item .value {
  font-weight: 800;
  color: #1B5E20;
}

.summary-item .valueHighlight {
  font-weight: 800;
  color: white;
  background: #2E7D32;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
}

/* BUTTONS */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-generate {
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
  font-weight: 700;
  height: 44px;
}

.btn-preview {
  --color: #1B5E20;
  --border-color: #2E7D32;
  --border-radius: 12px;
  font-weight: 700;
  height: 44px;
}

/* ANIMALS SELECT LIST */
.animals-check-list {
  max-height: 480px;
  overflow-y: auto;
  padding: 10px;
  background: #fdfdfd;
}

.animal-check-row {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: white;
  border: 1px solid rgba(46, 125, 50, 0.05);
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.animal-check-row:hover {
  border-color: rgba(46, 125, 50, 0.2);
  transform: translateY(-1px);
}

.animal-check-row.checked {
  background: #f9fbf8;
  border-color: #2E7D32;
}

.checkbox-wrapper {
  margin-right: 12px;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #c0c5b1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: white;
}

.checkbox-custom.active {
  background: #2E7D32;
  border-color: #2E7D32;
  color: white;
}

.checkbox-custom ion-icon {
  font-size: 14px;
}

.animal-check-info {
  flex: 1;
}

.animal-check-info .row-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.animal-check-info .name {
  font-weight: 700;
  font-size: 14px;
  color: #1B5E20;
}

.animal-check-info .arete {
  font-size: 11px;
  font-weight: 700;
  background: #eaf0e6;
  color: #1B5E20;
  padding: 1px 6px;
  border-radius: 6px;
}

.animal-check-info .row-bottom {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #5c6e58;
  margin-top: 2px;
  align-items: center;
}

.finca-badge {
  background: #f4f1ea;
  color: #5c6e58;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
}

.animal-check-weight {
  text-align: right;
}

.animal-check-weight .weight {
  font-size: 13px;
  font-weight: 800;
  color: #1B5E20;
  background: #eaf0e6;
  padding: 3px 8px;
  border-radius: 8px;
}

/* HISTORIAL / GUARDADOS LIST */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  background: white;
  border-radius: 20px;
  padding: 16px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.report-card:hover {
  border-color: #2E7D32;
  transform: translateY(-1px);
}

.report-card-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.report-icon-wrapper {
  width: 44px;
  height: 44px;
  background: #eaf0e6;
  color: #2E7D32;
  font-size: 22px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-info h3 {
  margin: 0 0 3px;
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
}

.report-info .description {
  margin: 0 0 6px;
  font-size: 12px;
  color: #5c6e58;
}

.report-info .meta {
  margin: 0;
  font-size: 11px;
  color: #8fa08c;
}

.report-info .meta strong {
  color: #5c6e58;
}

.report-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-action-export {
  --background: #eaf0e6;
  --color: #1B5E20;
  --border-radius: 10px;
  font-weight: 700;
  font-size: 11px;
  height: 34px;
}

.delete-report-btn {
  background: transparent;
  border: none;
  color: #c0c5b1;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  outline: none;
}

.delete-report-btn:active, .delete-report-btn:hover {
  background: #fff5f5;
  color: #d32f2f;
}

/* STATES */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #5c6e58;
  gap: 12px;
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
  max-width: 340px;
  line-height: 1.5;
}

.empty-state-mini {
  padding: 40px 20px;
  text-align: center;
  color: #5c6e58;
}

.empty-state-mini .emoji {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}

.empty-state-mini p {
  font-size: 13px;
  margin: 0;
}

.primary-btn {
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
  transition: transform 0.2s ease;
  margin: 0 auto;
}

.primary-btn:active {
  transform: scale(0.98);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .reports-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-container {
    padding: 16px 12px 80px;
  }
  
  .intro-section h1 {
    font-size: 22px;
  }
  
  .report-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
  }
  
  .report-card-actions {
    width: 100%;
    justify-content: space-between;
    border-top: 1px solid #f4f6f0;
    padding-top: 10px;
  }
  
  .btn-action-export {
    flex: 1;
  }
}

/* PREVIEW MODAL STYLES */
.preview-modal {
  --background: #f4f6f0;
  --border-radius: 24px;
}

.modal-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f4f6f0;
  color: #2c3e2d;
}

.modal-header {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid rgba(46, 125, 50, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  align-items: center;
  justify-content: center;
  outline: none;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.preview-report-header {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.preview-report-header h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 900;
  color: #1B5E20;
}

.preview-date {
  font-size: 12px;
  color: #8fa08c;
  margin: 0 0 10px;
}

.preview-desc {
  font-size: 13px;
  color: #5c6e58;
  line-height: 1.5;
  margin: 0;
}

.preview-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.preview-stat-card {
  background: white;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.preview-stat-card .icon {
  font-size: 24px;
}

.preview-stat-card .stat-info {
  display: flex;
  flex-direction: column;
}

.preview-stat-card .label {
  font-size: 11px;
  color: #8fa08c;
  font-weight: 500;
}

.preview-stat-card .value {
  font-size: 15px;
  font-weight: 850;
  color: #1B5E20;
}

.preview-table-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.preview-table-container h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 800;
  color: #1B5E20;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th {
  text-align: left;
  padding: 10px;
  font-weight: 700;
  color: #5c6e58;
  border-bottom: 2px solid #f4f6f0;
}

.preview-table td {
  padding: 10px;
  border-bottom: 1px solid #f4f6f0;
  color: #2c3e2d;
}

.arete-badge {
  font-size: 10px;
  font-weight: 700;
  background: #eaf0e6;
  color: #1B5E20;
  padding: 2px 6px;
  border-radius: 6px;
}

.weight-badge {
  font-weight: 800;
  color: #1B5E20;
}

.modal-footer {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid rgba(46, 125, 50, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-footer-close {
  --color: #5c6e58;
  --border-color: #c0c5b1;
  --border-radius: 12px;
}

.btn-footer-export {
  --background: #1B5E20;
  --border-radius: 12px;
}

.btn-action-view {
  --color: #2E7D32;
  font-weight: 700;
  font-size: 11px;
}

@media (max-width: 576px) {
  .preview-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
