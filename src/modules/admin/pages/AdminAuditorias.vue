<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🛡️</span>
            <span class="app-logo">Bitácora de Seguridad y Auditoría</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Filtros y Búsqueda -->
        <div class="filters-card">
          <div class="search-row">
            <div class="search-input-wrapper">
              <ion-icon :icon="searchOutline" class="search-icon"></ion-icon>
              <input
                type="text"
                v-model="filters.search"
                @input="debouncedFetch"
                placeholder="Buscar por correo, IP o tabla..."
                class="custom-input search-input"
              />
            </div>
            
            <div class="select-wrapper">
              <select v-model="filters.accion" @change="fetchLogs(true)" class="custom-select filter-select">
                <option value="">Todas las Acciones</option>
                <option value="CREAR">CREAR</option>
                <option value="MODIFICAR">MODIFICAR</option>
                <option value="ELIMINAR">ELIMINAR</option>
                <option value="LOGIN_EXITOSO">LOGIN EXITOSO</option>
                <option value="LOGIN_FALLIDO">LOGIN FALLIDO</option>
                <option value="BLOQUEO_IP">BLOQUEO DE IP</option>
              </select>
            </div>
          </div>

          <div class="date-row">
            <div class="date-field">
              <label>Desde:</label>
              <input type="date" v-model="filters.fecha_inicio" @change="fetchLogs(true)" class="custom-input date-input" />
            </div>
            <div class="date-field">
              <label>Hasta:</label>
              <input type="date" v-model="filters.fecha_fin" @change="fetchLogs(true)" class="custom-input date-input" />
            </div>
            <button @click="clearFilters" class="clear-filters-btn">
              Restablecer
            </button>
          </div>
        </div>

        <!-- Estado de Carga -->
        <div v-if="loading && logs.length === 0" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando registros de auditoría...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error && logs.length === 0" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error de Conexión</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchLogs(true)">
            Reintentar
          </ion-button>
        </div>

        <!-- Listado de Logs -->
        <div v-else>
          <div v-if="logs.length === 0" class="center-container empty-box">
            <span class="empty-icon">🔍</span>
            <h3>No se encontraron registros</h3>
            <p>Intenta cambiar los términos de búsqueda o filtros.</p>
          </div>

          <div v-else>
            <div class="logs-list">
              <div v-for="log in logs" :key="log.id" class="log-card" :class="{ expanded: expandedLogId === log.id }">
                <div class="log-header" @click="toggleExpand(log.id)">
                  <div class="log-main-info">
                    <span class="action-badge" :class="log.accion.toLowerCase()">
                      {{ formatActionName(log.accion) }}
                    </span>
                    <span class="log-date">
                      <ion-icon :icon="timeOutline" class="inline-icon"></ion-icon>
                      {{ log.creado_en }}
                    </span>
                  </div>

                  <div class="log-target-info">
                    <span class="log-user" :title="log.correo">
                      👤 {{ log.correo || 'Sistema / Visitante' }}
                    </span>
                    <span class="log-ip">
                      🖥️ {{ log.ip_address || 'Sin IP' }}
                    </span>
                  </div>

                  <div class="log-toggle-icon">
                    <ion-icon :icon="expandedLogId === log.id ? chevronUpOutline : chevronDownOutline"></ion-icon>
                  </div>
                </div>

                <!-- Detalles Expansibles -->
                <div v-if="expandedLogId === log.id" class="log-details animated-slide-down">
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">ID de Registro:</span>
                      <span class="detail-value">#{{ log.id }}</span>
                    </div>
                    <div v-if="log.tabla" class="detail-item">
                      <span class="detail-label">Tabla Afectada:</span>
                      <span class="detail-value font-code">{{ log.tabla }}</span>
                    </div>
                    <div v-if="log.registro_id" class="detail-item">
                      <span class="detail-label">ID Fila Afectada:</span>
                      <span class="detail-value font-code">#{{ log.registro_id }}</span>
                    </div>
                    <div v-if="log.user_agent" class="detail-item full-width">
                      <span class="detail-label">Agente de Usuario:</span>
                      <span class="detail-value text-muted">{{ log.user_agent }}</span>
                    </div>
                  </div>

                  <!-- Visualización de Cambios (Detalles JSON) -->
                  <div class="changes-section" v-if="log.detalles">
                    <h4 class="changes-title">Detalles del Evento:</h4>
                    
                    <!-- Formatear si es MODIFICAR (antes/despues) -->
                    <div v-if="log.accion === 'MODIFICAR'" class="changes-list">
                      <table class="changes-table">
                        <thead>
                          <tr>
                            <th>Campo</th>
                            <th>Valor Anterior</th>
                            <th>Nuevo Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(val, field) in log.detalles" :key="field">
                            <td class="font-code field-name">{{ field }}</td>
                            <td class="old-value">{{ formatValue(val.antes) }}</td>
                            <td class="new-value">{{ formatValue(val.despues) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Si es CREAR o ELIMINAR (atributos planos) -->
                    <div v-else-if="log.accion === 'CREAR' || log.accion === 'ELIMINAR'" class="attributes-grid">
                      <div v-for="(val, field) in log.detalles" :key="field" class="attribute-pill">
                        <span class="attribute-name">{{ field }}:</span>
                        <span class="attribute-val">{{ formatValue(val) }}</span>
                      </div>
                    </div>

                    <!-- Si es un mensaje simple o login -->
                    <div v-else class="generic-details">
                      <pre class="json-preview">{{ JSON.stringify(log.detalles, null, 2) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación "Cargar más" -->
            <div v-if="hasMore" class="pagination-container">
              <ion-button fill="outline" class="load-more-btn" @click="cargarMas" :disabled="loadingMore">
                <ion-spinner v-if="loadingMore" name="dots" class="btn-spinner"></ion-spinner>
                <span v-else>Cargar más registros</span>
              </ion-button>
            </div>
            <div v-else-if="logs.length > 0" class="no-more-text">
              Has llegado al final de la bitácora.
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonMenuButton, IonIcon, IonSpinner, IonText
} from '@ionic/vue';
import {
  searchOutline, chevronDownOutline, chevronUpOutline, timeOutline
} from 'ionicons/icons';
import { adminApi } from '@/services';

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);

const logs = ref<any[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const expandedLogId = ref<number | null>(null);

const filters = reactive({
  search: '',
  accion: '',
  fecha_inicio: '',
  fecha_fin: '',
});

let debounceTimeout: any = null;

const formatActionName = (accion: string) => {
  return accion.replace('_', ' ');
};

const formatValue = (val: any): string => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const toggleExpand = (id: number) => {
  expandedLogId.value = expandedLogId.value === id ? null : id;
};

const fetchLogs = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    logs.value = [];
    hasMore.value = true;
    loading.value = true;
    expandedLogId.value = null;
  } else {
    loadingMore.value = true;
  }
  error.value = null;

  // Limpiar filtros vacíos
  const activeFilters: Record<string, any> = {};
  if (filters.search.trim()) activeFilters.search = filters.search.trim();
  if (filters.accion) activeFilters.accion = filters.accion;
  if (filters.fecha_inicio) activeFilters.fecha_inicio = filters.fecha_inicio;
  if (filters.fecha_fin) activeFilters.fecha_fin = filters.fecha_fin;

  const { data, error: apiError } = await adminApi.getAuditLogs(currentPage.value, activeFilters);

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    const newLogs = data.data || [];
    logs.value = reset ? newLogs : [...logs.value, ...newLogs];
    hasMore.value = data.current_page < data.last_page;
  }
  loading.value = false;
  loadingMore.value = false;
};

const debouncedFetch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchLogs(true);
  }, 400);
};

const cargarMas = () => {
  if (hasMore.value && !loadingMore.value) {
    currentPage.value++;
    fetchLogs(false);
  }
};

const clearFilters = () => {
  filters.search = '';
  filters.accion = '';
  filters.fecha_inicio = '';
  filters.fecha_fin = '';
  fetchLogs(true);
};

onMounted(() => {
  fetchLogs(true);
});
</script>

<style scoped>
/* ====== TEMA GENERAL ====== */
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 1000px;
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

/* ====== FILTROS ====== */
.filters-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 8px 25px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(85, 107, 47, 0.04);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #8ba888;
  font-size: 18px;
}

.search-input {
  padding-left: 44px !important;
}

.select-wrapper {
  min-width: 180px;
}

.date-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.date-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-field label {
  font-size: 13px;
  font-weight: 700;
  color: #5c6e58;
}

.date-input {
  width: 140px;
}

.clear-filters-btn {
  background: transparent;
  color: #5c6e58;
  border: 1px solid #c2ccbf;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  height: 38px;
  margin-left: auto;
}

.clear-filters-btn:hover {
  background: #f4f1ea;
  color: #2c3e2d;
}

/* INPUTS COMUNES */
.custom-input {
  background: #fdfbf7;
  border: 1px solid #e1e8df;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  color: #2c3e2d;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}

.custom-input:focus {
  border-color: #8ba888;
  box-shadow: 0 0 0 3px rgba(139, 168, 136, 0.15);
  background: #ffffff;
}

.custom-select {
  background: #fdfbf7;
  border: 1px solid #e1e8df;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  color: #2c3e2d;
  outline: none;
  width: 100%;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s;
}

.custom-select:focus {
  border-color: #8ba888;
  box-shadow: 0 0 0 3px rgba(139, 168, 136, 0.15);
  background: #ffffff;
}

/* ====== LOG CARDS ====== */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(85, 107, 47, 0.03);
  box-shadow: 0 4px 15px rgba(44, 62, 45, 0.01);
  overflow: hidden;
  transition: all 0.2s ease;
}

.log-card.expanded {
  border-color: #c2ccbf;
  box-shadow: 0 6px 20px rgba(44, 62, 45, 0.03);
}

.log-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  flex-wrap: wrap;
  gap: 12px;
}

.log-header:hover {
  background: #fcfbfa;
}

.log-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 250px;
}

.log-target-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: inline-block;
  text-align: center;
  min-width: 100px;
}

/* Badges Action Colors */
.action-badge.crear { background: #e2f0d9; color: #385723; }
.action-badge.modificar { background: #fff2cc; color: #7f6000; }
.action-badge.eliminar { background: #fce4d6; color: #c65911; }
.action-badge.login_exitoso { background: #eaf0e6; color: #3e4f24; }
.action-badge.login_fallido { background: #fce8e8; color: #b71c1c; }
.action-badge.bloqueo_ip { background: #3a1c1c; color: #ffffff; }

.log-date {
  font-size: 12px;
  color: #7c8e79;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.inline-icon {
  margin-right: 4px;
  font-size: 14px;
}

.log-user {
  font-size: 13px;
  font-weight: 700;
  color: #2c3e2d;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-ip {
  font-size: 12px;
  font-weight: 600;
  color: #7c8e79;
  background: #f4f1ea;
  padding: 2px 8px;
  border-radius: 6px;
}

.log-toggle-icon {
  color: #8ba888;
  font-size: 18px;
  display: flex;
  align-items: center;
}

/* ====== DETALLES EXPANDIBLES ====== */
.log-details {
  background: #fdfbf8;
  border-top: 1px solid #f4f1ea;
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 800;
  color: #7c8e79;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e2d;
}

.font-code {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
}

.text-muted {
  color: #5c6e58;
}

/* SECCIÓN CAMBIOS */
.changes-section {
  margin-top: 16px;
  border-top: 1px dashed #e1e8df;
  padding-top: 12px;
}

.changes-title {
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 10px;
}

.changes-list {
  background: #ffffff;
  border: 1px solid #e1e8df;
  border-radius: 10px;
  overflow: hidden;
}

.changes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.changes-table th {
  background: #f4f1ea;
  padding: 10px;
  font-weight: 800;
  color: #5c6e58;
}

.changes-table td {
  padding: 10px;
  border-top: 1px solid #f4f1ea;
  vertical-align: middle;
}

.field-name {
  color: #3e4f24;
}

.old-value {
  color: #b71c1c;
  background: #fdf2f2;
}

.new-value {
  color: #385723;
  background: #f2f9f0;
  font-weight: 700;
}

/* Atributos Grid */
.attributes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attribute-pill {
  background: #ffffff;
  border: 1px solid #e1e8df;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  display: flex;
  gap: 6px;
}

.attribute-name {
  font-weight: 700;
  color: #7c8e79;
}

.attribute-val {
  color: #2c3e2d;
  font-weight: 600;
}

/* Generic JSON details */
.generic-details {
  background: #2c3e2d;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
}

.json-preview {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: #eaf0e6;
}

/* ====== CARGANDO / ERROR / VACIO ====== */
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

/* ANIMATIONS */
.animated-slide-down {
  animation: slideDown 0.25s ease-out forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
