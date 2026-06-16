/**
 * @file offlineSyncService.ts
 * @description Servicio para manejar la cola de estimaciones offline, compresión de fotos y sincronización automática.
 */

import { ref } from 'vue';
import { animalRepository } from './index';

export interface OfflineEstimation {
  id: string;
  animalId: number;
  animalNombre: string;
  animalArete: string;
  fecha: string;
  fotoBase64: string;
  estado: 'pendiente_local' | 'sincronizando' | 'procesando' | 'completado' | 'error';
  progreso: number;
  mensajeError?: string;
  pesoEstimado?: number;
}

const STORAGE_KEY = 'bovweight_offline_estimations';

class OfflineSyncService {
  public queue = ref<OfflineEstimation[]>([]);
  public isSyncing = ref(false);
  private syncTimer: any = null;

  constructor() {
    this.loadQueue();
    this.setupNetworkListeners();
    // Iniciar una sincronización inicial si estamos online
    if (navigator.onLine) {
      setTimeout(() => this.syncQueue(), 2000);
    }
  }

  /**
   * Carga la cola desde LocalStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue.value = JSON.parse(stored);
      } else {
        this.queue.value = [];
      }
    } catch (e) {
      console.error('Error al cargar la cola offline:', e);
      this.queue.value = [];
    }
  }

  /**
   * Guarda la cola en LocalStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue.value));
    } catch (e) {
      console.error('Error al guardar la cola offline:', e);
    }
  }

  /**
   * Agrega un elemento a la cola offline
   */
  public async addEstimationToQueue(
    animalId: number,
    animalNombre: string,
    animalArete: string,
    imageFile: File
  ): Promise<OfflineEstimation> {
    // 1. Comprimir la imagen
    let fotoBase64 = '';
    try {
      fotoBase64 = await this.compressImage(imageFile);
    } catch (err) {
      console.error('Error al comprimir la imagen, usando fallback base64 original:', err);
      fotoBase64 = await this.fileToBase64(imageFile);
    }

    // 2. Crear el objeto de estimación
    const estimation: OfflineEstimation = {
      id: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      animalId,
      animalNombre,
      animalArete,
      fecha: new Date().toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      fotoBase64,
      estado: 'pendiente_local',
      progreso: 0
    };

    // 3. Añadir a la cola y persistir
    this.queue.value.push(estimation);
    this.saveQueue();

    // 4. Intentar sincronizar inmediatamente si estamos online
    if (navigator.onLine) {
      this.syncQueue();
    }

    return estimation;
  }

  /**
   * Remueve una estimación de la cola
   */
  public removeEstimation(id: string) {
    this.queue.value = this.queue.value.filter(item => item.id !== id);
    this.saveQueue();
  }

  /**
   * Limpia todos los completados de la cola
   */
  public clearCompleted() {
    this.queue.value = this.queue.value.filter(item => item.estado !== 'completado');
    this.saveQueue();
  }

  /**
   * Procesa la sincronización de toda la cola
   */
  public async syncQueue() {
    if (this.isSyncing.value || !navigator.onLine) return;

    // Buscar elementos pendientes o con error para reintentar
    const pendingItems = this.queue.value.filter(
      item => item.estado === 'pendiente_local' || item.estado === 'error'
    );

    if (pendingItems.length === 0) return;

    this.isSyncing.value = true;

    for (const item of pendingItems) {
      // Verificar conexión antes de procesar cada uno
      if (!navigator.onLine) {
        this.isSyncing.value = false;
        return;
      }

      try {
        // 1. Actualizar estado a Sincronizando
        this.updateItemState(item.id, 'sincronizando', 20);

        // 2. Convertir base64 a archivo File
        const file = this.base64ToFile(item.fotoBase64, `animal_${item.animalId}_sync.jpg`);
        this.updateItemState(item.id, 'sincronizando', 40);

        // 3. Subir e invocar la estimación con IA
        // Simulamos un leve retraso para que los estados visuales sean apreciables
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.updateItemState(item.id, 'procesando', 60);
        
        const res = await animalRepository.estimateWeight(
          item.animalId,
          null,
          null,
          file
        );
        
        this.updateItemState(item.id, 'procesando', 80);

        // 4. Guardar registro en la base de datos de Laravel
        await animalRepository.saveWeightRecord(
          item.animalId,
          res.peso_estimado,
          undefined,
          res.ruta_imagen || undefined
        );

        // 5. Completar
        this.updateItemState(item.id, 'completado', 100, undefined, res.peso_estimado);

        // Remover automáticamente los completados después de 15 segundos en el dashboard para limpiar la vista
        setTimeout(() => {
          this.removeEstimation(item.id);
        }, 15000);

      } catch (err: any) {
        console.error(`Error al sincronizar estimación offline del animal ${item.animalNombre}:`, err);
        const errMsg = err.message || 'Error de comunicación con el servidor';
        this.updateItemState(item.id, 'error', 0, errMsg);
      }
    }

    this.isSyncing.value = false;
  }

  /**
   * Actualiza el estado de una estimación en la cola
   */
  private updateItemState(
    id: string,
    estado: OfflineEstimation['estado'],
    progreso: number,
    mensajeError?: string,
    pesoEstimado?: number
  ) {
    const item = this.queue.value.find(q => q.id === id);
    if (item) {
      item.estado = estado;
      item.progreso = progreso;
      if (mensajeError !== undefined) item.mensajeError = mensajeError;
      if (pesoEstimado !== undefined) item.pesoEstimado = pesoEstimado;
      this.saveQueue();
    }
  }

  /**
   * Escucha cambios en el estado de la red
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Dispositivo recuperó conexión a Internet. Sincronizando cola offline...');
      // Retrasar levemente para estabilizar conexión
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => this.syncQueue(), 3000);
    });

    window.addEventListener('offline', () => {
      console.log('Dispositivo sin conexión a Internet.');
    });
  }

  /**
   * Comprime una imagen para que su base64 quepa holgadamente en localStorage (~100KB)
   */
  private compressImage(file: File, maxWidth = 800, maxHeight = 800): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // 0.7 de calidad ofrece un excelente balance tamaño/detalle para YOLOv8
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  /**
   * Helper para convertir un archivo completo a Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Convierte un Base64 de vuelta a un objeto File para subirlo mediante FormData
   */
  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
}

export const offlineSyncService = new OfflineSyncService();
