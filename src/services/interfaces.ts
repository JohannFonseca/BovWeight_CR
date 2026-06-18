/**
 * @file interfaces.ts
 * @description Interfaces y contratos de datos para conectar el frontend con la base de datos.
 */

/**
 * Registro de pesaje individual de un animal.
 */
export interface WeightRecord {
  fecha: string; // Fecha en formato DD/MM/YYYY.
  peso: number;  // Peso en Kilogramos (kg).
}

/**
 * Ficha completa de un bovino consumida por la interfaz de usuario.
 */
export interface Animal {
  id: number;
  nombre: string;
  raza: string;
  edad: string;
  arete: string;
  imagen: string;
  pesoActual: number;
  historialPeso: WeightRecord[];
  sexo?: string;
  color?: string;
  estado?: string;
}

/**
 * Sesión del usuario autenticado en el sistema.
 */
export interface User {
  id: number;
  usuario: string;
  rol: 'admin' | 'ganadero' | 'veterinario';
  nombre_completo?: string;
  debe_cambiar_password?: boolean;
}

/**
 * Interfaz para la gestión y consulta de datos de ganado (Animales).
 */
export interface IAnimalRepository {
  /** Obtiene la lista completa de animales con su historial de peso. */
  getAllAnimals(): Promise<Animal[]>;

  /** Obtiene un animal específico por su identificador. */
  getAnimalById(id: number): Promise<Animal>;

  /** Obtiene el historial de pesajes de un animal. */
  getWeightHistory(animalId: number): Promise<WeightRecord[]>;

  /** Realiza una estimación de peso por IA en base a medidas o una foto del celular. */
  estimateWeight(animalId: number | null, girth: number | null, length: number | null, imageFile?: File | File[]): Promise<{ peso_estimado: number; model: string; largo_detectado?: number; perimetro_detectado?: number; confianza?: number; ruta_imagen?: string | null }>;

  /** Registra y guarda la estimación de peso (con corrección de báscula opcional) en BD. */
  saveWeightRecord(animalId: number, pesoEstimado: number, pesoCorregido?: number, rutaImagen?: string): Promise<any>;

  /** Obtiene la lista completa de fincas. */
  getFincas(): Promise<any[]>;

  /** Crea una nueva finca. */
  crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any>;

  /** Edita una finca existente. */
  editarFinca(id: number, finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<any>;

  /** Crea un nuevo animal. */
  crearAnimal(animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; observaciones?: string | null }): Promise<any>;

  /** Edita un animal existente. */
  editarAnimal(id: number, animal: { nombre: string; numero_arete: string; finca_id: number; raza_id?: number | null; fecha_nacimiento?: string | null; sexo?: string | null; color?: string | null; estado?: string | null; observaciones?: string | null }): Promise<any>;

  /** Obtiene todas las razas de la base de datos. */
  getRazas(): Promise<any[]>;

  /** Obtiene los usuarios (p. ej., filtrando por rol como veterinario). */
  getUsuarios(rolNombre?: string): Promise<any[]>;

  /** Elimina un animal por ID. */
  eliminarAnimal(id: number): Promise<any>;

  /** Elimina una finca por ID. */
  eliminarFinca(id: number): Promise<any>;

  /** Obtiene los detalles de un usuario específico. */
  getUsuarioDetalle(id: number): Promise<any>;

  /** Crea un nuevo usuario en el sistema. */
  crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string; ganadero_id?: number | null }): Promise<any>;

  /** Obtiene todos los roles del sistema. */
  getRoles(): Promise<any[]>;

  /** Edita los datos de un usuario. */
  editarUsuario(id: number, data: { correo: string; nombre_completo: string; contrasena?: string }): Promise<any>;

  /** Reenvía las credenciales temporales a un usuario. */
  reenviarCredenciales(id: number): Promise<any>;

  /** Cambia la contraseña temporal por una nueva. */
  cambiarPassword(id: number, passwordActual: string, nuevoPassword: string): Promise<any>;

  /** Obtiene todos los reportes de ganadero guardados. */
  getReportesGanadero(): Promise<any[]>;

  /** Guarda un reporte de ganadero con una selección de animales. */
  guardarReporteGanadero(reporte: { titulo: string; descripcion?: string | null; destinatario?: string | null; animal_ids: number[] }): Promise<any>;

  /** Obtiene los detalles de un reporte de ganadero, incluyendo los animales asignados. */
  getReporteDetalleGanadero(id: number): Promise<any>;

  /** Elimina un reporte de ganadero por ID. */
  eliminarReporteGanadero(id: number): Promise<any>;

  /** Obtiene la lista de veterinarios del ganadero actual. */
  getVeterinariosGanadero(): Promise<any[]>;

  /** Asigna un veterinario a una finca. */
  asignarFincaVeterinario(payload: { veterinario_id: number; finca_id: number }): Promise<any>;

  /** Guarda la lista de animales autorizados para un veterinario en una finca. */
  guardarPermisosVeterinario(payload: { veterinario_id: number; finca_id: number; animales_ids: number[] }): Promise<any>;

  /** Revoca el acceso de un veterinario a una finca. */
  revocarFincaVeterinario(vetId: number, fincaId: number): Promise<any>;

  /** Activa/Desactiva el estado de un veterinario. */
  toggleEstadoVeterinario(vetId: number): Promise<any>;

  /** Obtiene la lista de citas. */
  getCitas(): Promise<Cita[]>;

  /** Crea una nueva cita (solicitud o propuesta). */
  crearCita(cita: { veterinario_id: number; finca_id: number; animal_id?: number | null; fecha: string; hora: string; motivo: string; estado?: string }): Promise<any>;

  /** Actualiza el estado o reprograma una cita. */
  actualizarCita(id: number, payload: { fecha?: string; hora?: string; estado?: string; comentario_rechazo?: string | null }): Promise<any>;

  /** Obtiene la lista de reportes veterinarios. */
  getReportesVeterinarios(animalId?: number): Promise<ReporteVeterinario[]>;

  /** Crea un nuevo reporte veterinario. */
  crearReporteVeterinario(reporte: { animal_id: number; observaciones: string; diagnostico_preliminar: string; recomendaciones: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad: string; estado: string; visita_recomendada?: boolean; cita_id?: number | null }): Promise<any>;

  /** Actualiza un reporte veterinario. */
  actualizarReporteVeterinario(id: number, payload: { observaciones?: string; diagnostico_preliminar?: string; recomendaciones?: string; medicamentos_sugeridos?: string | null; proxima_revision?: string | null; prioridad?: string; estado?: string; visita_recomendada?: boolean; cita_id?: number | null }): Promise<any>;

  /** Obtiene las notificaciones del usuario. */
  getNotificaciones(): Promise<Notificacion[]>;

  /** Marca una notificación como leída. */
  marcarNotificacionLeida(id: number): Promise<any>;

  /** Marca todas las notificaciones como leídas. */
  marcarTodasNotificacionesLeidas(): Promise<any>;

  /** Elimina una notificación. */
  eliminarNotificacion(id: number): Promise<any>;

  /** Obtiene las estadísticas generales del dashboard. */
  getDashboardStats(): Promise<any>;
}

/**
 * Cita médica veterinaria.
 */
export interface Cita {
  id: number;
  ganadero_id: number;
  veterinario_id: number;
  finca_id: number;
  animal_id?: number | null;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'completada' | 'propuesta_veterinario';
  comentario_rechazo?: string | null;
  created_at?: string;
  updated_at?: string;
  veterinario?: { id: number; nombre_completo: string; correo: string };
  ganadero?: { id: number; nombre_completo: string; correo: string };
  finca?: { id: number; nombre: string; ubicacion: string };
  animal?: { id: number; nombre: string; numero_arete: string };
}

/**
 * Reporte clínico veterinario.
 */
export interface ReporteVeterinario {
  id: number;
  veterinario_id: number;
  ganadero_id: number;
  finca_id: number;
  animal_id: number;
  observaciones: string;
  diagnostico_preliminar: string;
  recomendaciones: string;
  medicamentos_sugeridos?: string | null;
  proxima_revision?: string | null;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'abierto' | 'en_seguimiento' | 'resuelto';
  visita_recomendada?: boolean;
  cita_id?: number | null;
  created_at?: string;
  updated_at?: string;
  veterinario?: { id: number; nombre_completo: string; correo: string };
  ganadero?: { id: number; nombre_completo: string; correo: string };
  finca?: { id: number; nombre: string; ubicacion: string };
  animal?: { id: number; nombre: string; numero_arete: string };
  cita?: Cita | null;
}

/**
 * Notificación del sistema.
 */
export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  tipo: 'reporte' | 'cita' | 'recordatorio' | 'sistema';
  leido: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz para la autenticación y control de accesos.
 */
export interface IAuthRepository {
  /** Autentica a un usuario mediante credenciales. */
  login(correo: string, password: string): Promise<User>;

  /** Solicita la recuperación de la contraseña enviando una temporal por correo. */
  recuperarPassword(correo: string): Promise<any>;
}

