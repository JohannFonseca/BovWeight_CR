<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-buttons slot="start" class="mobile-only">
          <ion-button @click="goBack">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <div class="brand">
            <span class="logo-icon desktop-only">🐄</span>
            <span class="app-logo desktop-only">BovWeight CR</span>
            <span class="badge-vet desktop-only">VETERINARIO</span>
            <span class="mobile-title mobile-only">Animales Asignados</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar vet">
              {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'V' }}
            </div>
            <div class="user-info desktop-only">
              <span class="name">{{ usuarioSesion?.nombre_completo || 'Ana Veterinaria' }}</span>
              <span class="role" style="font-size: 10px; color: #7c8e76;">{{ usuarioSesion?.usuario || 'veterinario@test.com' }}</span>
            </div>
          </div>
          <ion-button @click="logout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="sidebar desktop-only">
          <nav class="nav-menu">
            <a @click.prevent="router.push('/veterinario')" class="nav-item">
              <ion-icon :icon="medkitOutline"></ion-icon>
              <span>Panel Clínico</span>
            </a>
            <a @click.prevent="router.push('/veterinario/animales')" class="nav-item active">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Animales Asignados</span>
            </a>
            <a @click.prevent="router.push('/veterinario/agenda')" class="nav-item">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>Agenda de Visitas</span>
            </a>
            <a @click.prevent="router.push('/veterinario/reportes')" class="nav-item">
              <ion-icon :icon="documentTextOutline"></ion-icon>
              <span>Reportes Médicos</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="page-header">
            <div>
              <h1 class="page-title">Animales Asignados</h1>
              <p class="page-subtitle">Consulta general del ganado bajo tu supervisión</p>
            </div>
          </div>

          <!-- Filtros -->
          <div class="filters-card">
            <div class="search-box">
              <ion-icon :icon="searchOutline"></ion-icon>
              <input type="text" v-model="searchQuery" placeholder="Buscar por arete o nombre..." />
            </div>
            <div class="filter-box">
              <select v-model="selectedFinca">
                <option value="">Todas las fincas</option>
                <option v-for="finca in uniqueFincas" :key="finca" :value="finca">
                  Finca: {{ finca }}
                </option>
              </select>
            </div>
          </div>

          <!-- Tabla/Grid -->
          <div v-if="isLoading" class="state-message">
            Cargando animales...
          </div>
          <div v-else-if="error" class="state-message error">
            {{ error }}
          </div>
          <div v-else-if="filteredAnimales.length === 0" class="state-message">
            No se encontraron animales que coincidan con la búsqueda.
          </div>
          <div v-else class="animals-grid">
            <div class="animal-card" v-for="animal in filteredAnimales" :key="animal.id" @click="goToDetail(animal.id)">
              <div class="animal-header">
                <div class="animal-avatar">
                  <ion-icon :icon="pawOutline"></ion-icon>
                </div>
                <div class="animal-title">
                  <h4>{{ animal.nombre }}</h4>
                  <span class="arete">Arete #{{ animal.arete }}</span>
                </div>
                <div class="animal-status" :class="animal.estado === 'activo' ? 'active' : 'inactive'">
                  {{ animal.estado }}
                </div>
              </div>
              <div class="animal-body">
                <div class="info-row">
                  <span class="label">Raza:</span>
                  <span class="value">{{ animal.raza }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Finca:</span>
                  <span class="value">{{ animal.finca_nombre }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Último Peso:</span>
                  <span class="value font-bold">{{ animal.pesoActual ? animal.pesoActual + ' kg' : 'N/A' }}</span>
                </div>
              </div>
              <div class="animal-footer">
                <span>Ver expediente completo</span>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonButtons
} from '@ionic/vue';
import {
  medkitOutline, pawOutline, calendarOutline, documentTextOutline,
  searchOutline, chevronForwardOutline, arrowBackOutline, logOutOutline
} from 'ionicons/icons';

const router = useRouter();

const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  router.push('/login');
};

const isLoading = ref(true);
const error = ref<string | null>(null);
const animales = ref<any[]>([]);

const searchQuery = ref('');
const selectedFinca = ref('');

const goBack = () => {
  router.push('/veterinario');
};

const goToDetail = (id: number) => {
  router.push(`/veterinario/animal/${id}`);
};

const fetchAnimales = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const sessionStr = localStorage.getItem('usuario_sesion');
    let userId = '';
    let userRole = '';
    if (sessionStr) {
      try {
        const parsedSession = JSON.parse(sessionStr);
        userId = parsedSession.id;
        userRole = parsedSession.rol || 'veterinario';
      } catch(e) {}
    }

    if (!userId) {
      error.value = 'No se encontró una sesión activa.';
      isLoading.value = false;
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const response = await axios.get(`${apiUrl}/animales`, {
      headers: {
        'X-User-Id': userId,
        'X-User-Role': userRole,
        'Accept': 'application/json'
      }
    });

    if (response.data) {
      animales.value = response.data;
    }
  } catch (err: any) {
    error.value = 'Error al cargar la lista de animales.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAnimales();
});

const uniqueFincas = computed(() => {
  const fincas = new Set(animales.value.map(a => a.finca_nombre));
  return Array.from(fincas).filter(Boolean);
});

const filteredAnimales = computed(() => {
  return animales.value.filter(a => {
    const matchesSearch = !searchQuery.value || 
      a.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      a.arete?.toString().includes(searchQuery.value);
      
    const matchesFinca = !selectedFinca.value || a.finca_nombre === selectedFinca.value;
    
    return matchesSearch && matchesFinca;
  });
});
</script>

<style scoped>
.dashboard-content {
  --background: #f4f1ea;
  font-family: 'Inter', -apple-system, sans-serif;
}

.header-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.brand { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 26px; }
.app-logo { font-weight: 800; color: #2c3e2d; font-size: 20px; }
.badge-vet {
  background: linear-gradient(135deg, #c0c5b1, #8ba888);
  color: #2c3e2d; font-size: 10px; font-weight: 800;
  padding: 4px 10px; border-radius: 8px;
}

.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar.vet {
  background: #8ba888; color: white; border-radius: 12px;
  width: 38px; height: 38px; display: flex; align-items: center;
  justify-content: center; font-weight: 700;
}
.user-info { display: flex; flex-direction: column; text-align: left; }
.user-info .name { font-size: 14px; font-weight: 700; color: #2c3e2d; }
.user-info .role { font-size: 10px; color: #7c8e76; }

.dashboard-layout { display: flex; height: 100%; }

/* SIDEBAR */
.sidebar {
  width: 260px; background: #FFFFFF; border-right: 1px solid #e2dcd0;
  padding: 24px 16px; display: flex; flex-direction: column;
}
.nav-menu { display: flex; flex-direction: column; gap: 8px; }
.nav-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border-radius: 14px; text-decoration: none; color: #5c6e58;
  font-weight: 600; transition: all 0.2s ease; cursor: pointer;
}
.nav-item:hover { background: #f4f1ea; color: #2c3e2d; }
.nav-item.active { background: #fdfbf7; color: #8ba888; }
.nav-item ion-icon { font-size: 22px; }

/* MAIN CONTENT */
.main-content {
  flex: 1; padding: 32px; overflow-y: auto;
}
.page-header { margin-bottom: 24px; }
.page-title { font-size: 32px; font-weight: 800; color: #2c3e2d; margin: 0 0 6px; letter-spacing: -1px; }
.page-subtitle { font-size: 15px; color: #5c6e58; margin: 0; font-weight: 500; }

/* FILTERS */
.filters-card {
  display: flex; gap: 16px; margin-bottom: 24px;
  background: #fff; padding: 16px; border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}
.search-box {
  flex: 1; display: flex; align-items: center; background: #f4f1ea;
  border-radius: 12px; padding: 0 16px;
}
.search-box ion-icon { color: #8ba888; font-size: 20px; margin-right: 12px; }
.search-box input {
  width: 100%; border: none; background: transparent; padding: 14px 0;
  outline: none; font-size: 15px; color: #2c3e2d;
}
.filter-box select {
  padding: 14px 16px; border-radius: 12px; border: 1px solid #e2dcd0;
  background: #fff; outline: none; font-size: 15px; color: #2c3e2d;
  cursor: pointer; min-width: 200px;
}

/* GRID */
.animals-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
}
.animal-card {
  background: #fff; border-radius: 20px; padding: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.03); cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s; border: 1px solid rgba(0,0,0,0.02);
}
.animal-card:hover {
  transform: translateY(-4px); box-shadow: 0 12px 25px rgba(0,0,0,0.06);
}
.animal-header {
  display: flex; align-items: center; margin-bottom: 16px; gap: 14px;
}
.animal-avatar {
  width: 48px; height: 48px; border-radius: 14px; background: #eaf0e6;
  color: #556b2f; display: flex; align-items: center; justify-content: center; font-size: 24px;
}
.animal-title { flex: 1; }
.animal-title h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #2c3e2d; }
.animal-title .arete { font-size: 13px; color: #5c6e58; font-weight: 500; }
.animal-status {
  padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;
}
.animal-status.active { background: #eaf0e6; color: #556b2f; }
.animal-status.inactive { background: #fff7ed; color: #d97706; }

.animal-body { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.info-row { display: flex; justify-content: space-between; font-size: 14px; }
.info-row .label { color: #5c6e58; font-weight: 500; }
.info-row .value { color: #2c3e2d; font-weight: 600; }
.info-row .font-bold { font-weight: 800; color: #00897B; }

.animal-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 16px; border-top: 1px solid #f4f1ea; color: #8ba888;
  font-size: 13px; font-weight: 600;
}

.state-message { padding: 40px; text-align: center; color: #5c6e58; font-weight: 500; }
.state-message.error { color: #d97706; }

@media (min-width: 769px) { .mobile-only { display: none !important; } }
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .main-content { padding: 16px; }
  .filters-card { flex-direction: column; }
}
.logout-btn { --color: #5c6e58; }
</style>
