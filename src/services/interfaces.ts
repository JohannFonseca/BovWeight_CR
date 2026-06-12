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

  /** Obtiene todos los reportes de ganadero guardados. */
  getReportesGanadero(): Promise<any[]>;

  /** Guarda un reporte de ganadero con una selección de animales. */
  guardarReporteGanadero(reporte: { titulo: string; descripcion?: string | null; destinatario?: string | null; animal_ids: number[] }): Promise<any>;

  /** Obtiene los detalles de un reporte de ganadero, incluyendo los animales asignados. */
  getReporteDetalleGanadero(id: number): Promise<any>;

  /** Elimina un reporte de ganadero por ID. */
  eliminarReporteGanadero(id: number): Promise<any>;
}


/**
 * Interfaz para la autenticación y control de accesos.
 */
export interface IAuthRepository {
  /** Autentica a un usuario mediante credenciales. */
  login(correo: string, password: string): Promise<User>;
}

