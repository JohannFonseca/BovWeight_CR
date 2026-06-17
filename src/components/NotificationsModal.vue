<template>
  <ion-modal :is-open="isOpen" @didDismiss="emit('close')" class="notifications-modal">
    <ion-header class="ion-no-border">
      <ion-toolbar class="modal-toolbar">
        <ion-title>Centro de Alertas</ion-title>
        <ion-buttons slot="end">
          <button class="close-modal-btn" @click="emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content-bg">
      <div class="notifications-container">
        
        <!-- Actions row -->
        <div v-if="notifications.length > 0" class="actions-header">
          <span class="unread-count-text">
            Tienes {{ unreadCount }} alertas sin leer
          </span>
          <button class="mark-all-read-btn" @click="markAllAsRead" v-if="unreadCount > 0">
            Marcar todas
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="notifications.length === 0" class="empty-state">
          <div class="empty-icon-circle">
            <ion-icon :icon="notificationsOffOutline"></ion-icon>
          </div>
          <h3>Sin notificaciones</h3>
          <p>Te avisaremos cuando haya nuevos reportes veterinarios, cambios en tus citas o recordatorios de pesaje.</p>
        </div>

        <!-- List -->
        <div v-else class="notifications-list">
          <div 
            v-for="item in notifications" 
            :key="item.id" 
            class="notification-card" 
            :class="{ unread: !item.leido }"
          >
            <div class="card-icon-column">
              <div class="type-icon-circle" :class="item.tipo">
                <ion-icon :icon="getIconForType(item.tipo)"></ion-icon>
              </div>
            </div>

            <div class="card-body-column">
              <div class="card-header-row">
                <h4 class="card-title">{{ item.titulo }}</h4>
                <span class="card-date">{{ formatDate(item.created_at) }}</span>
              </div>
              <p class="card-desc">{{ item.descripcion }}</p>
              
              <!-- Quick Actions inside Notification -->
              <div class="card-actions" v-if="!item.leido || item.tipo === 'cita' || item.tipo === 'reporte'">
                <button 
                  v-if="!item.leido" 
                  class="action-btn text-btn" 
                  @click="markAsRead(item.id)"
                >
                  Marcar leída
                </button>
                <button 
                  v-if="item.tipo === 'reporte'" 
                  class="action-btn outline-btn" 
                  @click="goToReports"
                >
                  Ver Reportes
                </button>
                <button 
                  v-if="item.tipo === 'cita'" 
                  class="action-btn outline-btn" 
                  @click="goToAgenda"
                >
                  Ver Citas
                </button>
              </div>
            </div>

            <div class="card-delete-column">
              <button class="delete-btn" @click="deleteNotification(item.id)" title="Eliminar">
                <ion-icon :icon="trashOutline"></ion-icon>
              </button>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon
} from '@ionic/vue';
import { 
  closeOutline, notificationsOffOutline, trashOutline, 
  documentTextOutline, calendarOutline, scaleOutline, alertCircleOutline 
} from 'ionicons/icons';
import type { Notificacion } from '@/services/interfaces';
import { animalRepository } from '@/services';
import { useRouter } from 'vue-router';

const props = defineProps<{
  isOpen: boolean;
  notifications: Notificacion[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
}>();

const router = useRouter();

const unreadCount = computed(() => {
  return props.notifications.filter(n => !n.leido).length;
});

function getIconForType(tipo: string) {
  switch (tipo) {
    case 'reporte': return documentTextOutline;
    case 'cita': return calendarOutline;
    case 'recordatorio': return scaleOutline;
    default: return alertCircleOutline;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  // Si es hoy, mostrar hora
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Si es ayer
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  
  // De lo contrario, fecha completa
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

async function markAsRead(id: number) {
  try {
    await animalRepository.marcarNotificacionLeida(id);
    emit('refresh');
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

async function markAllAsRead() {
  try {
    await animalRepository.marcarTodasNotificacionesLeidas();
    emit('refresh');
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}

async function deleteNotification(id: number) {
  try {
    await animalRepository.eliminarNotificacion(id);
    emit('refresh');
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
}

function goToReports() {
  emit('close');
  // Redirigir a pestaña de reportes en Personal o a la sección de reportes
  router.push('/ganado/personal?tab=reportes');
}

function goToAgenda() {
  emit('close');
  router.push('/ganado/personal?tab=citas');
}
</script>

<style scoped>
.notifications-modal {
  --height: 90%;
  --border-radius: 24px 24px 0 0;
  align-items: flex-end;
}

.modal-toolbar {
  --background: #ffffff;
  --min-height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid #f2f4ee;
  color: #1b5e20;
}

.modal-toolbar ion-title {
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.close-modal-btn {
  background: #f4f6f0;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #5c6e58;
  cursor: pointer;
}

.modal-content-bg {
  --background: #f4f6f0;
}

.notifications-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.unread-count-text {
  font-size: 13px;
  font-weight: 700;
  color: #5c6e58;
}

.mark-all-read-btn {
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 800;
  color: #2e7d32;
  cursor: pointer;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #8fa086;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 800;
  color: #1b5e20;
  margin: 0;
}

.empty-state p {
  font-size: 13px;
  color: #5c6e58;
  margin: 0;
  line-height: 1.5;
}

/* List and Cards */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
  border: 1px solid rgba(46, 125, 50, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.notification-card.unread {
  border-left: 4px solid #2e7d32;
  background: #fdfdfd;
}

.card-icon-column {
  flex-shrink: 0;
}

.type-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.type-icon-circle.reporte { background: #e8f5e9; color: #2e7d32; }
.type-icon-circle.cita { background: #e3f2fd; color: #1565c0; }
.type-icon-circle.recordatorio { background: #fff3e0; color: #e65100; }
.type-icon-circle.sistema { background: #eceff1; color: #546e7a; }

.card-body-column {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #2c3e2d;
}

.card-date {
  font-size: 10px;
  font-weight: 700;
  color: #8fa086;
  white-space: nowrap;
}

.card-desc {
  margin: 0;
  font-size: 11px;
  color: #5c6e58;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  font-size: 11px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
}

.text-btn {
  background: transparent;
  border: none;
  color: #2e7d32;
  padding-left: 0;
}

.outline-btn {
  background: #f4f6f0;
  border: 1px solid rgba(46, 125, 50, 0.1);
  color: #1b5e20;
}

.card-delete-column {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #b0bec5;
  padding: 4px;
  cursor: pointer;
}

.delete-btn:active {
  color: #c62828;
}
</style>
