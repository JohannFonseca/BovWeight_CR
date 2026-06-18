<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-page-wrapper">
        
        <!-- Left Side: Brand Panel (Desktop only) -->
        <div class="brand-panel">
          <div class="brand-bg-overlay"></div>
          <div class="brand-grid-pattern"></div>
          
          <!-- Animated backdrop shapes -->
          <div class="brand-shape brand-shape-1"></div>
          <div class="brand-shape brand-shape-2"></div>
          
          <div class="brand-content">
            <div class="brand-logo-container">
              <!-- Geometric Modern Cow/Tech SVG Logo -->
              <svg class="brand-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#bg-gradient)" />
                <path d="M 25 25 L 75 25 M 25 45 L 75 45 M 25 65 L 75 65 M 25 25 L 25 65 M 50 25 L 50 65 M 75 25 L 75 65" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
                <!-- Horns -->
                <path d="M 36 34 A 8 8 0 0 0 26 28 M 64 34 A 8 8 0 0 1 74 28" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
                <!-- Cow face outline -->
                <path d="M 30 32 L 50 18 L 70 32 M 35 44 C 35 44, 50 36, 50 36 C 50 36, 65 44, 65 44" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M 35 44 L 40 64 C 41 70, 59 70, 60 64 L 65 44 Z" fill="rgba(255,255,255,0.15)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
                <!-- Nose element -->
                <rect x="44" y="52" width="12" height="6" rx="2" fill="#FF8F00" />
                <defs>
                  <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2E7D32" />
                    <stop offset="100%" stop-color="#1B5E20" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <h1 class="brand-title">BovWeight<span class="highlight">CR</span></h1>
            <p class="brand-subtitle">Gestión Inteligente de Ganado</p>
            <p class="brand-description">
              Optimice el control de su finca utilizando inteligencia artificial para estimar el peso y monitorear la evolución del ganado de forma precisa.
            </p>
            
            <div class="feature-list">
              <div class="feature-item">
                <div class="feature-icon-wrapper">
                  <ion-icon :icon="sparklesOutline" class="feature-icon"></ion-icon>
                </div>
                <div class="feature-text">
                  <h3>Estimación con Inteligencia Artificial</h3>
                  <p>Calcule pesos aproximados a partir de fotografías al instante.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon-wrapper">
                  <ion-icon :icon="trendingUpOutline" class="feature-icon"></ion-icon>
                </div>
                <div class="feature-text">
                  <h3>Monitoreo & Reportes</h3>
                  <p>Gráficas avanzadas para dar seguimiento detallado a cada animal.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon-wrapper">
                  <ion-icon :icon="cloudOfflineOutline" class="feature-icon"></ion-icon>
                </div>
                <div class="feature-text">
                  <h3>Operación Sin Conexión</h3>
                  <p>Ideal para registrar pesajes en zonas rurales sin cobertura de red.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="brand-footer">
            <p>© 2026 BovWeight CR. Todos los derechos reservados.</p>
          </div>
        </div>
        
        <!-- Right Side: Login Form -->
        <div class="form-panel">
          <!-- Background shape decoration for mobile (subtle) -->
          <div class="mobile-bg-shape shape-1"></div>
          <div class="mobile-bg-shape shape-2"></div>
          
          <div class="form-container">
            <!-- Mobile Header Logo (Visible on mobile, hidden on desktop) -->
            <div class="mobile-logo-header">
              <div class="mobile-logo-wrapper">
                <svg class="mobile-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="24" fill="url(#mobile-bg-gradient)" />
                  <path d="M 25 25 L 75 25 M 25 45 L 75 45 M 25 65 L 75 65 M 25 25 L 25 65 M 50 25 L 50 65 M 75 25 L 75 65" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
                  <path d="M 36 34 A 8 8 0 0 0 26 28 M 64 34 A 8 8 0 0 1 74 28" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
                  <path d="M 30 32 L 50 18 L 70 32 M 35 44 C 35 44, 50 36, 50 36 C 50 36, 65 44, 65 44" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M 35 44 L 40 64 C 41 70, 59 70, 60 64 L 65 44 Z" fill="rgba(255,255,255,0.15)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
                  <rect x="44" y="52" width="12" height="6" rx="2" fill="#FF8F00" />
                  <defs>
                    <linearGradient id="mobile-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#2E7D32" />
                      <stop offset="100%" stop-color="#1B5E20" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 class="mobile-app-title">BovWeight<span class="highlight">CR</span></h1>
              <p class="mobile-app-subtitle">Gestión Inteligente de Ganado</p>
            </div>

            <!-- Welcome message -->
            <div class="welcome-header">
              <h2>{{ isRecoveryMode ? 'Recuperar Acceso' : '¡Hola de nuevo!' }}</h2>
              <p>{{ isRecoveryMode ? 'Ingrese su correo para recibir una contraseña temporal' : 'Inicie sesión para acceder a su cuenta' }}</p>
            </div>

            <!-- Form Card Container -->
            <div class="form-card">
              <!-- LOGIN MODE -->
              <div v-if="!isRecoveryMode">
                <div class="input-field-container">
                  <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
                  <input 
                    type="email" 
                    v-model="usuario" 
                    placeholder="Correo electrónico" 
                    class="custom-input" 
                  />
                </div>

                <div class="input-field-container">
                  <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                  <input 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="password" 
                    placeholder="Contraseña" 
                    class="custom-input password-input" 
                    @keyup.enter="login"
                  />
                  <button 
                    type="button"
                    class="toggle-password-btn" 
                    @click="showPassword = !showPassword"
                    title="Mostrar/Ocultar contraseña"
                  >
                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                  </button>
                </div>

                <!-- Forgot Password Link -->
                <div class="forgot-password-container">
                  <button type="button" class="forgot-password-link" @click="toggleRecoveryMode(true)">
                    ¿Olvidó su contraseña?
                  </button>
                </div>

                <!-- Error Message -->
                <transition name="fade">
                  <div v-if="error" class="error-message">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                    <span>{{ error }}</span>
                  </div>
                </transition>

                <!-- Login Button -->
                <button @click="login" class="login-btn" :disabled="loading">
                  <span v-if="!loading" class="btn-content">
                    INICIAR SESIÓN
                    <ion-icon :icon="arrowForwardOutline" class="btn-arrow"></ion-icon>
                  </span>
                  <span class="spinner" v-else></span>
                </button>

                <!-- Demo accounts panel inside card -->
                <div class="demo-section">
                  <div class="demo-divider">
                    <span>ACCESO RÁPIDO</span>
                  </div>
                  <p class="demo-description">Toque una cuenta para rellenar los datos:</p>
                  <div class="demo-badges">
                    <button class="demo-chip" @click="fillDemo('admin@test.com')">
                      <span class="chip-dot admin"></span>
                      <span class="chip-label">Admin</span>
                    </button>
                    <button class="demo-chip" @click="fillDemo('ganadero@test.com')">
                      <span class="chip-dot ganadero"></span>
                      <span class="chip-label">Ganadero</span>
                    </button>
                    <button class="demo-chip" @click="fillDemo('vet@test.com')">
                      <span class="chip-dot vet"></span>
                      <span class="chip-label">Veterinario</span>
                    </button>
                  </div>
                  <p class="demo-password-hint">Contraseña por defecto: <strong>1234</strong></p>
                </div>
              </div>

              <!-- RECOVERY MODE -->
              <div v-else>
                <div class="input-field-container">
                  <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
                  <input 
                    type="email" 
                    v-model="recoveryEmail" 
                    placeholder="Correo electrónico registrado" 
                    class="custom-input" 
                    @keyup.enter="requestRecovery"
                  />
                </div>

                <!-- Success Message -->
                <transition name="fade">
                  <div v-if="recoverySuccess" class="success-message">
                    <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                    <span>{{ recoverySuccess }}</span>
                  </div>
                </transition>

                <!-- Error Message -->
                <transition name="fade">
                  <div v-if="recoveryError" class="error-message">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                    <span>{{ recoveryError }}</span>
                  </div>
                </transition>

                <!-- Send Code Button -->
                <button @click="requestRecovery" class="login-btn" :disabled="recoveryLoading || !recoveryEmail">
                  <span v-if="!recoveryLoading" class="btn-content">
                    ENVIAR CONTRASEÑA TEMPORAL
                    <ion-icon :icon="arrowForwardOutline" class="btn-arrow"></ion-icon>
                  </span>
                  <span class="spinner" v-else></span>
                </button>

                <!-- Back to Login Link -->
                <div class="back-to-login-container">
                  <button type="button" class="back-to-login-link" @click="toggleRecoveryMode(false)">
                    Volver al Inicio de Sesión
                  </button>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { 
  personOutline, 
  lockClosedOutline, 
  alertCircleOutline, 
  eyeOutline, 
  eyeOffOutline,
  sparklesOutline,
  trendingUpOutline,
  cloudOfflineOutline,
  arrowForwardOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { authRepository } from '@/services';

const router = useRouter();
const usuario = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

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
    
    // Guardar la sesión del usuario
    localStorage.setItem('usuario_sesion', JSON.stringify(user));
    
    // Redireccionar basado en el rol y estado de contraseña temporal
    if (user.debe_cambiar_password && user.rol !== 'admin') {
      router.push('/cambiar-contrasena');
    } else if (user.rol === 'admin') {
      router.push('/admin');
    } else if (user.rol === 'veterinario') {
      router.push('/veterinario');
    } else {
      router.push('/home'); // Ganadero
    }
  } catch (err: any) {
    error.value = err.message || 'Correo o contraseña incorrectos';
  } finally {
    loading.value = false;
  }
};

const fillDemo = (email: string) => {
  usuario.value = email;
  password.value = '1234';
};
</script>

<style scoped>
/* Main page container */
.login-content {
  --background: #f4f7f0;
}

.login-page-wrapper {
  display: flex;
  min-height: 100%;
  width: 100%;
  background-color: #f4f7f0;
}

/* Left panel (Desktop Only) */
.brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1.2;
  background: linear-gradient(135deg, #1d4d1f 0%, #0f3310 60%, #071c08 100%);
  padding: 60px 80px;
  position: relative;
  overflow: hidden;
  color: #ffffff;
  box-shadow: 6px 0 25px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.brand-bg-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.brand-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.8;
  pointer-events: none;
}

.brand-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
  pointer-events: none;
  animation: float-shape 16s infinite ease-in-out alternate;
}

.brand-shape-1 {
  top: -10%;
  left: -10%;
  width: 450px;
  height: 450px;
  background: #4caf50;
}

.brand-shape-2 {
  bottom: -10%;
  right: -10%;
  width: 350px;
  height: 350px;
  background: #ffb300;
  animation-delay: -8s;
}

@keyframes float-shape {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 30px) scale(1.1); }
}

.brand-content {
  position: relative;
  z-index: 3;
  max-width: 540px;
  margin: auto 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.brand-logo-container {
  width: 76px;
  height: 76px;
  margin-bottom: 24px;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

.brand-logo-svg {
  width: 100%;
  height: 100%;
}

.brand-title {
  font-size: 40px;
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: -1px;
  line-height: 1.1;
  color: #ffffff;
}

.brand-title .highlight {
  color: #ff8f00;
}

.brand-subtitle {
  font-size: 18px;
  font-weight: 500;
  color: #c4d7b2;
  margin: 0 0 20px;
}

.brand-description {
  font-size: 14.5px;
  line-height: 1.6;
  color: #e2ebd5;
  margin-bottom: 36px;
}

/* Feature checklist styling */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.feature-icon-wrapper {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.feature-icon {
  font-size: 20px;
  color: #ff8f00;
}

.feature-text h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px;
  color: #ffffff;
}

.feature-text p {
  font-size: 13px;
  margin: 0;
  color: #b0c9ad;
  line-height: 1.4;
}

.brand-footer {
  position: relative;
  z-index: 3;
  font-size: 12px;
  color: #8fae8c;
}

/* Right panel (Form) */
.form-panel {
  flex: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px 24px;
  background-color: #f4f7f0;
  overflow-y: auto;
  z-index: 1;
}

.mobile-bg-shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
  display: none;
}

.mobile-bg-shape.shape-1 {
  top: -10%;
  left: -10%;
  width: 250px;
  height: 250px;
  background: #c4d7b2;
}

.mobile-bg-shape.shape-2 {
  bottom: -10%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: #e1ebd5;
}

.form-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.mobile-logo-header {
  display: none;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
  width: 100%;
}

.mobile-logo-wrapper {
  width: 72px;
  height: 72px;
  margin-bottom: 14px;
  filter: drop-shadow(0 8px 16px rgba(46, 125, 50, 0.15));
}

.mobile-logo-svg {
  width: 100%;
  height: 100%;
}

.mobile-app-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a2f1c;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.mobile-app-title .highlight {
  color: #2E7D32;
}

.mobile-app-subtitle {
  font-size: 13.5px;
  color: #5c6e58;
  margin: 0;
  font-weight: 500;
}

.welcome-header {
  margin-bottom: 28px;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
}

.welcome-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a2f1c;
  margin: 0 0 6px;
}

.welcome-header p {
  font-size: 14.5px;
  color: #5c6e58;
  margin: 0;
}

.form-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(13, 56, 18, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

/* Input Styles */
.input-field-container {
  position: relative;
  margin-bottom: 18px;
}

.custom-input {
  width: 100%;
  height: 52px;
  padding: 0 16px 0 48px;
  background: #ffffff;
  border: 1.5px solid #d0dfca;
  border-radius: 14px;
  color: #1e291e;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.custom-input::placeholder {
  color: #8fa28f;
}

.custom-input:focus {
  border-color: #2E7D32;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #7c937a;
  font-size: 20px;
  transition: color 0.25s;
  pointer-events: none;
}

.input-field-container:focus-within .input-icon {
  color: #2E7D32;
}

.password-input {
  padding-right: 48px;
}

.toggle-password-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #7c937a;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 10px;
  outline: none;
  transition: color 0.2s ease;
}

.toggle-password-btn:hover {
  color: #2E7D32;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #c62828;
  font-size: 13px;
  margin-bottom: 18px;
  padding: 10px 14px;
  background: rgba(198, 40, 40, 0.07);
  border: 1px solid rgba(198, 40, 40, 0.12);
  border-radius: 12px;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Button Styles */
.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #2E7D32 0%, #1b5e20 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  height: 52px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(46, 125, 50, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1.5px);
  box-shadow: 0 12px 30px rgba(46, 125, 50, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-arrow {
  font-size: 18px;
  transition: transform 0.25s ease;
}

.login-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Quick Access Demo accounts section */
.demo-section {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px dashed #d0dfca;
  text-align: center;
}

.demo-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.demo-divider::before,
.demo-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e1ebd5;
}

.demo-divider span {
  padding: 0 10px;
  font-size: 10.5px;
  font-weight: 700;
  color: #7c937a;
  letter-spacing: 1.5px;
}

.demo-description {
  font-size: 11.5px;
  color: #5c6e58;
  margin: 0 0 12px;
}

.demo-badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.demo-chip {
  background: #ffffff;
  border: 1px solid #d0dfca;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: #1a2f1c;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  outline: none;
}

.demo-chip:hover {
  background: #f4f7f0;
  border-color: #b3cbb0;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.04);
}

.demo-chip:active {
  transform: translateY(1px);
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.chip-dot.admin { background: #d32f2f; }
.chip-dot.ganadero { background: #2E7D32; }
.chip-dot.vet { background: #ff8f00; }

.demo-password-hint {
  font-size: 11px;
  color: #7c937a;
  margin: 0;
}

.demo-password-hint strong {
  color: #1a2f1c;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .brand-panel {
    display: none;
  }
  
  .form-panel {
    flex: 1;
    width: 100%;
    min-height: 100%;
    align-items: center;
  }
  
  .mobile-bg-shape {
    display: block;
  }
  
  .mobile-logo-header {
    display: flex;
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  
  .welcome-header {
    display: none; /* Hide welcome header since mobile logo header shows it */
  }
  
  .form-card {
    padding: 24px;
    border-radius: 20px;
    margin-bottom: 20px;
  }
}

.forgot-password-container {
  display: flex;
  justify-content: flex-end;
  margin-top: -6px;
  margin-bottom: 18px;
}

.forgot-password-link {
  background: none;
  border: none;
  padding: 0;
  color: #2E7D32;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.25s ease;
  outline: none;
}

.forgot-password-link:hover {
  color: #1b5e20;
  text-decoration: underline;
}

.back-to-login-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.back-to-login-link {
  background: none;
  border: none;
  padding: 0;
  color: #5c6e58;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.25s ease;
  outline: none;
}

.back-to-login-link:hover {
  color: #1a2f1c;
  text-decoration: underline;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2e7d32;
  font-size: 13px;
  margin-bottom: 18px;
  padding: 10px 14px;
  background: rgba(46, 125, 50, 0.07);
  border: 1px solid rgba(46, 125, 50, 0.12);
  border-radius: 12px;
}
</style>
