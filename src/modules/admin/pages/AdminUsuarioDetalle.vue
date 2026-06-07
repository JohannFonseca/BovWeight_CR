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
              <span class="logo-icon">👤</span>
              <span class="app-logo">Perfil del Ganadero</span>
            </div>
          </ion-title>
        </ion-toolbar>
      </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Estado de Carga -->
        <div v-if="loading" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando expediente del usuario...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error al cargar</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchUsuario()">
            Reintentar
          </ion-button>
        </div>

        <!-- Datos del Usuario y Fincas (Cargado) -->
        <div v-else-if="user">
          <!-- Tarjeta de Perfil -->
          <div class="profile-card">
            <div class="profile-header">
              <div class="avatar-large">
                {{ user.nombre_completo.charAt(0).toUpperCase() }}
              </div>
              <h2 class="profile-name">{{ user.nombre_completo }}</h2>
              <span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre }}</span>
            </div>

            <div class="profile-body">
              <div class="profile-row">
                <div class="row-icon">📧</div>
                <div class="row-info">
                  <small>Correo Electrónico</small>
                  <p>{{ user.correo }}</p>
                </div>
              </div>

              <div class="profile-row">
                <div class="row-icon">📅</div>
                <div class="row-info">
                  <small>Fecha de Registro</small>
                  <p>{{ user.creado_en || 'No disponible' }}</p>
                </div>
              </div>

              <div class="profile-row">
                <div class="row-icon">🛡️</div>
                <div class="row-info">
                  <small>Estado de Cuenta</small>
                  <p>
                    <span class="status-badge" :class="user.activo ? 'success' : 'error'">
                      {{ user.activo ? 'Permitida / Activa' : 'Bloqueada / Inactiva' }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Relaciones del Veterinario (Ganadero Responsable) -->
          <div v-if="user.rol_nombre === 'veterinario'" class="association-section">
            <h3 class="section-title">👨‍🌾 Ganadero Responsable</h3>
            <div v-if="!user.ganadero" class="no-association-box">
              <span class="no-association-icon">⚠️</span>
              <p>Este veterinario no tiene un ganadero responsable asignado.</p>
            </div>
            <div v-else class="association-card" @click="irAUsuario(user.ganadero.id)">
              <div class="association-header">
                <div class="association-avatar">
                  {{ user.ganadero.nombre_completo.charAt(0).toUpperCase() }}
                </div>
                <div class="association-info">
                  <h4>{{ user.ganadero.nombre_completo }}</h4>
                  <p>{{ user.ganadero.correo }}</p>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="association-arrow"></ion-icon>
              </div>
            </div>
          </div>

          <!-- Relaciones del Ganadero (Veterinarios Asignados) -->
          <div v-if="user.rol_nombre === 'ganadero'" class="association-section">
            <h3 class="section-title">🩺 Veterinarios Asignados ({{ user.veterinarios ? user.veterinarios.length : 0 }})</h3>
            <div v-if="!user.veterinarios || user.veterinarios.length === 0" class="no-association-box">
              <span class="no-association-icon">🩺</span>
              <p>Este ganadero aún no tiene veterinarios asignados a su cuenta.</p>
            </div>
            <div v-else class="association-grid">
              <div v-for="vet in user.veterinarios" :key="vet.id" class="association-card" @click="irAUsuario(vet.id)">
                <div class="association-header">
                  <div class="association-avatar vet-avatar">
                    {{ vet.nombre_completo.charAt(0).toUpperCase() }}
                  </div>
                  <div class="association-info">
                    <h4>{{ vet.nombre_completo }}</h4>
                    <p>{{ vet.correo }}</p>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="association-arrow"></ion-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Listado de Fincas Asociadas (Solo para Ganaderos) -->
          <div v-if="user.rol_nombre === 'ganadero'" class="fincas-section">
            <h3 class="section-title">🏠 Fincas Registradas ({{ user.fincas ? user.fincas.length : 0 }})</h3>
            
            <div v-if="!user.fincas || user.fincas.length === 0" class="no-fincas-box">
              <span class="no-fincas-icon">🏡</span>
              <p>Este ganadero aún no posee propiedades registradas en el sistema.</p>
            </div>

            <div v-else class="fincas-grid">
              <div v-for="finca in user.fincas" :key="finca.id" class="finca-card">
                <div class="finca-header">
                  <div class="finca-icon">🌿</div>
                  <div class="finca-title-info">
                    <h4>{{ finca.nombre }}</h4>
                    <span>📍 {{ finca.ubicacion }}</span>
                  </div>
                </div>
                <div class="finca-body">
                  <div class="finca-stat">
                    <strong>Ganado asignado:</strong>
                    <span class="finca-badge">{{ finca.animales_count }} Bovinos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner, IonText
} from '@ionic/vue';
import { arrowBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { adminApi } from '@/services';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const user = ref<any>(null);

const fetchUsuario = async (id?: any) => {
  loading.value = true;
  error.value = null;
  const targetId = (typeof id === 'string' || typeof id === 'number') ? id : (route.params.id as string);
  const { data, error: apiError } = await adminApi.getUsuario(targetId);

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    user.value = data;
  }
  loading.value = false;
};

const irAtras = () => {
  router.push('/admin/usuarios');
};

const irAUsuario = (id: number | string) => {
  router.push(`/admin/usuarios/${id}`);
};

// Observar cambios en el parámetro ID para recargar cuando navegamos entre usuarios asociados
watch(
  () => route.params.id,
  (newId) => {
    if (newId && route.path.startsWith('/admin/usuarios/')) {
      fetchUsuario(newId as string);
    }
  }
);

onMounted(() => {
  fetchUsuario();
});
</script>

<style scoped>
/* ====== TEMA GENERAL ====== */
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', sans-serif;
}

.main-container {
  max-width: 600px;
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

/* ====== TARGETA DE PERFIL ====== */
.profile-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(44, 62, 45, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.01);
  margin-bottom: 24px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid #f4f1ea;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #eaf0e6;
  color: #556b2f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 12px;
  box-shadow: 0 6px 15px rgba(85, 107, 47, 0.08);
}

.profile-name {
  font-size: 20px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.role-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 8px;
  background: #f4f1ea;
  color: #5c6e58;
  letter-spacing: 0.5px;
}

.role-badge.admin { background: #f0f4f8; color: #334155; }
.role-badge.ganadero { background: #eaf0e6; color: #556b2f; }
.role-badge.veterinario { background: #fdfbf7; color: #6b8e23; }

.profile-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-row {
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

.status-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 750;
}

.status-badge.success { background: #eaf0e6; color: #3e4f24; }
.status-badge.error { background: #fce8e8; color: #b71c1c; }

/* ====== SECCIÓN FINCAS ====== */
.fincas-section {
  padding: 0 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #2c3e2d;
  margin-bottom: 16px;
}

.no-fincas-box {
  background: #ffffff;
  border: 1px dashed #e2dcd0;
  border-radius: 18px;
  padding: 24px;
  text-align: center;
  color: #5c6e58;
}

.no-fincas-icon {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}

.no-fincas-box p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.fincas-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.finca-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 8px 20px -5px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.01);
}

.finca-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #fdfbf7;
  padding-bottom: 10px;
}

.finca-icon {
  font-size: 20px;
}

.finca-title-info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
}

.finca-title-info span {
  font-size: 12px;
  color: #8ba888;
  font-weight: 600;
}

.finca-body {
  display: flex;
  justify-content: space-between;
}

.finca-stat {
  font-size: 13px;
  color: #5c6e58;
  display: flex;
  align-items: center;
  gap: 6px;
}

.finca-badge {
  background: #eaf0e6;
  color: #3e4f24;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
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

/* ====== ASOCIACIONES ====== */
.association-section {
  margin-top: 24px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.no-association-box {
  background: #ffffff;
  border: 1px dashed #e2dcd0;
  border-radius: 18px;
  padding: 20px;
  text-align: center;
  color: #5c6e58;
}

.no-association-icon {
  font-size: 28px;
  margin-bottom: 6px;
  display: block;
}

.no-association-box p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.association-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.association-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 4px 15px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.01);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.association-card:active {
  transform: scale(0.98);
}

.association-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.association-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #eaf0e6;
  color: #556b2f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
}

.association-avatar.vet-avatar {
  background: #fdfbf7;
  color: #6b8e23;
}

.association-info {
  flex-grow: 1;
  min-width: 0;
}

.association-info h4 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: #2c3e2d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.association-info p {
  margin: 0;
  font-size: 12px;
  color: #5c6e58;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.association-arrow {
  color: #8ba888;
  font-size: 18px;
  margin-left: 8px;
  flex-shrink: 0;
}
</style>
