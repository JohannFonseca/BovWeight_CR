<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-container">
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-icon">🐄</div>
          <h1 class="app-logo-large">BovWeight CR</h1>
          <p class="subtitle">Gestión Inteligente de Ganado</p>
        </div>

        <!-- Formulario -->
        <div class="form-section">
          <div class="input-group">
            <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
            <input type="email" v-model="usuario" placeholder="Correo electrónico" class="custom-input" />
          </div>

          <div class="input-group">
            <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
            <input type="password" v-model="password" placeholder="Contraseña" class="custom-input" />
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <span>{{ error }}</span>
          </div>

          <ion-button @click="login" class="login-btn" expand="block" :disabled="loading">
            {{ loading ? 'Iniciando...' : 'INICIAR SESIÓN' }}
          </ion-button>
        </div>
        
        <div class="demo-hints">
          <p>Demo: <b>admin@test.com</b> / <b>ganadero@test.com</b> / <b>vet@test.com</b></p>
          <p>Pass: <b>1234</b></p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { personOutline, lockClosedOutline, alertCircleOutline } from 'ionicons/icons';
import { authService } from '@/services/api';

const router = useRouter();
const usuario = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const login = async () => {
  if (!usuario.value || !password.value) {
    error.value = 'Por favor, ingrese sus credenciales.';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const user = await authService.login(usuario.value, password.value);
    
    // Redireccionar basado en el rol
    if (user.rol === 'admin') {
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
</script>

<style scoped>
.login-content {
  --background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 24px;
}

.logo-section {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 80px;
  margin-bottom: 10px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
}

.app-logo-large {
  font-size: 36px;
  font-weight: 900;
  margin: 0;
  letter-spacing: -1px;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.form-section {
  width: 100%;
  max-width: 340px;
  background: white;
  padding: 30px 24px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.input-group {
  position: relative;
  margin-bottom: 20px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #2E7D32;
  font-size: 20px;
  z-index: 2;
}

.custom-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 16px;
  background: #f9f9f9;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.custom-input:focus {
  border-color: #2E7D32;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d32f2f;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 8px;
}

.login-btn {
  --background: #2E7D32;
  --background-hover: #1B5E20;
  --border-radius: 16px;
  margin-top: 10px;
  font-weight: bold;
  height: 54px;
}

.demo-hints {
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-size: 12px;
}

.demo-hints b {
  color: white;
}
</style>
