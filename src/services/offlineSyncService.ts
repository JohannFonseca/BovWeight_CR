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
  tipo: 'foto' | 'manual';
  fotoBase64?: string;
  girth?: number;
  length?: number;
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
  private db: IDBDatabase | null = null;

  constructor() {
    this.loadQueue();
    this.setupNetworkListeners();
    // Iniciar una sincronización inicial si estamos online
    if (navigator.onLine) {
      setTimeout(() => this.syncQueue(), 2000);
    }
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BovWeightOfflineDB', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('estimaciones')) {
          db.createObjectStore('estimaciones', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Guarda una estimación en IndexedDB
   */
  private async saveToDB(item: OfflineEstimation) {
    try {
      if (!this.db) this.db = await this.initDB();
      const transaction = this.db.transaction('estimaciones', 'readwrite');
      const store = transaction.objectStore('estimaciones');
      store.put(item);
    } catch (e) {
      console.error('Error al guardar estimación en IndexedDB:', e);
    }
  }

  /**
   * Remueve una estimación de IndexedDB por id
   */
  private async removeFromDB(id: string) {
    try {
      if (!this.db) this.db = await this.initDB();
      const transaction = this.db.transaction('estimaciones', 'readwrite');
      const store = transaction.objectStore('estimaciones');
      store.delete(id);
    } catch (e) {
      console.error('Error al remover estimación de IndexedDB:', e);
    }
  }

  /**
   * Carga la cola desde IndexedDB. Migra datos previos de LocalStorage si existen.
   */
  private async loadQueue() {
    try {
      const db = await this.initDB();
      this.db = db;

      // Migrar datos de LocalStorage si existen
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const oldItems: OfflineEstimation[] = JSON.parse(stored);
          if (oldItems && oldItems.length > 0) {
            console.log(`[OfflineSync] Migrando ${oldItems.length} registros de LocalStorage a IndexedDB...`);
            const transaction = db.transaction('estimaciones', 'readwrite');
            const store = transaction.objectStore('estimaciones');
            for (const item of oldItems) {
              store.put(item);
            }
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (parseErr) {
          console.error('[OfflineSync] Error migrando datos de LocalStorage:', parseErr);
        }
      }

      // Cargar todos los registros desde IndexedDB
      const transaction = db.transaction('estimaciones', 'readonly');
      const store = transaction.objectStore('estimaciones');
      const request = store.getAll();

      request.onsuccess = () => {
        this.queue.value = request.result || [];
      };

      request.onerror = () => {
        console.error('[OfflineSync] Error leyendo IndexedDB:', request.error);
        this.queue.value = [];
      };
    } catch (e) {
      console.error('[OfflineSync] Error al inicializar IndexedDB:', e);
      this.queue.value = [];
    }
  }

  /**
   * Agrega un elemento a la cola offline
   */
  public async addEstimationToQueue(
    animalId: number,
    animalNombre: string,
    animalArete: string,
    tipo: 'foto' | 'manual',
    imageFile?: File,
    girth?: number,
    length?: number
  ): Promise<OfflineEstimation> {
    // 1. Comprimir la imagen si aplica
    let fotoBase64 = '';
    if (tipo === 'foto' && imageFile) {
      try {
        fotoBase64 = await this.compressImage(imageFile);
      } catch (err) {
        console.error('Error al comprimir la imagen, usando fallback base64 original:', err);
        fotoBase64 = await this.fileToBase64(imageFile);
      }
    }

    // 2. Crear el objeto de estimación
    const estimation: OfflineEstimation = {
      id: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      animalId,
      animalNombre,
      animalArete,
      tipo,
      fecha: new Date().toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      fotoBase64: fotoBase64 || undefined,
      girth,
      length,
      estado: 'pendiente_local',
      progreso: 0
    };

    // 3. Añadir a la cola y persistir
    this.queue.value.push(estimation);
    this.saveToDB(estimation);

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
    this.removeFromDB(id);
  }

  /**
   * Limpia todos los completados de la cola
   */
  public clearCompleted() {
    const completedItems = this.queue.value.filter(item => item.estado === 'completado');
    this.queue.value = this.queue.value.filter(item => item.estado !== 'completado');
    completedItems.forEach(item => {
      this.removeFromDB(item.id);
    });
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

        let res: any;
        if (item.tipo === 'manual') {
          this.updateItemState(item.id, 'sincronizando', 50);
          
          await new Promise(resolve => setTimeout(resolve, 800));
          this.updateItemState(item.id, 'procesando', 70);

          res = await animalRepository.estimateWeight(
            item.animalId,
            item.girth || null,
            item.length || null
          );
        } else {
          if (!item.fotoBase64) {
            throw new Error('No hay imagen guardada para la estimación por foto.');
          }
          // 2. Convertir base64 a archivo File
          const file = this.base64ToFile(item.fotoBase64, `animal_${item.animalId}_sync.jpg`);
          this.updateItemState(item.id, 'sincronizando', 40);

          // 3. Subir e invocar la estimación con IA
          // Simulamos un leve retraso para que los estados visuales sean apreciables
          await new Promise(resolve => setTimeout(resolve, 800));
          this.updateItemState(item.id, 'procesando', 60);

          res = await animalRepository.estimateWeight(
            item.animalId,
            null,
            null,
            file
          );
        }
        
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
      this.saveToDB(item);
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

// Exponer función de diagnóstico en el objeto window para pruebas manuales/automatizadas
if (typeof window !== 'undefined') {
  (window as any).testOfflineSyncIndexedDB = async () => {
    console.log('%c--- INICIANDO DIAGNÓSTICO DE PERSISTENCIA OFFLINE (IndexedDB) ---', 'color: #2E7D32; font-weight: bold; font-size: 14px;');
    
    const dbName = 'BovWeightOfflineDB';
    const storeName = 'estimaciones';
    const legacyKey = 'bovweight_offline_estimations';
    
    // Helper para verificar registros directamente en IndexedDB
    const getIndexedDBRecords = (): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onsuccess = () => {
          const db = request.result;
          try {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
          } catch (e) {
            resolve([]);
          }
        };
        request.onerror = () => reject(request.error);
      });
    };

    // Helper para limpiar IndexedDB de prueba
    const clearIndexedDB = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onsuccess = () => {
          const db = request.result;
          try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          } catch (e) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    };

    try {
      // 1. Limpieza inicial para comenzar limpios
      console.log('1. Preparando entorno de prueba...');
      localStorage.removeItem(legacyKey);
      await clearIndexedDB();
      console.log('   Enviando cola reactiva a vacío para la prueba.');
      offlineSyncService.queue.value = [];
      
      // 2. Probar compatibilidad de IndexedDB
      console.log('2. Comprobando compatibilidad de IndexedDB...');
      if (!window.indexedDB) {
        throw new Error('IndexedDB no está soportado en este navegador.');
      }
      console.log('   %c✓ IndexedDB soportado.', 'color: green;');

      // 3. Simular e inyectar datos antiguos en LocalStorage para validar migración
      console.log('3. Creando escenario de migración (simulación de datos antiguos en LocalStorage)...');
      const mockLegacyData = [
        {
          id: 'mock_legacy_1',
          animalId: 99,
          animalNombre: 'Vaca Vieja',
          animalArete: 'CR-999',
          fecha: '19/06/2026',
          fotoBase64: 'data:image/jpeg;base64,MOCK_LEGACY_IMAGE_DATA_1111111111111111111111111',
          estado: 'pendiente_local' as const,
          progreso: 0,
          tipo: 'foto' as const
        },
        {
          id: 'mock_legacy_2',
          animalId: 100,
          animalNombre: 'Toro Viejo',
          animalArete: 'CR-1000',
          fecha: '19/06/2026',
          fotoBase64: 'data:image/jpeg;base64,MOCK_LEGACY_IMAGE_DATA_2222222222222222222222222',
          estado: 'error' as const,
          progreso: 0,
          mensajeError: 'Error de prueba',
          tipo: 'foto' as const
        }
      ];
      localStorage.setItem(legacyKey, JSON.stringify(mockLegacyData));
      console.log('   Inyectados 2 registros legacy en LocalStorage.');

      // 4. Ejecutar migración llamando a loadQueue()
      console.log('4. Ejecutando proceso de migración y carga...');
      await (offlineSyncService as any).loadQueue();
      
      // 5. Verificar que los datos de LocalStorage se pasaron a IndexedDB
      console.log('5. Validando resultados de la migración...');
      const localDataAfter = localStorage.getItem(legacyKey);
      if (localDataAfter !== null) {
        throw new Error('La migración falló: La clave de LocalStorage no fue eliminada.');
      }
      console.log('   %c✓ LocalStorage clave removida correctamente.', 'color: green;');

      const dbRecords = await getIndexedDBRecords();
      if (dbRecords.length !== 2) {
        throw new Error(`La migración falló: Se esperaban 2 registros en IndexedDB, se encontraron ${dbRecords.length}`);
      }
      console.log('   %c✓ Registros guardados correctamente en IndexedDB.', 'color: green;');
      console.log('   Cola reactiva cargada con:');
      console.table(offlineSyncService.queue.value.map(item => ({ id: item.id, nombre: item.animalNombre, estado: item.estado })));

      // 6. Probar inyección de un registro de GRAN tamaño (Simulación de foto pesada de 6MB)
      console.log('6. Probando almacenamiento de gran tamaño (simulación de foto de alta resolución)...');
      console.log('   Generando Base64 simulado de 6.5 MB...');
      const bigString = 'A'.repeat(6.5 * 1024 * 1024);
      const bigEstimation = {
        id: 'mock_heavy_3',
        animalId: 101,
        animalNombre: 'Novillo Pesado',
        animalArete: 'CR-1010',
        fecha: '19/06/2026',
        fotoBase64: 'data:image/jpeg;base64,' + bigString,
        estado: 'pendiente_local' as const,
        progreso: 0,
        tipo: 'foto' as const
      };

      console.log('   Guardando registro pesado en IndexedDB...');
      await (offlineSyncService as any).saveToDB(bigEstimation);
      console.log('   %c✓ Registro pesado de 6.5 MB guardado exitosamente sin error de cuota!', 'color: green;');
      
      offlineSyncService.queue.value.push(bigEstimation);

      const finalRecords = await getIndexedDBRecords();
      if (finalRecords.length !== 3) {
        throw new Error('No se pudo leer el registro pesado de IndexedDB.');
      }
      console.log('   %c✓ Verificación de lectura de base de datos exitosa.', 'color: green;');

      // 7. Prueba de Limpieza y reactividad de borrado
      console.log('7. Probando borrado individual y limpieza...');
      offlineSyncService.removeEstimation('mock_heavy_3');
      await new Promise(resolve => setTimeout(resolve, 100));
      const postDeleteRecords = await getIndexedDBRecords();
      if (postDeleteRecords.length !== 2) {
        throw new Error('El registro borrado aún permanece en la base de datos.');
      }
      console.log('   %c✓ Registro removido correctamente de IndexedDB y estado reactivo.', 'color: green;');

      console.log('%c--- DIAGNÓSTICO FINALIZADO CON ÉXITO: TODO FUNCIONA EXCELENTE ---', 'color: #2E7D32; font-weight: bold; font-size: 14px;');
    } catch (err: any) {
      console.error('%c--- DIAGNÓSTICO FALLIDO ---', 'color: red; font-weight: bold;');
      console.error(err);
    }
  };
}
