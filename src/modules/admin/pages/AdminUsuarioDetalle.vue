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
              <span class="app-logo">Expediente de Usuario</span>
            </div>
          </ion-title>
          <ion-buttons slot="end" v-if="user && user.rol_nombre !== 'admin'">
            <ion-button @click="abrirModalEdicion" class="edit-header-btn">
              <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
            </ion-button>
            <ion-button @click="confirmarEliminacion" class="delete-header-btn">
              <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
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

    <!-- MODAL DE EDICIÓN DE USUARIO -->
    <ion-modal :is-open="isEditModalOpen" @didDismiss="cerrarModalEdicion" class="custom-modal">
      <ion-header class="ion-no-border">
        <ion-toolbar class="modal-toolbar">
          <ion-title>Editar Usuario</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="cerrarModalEdicion" color="medium">Cancelar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="modal-content ion-padding">
        <div class="form-container" v-if="editForm">
          <p class="form-desc">Actualiza los datos del usuario en el sistema.</p>

          <!-- Nombre Completo -->
          <div class="input-group">
            <label class="input-label">Nombre Completo</label>
            <input
              type="text"
              v-model="editForm.nombre_completo"
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
              v-model="editForm.correo"
              placeholder="Ej. juan@correo.com"
              class="custom-input"
              required
            />
          </div>

          <!-- Rol (Seleccionable) -->
          <div class="input-group">
            <label class="input-label">Rol de Usuario</label>
            <select v-model="editForm.rol_id" class="custom-select" required @change="onRolChangeInEdit">
              <option v-for="r in rolesDisponibles" :key="r.id" :value="r.id">
                {{ r.nombre.toUpperCase() }}
              </option>
            </select>
          </div>

          <!-- Ganadero Responsable (Solo para Veterinarios) -->
          <div class="input-group" v-if="isVeterinarioInEdit">
            <label class="input-label">Ganadero Responsable</label>
            <select v-model="editForm.ganadero_id" class="custom-select">
              <option :value="null">Ninguno</option>
              <option v-for="g in ganaderosDisponibles" :key="g.id" :value="g.id">
                {{ g.nombre_completo }} ({{ g.correo }})
              </option>
            </select>
            <span class="helper-text">El veterinario podrá consultar las fincas y pesajes de este ganadero.</span>
          </div>

          <!-- Estado Activo/Inactivo -->
          <div class="input-group" style="flex-direction: row; align-items: center; justify-content: space-between; margin-top: 8px;">
            <div>
              <label class="input-label" style="display: block;">Estado de Cuenta</label>
              <span class="helper-text">Permitir o bloquear acceso al sistema.</span>
            </div>
            <button
              type="button"
              class="status-btn"
              :class="{ active: editForm.activo }"
              @click="editForm.activo = !editForm.activo"
            >
              {{ editForm.activo ? 'Activo' : 'Bloqueado' }}
            </button>
          </div>

          <!-- Error del Formulario -->
          <div v-if="editFormError" class="form-error-msg animated-fade-in">
            {{ editFormError }}
          </div>

          <!-- Botón Guardar -->
          <ion-button
            expand="block"
            class="submit-btn"
            @click="guardarEdicion"
            :disabled="savingEdicion"
          >
            <ion-spinner v-if="savingEdicion" name="crescent"></ion-spinner>
            <span v-else>Guardar Cambios</span>
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner, IonText,
  IonModal, alertController, toastController, IonicSafeString
} from '@ionic/vue';
import { arrowBackOutline, chevronForwardOutline, trashOutline, createOutline } from 'ionicons/icons';
import { adminApi } from '@/services';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const user = ref<any>(null);

const confirmarEliminacion = async () => {
  if (!user.value) return;

  let detailsHtml = '';
  
  if (user.value.rol_nombre === 'ganadero') {
    const totalFincas = user.value.fincas ? user.value.fincas.length : 0;
    const totalAnimals = user.value.fincas 
      ? user.value.fincas.reduce((sum: number, f: any) => sum + (f.animales_count || 0), 0)
      : 0;
    const totalVets = user.value.veterinarios ? user.value.veterinarios.length : 0;

    detailsHtml = `
      <p>Esta acción es permanente y eliminará toda la información del ganadero en el sistema.</p>
      <strong>Datos a eliminar en cascada:</strong><br>
      • Fincas registradas: <b>${totalFincas}</b><br>
      • Animales bovinos: <b>${totalAnimals}</b><br>
      • Veterinarios asociados: <b>${totalVets}</b><br>
      • Historial de pesajes y reportes clínicos relacionados.
    `;
  } else if (user.value.rol_nombre === 'veterinario') {
    const ganaderoName = user.value.ganadero ? user.value.ganadero.nombre_completo : 'Ninguno';
    detailsHtml = `
      <p>Esta acción es permanente y eliminará la cuenta del veterinario del sistema.</p>
      <strong>Detalles de la cuenta:</strong><br>
      • Ganadero responsable: <b>${ganaderoName}</b><br>
      • Reportes emitidos e historial de citas agendadas.
    `;
  } else {
    detailsHtml = '<p>¿Está seguro de que desea eliminar este usuario y todos sus datos asociados?</p>';
  }

  const alert = await alertController.create({
    header: '¿Confirmar eliminación?',
    subHeader: `Eliminar a ${user.value.nombre_completo}`,
    message: new IonicSafeString(detailsHtml),
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          await procederEliminar();
        }
      }
    ]
  });

  await alert.present();
};

const procederEliminar = async () => {
  if (!user.value) return;
  
  loading.value = true;
  const { error: apiError } = await adminApi.eliminarUsuario(user.value.id);
  loading.value = false;

  if (apiError) {
    const toast = await toastController.create({
      message: `Error al eliminar: ${apiError}`,
      duration: 3500,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } else {
    const toast = await toastController.create({
      message: 'Usuario y todos sus registros asociados eliminados exitosamente.',
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
    router.push('/admin/usuarios');
  }
};

// EDICIÓN DE USUARIO
const isEditModalOpen = ref(false);
const editForm = ref<any>(null);
const editFormError = ref<string | null>(null);
const savingEdicion = ref(false);
const rolesDisponibles = ref<any[]>([]);
const ganaderosDisponibles = ref<any[]>([]);

const isVeterinarioInEdit = computed(() => {
  if (!editForm.value || !editForm.value.rol_id) return false;
  const selectedRol = rolesDisponibles.value.find(r => r.id === editForm.value.rol_id);
  return selectedRol && selectedRol.nombre.toLowerCase() === 'veterinario';
});

const onRolChangeInEdit = () => {
  if (!isVeterinarioInEdit.value) {
    editForm.value.ganadero_id = null;
  }
};

const abrirModalEdicion = async () => {
  if (!user.value) return;

  editFormError.value = null;
  editForm.value = {
    nombre_completo: user.value.nombre_completo,
    correo: user.value.correo,
    rol_id: user.value.rol_id,
    ganadero_id: user.value.ganadero ? user.value.ganadero.id : null,
    activo: user.value.activo
  };

  // Cargar roles si no se han cargado
  if (rolesDisponibles.value.length === 0) {
    const { data, error: apiError } = await adminApi.getRoles();
    if (data) {
      rolesDisponibles.value = data.filter((r: any) => r.nombre.toLowerCase() !== 'admin');
    }
  }

  // Cargar ganaderos
  if (ganaderosDisponibles.value.length === 0) {
    const { data, error: apiError } = await adminApi.getUsuarios(undefined, { rol_nombre: 'ganadero' });
    if (data) {
      ganaderosDisponibles.value = data;
    }
  }

  isEditModalOpen.value = true;
};

const cerrarModalEdicion = () => {
  isEditModalOpen.value = false;
};

const guardarEdicion = async () => {
  if (!editForm.value || !user.value) return;

  if (!editForm.value.nombre_completo || !editForm.value.correo) {
    editFormError.value = 'El nombre y correo son obligatorios.';
    return;
  }

  savingEdicion.value = true;
  editFormError.value = null;

  const payload = {
    nombre_completo: editForm.value.nombre_completo,
    correo: editForm.value.correo,
    rol_id: editForm.value.rol_id,
    ganadero_id: editForm.value.ganadero_id,
    activo: editForm.value.activo
  };

  const { error: apiError } = await adminApi.editarUsuario(user.value.id, payload);
  savingEdicion.value = false;

  if (apiError) {
    editFormError.value = apiError;
  } else {
    const toast = await toastController.create({
      message: 'Usuario actualizado exitosamente.',
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
    isEditModalOpen.value = false;
    await fetchUsuario(user.value.id); // Recargar datos
  }
};

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

.delete-header-btn {
  --color: #c81e1e;
  font-weight: 700;
}

.delete-header-btn:hover {
  --color: #9b1c1c;
}

.edit-header-btn {
  --color: #556b2f;
  margin-right: 8px;
}

.edit-header-btn:hover {
  --color: #4b5f29;
}

/* ====== MODALES Y FORMULARIOS ====== */
.custom-modal {
  --height: auto;
  --max-height: 90%;
  --border-radius: 24px;
  --box-shadow: 0 28px 48px rgba(44, 62, 45, 0.15);
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

.status-btn {
  background: #fce8e8;
  color: #c81e1e;
  border: 1px solid rgba(200, 30, 30, 0.1);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn.active {
  background: #eaf0e6;
  color: #3e4f24;
  border-color: rgba(85, 107, 47, 0.1);
}

.animated-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
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
