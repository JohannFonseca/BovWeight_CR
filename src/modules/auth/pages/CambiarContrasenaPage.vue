<template>
  <ion-page>
    <ion-content :fullscreen="true" class="change-password-content">
      <div class="change-page-wrapper">
        <div class="glass-container">
          <div class="form-header">
            <div class="icon-badge">
              <ion-icon :icon="lockOpenOutline"></ion-icon>
            </div>
            <h2>Actualizar Contraseña</h2>
            <p>Por seguridad, debe cambiar su contraseña temporal antes de continuar al sistema.</p>
          </div>

          <div class="form-body">
            <!-- Current Password -->
            <div class="input-group">
              <label for="current-password">Contraseña Temporal</label>
              <div class="input-wrapper">
                <ion-icon :icon="keyOutline" class="field-icon"></ion-icon>
                <input 
                  id="current-password"
                  :type="showCurrent ? 'text' : 'password'" 
                  v-model="currentPassword" 
                  placeholder="Ingrese la contraseña recibida por correo"
                  class="styled-input"
                />
                <button type="button" class="eye-toggle" @click="showCurrent = !showCurrent">
                  <ion-icon :icon="showCurrent ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div class="input-group">
              <label for="new-password">Nueva Contraseña</label>
              <div class="input-wrapper">
                <ion-icon :icon="lockClosedOutline" class="field-icon"></ion-icon>
                <input 
                  id="new-password"
                  :type="showNew ? 'text' : 'password'" 
                  v-model="newPassword" 
                  placeholder="Mínimo 6 caracteres"
                  class="styled-input"
                />
                <button type="button" class="eye-toggle" @click="showNew = !showNew">
                  <ion-icon :icon="showNew ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="input-group">
              <label for="confirm-password">Confirmar Nueva Contraseña</label>
              <div class="input-wrapper">
                <ion-icon :icon="checkmarkCircleOutline" class="field-icon"></ion-icon>
                <input 
                  id="confirm-password"
                  :type="showConfirm ? 'text' : 'password'" 
                  v-model="confirmPassword" 
                  placeholder="Repita la nueva contraseña"
                  class="styled-input"
                />
                <button type="button" class="eye-toggle" @click="showConfirm = !showConfirm">
                  <ion-icon :icon="showConfirm ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <!-- Validation List -->
            <div class="validation-hints">
              <div class="hint-item" :class="{ valid: hasMinLength }">
                <ion-icon :icon="hasMinLength ? checkmarkOutline : ellipseOutline"></ion-icon>
                <span>Mínimo 6 caracteres</span>
              </div>
              <div class="hint-item" :class="{ valid: passwordsMatch }">
                <ion-icon :icon="passwordsMatch ? checkmarkOutline : ellipseOutline"></ion-icon>
                <span>Las contraseñas coinciden</span>
              </div>
              <div class="hint-item" :class="{ valid: isDifferent }">
                <ion-icon :icon="isDifferent ? checkmarkOutline : ellipseOutline"></ion-icon>
                <span>Diferente a la contraseña temporal</span>
              </div>
            </div>

            <!-- Error message -->
            <transition name="fade">
              <div v-if="error" class="error-banner">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ error }}</span>
              </div>
            </transition>

            <!-- Success message -->
            <transition name="fade">
              <div v-if="success" class="success-banner">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>{{ success }}</span>
              </div>
            </transition>

            <!-- Submit Button -->
            <button 
              @click="submitPasswordChange" 
              class="submit-btn" 
              :disabled="loading || !isValidForm"
            >
              <span v-if="!loading">CAMBIAR CONTRASEÑA</span>
              <span class="spinner" v-else></span>
            </button>

            <!-- Logout Button -->
            <button @click="logout" class="cancel-btn" :disabled="loading">
              CERRAR SESIÓN
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { 
  lockOpenOutline, 
  lockClosedOutline, 
  keyOutline,
  checkmarkCircleOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkOutline,
  ellipseOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { animalRepository } from '@/services';

const router = useRouter();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const loading = ref(false);
const error = ref('');
const success = ref('');

// Get session info
const getSession = () => {
  const sessionStr = localStorage.getItem('usuario_sesion');
  if (sessionStr) {
    try {
      return JSON.parse(sessionStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const session = getSession();

// Computed validations
const hasMinLength = computed(() => newPassword.value.length >= 6);
const passwordsMatch = computed(() => {
  return newPassword.value.length > 0 && newPassword.value === confirmPassword.value;
});
const isDifferent = computed(() => {
  return newPassword.value.length > 0 && newPassword.value !== currentPassword.value;
});
const isValidForm = computed(() => {
  return currentPassword.value.length > 0 && hasMinLength.value && passwordsMatch.value && isDifferent.value;
});

const submitPasswordChange = async () => {
  if (!session) {
    error.value = 'Sesión no encontrada. Inicie sesión de nuevo.';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await animalRepository.cambiarPassword(
      session.id,
      currentPassword.value,
      newPassword.value,
      confirmPassword.value
    );

    success.value = 'Contraseña cambiada con éxito. Redirigiendo...';

    // Update local storage session flag
    session.debe_cambiar_password = false;
    localStorage.setItem('usuario_sesion', JSON.stringify(session));

    setTimeout(() => {
      // Redirect based on role
      if (session.rol === 'veterinario') {
        router.push('/veterinario');
      } else {
        router.push('/home');
      }
    }, 1500);
  } catch (err: any) {
    error.value = err.message || 'Error al cambiar la contraseña. Verifique los datos.';
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  router.push('/login');
};
</script>

<style scoped>
.change-password-content {
  --background: #f4f7f0;
}

.change-page-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 24px;
  background: radial-gradient(circle at 10% 20%, rgba(46, 125, 50, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(255, 143, 0, 0.05) 0%, transparent 40%);
}

.glass-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(13, 56, 18, 0.06);
  padding: 40px;
  width: 100%;
  max-width: 460px;
  box-sizing: border-box;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%);
  border-radius: 20px;
  color: white;
  font-size: 28px;
  margin-bottom: 18px;
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.2);
}

.form-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #1a2f1c;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.form-header p {
  font-size: 14px;
  color: #5c6e58;
  margin: 0;
  line-height: 1.5;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 12px;
  font-weight: 700;
  color: #5c6e58;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 16px;
  font-size: 20px;
  color: #7c937a;
  pointer-events: none;
}

.styled-input {
  width: 100%;
  height: 50px;
  padding: 0 44px 0 48px;
  background: white;
  border: 1.5px solid #d0dfca;
  border-radius: 14px;
  font-size: 15px;
  color: #1e291e;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.styled-input:focus {
  border-color: #2E7D32;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.eye-toggle {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: #7c937a;
  font-size: 20px;
  cursor: pointer;
  padding: 10px;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-toggle:hover {
  color: #2E7D32;
}

.validation-hints {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fdfdfd;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #eef3eb;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #8fa28f;
  transition: color 0.25s ease;
}

.hint-item ion-icon {
  font-size: 16px;
}

.hint-item.valid {
  color: #2e7d32;
  font-weight: 600;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(198, 40, 40, 0.06);
  border: 1px solid rgba(198, 40, 40, 0.12);
  color: #c62828;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(46, 125, 50, 0.06);
  border: 1px solid rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
}

.submit-btn {
  height: 52px;
  background: linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(46, 125, 50, 0.2);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 12px 30px rgba(46, 125, 50, 0.3);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  height: 48px;
  background: none;
  border: 1.5px solid #d0dfca;
  color: #5c6e58;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.02);
  border-color: #a4bfa0;
  color: #1a2f1c;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
