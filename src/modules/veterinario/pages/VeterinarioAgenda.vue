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
            <span class="mobile-title mobile-only">Agenda de Visitas</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile desktop-only">
            <div class="avatar vet">V</div>
            <div class="user-info">
              <span class="name">Veterinario</span>
            </div>
          </div>
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
            <a @click.prevent="router.push('/veterinario/animales')" class="nav-item">
              <ion-icon :icon="pawOutline"></ion-icon>
              <span>Animales Asignados</span>
            </a>
            <a @click.prevent="router.push('/veterinario/agenda')" class="nav-item active">
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
          <div class="coming-soon">
            <ion-icon :icon="calendarOutline" class="soon-icon"></ion-icon>
            <h2>Módulo en Desarrollo</h2>
            <p>La funcionalidad de Agenda de Visitas estará disponible próximamente. Podrás agendar visitas, establecer recordatorios y organizar tu ruta de trabajo por finca.</p>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonButtons
} from '@ionic/vue';
import {
  medkitOutline, pawOutline, calendarOutline, documentTextOutline,
  arrowBackOutline
} from 'ionicons/icons';

const router = useRouter();

const goBack = () => {
  router.push('/veterinario');
};
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
.user-info .name { font-size: 14px; font-weight: 700; color: #2c3e2d; }

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
  flex: 1; padding: 32px; display: flex; align-items: center; justify-content: center;
}

.coming-soon {
  background: #fff; padding: 60px 40px; border-radius: 24px;
  text-align: center; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}
.soon-icon { font-size: 64px; color: #8ba888; margin-bottom: 20px; }
.coming-soon h2 { color: #2c3e2d; font-weight: 800; font-size: 24px; margin-bottom: 12px; }
.coming-soon p { color: #5c6e58; line-height: 1.6; font-size: 15px; }

@media (min-width: 769px) { .mobile-only { display: none !important; } }
@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .main-content { padding: 16px; align-items: flex-start; }
}
</style>
