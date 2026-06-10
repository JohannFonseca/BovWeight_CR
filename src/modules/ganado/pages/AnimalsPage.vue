<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="Atrás" class="back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐂</span>
            <span class="app-logo">Mis Animales</span>
          </div>
        </ion-title>
      </ion-toolbar>
      <!-- Barra de Búsqueda -->
      <ion-toolbar class="search-toolbar">
        <div class="search-container">
          <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por nombre o número de arete..." 
            class="custom-search-input"
          />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="animals-page-content">
      <div class="page-container">
        <!-- Selector de Finca -->
        <div class="finca-filter-container">
          <label class="filter-label">Finca Activa:</label>
          <div class="select-wrapper">
            <select v-model="selectedFincaName" class="custom-select">
              <option value="all">Todas las Fincas</option>
              <option v-for="f in uniqueFincaNames" :key="f" :value="f">
                {{ f }}
              </option>
            </select>
          </div>
        </div>

        <!-- Carga o Estados vacíos -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando el rebaño...</p>
        </div>

        <div v-else-if="filteredGroups.length === 0" class="empty-state">
          <span class="emoji">🐂</span>
          <h3>No se encontraron animales</h3>
          <p v-if="searchQuery">Intenta ajustar tu búsqueda o el filtro de fincas.</p>
          <p v-else>Comienza registrando tu primer animal en el sistema.</p>
          <ion-button router-link="/ganado/registrar" class="btn-register-empty">
            Registrar Animal
          </ion-button>
        </div>

        <!-- Grupos por Finca -->
        <div v-else class="fincas-grid">
          <div 
            v-for="finca in filteredGroups" 
            :key="finca.nombre"
            class="finca-card-group"
          >
            <!-- Título de la Finca -->
            <div class="finca-header">
              <div class="finca-title-left">
                <span class="icon">🏡</span>
                <h3>{{ finca.nombre }}</h3>
              </div>
              <span class="finca-badge">{{ finca.animales.length }} animales</span>
            </div>

            <!-- Listado de Animales -->
            <div class="animals-list">
              <router-link
                v-for="a in finca.animales"
                :key="a.id"
                :to="`/animal/${a.id}`"
                class="animal-card-item"
              >
                <div class="animal-avatar">
                  <span class="cow-icon">🐄</span>
                </div>
                
                <div class="animal-details">
                  <div class="animal-name-row">
                    <span class="name">{{ a.nombre }}</span>
                    <span class="arete-tag">#{{ a.arete || 'Sin arete' }}</span>
                  </div>
                  
                  <div class="animal-meta-row">
                    <span>{{ a.raza }}</span>
                    <span class="sex-badge" :class="a.sexo">
                      {{ a.sexo === 'hembra' ? '♀' : '♂' }}
                    </span>
                  </div>

                  <!-- Información de Pesajes por Animal -->
                  <div class="animal-weigh-dates">
                    <div class="date-item">
                      <span class="label">Último Pesaje</span>
                      <span class="value">{{ getAnimalWeighDates(a).ultimo }}</span>
                    </div>
                    <div class="date-divider"></div>
                    <div class="date-item">
                      <span class="label">Próximo Pesaje</span>
                      <span class="value next" :class="{ alert: getAnimalWeighDates(a).ultimo === 'Sin registros' }">
                        {{ getAnimalWeighDates(a).proximo }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="animal-weight-col">
                  <div class="weight-box">
                    <span class="weight">{{ a.pesoActual > 0 ? `${a.pesoActual}` : 'S/P' }}</span>
                    <span class="unit" v-if="a.pesoActual > 0">kg</span>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="arrow-icon"></ion-icon>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Navigation para Móvil -->
      <BottomNav />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonIcon, IonSpinner, IonButton
} from '@ionic/vue';
import { 
  searchOutline, chevronForwardOutline, pawOutline 
} from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository, type Animal } from '@/services';

const animals = ref<Animal[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedFincaName = ref('all');

async function loadAnimals() {
  loading.value = true;
  try {
    animals.value = await animalRepository.getAllAnimals();
  } catch (e) {
    console.error('Error al cargar animales:', e);
  } finally {
    loading.value = false;
  }
}

// Obtener lista única de Fincas para el selector
const uniqueFincaNames = computed(() => {
  const names = animals.value.map(a => (a as any).finca_nombre || 'Sin Finca');
  return [...new Set(names)].filter(name => name);
});

// Fechas de pesaje para cada animal
function getAnimalWeighDates(a: Animal) {
  const lastRecord = a.historialPeso && a.historialPeso.length > 0
    ? a.historialPeso[a.historialPeso.length - 1]
    : null;
  
  const ultimo = lastRecord ? lastRecord.fecha : 'Sin registros';
  let proximo = 'Hoy mismo';
  
  if (lastRecord && lastRecord.fecha) {
    const parts = lastRecord.fecha.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      
      const date = new Date(year, month, day);
      date.setMonth(date.getMonth() + 1);
      
      const nextDay = String(date.getDate()).padStart(2, '0');
      const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
      const nextYear = date.getFullYear();
      proximo = `${nextDay}/${nextMonth}/${nextYear}`;
    }
  }
  
  return { ultimo, proximo };
}

// Filtrar y agrupar por Finca
const filteredGroups = computed(() => {
  let list = animals.value;

  // Filtrar por búsqueda de nombre o arete
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    list = list.filter(a => 
      a.nombre.toLowerCase().includes(query) || 
      (a.arete && a.arete.toLowerCase().includes(query))
    );
  }

  // Filtrar por finca seleccionada
  if (selectedFincaName.value !== 'all') {
    list = list.filter(a => ((a as any).finca_nombre || 'Sin Finca') === selectedFincaName.value);
  }

  // Agrupar los resultados filtrados por Finca
  const groups: { [key: string]: Animal[] } = {};
  list.forEach(a => {
    const fn = (a as any).finca_nombre || 'Sin Finca';
    if (!groups[fn]) {
      groups[fn] = [];
    }
    groups[fn].push(a);
  });

  return Object.keys(groups).map(name => ({
    nombre: name,
    animales: groups[name]
  })).sort((a, b) => {
    if (a.nombre === 'Sin Finca') return 1;
    if (b.nombre === 'Sin Finca') return -1;
    return a.nombre.localeCompare(b.nombre);
  });
});

onMounted(loadAnimals);
</script>

<style scoped>
.animals-page-content {
  --background: #f4f6f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 16px 90px;
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

/* Búsqueda */
.search-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.05);
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f1f3ee;
  border: 1px solid rgba(46, 125, 50, 0.1);
  border-radius: 14px;
  padding: 2px 12px;
}

.search-icon {
  font-size: 20px;
  color: #5c6e58;
  margin-right: 8px;
}

.custom-search-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  color: #2c3e2d;
  outline: none;
  font-family: inherit;
}

.custom-search-input::placeholder {
  color: #8fa08c;
}

/* Filtro Finca */
.finca-filter-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(46, 125, 50, 0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
}

.filter-label {
  font-size: 13px;
  font-weight: 700;
  color: #1B5E20;
}

.select-wrapper {
  position: relative;
  width: 60%;
}

.custom-select {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e2d;
  background-color: #f7f9f6;
  border: 1px solid #e2dcd0;
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  appearance: none;
}

/* Finca Groups */
.fincas-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.finca-card-group {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(46, 125, 50, 0.08);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.finca-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fcfdfa;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.05);
}

.finca-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.finca-title-left .icon {
  font-size: 18px;
}

.finca-title-left h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #1B5E20;
}

.finca-badge {
  font-size: 11px;
  font-weight: 750;
  background: #eaf0e6;
  color: #2E7D32;
  padding: 4px 10px;
  border-radius: 10px;
}

/* Lista de Animales */
.animals-list {
  display: flex;
  flex-direction: column;
}

.animal-card-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(46, 125, 50, 0.04);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.animal-card-item:last-child {
  border-bottom: none;
}

.animal-card-item:active {
  background: #f8fbf6;
}

.animal-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #eaf0e6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 14px;
  border: 1px solid rgba(46, 125, 50, 0.04);
}

.cow-icon {
  font-size: 22px;
}

.animal-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.animal-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.animal-name-row .name {
  font-size: 15px;
  font-weight: 800;
  color: #1B5E20;
}

.arete-tag {
  font-size: 10.5px;
  font-weight: 700;
  background: #f0f4ee;
  color: #5c6e58;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.animal-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7a8a77;
  font-weight: 500;
}

.sex-badge {
  font-size: 11px;
  font-weight: 800;
  border-radius: 4px;
  padding: 0 4px;
}

.sex-badge.hembra {
  color: #e91e63;
  background: #fce4ec;
}

.sex-badge.macho {
  color: #1e88e5;
  background: #e3f2fd;
}

/* Tarjeta de Pesajes */
.animal-weigh-dates {
  display: flex;
  align-items: center;
  background: #fcfdfa;
  border: 1px solid rgba(46, 125, 50, 0.05);
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 4px;
  width: fit-content;
  gap: 12px;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.date-item .label {
  font-size: 9px;
  font-weight: 600;
  color: #8fa08c;
  text-transform: uppercase;
}

.date-item .value {
  font-size: 11px;
  font-weight: 750;
  color: #2c3e2d;
}

.date-item .value.next {
  color: #2E7D32;
}

.date-item .value.next.alert {
  color: #d97706;
}

.date-divider {
  width: 1px;
  height: 20px;
  background: #e2dcd0;
}

/* Columna de peso */
.animal-weight-col {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.weight-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: #eaf0e6;
  padding: 6px 10px;
  border-radius: 10px;
  min-width: 60px;
}

.weight-box .weight {
  font-size: 15px;
  font-weight: 850;
  color: #1B5E20;
  line-height: 1;
}

.weight-box .unit {
  font-size: 9px;
  font-weight: 700;
  color: #2E7D32;
  text-transform: uppercase;
  margin-top: 2px;
}

.arrow-icon {
  color: #c0c5b1;
  font-size: 18px;
}

/* Estados de carga/vacío */
.loading-state, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #5c6e58;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 24px;
  border: 1px solid rgba(46, 125, 50, 0.05);
}

.empty-state h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1B5E20;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.btn-register-empty {
  --background: linear-gradient(135deg, #2E7D32, #1B5E20);
  --border-radius: 12px;
  font-weight: 700;
}

@media (max-width: 480px) {
  .animal-weigh-dates {
    gap: 8px;
  }
}
</style>
