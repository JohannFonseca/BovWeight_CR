<template>
  <ion-page>
      <ion-header class="ion-no-border">
        <ion-toolbar class="header-toolbar">
          <ion-buttons slot="start">
            <ion-button @click="irAtras" class="back-btn">
              <ion-icon :icon="arrowBackOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>
            <div class="brand">
              <span class="logo-icon">🏡</span>
              <span class="app-logo">Expediente de Finca</span>
            </div>
          </ion-title>
        </ion-toolbar>
      </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Estado de Carga -->
        <div v-if="loading" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando datos de la finca...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error al cargar</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchFinca">
            Reintentar
          </ion-button>
        </div>

        <!-- Datos de Finca (Cargado) -->
        <div v-else-if="finca">
          <!-- Tarjeta de Finca -->
          <div class="finca-card">
            <div class="finca-header">
              <div class="finca-avatar">🏡</div>
              <div class="finca-title-wrapper">
                <h2 class="finca-name">{{ finca.nombre }}</h2>
                <span class="finca-owner">👤 Propietario: {{ finca.propietario_nombre }}</span>
              </div>
            </div>

            <div class="finca-body">
              <div class="finca-row">
                <div class="row-icon">📍</div>
                <div class="row-info">
                  <small>Ubicación Geográfica</small>
                  <p>{{ finca.ubicacion }}</p>
                </div>
              </div>

              <div class="finca-row">
                <div class="row-icon">📅</div>
                <div class="row-info">
                  <small>Fecha de Registro</small>
                  <p>{{ finca.creado_en }}</p>
                </div>
              </div>

              <div class="finca-row">
                <div class="row-icon">🐄</div>
                <div class="row-info">
                  <small>Inventario de Ganado</small>
                  <p>{{ finca.animales ? finca.animales.length : 0 }} Bovinos asignados</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Listado de Animales -->
          <div class="animales-section">
            <h3 class="section-title">🐄 Inventario de Ganado</h3>

            <div v-if="!finca.animales || finca.animales.length === 0" class="no-animales-box">
              <span class="no-animales-icon">🐂</span>
              <p>No hay ganado registrado en esta finca actualmente.</p>
            </div>

            <div v-else>
              <div class="table-responsive">
                <table class="saas-table">
                  <thead>
                    <tr>
                      <th>Bovino</th>
                      <th>Arete</th>
                      <th>Raza</th>
                      <th>Último Peso</th>
                      <th>Fecha Pesaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="animal in finca.animales" :key="animal.id">
                      <td data-label="Bovino">
                        <div class="cell-animal">
                          <span class="animal-avatar">🐄</span>
                          <span class="animal-name">{{ animal.nombre }}</span>
                        </div>
                      </td>
                      <td data-label="Arete">
                        <strong class="arete-value">#{{ animal.numero_arete }}</strong>
                      </td>
                      <td data-label="Raza">
                        <span class="raza-badge">{{ animal.raza }}</span>
                      </td>
                      <td data-label="Último Peso">
                        <strong class="peso-value">{{ animal.peso_actual > 0 ? animal.peso_actual + ' kg' : 'N/A' }}</strong>
                      </td>
                      <td data-label="Fecha Pesaje" class="date-value">
                        {{ animal.fecha_pesaje }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner, IonText
} from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import { adminApi } from '@/services';

const route = useRoute();
const router = useRouter();

const fincaId = route.params.id as string;
const loading = ref(true);
const error = ref<string | null>(null);
const finca = ref<any>(null);

const fetchFinca = async () => {
  loading.value = true;
  error.value = null;
  const { data, error: apiError } = await adminApi.getFinca(fincaId);

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    finca.value = data;
  }
  loading.value = false;
};

const irAtras = () => {
  router.push('/admin/fincas');
};

onMounted(() => {
  fetchFinca();
});
</script>

<style scoped>
/* ====== TEMA GENERAL ====== */
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 700px;
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

/* ====== TARJETA DE FINCA ====== */
.finca-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(44, 62, 45, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.01);
  margin-bottom: 24px;
}

.finca-header {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f4f1ea;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.finca-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #eaf0e6;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(85, 107, 47, 0.05);
}

.finca-title-wrapper {
  display: flex;
  flex-direction: column;
}

.finca-name {
  font-size: 20px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.finca-owner {
  font-size: 13px;
  color: #5c6e58;
  font-weight: 600;
}

.finca-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.finca-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.row-icon {
  font-size: 22px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fdfbf7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-info {
  display: flex;
  flex-direction: column;
}

.row-info small {
  font-size: 11px;
  color: #8ba888;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.row-info p {
  margin: 2px 0 0;
  font-size: 14px;
  color: #2c3e2d;
  font-weight: 600;
}

/* ====== LISTADO GANADO ====== */
.animales-section {
  padding: 0 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
  margin-bottom: 16px;
}

.no-animales-box {
  background: #ffffff;
  border: 1px dashed #e2dcd0;
  border-radius: 18px;
  padding: 24px;
  text-align: center;
  color: #5c6e58;
}

.no-animales-icon {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}

.no-animales-box p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

/* ====== TABLA ESTILOS SAAS ====== */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 25px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.01);
}

.saas-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.saas-table th {
  padding: 14px 18px;
  font-size: 11px;
  text-transform: uppercase;
  color: #5c6e58;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: #fdfbf7;
  border-bottom: 1px solid #f4f1ea;
}

.saas-table td {
  padding: 14px 18px;
  font-size: 13px;
  color: #2c3e2d;
  border-bottom: 1px solid #f4f1ea;
  vertical-align: middle;
}

.saas-table tbody tr:last-child td {
  border-bottom: none;
}

.cell-animal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.animal-avatar {
  font-size: 16px;
}

.animal-name {
  color: #2c3e2d;
}

.arete-value {
  color: #556b2f;
}

.raza-badge {
  background: #f4f1ea;
  color: #5c6e58;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.peso-value {
  color: #2c3e2d;
}

.date-value {
  color: #8ba888;
  font-weight: 600;
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

/* ====== RESPONSIVO MÓVIL ====== */
@media (max-width: 576px) {
  .saas-table, .saas-table tbody, .saas-table tr, .saas-table td {
    display: block;
    width: 100%;
  }

  .saas-table thead {
    display: none;
  }

  .saas-table tr {
    margin-bottom: 12px;
    border: 1px solid #e2dcd0;
    border-radius: 14px;
    padding: 10px;
  }

  .saas-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #fdfbf7;
    padding: 10px 6px;
    text-align: right;
  }

  .saas-table td:last-child {
    border-bottom: none;
  }

  .saas-table td::before {
    content: attr(data-label);
    font-size: 11px;
    font-weight: 750;
    text-transform: uppercase;
    color: #8ba888;
    float: left;
    text-align: left;
  }
}
</style>
