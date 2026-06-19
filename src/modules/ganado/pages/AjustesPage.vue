<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">Mi Perfil</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ajustes-content">
      <div class="page-container">
        <!-- HEADER PERFIL -->
        <div class="profile-card animate-fade-in">
          <div class="avatar-container" @click="triggerPhotoUpload">
            <img v-if="profilePhoto" :src="profilePhoto" class="profile-photo" alt="Foto de perfil" />
            <div v-else class="avatar-placeholder">
              {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'G' }}
            </div>
            <div class="avatar-edit-badge">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
            <input 
              type="file" 
              ref="photoInput" 
              accept="image/*" 
              @change="onPhotoSelected" 
              style="display: none;" 
            />
          </div>
          
          <h2 class="profile-name">{{ usuarioSesion?.nombre_completo || 'Pedro Ganadero' }}</h2>
          <span class="profile-badge">PROPIETARIO GANADERO</span>
        </div>

        <!-- FORMULARIO DE EDICIÓN -->
        <div class="form-card animate-fade-in">
          <div class="card-header">
            <h3>📝 Datos de la Cuenta</h3>
          </div>
          <form @submit.prevent="updateProfile">
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Nombre Completo *</label>
                <input 
                  type="text" 
                  v-model="profileForm.nombre_completo" 
                  required 
                  class="form-input" 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Correo Electrónico *</label>
                <input 
                  type="email" 
                  v-model="profileForm.correo" 
                  required 
                  class="form-input" 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Nueva Contraseña (Dejar vacío para no cambiar)</label>
                <input 
                  type="password" 
                  v-model="profileForm.contrasena" 
                  placeholder="Mínimo 4 caracteres"
                  class="form-input" 
                />
              </div>
            </div>
            <div class="card-footer">
              <button type="submit" class="submit-btn" :disabled="updating">
                <span v-if="updating">Guardando cambios...</span>
                <span v-else>Actualizar Perfil</span>
              </button>
            </div>
          </form>
        </div>

        <!-- BOTÓN CERRAR SESIÓN -->
        <div class="danger-zone-card animate-fade-in">
          <h3>Zona de Riesgo</h3>
          <p>Para salir de tu cuenta y borrar la sesión activa en este dispositivo, presiona el botón inferior.</p>
          <button class="logout-btn" @click="handleLogout">
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            CERRAR SESIÓN ACTIVA
          </button>
        </div>
      </div>

      <!-- BOTTOM NAV BAR -->
      <BottomNav />
    </ion-content>

    <!-- TOASTS -->
    <ion-toast
      :is-open="toast.show"
      :message="toast.message"
      :color="toast.color"
      :duration="3000"
      @didDismiss="toast.show = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonToast, IonIcon 
} from '@ionic/vue';
import { cameraOutline, logOutOutline } from 'ionicons/icons';
import BottomNav from '@/components/BottomNav.vue';
import { animalRepository } from '@/services';

const router = useRouter();

// Datos de la sesión actual
const usuarioSesion = ref<any>(null);
const profilePhoto = ref<string | null>(null);
const selectedPhotoBase64 = ref<string | null>(null);

// Datos del formulario
const profileForm = ref({
  nombre_completo: '',
  correo: '',
  contrasena: ''
});
const updating = ref(false);

// Referencia al selector de archivos oculto
const photoInput = ref<HTMLInputElement | null>(null);

// Estado de las notificaciones toast
const toast = ref({
  show: false,
  message: '',
  color: 'success'
});

const showToast = (message: string, color: 'success' | 'danger' = 'success') => {
  toast.value.message = message;
  toast.value.color = color;
  toast.value.show = true;
};

// Activar el click en el selector de fotos
const triggerPhotoUpload = () => {
  if (photoInput.value) {
    photoInput.value.click();
  }
};

// Convertir imagen seleccionada a Base64 para vista previa y envío
const onPhotoSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La foto supera el límite de 5MB.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const base64Str = e.target.result as string;
        profilePhoto.value = base64Str;
        selectedPhotoBase64.value = base64Str;
      }
    };
    reader.readAsDataURL(file);
  }
};

// Guardar cambios del perfil en el servidor
const updateProfile = async () => {
  if (!usuarioSesion.value?.id) return;
  updating.value = true;
  try {
    const payload: any = {
      nombre_completo: profileForm.value.nombre_completo,
      correo: profileForm.value.correo,
    };
    if (profileForm.value.contrasena) {
      if (profileForm.value.contrasena.length < 4) {
        showToast('La contraseña debe tener al menos 4 caracteres.', 'danger');
        updating.value = false;
        return;
      }
      payload.contrasena = profileForm.value.contrasena;
    }

    if (selectedPhotoBase64.value) {
      payload.foto_base64 = selectedPhotoBase64.value;
    }

    const res = await animalRepository.editarUsuario(usuarioSesion.value.id, payload);
    
    // Actualizar la sesión almacenada en el navegador
    usuarioSesion.value.nombre_completo = profileForm.value.nombre_completo;
    usuarioSesion.value.correo = profileForm.value.correo;
    usuarioSesion.value.usuario = profileForm.value.correo;
    
    if (res && res.foto_url) {
      usuarioSesion.value.foto_url = res.foto_url;
      profilePhoto.value = res.foto_url;
      // Limpiar caché local obsoleta
      localStorage.removeItem(`foto_perfil_usuario_${usuarioSesion.value.id}`);
    }
    
    localStorage.setItem('usuario_sesion', JSON.stringify(usuarioSesion.value));
    selectedPhotoBase64.value = null; // resetear estado temporal
    
    showToast('Perfil actualizado con éxito.');
    profileForm.value.contrasena = ''; // clear password input
  } catch (e: any) {
    showToast(e.message || 'Error al guardar cambios de perfil.', 'danger');
  } finally {
    updating.value = false;
  }
};

// Cerrar sesión del usuario
const handleLogout = () => {
  localStorage.removeItem('usuario_sesion');
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  router.push('/login');
};

onMounted(() => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  if (sessionStr) {
    try {
      usuarioSesion.value = JSON.parse(sessionStr);
      profileForm.value.nombre_completo = usuarioSesion.value.nombre_completo || '';
      profileForm.value.correo = usuarioSesion.value.correo || usuarioSesion.value.usuario || '';
      
      // Cargar foto de perfil priorizando la guardada en el servidor (foto_url)
      if (usuarioSesion.value.foto_url) {
        profilePhoto.value = usuarioSesion.value.foto_url;
      } else {
        const savedPhoto = localStorage.getItem(`foto_perfil_usuario_${usuarioSesion.value.id}`);
        if (savedPhoto) {
          profilePhoto.value = savedPhoto;
        }
      }
    } catch (e) {
      console.error('Error parseando usuario_sesion:', e);
    }
  }
});
</script>

<style scoped>
.ajustes-content {
  --background: #f4f6f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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

/* Page Shell Container */
.page-container {
  padding: 20px 16px 100px; /* space for bottom nav bar */
  max-width: 500px;
  margin: 0 auto;
}

/* Tarjeta de información del perfil */
.profile-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-container {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 14px;
  cursor: pointer;
}

.profile-photo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #eaf0e6;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  color: white;
  font-size: 36px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.15);
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #2E7D32;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 2px solid white;
}

.avatar-edit-badge ion-icon {
  font-size: 14px;
}

.profile-name {
  font-size: 20px;
  font-weight: 850;
  color: #1B5E20;
  margin: 0 0 4px;
}

.profile-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #2E7D32;
  background: #eaf0e6;
  padding: 4px 10px;
  border-radius: 8px;
}

/* Estilos del formulario de edición */
.form-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(46, 125, 50, 0.06);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f4f6f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #1B5E20;
}

.card-body {
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #1B5E20;
}

.form-input {
  border: 1px solid #c0c5b1;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  color: #2c3e2d;
  background: #fdfdfd;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #2E7D32;
  background: white;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #f4f6f0;
  background: #fdfdfd;
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #2E7D32, #1B5E20);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Zona de peligro (Cerrar sesión) */
.danger-zone-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.02);
  border: 1px dashed #d32f2f;
  text-align: center;
}

.danger-zone-card h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: #d32f2f;
}

.danger-zone-card p {
  font-size: 12px;
  color: #5c6e58;
  margin: 0 0 16px;
  line-height: 1.5;
}

.logout-btn {
  width: 100%;
  background: linear-gradient(135deg, #D32F2F, #B71C1C);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
