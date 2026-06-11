<template>
  <ion-page>
      <ion-header class="ion-no-border">
        <ion-toolbar class="header-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>
            <div class="brand">
              <span class="logo-icon">👥</span>
              <span class="app-logo">Usuarios</span>
            </div>
          </ion-title>
          <ion-buttons slot="end">
            <ion-button @click="abrirModalCreacion" class="add-user-btn">
              <ion-icon :icon="personAddOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

    <ion-content class="dashboard-content ion-padding">
      <div class="main-container">
        <!-- Barra de Búsqueda -->
        <div class="search-section">
          <ion-searchbar
            v-model="searchQuery"
            @ionInput="onSearchInput"
            placeholder="Buscar por nombre o correo..."
            class="custom-searchbar"
            :debounce="400"
          ></ion-searchbar>
        </div>

        <!-- Estado de Carga Inicial -->
        <div v-if="loading && usuarios.length === 0" class="center-container">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p class="loading-text">Cargando listado de usuarios...</p>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error && usuarios.length === 0" class="center-container error-box">
          <div class="error-icon">⚠️</div>
          <ion-text color="danger">
            <h2 class="error-title">Error de Conexión</h2>
            <p class="error-msg">{{ error }}</p>
          </ion-text>
          <ion-button fill="outline" color="primary" class="retry-btn" @click="fetchUsuarios(true)">
            Reintentar
          </ion-button>
        </div>

        <!-- Listado de Usuarios -->
        <div v-else>
          <div v-if="usuarios.length === 0" class="center-container empty-box">
            <span class="empty-icon">🔍</span>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta con otros términos de búsqueda.</p>
          </div>

          <div v-else>
            <ion-list class="usuarios-list">
              <ion-item v-for="user in usuarios" :key="user.id" class="usuario-item" lines="none">
                <div class="user-row-content">
                  <!-- Avatar -->
                  <div class="avatar-col">
                    <div class="avatar">
                      {{ user.nombre_completo.charAt(0).toUpperCase() }}
                    </div>
                  </div>

                  <!-- Info Principal -->
                  <div class="info-col">
                    <h3 class="user-name">{{ user.nombre_completo }}</h3>
                    <p class="user-email">{{ user.correo }}</p>
                    <div class="user-meta">
                      <span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre }}</span>
                      <span class="fincas-badge">🏡 {{ user.fincas_count }} Fincas</span>
                    </div>
                  </div>

                  <!-- Acciones y Estado -->
                  <div class="actions-col">
                    <!-- Switch de Estado (Activo/Inactivo) -->
                    <button
                      class="status-btn"
                      :class="{ active: user.activo, disabled: user.toggling }"
                      @click="toggleStatus(user)"
                      :disabled="user.toggling"
                    >
                      <span v-if="user.toggling" class="mini-spinner"></span>
                      <span v-else>{{ user.activo ? 'Activo' : 'Bloqueado' }}</span>
                    </button>

                    <!-- Botón Detalles -->
                    <ion-button fill="clear" size="small" class="detail-btn" @click="verDetalle(user.id)">
                      <ion-icon :icon="chevronForwardOutline" slot="icon-only"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              </ion-item>
            </ion-list>

            <!-- Paginación "Cargar más" -->
            <div v-if="hasMore" class="pagination-container">
              <ion-button fill="outline" class="load-more-btn" @click="cargarMas" :disabled="loadingMore">
                <ion-spinner v-if="loadingMore" name="dots" class="btn-spinner"></ion-spinner>
                <span v-else>Cargar más usuarios</span>
              </ion-button>
            </div>
            <div v-else-if="usuarios.length > 0" class="no-more-text">
              Has llegado al final de la lista.
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Modal de Registro de Usuario -->
    <ion-modal :is-open="isModalOpen" @didDismiss="cerrarModal" class="custom-modal">
      <ion-header class="ion-no-border">
        <ion-toolbar class="modal-toolbar">
          <ion-title>Registrar Usuario</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModal" color="medium">Cancelar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="modal-content ion-padding">
        <div class="form-container">
          <p class="form-desc">Crea una nueva cuenta de Ganadero o de Veterinario (asociado a un ganadero).</p>

          <!-- Nombre Completo -->
          <div class="input-group">
            <label class="input-label">Nombre Completo</label>
            <input
              type="text"
              v-model="form.nombre_completo"
              placeholder="Ej. Juan Pérez"
              class="custom-input"
              required
            />
          </div>

          <!-- Correo Electrónico -->
          <div class="input-group">
            <label class="input-label">Correo Electrónico</label>
            <input
              type="email"
              v-model="form.correo"
              placeholder="ejemplo@correo.com"
              class="custom-input"
              required
            />
          </div>

          <!-- Contraseña -->
          <div class="input-group">
            <label class="input-label">Contraseña</label>
            <input
              type="password"
              v-model="form.contrasena"
              placeholder="Mínimo 4 caracteres"
              class="custom-input"
              required
            />
          </div>

          <!-- Rol -->
          <div class="input-group">
            <label class="input-label">Tipo de Usuario (Rol)</label>
            <select v-model="form.rol_id" class="custom-select" @change="onRoleChange">
              <option value="" disabled>Seleccione un rol</option>
              <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">
                {{ formatRolNombre(rol.nombre) }}
              </option>
            </select>
          </div>

          <!-- Ganadero Asociado (solo si es Veterinario) -->
          <div v-if="esVeterinario" class="input-group animated-fade-in">
            <label class="input-label">Ganadero Responsable</label>
            <select v-model="form.ganadero_id" class="custom-select">
              <option value="" disabled>Seleccione el Ganadero asociado</option>
              <option v-for="g in ganaderosDisponibles" :key="g.id" :value="g.id">
                {{ g.nombre_completo }} ({{ g.correo }})
              </option>
            </select>
            <small class="helper-text">Los veterinarios operan bajo el expediente de un ganadero responsable.</small>
          </div>

          <!-- Mensaje de Error en Formulario -->
          <div v-if="formError" class="form-error-msg">
            ⚠️ {{ formError }}
          </div>

          <!-- Botón de Envío -->
          <ion-button
            expand="block"
            class="submit-btn"
            @click="guardarUsuario"
            :disabled="saving"
          >
            <ion-spinner v-if="saving" name="crescent" class="btn-spinner"></ion-spinner>
            <span v-else>Crear Usuario</span>
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonList, IonItem, IonSpinner, IonText,
  IonMenuButton, IonModal
} from '@ionic/vue';
import { chevronForwardOutline, personAddOutline } from 'ionicons/icons';
import { adminApi } from '@/services';

const router = useRouter();

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);

const usuarios = ref<any[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const hasMore = ref(true);

const fetchUsuarios = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    usuarios.value = [];
    hasMore.value = true;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  error.value = null;

  const filters = searchQuery.value.trim() ? { search: searchQuery.value.trim() } : {};
  const { data, error: apiError } = await adminApi.getUsuarios(currentPage.value, filters);

  if (apiError) {
    error.value = apiError;
  } else if (data) {
    const newUsers = (data.data || []).map((u: any) => ({ ...u, toggling: false }));
    usuarios.value = reset ? newUsers : [...usuarios.value, ...newUsers];
    hasMore.value = data.current_page < data.last_page;
  }
  loading.value = false;
  loadingMore.value = false;
};

const onSearchInput = () => {
  fetchUsuarios(true);
};

const cargarMas = () => {
  if (hasMore.value && !loadingMore.value) {
    currentPage.value++;
    fetchUsuarios(false);
  }
};

const toggleStatus = async (user: any) => {
  user.toggling = true;
  const { data, error: apiError } = await adminApi.toggleUsuarioStatus(user.id);
  if (apiError) {
    console.error('Error al cambiar estado:', apiError);
  } else if (data) {
    user.activo = data.activo;
  }
  user.toggling = false;
};

const verDetalle = (id: number) => {
  router.push(`/admin/usuarios/${id}`);
};


const isModalOpen = ref(false);
const saving = ref(false);
const formError = ref<string | null>(null);

const rolesDisponibles = ref<any[]>([]);
const ganaderosDisponibles = ref<any[]>([]);

const form = ref({
  nombre_completo: '',
  correo: '',
  contrasena: '',
  rol_id: '',
  ganadero_id: ''
});

const esVeterinario = ref(false);

const formatRolNombre = (nombre: string) => {
  if (nombre.toLowerCase() === 'admin') return 'Administrador';
  if (nombre.toLowerCase() === 'ganadero') return 'Ganadero';
  if (nombre.toLowerCase() === 'veterinario') return 'Veterinario';
  return nombre;
};

const abrirModalCreacion = async () => {
  isModalOpen.value = true;
  formError.value = null;
  resetForm();
  
  // Cargar roles si no se han cargado
  if (rolesDisponibles.value.length === 0) {
    const { data, error: apiError } = await adminApi.getRoles();
    if (data) {
      // Filtrar para no permitir crear admins en esta pantalla
      rolesDisponibles.value = data.filter((r: any) => r.nombre.toLowerCase() !== 'admin');
    } else {
      console.error('Error al cargar roles:', apiError);
    }
  }

  // Cargar ganaderos si no se han cargado o refrescar para tener la lista actualizada
  const { data, error: apiError } = await adminApi.getUsuarios(undefined, { rol_nombre: 'ganadero' });
  if (data) {
    ganaderosDisponibles.value = data;
  } else {
    console.error('Error al cargar ganaderos:', apiError);
  }
};

const cerrarModal = () => {
  isModalOpen.value = false;
};

const resetForm = () => {
  form.value = {
    nombre_completo: '',
    correo: '',
    contrasena: '',
    rol_id: '',
    ganadero_id: ''
  };
  esVeterinario.value = false;
};

const onRoleChange = () => {
  const selectedRol = rolesDisponibles.value.find(r => r.id === Number(form.value.rol_id));
  if (selectedRol && selectedRol.nombre.toLowerCase() === 'veterinario') {
    esVeterinario.value = true;
  } else {
    esVeterinario.value = false;
    form.value.ganadero_id = '';
  }
};

const guardarUsuario = async () => {
  formError.value = null;
  
  // Validaciones locales
  if (!form.value.nombre_completo.trim()) {
    formError.value = 'El nombre completo es obligatorio.';
    return;
  }
  if (!form.value.correo.trim()) {
    formError.value = 'El correo electrónico es obligatorio.';
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.correo)) {
    formError.value = 'El correo electrónico no es válido.';
    return;
  }
  if (!form.value.contrasena || form.value.contrasena.length < 4) {
    formError.value = 'La contraseña debe tener al menos 4 caracteres.';
    return;
  }
  if (!form.value.rol_id) {
    formError.value = 'Debe seleccionar un tipo de usuario (rol).';
    return;
  }
  if (esVeterinario.value && !form.value.ganadero_id) {
    formError.value = 'Los veterinarios deben asociarse a un ganadero responsable.';
    return;
  }

  saving.value = true;
  
  const payload: any = {
    nombre_completo: form.value.nombre_completo.trim(),
    correo: form.value.correo.trim(),
    contrasena: form.value.contrasena,
    rol_id: form.value.rol_id,
  };

  if (esVeterinario.value) {
    payload.ganadero_id = form.value.ganadero_id;
  }

  const { error: apiError } = await adminApi.crearUsuario(payload);
  saving.value = false;

  if (apiError) {
    formError.value = apiError;
  } else {
    cerrarModal();
    // Refrescar listado de usuarios
    fetchUsuarios(true);
  }
};

onMounted(() => {
  fetchUsuarios(true);
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

/* ====== SECCIÓN BÚSQUEDA ====== */
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

/* ====== LISTADO Y ELEMENTOS ====== */
.usuarios-list {
  background: transparent;
  padding: 0;
}

.usuario-item {
  --background: #ffffff;
  border-radius: 18px;
  margin-bottom: 12px;
  box-shadow: 0 8px 20px -5px rgba(44, 62, 45, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.01);
  --padding-start: 0;
  --inner-padding-end: 0;
}

.user-row-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.avatar-col {
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar {
  width: 44px;
  height: 44px;
  background: #eaf0e6;
  color: #556b2f;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(85, 107, 47, 0.05);
}

.info-col {
  flex-grow: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 13px;
  color: #5c6e58;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.role-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f4f1ea;
  color: #5c6e58;
}

.role-badge.admin { background: #f0f4f8; color: #334155; }
.role-badge.ganadero { background: #eaf0e6; color: #556b2f; }
.role-badge.veterinario { background: #fdfbf7; color: #6b8e23; }

.fincas-badge {
  font-size: 11px;
  color: #8ba888;
  font-weight: 700;
}

.actions-col {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  flex-shrink: 0;
}

/* Botón de Estado Integrado */
.status-btn {
  background: #fce8e8;
  color: #b71c1c;
  border: none;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 90px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-btn.active {
  background: #eaf0e6;
  color: #3e4f24;
}

.status-btn:active {
  transform: scale(0.95);
}

.status-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-btn {
  --color: #8ba888;
  margin: 0;
  --padding-start: 4px;
  --padding-end: 4px;
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

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== MODAL CREACIÓN ====== */
.add-user-btn {
  --color: #556b2f;
}

.modal-toolbar {
  --background: #ffffff;
  --min-height: 60px;
  border-bottom: 1px solid #f4f1ea;
}

.modal-toolbar ion-title {
  font-weight: 800;
  color: #2c3e2d;
  font-size: 16px;
}

.modal-content {
  --background: #fdfbf7;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.form-desc {
  font-size: 13px;
  color: #5c6e58;
  margin-top: 0;
  margin-bottom: 12px;
  line-height: 1.4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 11px;
  font-weight: 800;
  color: #8ba888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-input {
  background: #ffffff;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #2c3e2d;
  font-family: inherit;
  transition: all 0.2s ease;
}

.custom-input:focus {
  outline: none;
  border-color: #8ba888;
  box-shadow: 0 0 0 3px rgba(139, 168, 136, 0.15);
}

.custom-select {
  background: #ffffff;
  border: 1px solid #e2dcd0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #2c3e2d;
  font-family: inherit;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235c6e58' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 40px;
  transition: all 0.2s ease;
}

.custom-select:focus {
  outline: none;
  border-color: #8ba888;
  box-shadow: 0 0 0 3px rgba(139, 168, 136, 0.15);
}

.helper-text {
  font-size: 11px;
  color: #8ba888;
  line-height: 1.3;
}

.form-error-msg {
  background: #fdf2f2;
  color: #c81e1e;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(200, 30, 30, 0.1);
}

.submit-btn {
  --background: #556b2f;
  --color: #ffffff;
  --border-radius: 12px;
  margin-top: 12px;
  font-weight: 700;
  --box-shadow: 0 4px 12px rgba(85, 107, 47, 0.2);
  --background-hover: #4b5f29;
}

.animated-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
