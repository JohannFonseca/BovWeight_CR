<template>
  <ion-page>
    <ion-split-pane content-id="admin-content" when="lg">
      <AdminMenu content-id="admin-content" />
      <ion-router-outlet id="admin-content" />
    </ion-split-pane>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonSplitPane, IonRouterOutlet } from '@ionic/vue';
import AdminMenu from '@/components/admin/AdminMenu.vue';
</script>

<style scoped>
/* Estilos globales y de transición para el área administrativa */
</style>
