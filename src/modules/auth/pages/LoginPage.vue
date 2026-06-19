<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-wrapper">

        <!-- ============ HERO SECTION ============ -->
        <div class="hero-section">
          <img src="/hero-cows.jpg" alt="BovWeight CR - Ganado en campo" class="hero-image" />
          <div class="hero-overlay"></div>

          <!-- Logo sobre la imagen -->
          <div class="hero-logo-area">
            <img src="/logo.png" alt="BovWeight CR" class="hero-logo-img" />
          </div>
        </div>

        <!-- ============ BOTTOM SHEET (FORM) ============ -->
        <div class="form-sheet">

          <!-- LOGIN MODE -->
          <div v-if="!isRecoveryMode">
            <div class="sheet-header">
              <h1 class="sheet-title">Iniciar sesión</h1>
              <p class="sheet-subtitle">Bienvenido a <span class="brand-green">BovWeight CR</span></p>
            </div>

            <!-- Email -->
            <div class="input-group">
              <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
              <input
                id="login-email"
                type="email"
                v-model="usuario"
                placeholder="Correo electrónico"
                class="field-input"
                autocomplete="email"
                @keyup.enter="login"
              />
            </div>

            <!-- Password -->
            <div class="input-group">
              <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
              <input
                id="login-password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Contraseña"
                class="field-input"
                autocomplete="current-password"
                @keyup.enter="login"
              />
              <button type="button" class="toggle-eye" @click="showPassword = !showPassword" tabindex="-1">
                <ion-icon :icon="showPassword ? eyeOutline : eyeOffOutline"></ion-icon>
              </button>
            </div>

            <!-- Remember me + Forgot password -->
            <div class="options-row">
              <label class="remember-label">
                <input type="checkbox" v-model="rememberMe" class="remember-checkbox" />
                <span class="remember-text">Recordarme</span>
              </label>
              <button type="button" class="forgot-link" @click="toggleRecoveryMode(true)">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <!-- Error -->
            <transition name="fade">
              <div v-if="error" class="error-box">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ error }}</span>
              </div>
            </transition>

            <!-- Login Button -->
            <button id="login-submit-btn" class="login-btn" @click="login" :disabled="loading">
              <span v-if="!loading" class="btn-inner">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                Iniciar sesión
              </span>
              <span v-else class="spinner"></span>
            </button>

            <!-- Security badge -->
            <div class="security-badge">
              <ion-icon :icon="shieldCheckmarkOutline" class="shield-icon"></ion-icon>
              <span>Tu información está protegida y segura</span>
            </div>
          </div>

          <!-- RECOVERY MODE -->
          <div v-else>
            <div class="sheet-header">
              <h1 class="sheet-title">Recuperar Acceso</h1>
              <p class="sheet-subtitle">Te enviaremos una contraseña temporal</p>
            </div>

            <div class="input-group">
              <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
              <input
                type="email"
                v-model="recoveryEmail"
                placeholder="Correo electrónico registrado"
                class="field-input"
                @keyup.enter="requestRecovery"
              />
            </div>

            <transition name="fade">
              <div v-if="recoverySuccess" class="success-box">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>{{ recoverySuccess }}</span>
              </div>
            </transition>

            <transition name="fade">
              <div v-if="recoveryError" class="error-box">
                <ion-icon :icon="alertCircleOutline"></ion-icon>
                <span>{{ recoveryError }}</span>
              </div>
            </transition>

            <button class="login-btn" @click="requestRecovery" :disabled="recoveryLoading">
              <span v-if="!recoveryLoading" class="btn-inner">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                Enviar contraseña temporal
              </span>
              <span v-else class="spinner"></span>
            </button>

            <div class="back-row">
              <button type="button" class="back-link" @click="toggleRecoveryMode(false)">
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>

          <!-- Footer -->
          <p class="footer-copy">© 2024 <span class="brand-green">BovWeight CR</span>. Todos los derechos reservados.</p>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import {
  personOutline,
  lockClosedOutline,
  alertCircleOutline,
  eyeOutline,
  eyeOffOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { authRepository } from '@/services';

const router = useRouter();
const usuario = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const rememberMe = ref(false);

// Password recovery states
const isRecoveryMode = ref(false);
const recoveryEmail = ref('');
const recoveryLoading = ref(false);
const recoveryError = ref('');
const recoverySuccess = ref('');

const toggleRecoveryMode = (val: boolean) => {
  isRecoveryMode.value = val;
  recoveryEmail.value = '';
  recoveryError.value = '';
  recoverySuccess.value = '';
  error.value = '';
};

const requestRecovery = async () => {
  if (!recoveryEmail.value) {
    recoveryError.value = 'Por favor, ingrese su correo electrónico.';
    return;
  }
  recoveryLoading.value = true;
  recoveryError.value = '';
  recoverySuccess.value = '';
  try {
    const response = await authRepository.recuperarPassword(recoveryEmail.value);
    recoverySuccess.value = response.message || 'Se ha enviado una contraseña temporal a su correo.';
  } catch (err: any) {
    recoveryError.value = err.message || 'Error al procesar la solicitud. Verifique el correo ingresado.';
  } finally {
    recoveryLoading.value = false;
  }
};

const login = async () => {
  if (!usuario.value || !password.value) {
    error.value = 'Por favor, ingrese sus credenciales.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const user = await authRepository.login(usuario.value, password.value);
    localStorage.setItem('usuario_sesion', JSON.stringify(user));
    if (user.debe_cambiar_password && user.rol !== 'admin') {
      router.push('/cambiar-contrasena');
    } else if (user.rol === 'admin') {
      router.push('/admin');
    } else if (user.rol === 'veterinario') {
      router.push('/veterinario');
    } else {
      router.push('/home');
    }
  } catch (err: any) {
    error.value = err.message || 'Correo o contraseña incorrectos';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ==========================================
   PAGE CONTAINER
   ========================================== */
.login-content {
  --background: #f5f7f4;
}

.login-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f5f7f4;
}

/* ==========================================
   HERO SECTION
   ========================================== */
.hero-section {
  position: relative;
  width: 100%;
  height: 380px;
  flex-shrink: 0;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.05) 40%,
    rgba(255, 255, 255, 0.0) 70%,
    rgba(245, 247, 244, 0.92) 100%
  );
}

.hero-logo-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px 24px 60px;
  text-align: center;
  /* Spotlight oscuro detrás del logo para hacer que los colores resalten */
  background: radial-gradient(
    ellipse 85% 55% at 50% 45%,
    rgba(0, 0, 0, 0.50) 0%,
    rgba(0, 0, 0, 0.20) 55%,
    transparent 75%
  );
}

.hero-logo-img {
  width: 80%;
  max-width: 320px;
  height: auto;
  display: block;
  /* Sin mix-blend-mode: colores 100% vivos y originales */
  filter: saturate(1.25) brightness(1.08) drop-shadow(0 4px 24px rgba(0, 0, 0, 0.45));
}

.hero-tagline {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.45;
  margin: 0;
  text-align: center;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.01em;
}

/* ==========================================
   BOTTOM SHEET (FORM)
   ========================================== */
.form-sheet {
  flex: 1;
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  margin-top: -42px;
  padding: 32px 28px 24px;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
  min-height: 460px;
}

/* ==========================================
   SHEET HEADER
   ========================================== */
.sheet-header {
  margin-bottom: 28px;
}

.sheet-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f2910;
  margin: 0 0 5px;
  letter-spacing: -0.4px;
}

.sheet-subtitle {
  font-size: 14px;
  color: #6b7d6a;
  margin: 0;
  font-weight: 400;
}

.brand-green {
  color: #2e7d32;
  font-weight: 600;
}

/* ==========================================
   INPUT FIELDS
   ========================================== */
.input-group {
  position: relative;
  margin-bottom: 14px;
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #9eb89b;
  pointer-events: none;
  transition: color 0.2s;
}

.input-group:focus-within .input-icon {
  color: #2e7d32;
}

.field-input {
  width: 100%;
  height: 52px;
  padding: 0 44px 0 46px;
  border: 1.5px solid #e0e8dc;
  border-radius: 13px;
  background: #f9fbf8;
  font-size: 15px;
  color: #1a2b1a;
  font-family: inherit;
  outline: none;
  transition: border-color 0.22s, box-shadow 0.22s;
  box-sizing: border-box;
}

.field-input::placeholder {
  color: #adbdab;
}

.field-input:focus {
  border-color: #2e7d32;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.09);
}

.toggle-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #9eb89b;
  font-size: 19px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 8px;
  transition: color 0.2s;
}

.toggle-eye:hover {
  color: #2e7d32;
}

/* ==========================================
   OPTIONS ROW (Remember me + Forgot)
   ========================================== */
.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 22px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #2e7d32;
  border-radius: 4px;
  cursor: pointer;
}

.remember-text {
  font-size: 14px;
  color: #4e6b4d;
  font-weight: 500;
}

.forgot-link {
  background: none;
  border: none;
  font-size: 13.5px;
  color: #2e7d32;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}

.forgot-link:hover {
  opacity: 0.75;
}

/* ==========================================
   ALERTS (Error / Success)
   ========================================== */
.error-box,
.success-box {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  padding: 11px 14px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.error-box {
  color: #b71c1c;
  background: rgba(183, 28, 28, 0.07);
  border: 1px solid rgba(183, 28, 28, 0.12);
}

.success-box {
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.08);
  border: 1px solid rgba(46, 125, 50, 0.15);
}

/* ==========================================
   LOGIN BUTTON
   ========================================== */
.login-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border: none;
  border-radius: 14px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.30);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  letter-spacing: 0.02em;
  margin-bottom: 24px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(46, 125, 50, 0.36);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ==========================================
   SPINNER
   ========================================== */
.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ==========================================
   SECURITY BADGE
   ========================================== */
.security-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 13px;
  color: #8faa8c;
  margin-bottom: 28px;
}

.shield-icon {
  font-size: 16px;
  color: #7da67a;
}

/* ==========================================
   BACK LINK (Recovery mode)
   ========================================== */
.back-row {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.back-link {
  background: none;
  border: none;
  font-size: 14px;
  color: #4e6b4d;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2e7d32;
}

/* ==========================================
   FOOTER
   ========================================== */
.footer-copy {
  text-align: center;
  font-size: 12.5px;
  color: #b0c0ae;
  margin: 0;
}

/* ==========================================
   TRANSITIONS
   ========================================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==========================================
   RESPONSIVE — Tablet / Desktop center card
   ========================================== */
@media (min-width: 600px) {
  .login-content {
    --background: #e8ede5;
  }

  .login-wrapper {
    min-height: 100%;
    justify-content: center;
    align-items: center;
    background: #e8ede5;
    padding: 40px 20px;
  }

  .hero-section {
    width: 100%;
    max-width: 420px;
    border-radius: 28px 28px 0 0;
    height: 260px;
    overflow: hidden;
  }

  .form-sheet {
    width: 100%;
    max-width: 420px;
    border-radius: 0 0 28px 28px;
    box-shadow: 0 12px 50px rgba(0, 0, 0, 0.14);
    margin-top: 0;
  }

  /* Wrap both as a card */
  .login-wrapper {
    flex-direction: column;
  }
}
</style>
