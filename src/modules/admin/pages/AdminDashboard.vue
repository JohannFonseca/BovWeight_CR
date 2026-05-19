<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">BovWeight CR</span>
            <span class="badge-admin">ADMIN</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar">A</div>
            <div class="user-info">
              <span class="name">Administrador</span>
              <span class="role">admin@test.com</span>
            </div>
          </div>
          <ion-button @click="logout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="dashboard-content">
      <div class="dashboard-layout">
        <!-- Sidebar (Visible solo en desktop) -->
        <aside class="sidebar desktop-only">
          <nav class="nav-menu">
            <a href="#" class="nav-item" :class="{ active: activeTab === 'panel' }" @click.prevent="activeTab = 'panel'">
              <ion-icon :icon="pieChartOutline"></ion-icon>
              <span>Panel Principal</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'usuarios' }" @click.prevent="activeTab = 'usuarios'">
              <ion-icon :icon="peopleOutline"></ion-icon>
              <span>Gestión de Usuarios</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'roles' }" @click.prevent="activeTab = 'roles'">
              <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              <span>Roles y Permisos</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'logs' }" @click.prevent="activeTab = 'logs'">
              <ion-icon :icon="listOutline"></ion-icon>
              <span>Logs del Sistema</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- HEADER DE PAGINA GENERAL -->
          <div class="page-header">
            <div v-if="activeTab === 'panel'">
              <h1 class="page-title">Resumen del Sistema</h1>
              <p class="page-subtitle">Monitoreo general y seguridad de BovWeight CR</p>
            </div>
            <div v-if="activeTab === 'usuarios'">
              <h1 class="page-title">Gestión de Usuarios</h1>
              <p class="page-subtitle">Administra los accesos al sistema. (No hay auto-registro)</p>
            </div>
            <div v-if="activeTab === 'roles'">
              <h1 class="page-title">Roles del Sistema</h1>
              <p class="page-subtitle">Catálogo de perfiles de acceso</p>
            </div>
            
            <ion-button v-if="activeTab === 'usuarios'" class="primary-btn" @click="mostrarModal = true">
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Nuevo Usuario
            </ion-button>
          </div>

          <!-- PESTAÑA: PANEL PRINCIPAL -->
          <div v-if="activeTab === 'panel'">

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper blue">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">1,248</span>
                <span class="stat-label">Usuarios Activos</span>
              </div>
              <div class="stat-trend positive">
                <ion-icon :icon="trendingUpOutline"></ion-icon>
                <span>+12%</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper green">
                <ion-icon :icon="leafOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">845</span>
                <span class="stat-label">Ganaderos</span>
              </div>
              <div class="stat-trend positive">
                <ion-icon :icon="trendingUpOutline"></ion-icon>
                <span>+5%</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper teal">
                <ion-icon :icon="medkitOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">156</span>
                <span class="stat-label">Veterinarios</span>
              </div>
              <div class="stat-trend neutral">
                <ion-icon :icon="removeOutline"></ion-icon>
                <span>0%</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper orange">
                <ion-icon :icon="pulseOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">8,492</span>
                <span class="stat-label">Pesajes IA Hoy</span>
              </div>
              <div class="stat-trend positive">
                <ion-icon :icon="trendingUpOutline"></ion-icon>
                <span>+24%</span>
              </div>
            </div>
          </div>

          <!-- Charts & Tables Grid -->
          <div class="content-grid">
            <!-- Chart Section -->
            <div class="panel-card chart-panel">
              <div class="panel-header">
                <h3>Crecimiento de Usuarios</h3>
                <ion-button fill="clear" size="small">Ver reporte</ion-button>
              </div>
              <div class="panel-body">
                <LineChart :data="chartData" :options="chartOptions" class="chart-container" />
              </div>
            </div>

            <!-- Recent Activity Table -->
            <div class="panel-card">
              <div class="panel-header">
                <h3>Logs Recientes del Sistema</h3>
              </div>
              <div class="panel-body no-padding">
                <div class="table-responsive">
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Resultado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><div class="cell-user"><div class="mini-avatar">G</div> ganadero@test.com</div></td>
                        <td>Estimación de peso IA (#4512)</td>
                        <td><span class="status-badge success">Éxito</span></td>
                        <td>Hace 5 min</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          </div> <!-- FIN PANEL PRINCIPAL -->

          <!-- PESTAÑA: GESTIÓN DE USUARIOS -->
          <div v-if="activeTab === 'usuarios'" class="panel-card">
            <div class="panel-header">
              <h3>Listado Oficial de Usuarios</h3>
              <ion-button fill="clear" size="small" @click="cargarUsuarios">Actualizar</ion-button>
            </div>
            <div class="panel-body no-padding">
              <div class="table-responsive">
                <table class="saas-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol Asignado</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in usuariosList" :key="user.id">
                      <td>
                        <div class="cell-user">
                          <div class="mini-avatar">{{ user.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : 'U' }}</div>
                          {{ user.nombre_completo }}
                        </div>
                      </td>
                      <td>{{ user.correo }}</td>
                      <td>
                        <span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre || 'Desconocido' }}</span>
                      </td>
                      <td>
                        <span class="status-badge" :class="user.activo ? 'success' : 'error'">{{ user.activo ? 'activo' : 'inactivo' }}</span>
                      </td>
                      <td>{{ user.creado_en }}</td>
                      <td>
                        <ion-button fill="clear" size="small" color="danger" @click="eliminarUsuario(user.id)">
                          <ion-icon :icon="trashOutline"></ion-icon>
                        </ion-button>
                      </td>
                    </tr>
                    <tr v-if="usuariosList.length === 0">
                      <td colspan="6" style="text-align: center; padding: 24px;">No hay usuarios registrados o cargando...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- PESTAÑA: ROLES Y PERMISOS -->
          <div v-if="activeTab === 'roles'" class="panel-card">
             <div class="panel-header">
              <h3>Permisos y Bloqueos de Usuarios</h3>
              <ion-button fill="clear" size="small" @click="cargarUsuarios">Actualizar</ion-button>
            </div>
            <div class="panel-body no-padding">
              <div class="table-responsive">
                <table class="saas-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol en el Sistema</th>
                      <th>Estado de Acceso</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in usuariosList" :key="'rol-'+user.id">
                      <td>{{ user.nombre_completo }} <br><small style="color: #888;">{{ user.correo }}</small></td>
                      <td><span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre }}</span></td>
                      <td>
                        <span class="status-badge" :class="user.activo ? 'success' : 'error'">
                          {{ user.activo ? 'Permitido' : 'Bloqueado' }}
                        </span>
                      </td>
                      <td>
                        <ion-button v-if="user.activo" fill="clear" size="small" color="warning" @click="cambiarEstadoUsuario(user.id, false)">
                          Bloquear Acceso
                        </ion-button>
                        <ion-button v-else fill="clear" size="small" color="success" @click="cambiarEstadoUsuario(user.id, true)">
                          Reactivar Acceso
                        </ion-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>

      <!-- MODAL CREAR USUARIO -->
      <ion-modal :is-open="mostrarModal" @didDismiss="mostrarModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Registrar Nuevo Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="mostrarModal = false">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-container">
            <ion-item>
              <ion-label position="stacked">Nombre Completo</ion-label>
              <ion-input v-model="nuevoUsuario.nombre_completo" placeholder="Ej. Juan Pérez"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Correo Electrónico</ion-label>
              <ion-input v-model="nuevoUsuario.correo" type="email" placeholder="ejemplo@test.com"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Contraseña Inicial</ion-label>
              <ion-input v-model="nuevoUsuario.contrasena" type="password" placeholder="Mínimo 6 caracteres"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Rol en el Sistema</ion-label>
              <ion-select v-model="nuevoUsuario.rol_id" placeholder="Selecciona un rol">
                <ion-select-option v-for="rol in rolesList" :key="rol.id" :value="rol.id">{{ rol.nombre.toUpperCase() }}</ion-select-option>
              </ion-select>
            </ion-item>
            <div class="form-actions">
              <ion-button expand="block" class="primary-btn" @click="guardarUsuario" :disabled="guardando">
                {{ guardando ? 'Guardando...' : 'Crear Acceso' }}
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons,
  IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption
} from '@ionic/vue';
import { 
  logOutOutline, shieldCheckmarkOutline, peopleOutline, settingsOutline, 
  pieChartOutline, listOutline, addOutline, trendingUpOutline, trashOutline,
  leafOutline, medkitOutline, pulseOutline, removeOutline 
} from 'ionicons/icons';

import { adminService, type UsuarioInfo, type Rol } from '../services/admin.service';

// Chart.js imports
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const router = useRouter();
const activeTab = ref('usuarios'); // Empezamos en usuarios para probar la funcionalidad
const mostrarModal = ref(false);
const guardando = ref(false);

const usuariosList = ref<UsuarioInfo[]>([]);
const rolesList = ref<Rol[]>([]);

const nuevoUsuario = ref({
  nombre_completo: '',
  correo: '',
  contrasena: '',
  rol_id: null as number | null
});

const logout = () => {
  router.push('/login');
};

const cargarUsuarios = async () => {
  try {
    usuariosList.value = await adminService.getUsuarios();
  } catch (error) {
    console.error("No se pudieron cargar los usuarios.");
  }
};

const cargarRoles = async () => {
  try {
    rolesList.value = await adminService.getRoles();
  } catch (error) {
    console.error("No se pudieron cargar los roles.");
  }
};

const guardarUsuario = async () => {
  if (!nuevoUsuario.value.correo || !nuevoUsuario.value.rol_id) return;
  guardando.value = true;
  try {
    await adminService.crearUsuario({
      nombre_completo: nuevoUsuario.value.nombre_completo,
      correo: nuevoUsuario.value.correo,
      contrasena: nuevoUsuario.value.contrasena,
      rol_id: nuevoUsuario.value.rol_id
    });
    mostrarModal.value = false;
    nuevoUsuario.value = { nombre_completo: '', correo: '', contrasena: '', rol_id: null };
    await cargarUsuarios();
  } catch (error) {
    alert("Error al crear el usuario. Verifica la BD.");
  } finally {
    guardando.value = false;
  }
};

const eliminarUsuario = async (id: number) => {
  if (confirm('¿Estás seguro de eliminar permanentemente este acceso?')) {
    await adminService.eliminarUsuario(id);
    await cargarUsuarios();
  }
};

const cambiarEstadoUsuario = async (id: number, nuevoEstado: boolean) => {
  const accion = nuevoEstado ? 'reactivar' : 'bloquear';
  if (confirm(`¿Estás seguro de ${accion} a este usuario?`)) {
    await adminService.toggleEstadoUsuario(id, nuevoEstado);
    await cargarUsuarios();
  }
};

onMounted(() => {
  cargarUsuarios();
  cargarRoles();
});

// Configuración de gráfica
const chartData = ref({
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Ganaderos',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      borderColor: '#2E7D32',
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#2E7D32',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      data: [150, 220, 310, 480, 650, 845],
      tension: 0.4
    },
    {
      label: 'Veterinarios',
      backgroundColor: 'rgba(13, 71, 161, 0.1)',
      borderColor: '#0D47A1',
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#0D47A1',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      data: [30, 45, 60, 95, 120, 156],
      tension: 0.4
    }
  ]
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        font: { family: "'Inter', sans-serif", size: 12 }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f0f0f0', drawBorder: false }
    },
    x: {
      grid: { display: false, drawBorder: false }
    }
  }
});
</script>

<style scoped>
/* ====== VARIABLES GLOBALES DEL TEMA ====== */
.dashboard-content {
  --background: #F4F7F6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ====== HEADER ====== */
.header-toolbar {
  --background: #FFFFFF;
  --min-height: 70px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  padding: 0 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(46, 125, 50, 0.2));
}

.app-logo {
  font-weight: 800;
  color: #1B5E20;
  letter-spacing: -0.5px;
  font-size: 20px;
}

.badge-admin {
  background: #0D47A1;
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #0D47A1;
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-info .name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.user-info .role {
  font-size: 12px;
  color: #777;
}

.logout-btn {
  --color: #555;
}

/* ====== LAYOUT ====== */
.dashboard-layout {
  display: flex;
  min-height: 100%;
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  background: #FFFFFF;
  border-right: 1px solid #EAEBEF;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #555;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #F4F7F6;
  color: #1B5E20;
}

.nav-item.active {
  background: #E8F5E9;
  color: #2E7D32;
  font-weight: 600;
}

.nav-item ion-icon {
  font-size: 20px;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.primary-btn {
  --background: #0D47A1;
  --background-hover: #1565C0;
  --border-radius: 10px;
  --box-shadow: 0 4px 12px rgba(13, 71, 161, 0.2);
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* ====== STATS GRID ====== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  border: 1px solid #F0F0F0;
  position: relative;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
}

.stat-icon-wrapper.blue { background: #E3F2FD; color: #1976D2; }
.stat-icon-wrapper.green { background: #E8F5E9; color: #388E3C; }
.stat-icon-wrapper.teal { background: #E0F2F1; color: #00897B; }
.stat-icon-wrapper.orange { background: #FFF3E0; color: #F57C00; }

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #222;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #777;
  font-weight: 500;
  margin-top: 4px;
}

.stat-trend {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
}

.stat-trend.positive { background: #E8F5E9; color: #2E7D32; }
.stat-trend.neutral { background: #F5F5F5; color: #757575; }
.stat-trend.negative { background: #FFEBEE; color: #C62828; }

/* ====== PANELS GRID ====== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.panel-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  border: 1px solid #F0F0F0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #F0F0F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.panel-body {
  padding: 24px;
  flex: 1;
}

.panel-body.no-padding {
  padding: 0;
}

.chart-container {
  height: 250px;
  width: 100%;
}

/* ====== SAAS TABLE ====== */
.table-responsive {
  overflow-x: auto;
}

.saas-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.saas-table th {
  padding: 16px 24px;
  font-size: 12px;
  text-transform: uppercase;
  color: #888;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: #FAFAFA;
  border-bottom: 1px solid #F0F0F0;
}

.saas-table td {
  padding: 16px 24px;
  font-size: 14px;
  color: #444;
  border-bottom: 1px solid #F0F0F0;
  vertical-align: middle;
}

.saas-table tbody tr:last-child td {
  border-bottom: none;
}

.saas-table tbody tr:hover {
  background: #FAFAFA;
}

.cell-user {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  color: #222;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #EAEBEF;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success { background: #E8F5E9; color: #2E7D32; }
.status-badge.error { background: #FFEBEE; color: #C62828; }

.role-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: #EAEBEF;
  color: #555;
}
.role-badge.admin { background: #E3F2FD; color: #0D47A1; }
.role-badge.ganadero { background: #E8F5E9; color: #1B5E20; }
.role-badge.veterinario { background: #E0F2F1; color: #00897B; }

.form-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-actions {
  margin-top: 24px;
}

/* ====== RESPONSIVE ====== */
@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .user-info {
    display: none; /* Hide email on mobile to save space */
  }
}
</style>
