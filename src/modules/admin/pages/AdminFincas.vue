<template>
  <ion-page>
      <ion-header class="ion-no-border">
        <ion-toolbar class="header-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>
            <div class="brand">
              <span class="logo-icon">🏡</span>
              <span class="app-logo">Fincas Registradas</span>
            </div>
          </ion-title>
        </ion-toolbar>
      </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Barra de Búsqueda -->
        <div class="search-section">
          <ion-searchbar
            v-model="searchQuery"
            @ionInput="onSearchInput"
            placeholder="Buscar por finca o ganadero..."
            class="custom-searchbar"
            :debounce="400"
          ></ion-searchbar>
        </div>

        <!-- Estado de Carga Inicial -->
        <div v-if="loading && fincas.length === 0" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando listado de fincas...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error && fincas.length === 0" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error de Conexión</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchFincas(true)">
            Reintentar
          </ion-button>
        </div>

        <!-- Listado de Fincas -->
        <div v-else>
          <div v-if="fincas.length === 0" class="center-container empty-box">
            <span class="empty-icon">🔍</span>
            <h3>No se encontraron fincas</h3>
            <p>Intenta con otros términos de búsqueda.</p>
          </div>

          <div v-else>
            <ion-list class="fincas-list">
              <ion-item
                v-for="finca in fincas"
                :key="finca.id"
                class="finca-item"
                button
                :detail="false"
                @click="verDetalle(finca.id)"
                lines="none"
              >
                <div class="finca-row-content">
                  <!-- Icono -->
                  <div class="finca-icon-wrapper">
                    <span class="finca-emoji">🌿</span>
                  </div>

                  <!-- Info Principal -->
                  <div class="info-col">
                    <h3 class="finca-name">{{ finca.nombre }}</h3>
                    <p class="finca-owner">👤 Propietario: {{ finca.propietario_nombre }}</p>
                    <div class="finca-meta">
                      <span class="finca-badge">{{ finca.animales_count }} Bovinos</span>
                      <span class="finca-date">📅 {{ finca.creado_en }}</span>
                    </div>
                  </div>

                  <!-- Icono navegación -->
                  <div class="navigation-col">
                    <ion-icon :icon="chevronForwardOutline" class="chevron-icon"></ion-icon>
                  </div>
                </div>
              </ion-item>
            </ion-list>

            <!-- Paginación "Cargar más" -->
            <div v-if="hasMore" class="pagination-container">
              <ion-button fill="outline" class="load-more-btn" @click="cargarMas" :disabled="loadingMore">
                <ion-spinner v-if="loadingMore" name="dots" class="btn-spinner"></ion-spinner>
                <span v-else>Cargar más fincas</span>
              </ion-button>
            </div>
            <div v-else-if="fincas.length > 0" class="no-more-text">
              Has llegado al final de la lista.
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonList, IonItem, IonSpinner, IonText,
  IonMenuButton
} from '@ionic/vue';
import { chevronForwardOutline } from 'ionicons/icons';
import { adminApi } from '@/services';

const router = useRouter();

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);

const fincas = ref<any[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const hasMore = ref(true);

const fetchFincas = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    fincas.value = [];
    hasMore.value = true;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  error.value = null;

  const filters = searchQuery.value.trim() ? { search: searchQuery.value.trim() } : {};
  const { data, error: apiError } = await adminApi.getFincas(currentPage.value, filters);

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    const newFincas = data.data || [];
    fincas.value = reset ? newFincas : [...fincas.value, ...newFincas];
    hasMore.value = data.current_page < data.last_page;
  }
  loading.value = false;
  loadingMore.value = false;
};

const onSearchInput = () => {
  fetchFincas(true);
};

const cargarMas = () => {
  if (hasMore.value && !loadingMore.value) {
    currentPage.value++;
    fetchFincas(false);
  }
};

const verDetalle = (id: number) => {
  router.push(`/admin/fincas/${id}`);
};


onMounted(() => {
  fetchFincas(true);
});
</script>

<style scoped>
/* ====== TEMA GENERAL ====== */
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 8px;
}

.header-toolbar {
  --background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  --min-height: 65px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.app-logo {
  font-weight: 800;
  color: #2c3e2d;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.back-btn {
  --color: #5c6e58;
}

/* ====== BÚSQUEDA ====== */
.search-section {
  margin-bottom: 20px;
}

.custom-searchbar {
  --background: #ffffff;
  --border-radius: 14px;
  --placeholder-color: #95a595;
  --color: #2c3e2d;
  box-shadow: 0 4px 15px rgba(44, 62, 45, 0.02);
  padding: 0;
}

/* ====== LISTADO DE FINCAS ====== */
.fincas-list {
  background: transparent;
  padding: 0;
}

.finca-item {
  --background: #ffffff;
  border-radius: 18px;
  margin-bottom: 12px;
  box-shadow: 0 8px 20px -5px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.01);
  --padding-start: 0;
  --inner-padding-end: 0;
  cursor: pointer;
}

.finca-row-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.finca-icon-wrapper {
  width: 44px;
  height: 44px;
  background: #eaf0e6;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(85, 107, 47, 0.05);
}

.finca-emoji {
  font-size: 20px;
}

.info-col {
  flex-grow: 1;
  min-width: 0;
}

.finca-name {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 4px;
}

.finca-owner {
  font-size: 13px;
  color: #5c6e58;
  margin: 0 0 8px;
  font-weight: 500;
}

.finca-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.finca-badge {
  background: #eaf0e6;
  color: #3e4f24;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.finca-date {
  font-size: 12px;
  color: #8ba888;
  font-weight: 600;
}

.navigation-col {
  margin-left: 12px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.chevron-icon {
  font-size: 20px;
  color: #8ba888;
}

/* ====== ESTADOS ====== */
.center-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  text-align: center;
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(85, 107, 47, 0.04);
}

.custom-spinner {
  color: #556b2f;
  transform: scale(1.3);
  margin-bottom: 12px;
}

.loading-text {
  color: #5c6e58;
  font-weight: 600;
  font-size: 14px;
}

.error-box {
  border: 1px solid rgba(183, 28, 28, 0.15);
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.error-title {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 4px;
}

.error-msg {
  color: #5c6e58;
  margin: 0 0 16px;
  font-size: 13px;
}

.retry-btn {
  --border-radius: 10px;
  font-weight: 700;
  --color: #556b2f;
  --border-color: #556b2f;
  height: 36px;
}

.empty-box {
  color: #5c6e58;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.empty-box h3 {
  font-weight: 800;
  font-size: 16px;
  color: #2c3e2d;
  margin: 0 0 4px;
}

.empty-box p {
  font-size: 13px;
  margin: 0;
}

/* ====== PAGINACIÓN ====== */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  margin-bottom: 24px;
}

.load-more-btn {
  --border-radius: 12px;
  font-weight: 700;
  --color: #556b2f;
  --border-color: #556b2f;
  height: 44px;
}

.btn-spinner {
  color: #556b2f;
}

.no-more-text {
  text-align: center;
  color: #8ba888;
  font-size: 12px;
  font-weight: 600;
  margin-top: 16px;
  margin-bottom: 24px;
}
</style>
