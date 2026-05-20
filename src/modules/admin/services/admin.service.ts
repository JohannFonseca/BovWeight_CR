/**
 * ============================================================
 * admin.service.ts — Servicio de Administración de BovWeight CR
 * ============================================================
 * 
 * ¿Qué es este archivo?
 * Este es el "cerebro" de toda la sección de administración.
 * Aquí se definen TODAS las funciones que se comunican con la
 * base de datos (Supabase) para crear, leer, actualizar y
 * eliminar datos (operaciones CRUD).
 * 
// Importamos el cliente de Supabase que ya está configurado con la URL y la API Key.
// El '@/supabase' es un alias que apunta a src/supabase/index.ts
//import { supabase } from '@/supabase';

/**
 * Rol — Representa un tipo de usuario en el sistema.
 * Ejemplo: { id: 1, nombre: 'admin' }
 * Los 3 roles que manejamos son: admin, ganadero y veterinario.
 */
export interface Rol {
  id: number;
  nombre: string;
}

/**
 * UsuarioInfo — Toda la info de un usuario que mostramos en la tabla.
 */
export interface UsuarioInfo {
  id: number;
  correo: string;
  nombre_completo: string;
  activo: boolean;           // true = puede usar el sistema, false = bloqueado
  rol_id: number;            // Número que referencia a la tabla roles (1=admin, 2=ganadero, 3=vet)
  rol_nombre?: string;       // El nombre del rol en texto (se calcula, no viene directo de la DB)
  creado_en?: string;        // Fecha de registro formateada
}

/**
 * Finca — Representa una propiedad ganadera.
 * Cada finca tiene un propietario (referencia a usuarios) y puede tener N animales.
 */
export interface Finca {
  id: number;
  nombre: string;
  ubicacion: string;
  propietario_id: number;       // ID del usuario dueño de esta finca
  propietario_nombre?: string;  // Nombre del propietario (se busca por separado)
  bovinos_count: number;        // Cantidad de animales en esta finca (se cuenta manualmente)
  creado_en?: string;
}

/**
 * Raza — Catálogo de razas bovinas (Brahman, Charolais, etc.)
 */
export interface Raza {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * AnimalInfo — Info completa de un bovino para mostrar en la tabla.
 * Incluye datos que vienen de VARIAS tablas: animales + razas + fincas + estimaciones_peso.
 * Esto es lo que en bases de datos llamamos un "JOIN" o consulta relacional.
 */
export interface AnimalInfo {
  id: number;
  nombre: string;
  raza: string;              // Nombre de la raza (viene de la tabla razas)
  raza_id?: number;          // ID de la raza (clave foránea)
  numero_arete: string;      // Identificador físico del animal
  fecha_nacimiento: string;
  sexo?: string;
  color?: string;
  estado?: string;           // 'activo', 'vendido', 'muerto', etc.
  finca_id?: number;         // ID de la finca donde está (clave foránea)
  finca_nombre?: string;     // Nombre de la finca (viene de la tabla fincas)
  peso_actual: number;       // Último peso registrado (viene de estimaciones_peso)
  observaciones?: string;
}

/**
 * AnalisisPesos — Datos calculados para la sección de Análisis.
 * Estos datos NO vienen directamente de una tabla, sino que se CALCULAN
 * a partir de los pesajes de todos los animales.
 */
export interface AnalisisPesos {
  labels: string[];          // Etiquetas del eje X de la gráfica (nombres de meses)
  pesosPromedio: number[];   // Array de 6 valores: peso promedio de cada mes
  crecimientoMensual: number;   // Porcentaje de crecimiento del último mes vs el anterior
  pesoPromedioGeneral: number;  // Promedio total de todos los animales
  bovinoMasPesado: { nombre: string; peso: number; raza: string } | null; // El animal más pesado
}

// ============================================================
// FUNCIÓN AUXILIAR: Manejo de errores de RLS
// ============================================================
/**
 * ¿Qué es RLS? (Row Level Security)
 * Es una política de seguridad de Supabase que controla QUIÉN puede
 * hacer CADA operación en CADA tabla. Si no tienes permiso, Supabase
 * te responde con error código 42501.
 */
function handleRLSError(error: any, operacion: string): never {
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    throw new Error(
      `Permiso denegado al ${operacion}. ` +
      `Las políticas de seguridad (RLS) de Supabase bloquean esta operación. ` +
      `Ve al Dashboard de Supabase → tabla correspondiente → Policies → y agrega una política que permita INSERT/UPDATE/DELETE para el rol "anon".`
    );
  }
  // Si no es un error de RLS, lanzamos el error original con un mensaje descriptivo
  throw new Error(`Error al ${operacion}: ${error.message}`);
}

// ============================================================
// SERVICIO PRINCIPAL
// ============================================================
/**
 * adminService — Es un objeto que agrupa TODAS las funciones del admin.
 * 
 * Todas las funciones son "async" porque hablan con Supabase,
 * que es una operación que toma tiempo (va por internet a la base de datos).
 * Por eso usamos "await" al llamarlas.
 */
export const adminService = {

  // ==========================================
  // SECCIÓN: ROLES
  // ==========================================

  /**
   * getRoles — Obtiene la lista de roles del sistema.
   * 
   * Primero intenta traerlos de Supabase.
   * Si la tabla está vacía o da error (porque RLS la bloquea),
   * retorna unos roles "hardcodeados" como respaldo para que
   * la app no se rompa. Esto es un patrón llamado "fallback".
   */
  async getRoles(): Promise<Rol[]> {
    // .from('roles') = selecciona la tabla 'roles'
    // .select('id, nombre') = solo trae esas 2 columnas (no todas)
    // .order('id') = ordena por ID de menor a mayor
    const { data, error } = await supabase
      .from('roles')
      .select('id, nombre')
      .order('id');

    if (error) {
      console.error('Error fetching roles:', error.message);
    }

    // Si no hay datos, usamos roles por defecto para que el formulario funcione
    if (!data || data.length === 0) {
      console.warn('La tabla roles está vacía o protegida. Cargando roles base...');
      return [
        { id: 1, nombre: 'admin' },
        { id: 2, nombre: 'ganadero' },
        { id: 3, nombre: 'veterinario' }
      ];
    }
    // "as Rol[]" le dice a TypeScript: "confía en mí, esto tiene forma de Rol[]"
    return data as Rol[];
  },

  // ==========================================
  // SECCIÓN: RAZAS
  // ==========================================

  /**
   * getRazas — Trae el catálogo de razas bovinas desde Supabase.
   * Se usa para llenar el <select> en el formulario de crear animal.
   */
  async getRazas(): Promise<Raza[]> {
    const { data, error } = await supabase
      .from('razas')
      .select('id, nombre, descripcion')
      .order('nombre'); // Orden alfabético para que sea más fácil encontrar la raza

    if (error) {
      console.error('Error fetching razas:', error.message);
      return []; // Retornamos array vacío en vez de lanzar error
    }
    return (data || []) as Raza[];
  },

  /**
   * crearRaza — Inserta una nueva raza en la tabla 'razas'.
   * Se usa por si el admin necesita agregar una raza que no existe.
   * 
   * .insert([{...}]) = inserta una fila nueva
   * .select() = después de insertar, devuélveme lo que insertaste
   * .single() = espero solo 1 resultado (no un array)
   */
  async crearRaza(nombre: string, descripcion?: string): Promise<Raza> {
    const { data, error } = await supabase
      .from('razas')
      .insert([{ nombre, descripcion: descripcion || null }])
      .select()
      .single();

    if (error) handleRLSError(error, 'crear raza');
    return data as Raza;
  },

  // ==========================================
  // SECCIÓN: USUARIOS (Empleados)
  // ==========================================

  /**
   * getUsuarios — Trae TODOS los usuarios registrados en el sistema.
   * 
   * ¿Por qué mapeamos los datos con .map()?
   * Porque la tabla 'usuarios' no tiene una columna 'rol_nombre',
   * solo tiene 'rol_id' (un número). Nosotros traducimos ese número
   * al nombre del rol para mostrarlo bonito en la interfaz.
   * 
   * También formateamos la fecha con toLocaleDateString('es-CR')
   * para que salga en formato costarricense (dd/mm/aaaa).
   */
  async getUsuarios(): Promise<UsuarioInfo[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id,
        correo,
        nombre_completo,
        activo,
        rol_id,
        creado_en
      `)
      .order('creado_en', { ascending: false }); // Los más recientes primero

    if (error) {
      console.error('Error fetching usuarios:', error.message);
      throw new Error(error.message);
    }

    // Transformamos cada registro de la DB al formato que necesita la interfaz
    return (data || []).map((u: any) => {
      // Traducimos el rol_id numérico a un nombre legible
      let nombreRol = '';
      if (u.rol_id === 1) nombreRol = 'admin';
      else if (u.rol_id === 2) nombreRol = 'ganadero';
      else if (u.rol_id === 3) nombreRol = 'veterinario';

      return {
        id: u.id,
        correo: u.correo,
        nombre_completo: u.nombre_completo || 'Sin nombre', // Si no tiene nombre, ponemos un placeholder
        activo: u.activo,
        rol_id: u.rol_id,
        rol_nombre: nombreRol,
        creado_en: new Date(u.creado_en).toLocaleDateString('es-CR') // Formato: 20/5/2026
      };
    });
  },

  /**
   * crearUsuario — Registra un nuevo usuario/empleado en el sistema.
   * 
   * Pasos que sigue:
   * 1. Validar que los datos sean correctos (correo válido, contraseña suficiente)
   * 2. Verificar que no exista otro usuario con el mismo correo
   * 3. Insertar en la tabla 'usuarios' de Supabase
   * 
   * ¿Por qué guardamos 'contrasena_hash' y no 'contrasena'?
   * Porque la columna en la DB se llama 'contrasena_hash'.
   * NOTA: En un sistema real, la contraseña debería hashearse
   * con bcrypt antes de guardarla. Aquí se guarda en texto plano
   * porque es un proyecto académico.
   */
  async crearUsuario(usuario: { correo: string; contrasena: string; rol_id: number; nombre_completo: string }): Promise<void> {
    // ---- VALIDACIONES (antes de tocar la base de datos) ----
    if (!usuario.correo || !usuario.correo.includes('@')) {
      throw new Error('El correo electrónico no es válido.');
    }
    if (!usuario.contrasena || usuario.contrasena.length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres.');
    }
    if (!usuario.nombre_completo || usuario.nombre_completo.trim().length === 0) {
      throw new Error('El nombre completo es requerido.');
    }

    // ---- VERIFICAR DUPLICADOS ----
    // .maybeSingle() retorna null si no encuentra nada (en vez de lanzar error)
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', usuario.correo) // .eq = WHERE correo = 'valor'
      .maybeSingle();

    if (existente) {
      throw new Error(`Ya existe un usuario con el correo: ${usuario.correo}`);
    }

    // ---- INSERTAR EN LA DB ----
    const { error } = await supabase
      .from('usuarios')
      .insert([
        {
          correo: usuario.correo,
          contrasena_hash: usuario.contrasena, // En producción esto debería ser un hash
          rol_id: usuario.rol_id,
          nombre_completo: usuario.nombre_completo,
          activo: true // El usuario nuevo empieza activo por defecto
        }
      ]);

    if (error) handleRLSError(error, 'crear usuario');
  },

  /**
   * eliminarUsuario — Borra permanentemente un usuario de la base de datos.
   * 
   * .delete() = elimina filas
   * .eq('id', id) = solo la fila donde id = el valor que pasamos
   * 
   * IMPORTANTE: Esto es un DELETE real, no un "soft delete".
   * El usuario desaparece para siempre de la DB.
   */
  async eliminarUsuario(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) handleRLSError(error, 'eliminar usuario');
  },

  /**
   * toggleEstadoUsuario — Activa o bloquea un usuario sin eliminarlo.
   * 
   * Esto es un "soft toggle": el usuario sigue existiendo en la DB,
   * pero si activo=false, no puede iniciar sesión.
   * 
   * .update({ activo: nuevoEstado }) = UPDATE usuarios SET activo = true/false
   */
  async toggleEstadoUsuario(id: number, nuevoEstado: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id', id);

    if (error) handleRLSError(error, 'actualizar estado del usuario');
  },

  // ==========================================
  // SECCIÓN: FINCAS — CRUD COMPLETO
  // ==========================================

  /**
   * getFincas — Obtiene todas las fincas CON información extra calculada.
   * 
   * El reto aquí es que necesitamos info de 3 tablas diferentes:
   * 1. fincas (nombre, ubicación, propietario_id)
   * 2. usuarios (para saber el NOMBRE del propietario)
   * 3. animales (para CONTAR cuántos bovinos tiene cada finca)
   * 
   * En SQL esto sería un JOIN, pero con Supabase lo hacemos
   * con consultas separadas y luego las "juntamos" manualmente
   * usando un Map (diccionario) de JavaScript.
   */
  async getFincas(): Promise<Finca[]> {
    try {
      // Paso 1: Traer todas las fincas de la DB
      const { data: fincas, error } = await supabase
        .from('fincas')
        .select('*')       // Todas las columnas
        .order('nombre');   // Orden alfabético

      if (error) throw error;

      // Si no hay fincas, retornamos array vacío (sin datos inventados)
      if (!fincas || fincas.length === 0) {
        return [];
      }

      // Paso 2: Traer usuarios para saber quién es el propietario de cada finca
      // Creamos un "mapa" (diccionario) donde la llave es el ID y el valor es el nombre
      // Esto nos permite buscar el nombre del propietario de forma instantánea: usuariosMap[1] = "Juan"
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre_completo');

      const usuariosMap: Record<number, string> = {};
      (usuarios || []).forEach((u: any) => {
        usuariosMap[u.id] = u.nombre_completo;
      });

      // Paso 3: Contar cuántos animales tiene cada finca
      // Traemos solo la columna finca_id de todos los animales
      // y contamos cuántas veces aparece cada finca_id
      const { data: animales } = await supabase
        .from('animales')
        .select('finca_id');

      const conteoAnimales: Record<number, number> = {};
      (animales || []).forEach((a: any) => {
        if (a.finca_id) {
          // Si ya existe la finca en el conteo, sumamos 1; si no, empezamos en 1
          conteoAnimales[a.finca_id] = (conteoAnimales[a.finca_id] || 0) + 1;
        }
      });

      // Paso 4: Combinar todo en un objeto limpio para cada finca
      return fincas.map((f: any) => ({
        id: f.id,
        nombre: f.nombre,
        ubicacion: f.ubicacion || 'Sin ubicación',
        propietario_id: f.propietario_id,
        propietario_nombre: usuariosMap[f.propietario_id] || 'Sin asignar',
        bovinos_count: conteoAnimales[f.id] || 0, // Si no tiene animales, muestra 0
        creado_en: f.creado_en
      }));
    } catch (e: any) {
      console.error('Error al cargar fincas:', e);
      return [];
    }
  },

  /**
   * crearFinca — Registra una nueva finca en la base de datos.
   * 
   * Recibe un objeto con: nombre, ubicación y el ID del propietario.
   * Primero valida que los campos obligatorios no estén vacíos,
   * y luego inserta en la tabla 'fincas'.
   * 
   * .trim() elimina espacios al inicio y al final del texto.
   */
  async crearFinca(finca: { nombre: string; ubicacion: string; propietario_id: number }): Promise<void> {
    // Validaciones básicas antes de insertar
    if (!finca.nombre || finca.nombre.trim().length === 0) {
      throw new Error('El nombre de la finca es requerido.');
    }
    if (!finca.ubicacion || finca.ubicacion.trim().length === 0) {
      throw new Error('La ubicación de la finca es requerida.');
    }

    const { error } = await supabase
      .from('fincas')
      .insert([{
        nombre: finca.nombre.trim(),
        ubicacion: finca.ubicacion.trim(),
        propietario_id: finca.propietario_id
      }]);

    // Si hay error (especialmente de permisos RLS), lo manejamos
    if (error) handleRLSError(error, 'crear finca');
  },

  /**
   * eliminarFinca — Elimina una finca de la base de datos.
   * 
   * IMPORTANTE: Antes de eliminar, verificamos si la finca tiene
   * animales asignados. Si tiene, NO la eliminamos porque causaría
   * inconsistencia en la DB (animales huérfanos sin finca).
   * Esto se llama "validación de integridad referencial".
   */
  async eliminarFinca(id: number): Promise<void> {
    // Verificar si tiene animales asignados
    // { count: 'exact', head: true } = solo quiero el conteo, no los datos
    const { count } = await supabase
      .from('animales')
      .select('*', { count: 'exact', head: true })
      .eq('finca_id', id);

    if (count && count > 0) {
      throw new Error(`No se puede eliminar esta finca porque tiene ${count} animales asignados. Elimine o reasigne los animales primero.`);
    }

    const { error } = await supabase
      .from('fincas')
      .delete()
      .eq('id', id);

    if (error) handleRLSError(error, 'eliminar finca');
  },

  // ==========================================
  // SECCIÓN: GANADO — CRUD COMPLETO
  // ==========================================

  /**
   * getGanadoCompleto — Trae TODOS los animales con datos de múltiples tablas.
   * 
   * Aquí usamos las "relaciones" de Supabase (similar a un JOIN en SQL).
   * La sintaxis razas(nombre) significa:
   *   "Desde la tabla animales, seguí la clave foránea raza_id
   *    hasta la tabla razas y traeme el campo nombre"
   * 
   * Lo mismo con fincas(nombre) y estimaciones_peso(...).
   * 
   * Para el peso, tomamos el ÚLTIMO pesaje registrado (el más reciente).
   * Si no hay pesajes, el peso queda en 0.
   */
  async getGanadoCompleto(): Promise<AnimalInfo[]> {
    try {
      // Esta query trae datos de 4 tablas en UNA sola consulta:
      // animales + razas + fincas + estimaciones_peso
      const { data, error } = await supabase
        .from('animales')
        .select(`
          id,
          nombre,
          numero_arete,
          fecha_nacimiento,
          sexo,
          color,
          estado,
          finca_id,
          raza_id,
          observaciones,
          razas (
            nombre
          ),
          fincas (
            nombre
          ),
          estimaciones_peso (
            peso_estimado_kg,
            peso_corregido_kg,
            creado_en
          )
        `);

      if (error) throw error;

      // Si no hay animales registrados, retornamos array vacío
      if (!data || data.length === 0) {
        return [];
      }

      // Transformamos cada animal de la DB al formato de nuestra interfaz
      return data.map((a: any) => {
        // Obtenemos todos los pesajes de este animal y los ordenamos
        // del más reciente al más antiguo para tomar el último
        const weights = a.estimaciones_peso || [];
        weights.sort((x: any, y: any) => new Date(y.creado_en).getTime() - new Date(x.creado_en).getTime());

        // El peso actual es el pesaje más reciente
        // Usamos peso_corregido_kg si existe, si no, peso_estimado_kg
        const latestWeight = weights.length > 0
          ? (weights[0].peso_corregido_kg || weights[0].peso_estimado_kg || 0)
          : 0;

        return {
          id: a.id,
          nombre: a.nombre || 'Sin nombre',
          raza: a.razas?.nombre || 'Sin raza',        // Viene del JOIN con tabla razas
          raza_id: a.raza_id,
          numero_arete: a.numero_arete || 'N/A',
          fecha_nacimiento: a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString('es-CR') : 'N/A',
          sexo: a.sexo || 'N/A',
          color: a.color || '',
          estado: a.estado || 'activo',
          finca_id: a.finca_id,
          finca_nombre: a.fincas?.nombre || 'Sin finca', // Viene del JOIN con tabla fincas
          peso_actual: latestWeight > 0 ? Number(latestWeight.toFixed(1)) : 0, // Redondeamos a 1 decimal
          observaciones: a.observaciones || ''
        };
      });
    } catch (e) {
      console.error('Error al cargar ganado completo:', e);
      return [];
    }
  },

  /**
   * crearAnimal — Registra un nuevo bovino en la base de datos.
   * 
   * Los campos obligatorios son: nombre, número de arete y finca.
   * Los opcionales son: fecha de nacimiento, raza, color, observaciones.
   * 
   * ¿Por qué construimos el objeto insertData dinámicamente?
   * Porque si mandamos un campo como null a Supabase cuando la columna
   * no acepta null, nos da error. Entonces solo agregamos los campos
   * que realmente tienen valor.
   */
  async crearAnimal(animal: {
    nombre: string;
    numero_arete: string;
    fecha_nacimiento?: string;
    sexo: string;
    raza_id: number | null;
    finca_id: number;
    color?: string;
    observaciones?: string;
  }): Promise<void> {
    // Validaciones de campos obligatorios
    if (!animal.nombre || animal.nombre.trim().length === 0) {
      throw new Error('El nombre del animal es requerido.');
    }
    if (!animal.numero_arete || animal.numero_arete.trim().length === 0) {
      throw new Error('El número de arete es requerido.');
    }
    if (!animal.finca_id) {
      throw new Error('Debe seleccionar una finca para el animal.');
    }

    // Construimos el objeto con solo los campos que tienen valor
    const insertData: any = {
      nombre: animal.nombre.trim(),
      numero_arete: animal.numero_arete.trim(),
      sexo: animal.sexo || 'macho',    // Si no se especifica, por defecto 'macho'
      finca_id: animal.finca_id,
      estado: 'activo'                  // Todo animal nuevo entra como activo
    };

    // Solo agregamos los campos opcionales si tienen valor
    if (animal.fecha_nacimiento) {
      insertData.fecha_nacimiento = animal.fecha_nacimiento;
    }
    if (animal.raza_id) {
      insertData.raza_id = animal.raza_id;
    }
    if (animal.color) {
      insertData.color = animal.color.trim();
    }
    if (animal.observaciones) {
      insertData.observaciones = animal.observaciones.trim();
    }

    const { error } = await supabase
      .from('animales')
      .insert([insertData]);

    if (error) handleRLSError(error, 'crear animal');
  },

  /**
   * eliminarAnimal — Borra un animal de la base de datos.
   * Es un DELETE directo por ID.
   */
  async eliminarAnimal(id: number): Promise<void> {
    const { error } = await supabase
      .from('animales')
      .delete()
      .eq('id', id);

    if (error) handleRLSError(error, 'eliminar animal');
  },

  // ==========================================
  // SECCIÓN: ESTADÍSTICAS DEL DASHBOARD
  // ==========================================

  /**
   * getDashboardStats — Obtiene conteos generales para las tarjetas del panel.
   * 
   * Usamos { count: 'exact', head: true } que significa:
   * - count: 'exact' = dame el conteo exacto de filas
   * - head: true = NO me traigas los datos, solo el conteo
   * 
   * Esto es mucho más eficiente que traer todos los registros
   * y luego hacer .length en JavaScript.
   */
  async getDashboardStats(): Promise<{ personalActivo: number, bovinos: number, fincas: number }> {
    const { count: personalCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('activo', true);
    const { count: bovinosCount } = await supabase.from('animales').select('*', { count: 'exact', head: true });
    const { count: fincasCount } = await supabase.from('fincas').select('*', { count: 'exact', head: true });

    return {
      personalActivo: personalCount || 0,
      bovinos: bovinosCount || 0,
      fincas: fincasCount || 0
    };
  },

  // ==========================================
  // SECCIÓN: ANÁLISIS DE PESAJES
  // ==========================================

  /**
   * getAnalisisPesajes — Calcula estadísticas de crecimiento del hato.
   * 
   * Esta es la función más compleja del servicio. Lo que hace es:
   * 
   * 1. Genera las etiquetas de los últimos 6 meses (DIC, ENE, FEB, etc.)
   * 2. Trae TODOS los animales con TODOS sus pesajes
   * 3. Para cada animal:
   *    a. Encuentra su peso más reciente
   *    b. Clasifica cada pesaje en el mes correspondiente
   * 4. Calcula el promedio de peso por mes
   * 5. Calcula la tasa de crecimiento (% de cambio del último mes)
   * 6. Identifica al bovino más pesado de todo el hato
   * 
   * Si no hay datos, retorna todo en 0 (nunca inventa datos).
   */
  async getAnalisisPesajes(): Promise<AnalisisPesos> {
    // Paso 1: Generar las etiquetas de los últimos 6 meses
    const hoy = new Date();
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(hoy.getMonth() - i); // Retrocedemos i meses
      // toLocaleString con 'es-CR' nos da el nombre del mes en español
      labels.push(d.toLocaleString('es-CR', { month: 'short' }).toUpperCase());
    }

    try {
      // Paso 2: Traer todos los animales con sus pesajes y razas
      const { data: animales, error } = await supabase
        .from('animales')
        .select(`
          id,
          nombre,
          numero_arete,
          razas(nombre),
          estimaciones_peso (
            peso_estimado_kg,
            peso_corregido_kg,
            creado_en
          )
        `);

      if (error) throw error;

      // Si no hay animales, retornamos datos vacíos (todo en 0)
      if (!animales || animales.length === 0) {
        return {
          labels,
          pesosPromedio: [0, 0, 0, 0, 0, 0],
          crecimientoMensual: 0,
          pesoPromedioGeneral: 0,
          bovinoMasPesado: null
        };
      }

      // Paso 3: Estructuras para acumular datos
      // pesosPorMes es un diccionario donde cada índice (0-5) representa un mes
      // y el valor es un array de todos los pesos registrados en ese mes
      const pesosPorMes: { [key: number]: number[] } = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
      let totalPesoActual = 0;    // Suma de los pesos actuales de todos los animales
      let countPesosActuales = 0;  // Cantidad de animales con peso registrado
      let maxPeso = 0;             // El peso más alto encontrado
      let heaviestBovino: any = null; // Info del animal más pesado

      // Paso 4: Recorremos cada animal para procesar sus pesajes
      animales.forEach((a: any) => {
        const weights = a.estimaciones_peso || [];
        if (weights.length === 0) return; // Si no tiene pesajes, lo saltamos

        // Ordenamos pesajes del más antiguo al más reciente
        weights.sort((x: any, y: any) => new Date(x.creado_en).getTime() - new Date(y.creado_en).getTime());

        // El peso más reciente es el último del array (ya que ordenamos ascendente)
        const latestWeight = weights[weights.length - 1].peso_corregido_kg || weights[weights.length - 1].peso_estimado_kg || 0;

        if (latestWeight > 0) {
          totalPesoActual += latestWeight;
          countPesosActuales++;

          // ¿Es este el animal más pesado hasta ahora?
          if (latestWeight > maxPeso) {
            maxPeso = latestWeight;
            heaviestBovino = {
              nombre: a.nombre || `Arete: ${a.numero_arete}`,
              peso: Number(latestWeight.toFixed(1)),
              raza: a.razas?.nombre || 'Sin raza'
            };
          }
        }

        // Clasificamos cada pesaje en su mes correspondiente
        weights.forEach((w: any) => {
          const date = new Date(w.creado_en);
          const pesoVal = w.peso_corregido_kg || w.peso_estimado_kg || 0;
          if (pesoVal <= 0) return;

          // Calculamos cuántos meses de diferencia hay entre el pesaje y hoy
          const monthDiff = (hoy.getFullYear() - date.getFullYear()) * 12 + hoy.getMonth() - date.getMonth();

          // Solo nos interesan los últimos 6 meses (índice 0 a 5)
          if (monthDiff >= 0 && monthDiff < 6) {
            // 5 - monthDiff: convierte "meses atrás" a "índice del array"
            // monthDiff=0 (este mes) → índice 5 (último del array)
            // monthDiff=5 (hace 5 meses) → índice 0 (primero del array)
            pesosPorMes[5 - monthDiff].push(pesoVal);
          }
        });
      });

      // Paso 5: Calcular el promedio de peso para cada mes
      const pesosPromedio: number[] = [0, 0, 0, 0, 0, 0];

      for (let i = 0; i < 6; i++) {
        const arr = pesosPorMes[i];
        if (arr && arr.length > 0) {
          // Sumamos todos los pesos del mes y dividimos entre la cantidad
          const sum = arr.reduce((sumVal, val) => sumVal + val, 0);
          pesosPromedio[i] = Number((sum / arr.length).toFixed(1));
        }
        // Si no hay datos para ese mes, queda en 0
      }

      // Paso 6: Calcular la tasa de crecimiento mensual
      // Comparamos el mes actual (índice 5) con el mes anterior (índice 4)
      const pesoUltimo = pesosPromedio[5];     // Promedio del mes actual
      const pesoPenultimo = pesosPromedio[4];  // Promedio del mes pasado
      const dif = pesoUltimo - pesoPenultimo;  // Diferencia en kg
      // Fórmula: (diferencia / valor anterior) * 100 = porcentaje de cambio
      const crecimientoMensual = pesoPenultimo > 0 ? Number(((dif / pesoPenultimo) * 100).toFixed(1)) : 0;

      // Peso promedio general = suma de pesos actuales / cantidad de animales con peso
      const pesoPromedioGeneral = countPesosActuales > 0 ? Number((totalPesoActual / countPesosActuales).toFixed(1)) : 0;

      return {
        labels,
        pesosPromedio,
        crecimientoMensual,
        pesoPromedioGeneral,
        bovinoMasPesado: heaviestBovino
      };
    } catch (e) {
      console.error('Error al calcular análisis de pesajes:', e);
      // En caso de error, retornamos datos vacíos para que la UI no se rompa
      return {
        labels,
        pesosPromedio: [0, 0, 0, 0, 0, 0],
        crecimientoMensual: 0,
        pesoPromedioGeneral: 0,
        bovinoMasPesado: null
      };
    }
  }
};
