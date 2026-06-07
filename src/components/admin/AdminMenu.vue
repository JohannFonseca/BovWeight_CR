<template>
  <ion-menu :content-id="contentId" menu-id="admin-menu">
    <ion-header class="ion-no-border">
      <ion-toolbar class="menu-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">👑</span>
            <span class="app-logo">Admin Panel</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="menu-content ion-padding-vertical">
      <div class="menu-wrapper">
        <ion-list class="menu-list" lines="none">
          <ion-item
            button
            :detail="false"
            @click="navegar('/admin/dashboard')"
            class="menu-item"
            :class="{ active: rutaActiva === '/admin/dashboard' }"
          >
            <ion-icon :icon="gridOutline" slot="start"></ion-icon>
            <ion-label>Dashboard</ion-label>
          </ion-item>

          <ion-item
            button
            :detail="false"
            @click="navegar('/admin/usuarios')"
            class="menu-item"
            :class="{ active: rutaActiva.startsWith('/admin/usuarios') }"
          >
            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
            <ion-label>Usuarios</ion-label>
          </ion-item>

          <ion-item
            button
            :detail="false"
            @click="navegar('/admin/fincas')"
            class="menu-item"
            :class="{ active: rutaActiva.startsWith('/admin/fincas') }"
          >
            <ion-icon :icon="businessOutline" slot="start"></ion-icon>
            <ion-label>Fincas</ion-label>
          </ion-item>

          <ion-item
            button
            :detail="false"
            @click="navegar('/admin/reportes')"
            class="menu-item"
            :class="{ active: rutaActiva === '/admin/reportes' }"
          >
            <ion-icon :icon="barChartOutline" slot="start"></ion-icon>
            <ion-label>Reportes</ion-label>
          </ion-item>
        </ion-list>

        <div class="menu-footer">
          <ion-item button :detail="false" @click="cerrarSesion" class="menu-item logout-item">
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            <ion-label>Cerrar Sesión</ion-label>
          </ion-item>
        </div>
      </div>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineProps<{
  contentId: string;
}>();
import { useRoute, useRouter } from 'vue-router';
import {
  IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonIcon, IonLabel, menuController
} from '@ionic/vue';
import {
  gridOutline, peopleOutline, businessOutline, barChartOutline, logOutOutline
} from 'ionicons/icons';

const route = useRoute();
const router = useRouter();

const rutaActiva = computed(() => route.path);

const navegar = async (path: string) => {
  await menuController.close('admin-menu');
  router.push(path);
};

const cerrarSesion = async () => {
  await menuController.close('admin-menu');
  localStorage.removeItem('usuario_sesion');
  router.push('/login');
};
</script>

<style scoped>
.menu-toolbar {
  --background: #ffffff;
  border-bottom: 1px solid #f4f1ea;
  --min-height: 70px;
  padding: 0 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
}

.app-logo {
  font-weight: 850;
  color: #2c3e2d;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.menu-content {
  --background: #ffffff;
}

.menu-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 110px);
  padding: 10px 16px;
}

.menu-list {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-item {
  --background: transparent;
  --color: #5c6e58;
  --border-radius: 14px;
  margin: 0;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 15px;
  --padding-start: 16px;
  --padding-end: 16px;
  height: 50px;
  cursor: pointer;
}

.menu-item::part(native) {
  border-radius: 14px;
}

.menu-item ion-icon {
  font-size: 20px;
  margin-right: 12px;
  color: #5c6e58;
}

.menu-item:hover {
  --background: #f4f1ea;
  --color: #2c3e2d;
}

.menu-item.active {
  --background: #eaf0e6;
  --color: #3e4f24;
  font-weight: 750;
}

.menu-item.active ion-icon {
  color: #3e4f24;
}

.menu-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #f4f1ea;
}

.logout-item {
  --color: #b71c1c;
}

.logout-item ion-icon {
  color: #b71c1c;
}

.logout-item:hover {
  --background: #fce8e8;
  --color: #b71c1c;
}
</style>
