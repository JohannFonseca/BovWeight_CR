<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="header-toolbar">
        <ion-title>
          <div class="brand">
            <span class="logo-icon">🐄</span>
            <span class="app-logo">BovWeight CR</span>
            <span class="badge-admin">ADMIN</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="user-profile">
            <div class="avatar">
              {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'A' }}
            </div>
            <div class="user-info">
              <span class="name">{{ usuarioSesion?.nombre_completo || 'Administrador' }}</span>
              <span class="role">{{ usuarioSesion?.usuario || 'admin@test.com' }}</span>
            </div>
          </div>
          <ion-button @click="logout" class="logout-btn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content">
      <div class="dashboard-layout">
        <!-- Sidebar (Visible solo en desktop) -->
        <aside class="sidebar desktop-only">
          <nav class="nav-menu">
            <a href="#" class="nav-item" :class="{ active: activeTab === 'panel' }" @click.prevent="activeTab = 'panel'">
              <ion-icon :icon="pieChartOutline"></ion-icon>
              <span>Inicio</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'analisis' }" @click.prevent="activeTab = 'analisis'">
              <ion-icon :icon="barChartOutline"></ion-icon>
              <span>Análisis</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'empresa' }" @click.prevent="activeTab = 'empresa'">
              <ion-icon :icon="businessOutline"></ion-icon>
              <span>Mi Empresa</span>
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- NAVEGACIÓN MÓVIL REMOVIDA DE AQUÍ (AHORA EN EL BOTTOM BAR) -->

          <!-- HEADER DE PAGINA GENERAL -->
          <div class="page-header">
            <div v-if="activeTab === 'panel'">
              <h1 class="page-title">Panel General</h1>
              <p class="page-subtitle">Monitoreo de accesos, ganado y rendimiento global</p>
            </div>
            <div v-if="activeTab === 'analisis'">
              <h1 class="page-title">Análisis de Crecimiento</h1>
              <p class="page-subtitle">Vea cómo va creciendo el ganado y pesos promedio</p>
            </div>
            <div v-if="activeTab === 'empresa'">
              <h1 class="page-title">Mi Empresa Ganadera</h1>
              <p class="page-subtitle">Administración de fincas, ganado y empleados</p>
            </div>
            
            <ion-button v-if="activeTab === 'empresa' && subTab === 'empleados'" class="primary-btn" @click="mostrarModal = true">
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Nuevo Empleado
            </ion-button>
          </div>

          <!-- PESTAÑA: PANEL PRINCIPAL -->
          <div v-if="activeTab === 'panel'">

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper blue">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ usuariosList.length }}</span>
                <span class="stat-label">Personal Registrado</span>
              </div>
              <div class="stat-trend neutral">
                <span>Cuentas</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper green">
                <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ ganadoCompleto.length }}</span>
                <span class="stat-label">Bovinos Totales</span>
              </div>
              <div class="stat-trend positive">
                <span>Hato Activo</span>
              </div>
            </div>

            <div class="stat-card font-error-card">
              <div class="stat-icon-wrapper red-bg">
                <ion-icon :icon="removeOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ fincasList.length }}</span>
                <span class="stat-label">Fincas Activas</span>
              </div>
              <div class="stat-trend negative">
                <span>Ubicaciones</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrapper teal">
                <ion-icon :icon="listOutline"></ion-icon>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ analisisInfo?.pesoPromedioGeneral ?? 0 }} kg</span>
                <span class="stat-label">Peso Promedio General</span>
              </div>
              <div class="stat-trend positive">
                <span>Promedio</span>
              </div>
            </div>
          </div>

          <!-- Charts & Tables Grid -->
          <div class="content-grid">
            <!-- Chart Section -->
            <div class="panel-card chart-panel">
              <div class="panel-header">
                <h3>Estadísticas de Pesajes vs Nacimientos</h3>
                <ion-button fill="clear" size="small" @click="activeTab = 'analisis'">Ver análisis de peso</ion-button>
              </div>
              <div class="panel-body">
                <LineChart :data="chartData" :options="chartOptions" class="chart-container" />
              </div>
            </div>

            <!-- Recent Activity Table -->
            <div class="panel-card">
              <div class="panel-header">
                <h3>Listado Rápido de Personal Activo</h3>
              </div>
              <div class="panel-body no-padding">
                <div class="table-responsive">
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="user in usuariosList.slice(0, 5)" :key="user.id" @click="abrirDetalles(user)" class="clickable-row">
                        <td data-label="Usuario">
                          <div class="cell-user">
                            <div class="mini-avatar">{{ user.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : 'U' }}</div>
                            <div class="user-main-info">
                              <span class="user-name">{{ user.nombre_completo }}</span>
                              <small style="color: #888;">{{ user.correo }}</small>
                            </div>
                          </div>
                        </td>
                        <td data-label="Rol">
                          <span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre || 'Desconocido' }}</span>
                        </td>
                        <td data-label="Estado">
                          <span class="status-badge" :class="user.activo ? 'success' : 'error'">{{ user.activo ? 'Activo' : 'Bloqueado' }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          </div> <!-- FIN PANEL PRINCIPAL -->

          <!-- PESTAÑA: ANÁLISIS -->
          <div v-if="activeTab === 'analisis'">
            <!-- Stats Grid -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon-wrapper teal">
                  <ion-icon :icon="trendingUpOutline"></ion-icon>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ analisisInfo?.pesoPromedioGeneral ?? 0 }} kg</span>
                  <span class="stat-label">Peso Promedio General</span>
                </div>
                <div class="stat-trend positive">
                  <span>Hato Activo</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper green">
                  <ion-icon :icon="statsChartOutline"></ion-icon>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ (analisisInfo?.crecimientoMensual ?? 0) >= 0 ? '+' : '' }}{{ analisisInfo?.crecimientoMensual ?? 0 }}%</span>
                  <span class="stat-label">Tasa de Crecimiento</span>
                </div>
                <div class="stat-trend positive">
                  <span>Último Mes</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper blue">
                  <ion-icon :icon="leafOutline"></ion-icon>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ analisisInfo?.bovinoMasPesado ? analisisInfo.bovinoMasPesado.peso + ' kg' : '0 kg' }}</span>
                  <span class="stat-label">Bovino más Pesado</span>
                </div>
                <div class="stat-trend neutral">
                  <span style="font-size: 11px;">{{ analisisInfo?.bovinoMasPesado?.nombre || 'Ninguno' }}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper red-bg">
                  <ion-icon :icon="pulseOutline"></ion-icon>
                </div>
                <div class="stat-details">
                  <span class="stat-value">{{ ganadoCompleto.length }}</span>
                  <span class="stat-label">Bovinos Totales</span>
                </div>
                <div class="stat-trend positive">
                  <span>Activo</span>
                </div>
              </div>
            </div>

            <!-- Charts Section -->
            <div class="content-grid" style="grid-template-columns: 1fr;">
              <div class="panel-card chart-panel" style="width: 100%;">
                <div class="panel-header">
                  <h3>Crecimiento de Peso Promedio en el Tiempo (Últimos 6 Meses)</h3>
                  <ion-button fill="clear" size="small" @click="cargarAnalisis" :disabled="cargandoAnalisis">
                    {{ cargandoAnalisis ? 'Actualizando...' : 'Actualizar' }}
                  </ion-button>
                </div>
                <div class="panel-body">
                  <LineChart :data="analisisChartData" :options="chartOptions" class="chart-container" />
                </div>
              </div>
            </div>

            <!-- Insights Section -->
            <div class="panel-card" style="margin-top: 24px;">
              <div class="panel-header">
                <h3>📋 Análisis del Rendimiento del Hato</h3>
              </div>
              <div class="panel-body">
                <div class="insight-content" style="padding: 16px; background: #fdfbf7; border-radius: 12px; border: 1px solid rgba(85, 107, 47, 0.15);">
                  <div v-if="ganadoCompleto.length > 0">
                    <p style="margin: 0 0 12px; line-height: 1.6; color: #2c3e2d; font-weight: 600;">
                      📈 El peso promedio general de tu hato se encuentra actualmente en **{{ analisisInfo?.pesoPromedioGeneral ?? 0 }} kg**, reflejando una curva de crecimiento sostenido del **{{ (analisisInfo?.crecimientoMensual ?? 0) >= 0 ? '+' : '' }}{{ analisisInfo?.crecimientoMensual ?? 0 }}%** con respecto al período anterior.
                    </p>
                    <p v-if="analisisInfo?.bovinoMasPesado" style="margin: 0 0 12px; line-height: 1.6; color: #2c3e2d; font-weight: 500;">
                      👑 El animal con mayor peso registrado en la empresa es **{{ analisisInfo.bovinoMasPesado.nombre }}** de raza **{{ analisisInfo.bovinoMasPesado.raza }}** con un peso de **{{ analisisInfo.bovinoMasPesado.peso }} kg**.
                    </p>
                    <p style="margin: 0; line-height: 1.6; color: #5c6e58; font-size: 14px;">
                      💡 **Recomendación**: La curva de ganancia de peso muestra una excelente respuesta al programa de suplementación nutricional. Se sugiere continuar la toma de pesajes de forma constante cada mes para sostener este índice de precisión.
                    </p>
                  </div>
                  <div v-else style="text-align: center; color: #5c6e58; padding: 8px;">
                    <p style="margin: 0; font-weight: 600; font-size: 14px;">💡 Registra animales y pesajes para generar análisis de rendimiento automáticos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PESTAÑA: MI EMPRESA (Fincas, Ganado y Empleados) -->
          <div v-if="activeTab === 'empresa'">
            <!-- Sub-Tabs Navigation (Segment) -->
            <div class="empresa-segment">
              <button class="subtab-btn" :class="{ active: subTab === 'fincas' }" @click="subTab = 'fincas'">
                🏠 Fincas
              </button>
              <button class="subtab-btn" :class="{ active: subTab === 'ganado' }" @click="subTab = 'ganado'">
                🐄 Ganado
              </button>
              <button class="subtab-btn" :class="{ active: subTab === 'empleados' }" @click="subTab = 'empleados'">
                👥 Empleados
              </button>
            </div>

            <!-- SUB-TAB: FINCAS -->
            <div v-if="subTab === 'fincas'">
              <div class="fincas-grid">
                <div v-for="finca in fincasList" :key="finca.id" class="finca-card">
                  <div class="finca-header">
                    <div class="finca-icon">🏡</div>
                    <div class="finca-title-info">
                      <h4>{{ finca.nombre }}</h4>
                      <span>{{ finca.ubicacion }}</span>
                    </div>
                  </div>
                  <div class="finca-body">
                    <div class="finca-info-row">
                      <strong>Encargado:</strong>
                      <span>{{ finca.encargado_nombre }}</span>
                    </div>
                    <div class="finca-info-row">
                      <strong>Ganado:</strong>
                      <span class="finca-badge">{{ finca.bovinos_count }} Bovinos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SUB-TAB: GANADO -->
            <div v-if="subTab === 'ganado'" class="panel-card">
              <div class="panel-header logs-header">
                <h3>Inventario de Ganado de la Empresa</h3>
                <div class="logs-actions">
                  <div class="search-box">
                    <input 
                      type="text" 
                      v-model="searchQueryGanado" 
                      placeholder="Buscar por arete, nombre, raza..." 
                      class="search-input"
                      style="width: 250px;"
                    />
                  </div>
                  <ion-button fill="clear" size="small" @click="cargarGanadoCompleto">Actualizar</ion-button>
                </div>
              </div>
              <div class="panel-body no-padding">
                <div class="table-responsive">
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Bovino</th>
                        <th>Número Arete</th>
                        <th>Raza</th>
                        <th>Ubicación</th>
                        <th>Peso Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="animal in filteredGanado" :key="animal.id">
                        <td data-label="Bovino">
                          <div class="cell-user">
                            <div class="mini-avatar" style="background: #eaf0e6; color: #3e4f24;">🐄</div>
                            <div class="user-main-info">
                              <span class="user-name">{{ animal.nombre }}</span>
                              <span class="user-role mobile-only">Arete: #{{ animal.numero_arete }} • {{ animal.raza }} • {{ animal.peso_actual }} kg</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Número Arete"><strong style="color: #556b2f;">#{{ animal.numero_arete }}</strong></td>
                        <td data-label="Raza"><span class="role-badge ganadero">{{ animal.raza }}</span></td>
                        <td data-label="Ubicación">{{ animal.finca_nombre }}</td>
                        <td data-label="Peso Actual"><strong>{{ animal.peso_actual }} kg</strong></td>
                      </tr>
                      <tr v-if="filteredGanado.length === 0">
                        <td colspan="5" style="text-align: center; padding: 24px;">No se encontraron bovinos en el sistema.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- SUB-TAB: EMPLEADOS -->
            <div v-if="subTab === 'empleados'" class="panel-card">
              <div class="panel-header logs-header">
                <h3>Listado del Personal de la Empresa</h3>
                <div class="logs-actions">
                  <div class="search-box">
                    <input 
                      type="text" 
                      v-model="searchQueryEmpleado" 
                      placeholder="Buscar por nombre, correo..." 
                      class="search-input"
                    />
                  </div>
                  <ion-button fill="clear" size="small" @click="cargarUsuarios">Actualizar</ion-button>
                </div>
              </div>
              <div class="panel-body no-padding">
                <div class="table-responsive">
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th class="hide-on-mobile">Correo</th>
                        <th>Rol Asignado</th>
                        <th class="hide-on-mobile">Estado</th>
                        <th class="hide-on-mobile">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="user in filteredUsuarios" :key="user.id" @click="abrirDetalles(user)" class="clickable-row">
                        <td data-label="Nombre">
                          <div class="cell-user">
                            <div class="mini-avatar">{{ user.nombre_completo ? user.nombre_completo.charAt(0).toUpperCase() : 'U' }}</div>
                            <div class="user-main-info">
                              <span class="user-name">{{ user.nombre_completo }}</span>
                              <span class="user-role mobile-only">{{ user.rol_nombre || 'Desconocido' }}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Correo" class="hide-on-mobile">{{ user.correo }}</td>
                        <td data-label="Rol Asignado">
                          <span class="role-badge" :class="user.rol_nombre">{{ user.rol_nombre || 'Desconocido' }}</span>
                        </td>
                        <td data-label="Estado" class="hide-on-mobile">
                          <span class="status-badge" :class="user.activo ? 'success' : 'error'">{{ user.activo ? 'activo' : 'inactivo' }}</span>
                        </td>
                        <td data-label="Acciones" class="hide-on-mobile">
                          <div class="table-actions">
                            <ion-button v-if="user.activo" fill="clear" size="small" color="warning" @click.stop="cambiarEstadoUsuario(user.id, false)">
                              Bloquear
                            </ion-button>
                            <ion-button v-else fill="clear" size="small" color="success" @click.stop="cambiarEstadoUsuario(user.id, true)">
                              Reactivar
                            </ion-button>
                            <ion-button fill="clear" size="small" color="danger" @click.stop="eliminarUsuario(user.id)">
                              <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                              Eliminar
                            </ion-button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="filteredUsuarios.length === 0">
                        <td colspan="5" style="text-align: center; padding: 24px;">No hay usuarios registrados.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      <!-- MODAL CREAR USUARIO -->
      <ion-modal :is-open="mostrarModal" @didDismiss="mostrarModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Registrar Nuevo Usuario</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="mostrarModal = false">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-container">
            <ion-item>
              <ion-label position="stacked">Nombre Completo</ion-label>
              <ion-input v-model="nuevoUsuario.nombre_completo" placeholder="Ej. Juan Pérez"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Correo Electrónico</ion-label>
              <ion-input v-model="nuevoUsuario.correo" type="email" placeholder="ejemplo@test.com"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Contraseña Inicial</ion-label>
              <ion-input v-model="nuevoUsuario.contrasena" type="password" placeholder="Mínimo 6 caracteres"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Rol en el Sistema</ion-label>
              <ion-select v-model="nuevoUsuario.rol_id" placeholder="Selecciona un rol">
                <ion-select-option v-for="rol in rolesList" :key="rol.id" :value="rol.id">{{ rol.nombre.toUpperCase() }}</ion-select-option>
              </ion-select>
            </ion-item>
            <div class="form-actions">
              <ion-button expand="block" class="primary-btn" @click="guardarUsuario" :disabled="guardando">
                {{ guardando ? 'Guardando...' : 'Crear Acceso' }}
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <!-- MODAL DETALLES DE USUARIO (BOTTOM SHEET) -->
      <ion-modal :is-open="mostrarModalDetalles" @didDismiss="mostrarModalDetalles = false" :initial-breakpoint="0.7" :breakpoints="[0, 0.7, 0.9]" class="bottom-sheet-modal">
        <ion-content class="ion-padding">
          <div v-if="usuarioSeleccionado" class="details-container">
            <div class="details-header">
              <div class="avatar-large">{{ usuarioSeleccionado.nombre_completo ? usuarioSeleccionado.nombre_completo.charAt(0).toUpperCase() : 'U' }}</div>
              <h2>{{ usuarioSeleccionado.nombre_completo }}</h2>
              <span class="role-badge" :class="usuarioSeleccionado.rol_nombre">{{ usuarioSeleccionado.rol_nombre || 'Desconocido' }}</span>
            </div>
            
            <div class="details-body">
              <div class="detail-item">
                <ion-icon :icon="mailOutline"></ion-icon>
                <div class="detail-text">
                  <small>Correo</small>
                  <p>{{ usuarioSeleccionado.correo }}</p>
                </div>
              </div>
              <div class="detail-item">
                <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                <div class="detail-text">
                  <small>Estado</small>
                  <p>
                    <span class="status-badge" :class="usuarioSeleccionado.activo ? 'success' : 'error'">
                      {{ usuarioSeleccionado.activo ? 'Activo / Permitido' : 'Inactivo / Bloqueado' }}
                    </span>
                  </p>
                </div>
              </div>
              <div class="detail-item">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <div class="detail-text">
                  <small>Fecha de Registro</small>
                  <p>{{ usuarioSeleccionado.creado_en || 'No disponible' }}</p>
                </div>
              </div>
            </div>

            <div class="details-actions-row">
              <ion-button v-if="usuarioSeleccionado.activo" color="warning" class="action-btn" @click="cambiarEstadoUsuario(usuarioSeleccionado.id, false); mostrarModalDetalles = false">
                Bloquear Acceso
              </ion-button>
              <ion-button v-else color="success" class="action-btn" @click="cambiarEstadoUsuario(usuarioSeleccionado.id, true); mostrarModalDetalles = false">
                Reactivar Acceso
              </ion-button>
              
              <ion-button color="danger" fill="outline" class="action-btn" @click="eliminarUsuario(usuarioSeleccionado.id); mostrarModalDetalles = false">
                Eliminar Acceso
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>

    <!-- BOTTOM TAB BAR (Visible solo en celular) -->
    <div class="mobile-bottom-tabs mobile-only">
      <button class="bottom-tab-btn" :class="{ active: activeTab === 'panel' }" @click="activeTab = 'panel'">
        <ion-icon :icon="pieChartOutline"></ion-icon>
        <span>Inicio</span>
      </button>
      <button class="bottom-tab-btn" :class="{ active: activeTab === 'analisis' }" @click="activeTab = 'analisis'">
        <ion-icon :icon="barChartOutline"></ion-icon>
        <span>Análisis</span>
      </button>
      <button class="bottom-tab-btn" :class="{ active: activeTab === 'empresa' }" @click="activeTab = 'empresa'">
        <ion-icon :icon="businessOutline"></ion-icon>
        <span>Mi Empresa</span>
      </button>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons,
  IonModal, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, toastController, alertController
} from '@ionic/vue';
import { 
  logOutOutline, shieldCheckmarkOutline, peopleOutline, settingsOutline, 
  pieChartOutline, listOutline, addOutline, trendingUpOutline, trashOutline,
  leafOutline, medkitOutline, pulseOutline, removeOutline, mailOutline, calendarOutline,
  checkmarkCircleOutline, alertCircleOutline, informationCircleOutline,
  barChartOutline, businessOutline, statsChartOutline
} from 'ionicons/icons';

import { adminService, type UsuarioInfo, type Rol, type Finca, type AnimalInfo, type AnalisisPesos } from '../services/admin.service';

// Chart.js imports
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const router = useRouter();
const usuarioSesion = ref<any>(null);
const sessionStr = localStorage.getItem('usuario_sesion');
if (sessionStr) {
  try {
    usuarioSesion.value = JSON.parse(sessionStr);
  } catch (e) {
    console.error('Error parseando usuario_sesion:', e);
  }
}

const activeTab = ref('panel'); // Empezamos en el Panel Principal
const subTab = ref('fincas'); // Subpestaña por defecto en Mi Empresa
const mostrarModal = ref(false);
const guardando = ref(false);

const usuarioSeleccionado = ref<UsuarioInfo | null>(null);
const mostrarModalDetalles = ref(false);

const abrirDetalles = (user: UsuarioInfo) => {
  usuarioSeleccionado.value = user;
  mostrarModalDetalles.value = true;
};

// Listas de datos reactivos
const usuariosList = ref<UsuarioInfo[]>([]);
const rolesList = ref<Rol[]>([]);
const fincasList = ref<Finca[]>([]);
const ganadoCompleto = ref<AnimalInfo[]>([]);
const analisisInfo = ref<AnalisisPesos | null>(null);

// Filtros y búsquedas
const searchQueryGanado = ref('');
const searchQueryEmpleado = ref('');
const cargandoAnalisis = ref(false);

// Computeds para búsquedas y filtros
const filteredGanado = computed(() => {
  if (!searchQueryGanado.value || searchQueryGanado.value.trim() === '') {
    return ganadoCompleto.value;
  }
  const query = searchQueryGanado.value.toLowerCase().trim();
  return ganadoCompleto.value.filter(animal => 
    animal.nombre.toLowerCase().includes(query) || 
    animal.numero_arete.toLowerCase().includes(query) || 
    animal.raza.toLowerCase().includes(query)
  );
});

const filteredUsuarios = computed(() => {
  if (!searchQueryEmpleado.value || searchQueryEmpleado.value.trim() === '') {
    return usuariosList.value;
  }
  const query = searchQueryEmpleado.value.toLowerCase().trim();
  return usuariosList.value.filter(user => 
    user.nombre_completo.toLowerCase().includes(query) || 
    user.correo.toLowerCase().includes(query)
  );
});

// Computeds para gráficas usando los datos del backend
const chartData = computed(() => {
  const labels = analisisInfo.value?.labels || ['DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY'];
  const pesos = analisisInfo.value?.pesosPromedio || [340, 352, 365, 378, 390, 405];

  return {
    labels,
    datasets: [
      {
        label: 'Pesos Promedio Hato (kg)',
        backgroundColor: 'rgba(85, 107, 47, 0.1)',
        borderColor: '#556b2f',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#556b2f',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        data: pesos,
        tension: 0.4
      }
    ]
  };
});

const analisisChartData = computed(() => {
  const labels = analisisInfo.value?.labels || ['DIC', 'ENE', 'FEB', 'MAR', 'ABR', 'MAY'];
  const pesos = analisisInfo.value?.pesosPromedio || [340, 352, 365, 378, 390, 405];

  return {
    labels,
    datasets: [
      {
        label: 'Peso Promedio (kg)',
        backgroundColor: 'rgba(85, 107, 47, 0.1)',
        borderColor: '#556b2f',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#556b2f',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        data: pesos,
        tension: 0.4
      }
    ]
  };
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        font: { family: "'Inter', sans-serif", size: 12 }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f0f0f0', drawBorder: false }
    },
    x: {
      grid: { display: false, drawBorder: false }
    }
  }
});

// Métodos de carga
const cargarUsuarios = async () => {
  try {
    usuariosList.value = await adminService.getUsuarios();
  } catch (error: any) {
    console.error("Error cargando usuarios:", error);
    mostrarNotificacion(`Error cargando usuarios: ${error?.message}`, 'danger');
  }
};

const cargarRoles = async () => {
  try {
    rolesList.value = await adminService.getRoles();
  } catch (error) {
    console.error("No se pudieron cargar los roles.");
  }
};

const cargarFincas = async () => {
  try {
    fincasList.value = await adminService.getFincas();
  } catch (error) {
    console.error("Error al cargar fincas:", error);
  }
};

const cargarGanadoCompleto = async () => {
  try {
    ganadoCompleto.value = await adminService.getGanadoCompleto();
  } catch (error) {
    console.error("Error al cargar ganado completo:", error);
  }
};

const cargarAnalisis = async () => {
  cargandoAnalisis.value = true;
  try {
    analisisInfo.value = await adminService.getAnalisisPesajes();
  } catch (error) {
    console.error("Error al cargar análisis de pesajes:", error);
  } finally {
    cargandoAnalisis.value = false;
  }
};

const nuevoUsuario = ref({
  nombre_completo: '',
  correo: '',
  contrasena: '',
  rol_id: null as number | null
});

const logout = () => {
  localStorage.removeItem('usuario_sesion');
  router.push('/login');
};

const mostrarNotificacion = async (mensaje: string, tipo: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
  const iconMap = {
    success: checkmarkCircleOutline,
    danger: alertCircleOutline,
    warning: alertCircleOutline,
    info: informationCircleOutline
  };

  const toast = await toastController.create({
    message: mensaje,
    duration: 3500,
    position: 'top',
    icon: iconMap[tipo],
    cssClass: `premium-toast toast-${tipo}`,
    buttons: [
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ]
  });
  await toast.present();
};

const guardarUsuario = async () => {
  if (!nuevoUsuario.value.nombre_completo || nuevoUsuario.value.nombre_completo.trim().length === 0) {
    mostrarNotificacion('Por favor ingresa el nombre completo.', 'warning');
    return;
  }
  if (!nuevoUsuario.value.correo || !nuevoUsuario.value.correo.includes('@')) {
    mostrarNotificacion('Por favor ingresa un correo electrónico válido.', 'warning');
    return;
  }
  if (!nuevoUsuario.value.contrasena || nuevoUsuario.value.contrasena.length < 4) {
    mostrarNotificacion('La contraseña debe tener al menos 4 caracteres.', 'warning');
    return;
  }
  if (!nuevoUsuario.value.rol_id) {
    mostrarNotificacion('Por favor selecciona un rol para el usuario.', 'warning');
    return;
  }

  guardando.value = true;
  try {
    await adminService.crearUsuario({
      nombre_completo: nuevoUsuario.value.nombre_completo,
      correo: nuevoUsuario.value.correo,
      contrasena: nuevoUsuario.value.contrasena,
      rol_id: nuevoUsuario.value.rol_id
    });
    mostrarNotificacion('🎉 ¡Usuario creado exitosamente!', 'success');
    mostrarModal.value = false;
    nuevoUsuario.value = { nombre_completo: '', correo: '', contrasena: '', rol_id: null };
    await cargarUsuarios();
  } catch (error: any) {
    const mensaje = error?.message || 'Error desconocido al crear el usuario.';
    mostrarNotificacion(`Error al crear usuario: ${mensaje}`, 'danger');
  } finally {
    guardando.value = false;
  }
};

const eliminarUsuario = async (id: number) => {
  const alertConfirm = await alertController.create({
    header: 'Confirmar Eliminación',
    subHeader: 'Esta acción no se puede deshacer',
    message: '¿Estás seguro de eliminar permanentemente este acceso al sistema?',
    cssClass: 'premium-alert',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            await adminService.eliminarUsuario(id);
            mostrarNotificacion('🗑️ Acceso eliminado permanentemente.', 'success');
            await cargarUsuarios();
          } catch (error: any) {
            mostrarNotificacion(`Error al eliminar: ${error.message || 'Inténtelo de nuevo.'}`, 'danger');
          }
        }
      }
    ]
  });
  await alertConfirm.present();
};

const cambiarEstadoUsuario = async (id: number, nuevoEstado: boolean) => {
  const accion = nuevoEstado ? 'reactivar' : 'bloquear';
  const alertConfirm = await alertController.create({
    header: nuevoEstado ? 'Reactivar Acceso' : 'Bloquear Acceso',
    message: `¿Estás seguro de que deseas ${accion} el acceso a este usuario?`,
    cssClass: 'premium-alert',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: nuevoEstado ? 'Reactivar' : 'Bloquear',
        role: 'confirm',
        handler: async () => {
          try {
            await adminService.toggleEstadoUsuario(id, nuevoEstado);
            mostrarNotificacion(`Acceso ${nuevoEstado ? 'reactivado' : 'bloqueado'} exitosamente.`, 'success');
            await cargarUsuarios();
          } catch (error: any) {
            mostrarNotificacion(`Error al cambiar estado: ${error.message || 'Inténtelo de nuevo.'}`, 'danger');
          }
        }
      }
    ]
  });
  await alertConfirm.present();
};

onMounted(() => {
  cargarUsuarios();
  cargarRoles();
});
</script>

<style scoped>
/* 
 * ==========================================
 * VARIABLES GLOBALES DEL TEMA (Rústico/Beige)
 * ==========================================
 * Comentario para el equipo:
 * Se utilizan variables CSS para mantener la consistencia del tema 
 * en toda la aplicación. Elegimos una paleta basada en tonos cálidos
 * (beige) y acentos en verde natural para alinearnos a la temática ganadera.
 */
.dashboard-content {
  --background: #f4f1ea; /* Fondo beige cálido principal */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ====== HEADER ====== */
.header-toolbar {
  --background: rgba(255, 255, 255, 0.85); /* Fondo semitransparente */
  --min-height: 70px;
  /* Efecto Glassmorphism para darle un aspecto premium moderno */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(85, 107, 47, 0.2));
}

.app-logo {
  font-weight: 800;
  color: #2c3e2d; /* Verde bosque oscuro */
  letter-spacing: -0.5px;
  font-size: 20px;
}

.badge-admin {
  background: linear-gradient(135deg, #2c3e2d, #1a241a);
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px -1px rgba(44, 62, 45, 0.3);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
}

.avatar {
  width: 38px;
  height: 38px;
  background: #2c3e2d; /* Color consistente con el rol */
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-info .name {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e2d;
}

.user-info .role {
  font-size: 12px;
  color: #5c6e58;
  font-weight: 500;
}

.logout-btn {
  --color: #5c6e58;
}

/* 
 * ==========================================
 * LAYOUT PRINCIPAL (Flexbox)
 * ==========================================
 * Comentario para el equipo:
 * Se usa flexbox para distribuir el menú lateral (sidebar)
 * y el contenido principal. En móviles, el sidebar desaparece
 * y el main-content ocupa todo el 100% de la pantalla.
 */
.dashboard-layout {
  display: flex;
  height: 100%; /* Corregido: asegurar que ocupe todo el alto disponible en Ionic */
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  background: #FFFFFF;
  border-right: 1px solid #e2dcd0;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: #5c6e58;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #f4f1ea;
  color: #2c3e2d;
}

.nav-item.active {
  background: #eaf0e6;
  color: #3e4f24;
}

.nav-item ion-icon {
  font-size: 22px;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Permite scroll fluido en iOS */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #2c3e2d;
  margin: 0 0 6px;
  letter-spacing: -1px;
}

.page-subtitle {
  font-size: 15px;
  color: #5c6e58;
  margin: 0;
  font-weight: 500;
}

.primary-btn {
  --background: linear-gradient(135deg, #556b2f, #3e4f24);
  --border-radius: 14px;
  --box-shadow: 0 10px 20px -10px rgba(85, 107, 47, 0.6);
  font-weight: 700;
  letter-spacing: 0.5px;
  height: 48px;
}

/* 
 * ==========================================
 * GRID DE ESTADÍSTICAS Y TARJETAS
 * ==========================================
 * Comentario para el equipo:
 * Se utiliza CSS Grid para hacer que las tarjetas se ajusten
 * automáticamente al ancho de la pantalla (responsive).
 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
  position: relative;
  transition: transform 0.2s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 16px;
}

/* Colores de íconos adaptados al tema natural */
.stat-icon-wrapper.blue { background: #f0f4f8; color: #475569; }
.stat-icon-wrapper.green { background: #eaf0e6; color: #556b2f; }
.stat-icon-wrapper.teal { background: #fdfbf7; color: #6b8e23; }
.stat-icon-wrapper.orange { background: #fff7ed; color: #d97706; }
.stat-icon-wrapper.red-bg { background: #fce8e8; color: #b71c1c; }

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #2c3e2d;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #5c6e58;
  font-weight: 600;
  margin-top: 4px;
}

.stat-trend {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 20px;
}

.stat-trend.positive { background: #eaf0e6; color: #3e4f24; }
.stat-trend.neutral { background: #f4f1ea; color: #5c6e58; }
.stat-trend.negative { background: #fce8e8; color: #b71c1c; }

/* ====== PANELS GRID ====== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.panel-card {
  background: #FFFFFF;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 24px; /* Margen inferior para móviles */
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid #f4f1ea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
}

.panel-body {
  padding: 24px;
  flex: 1;
}

.panel-body.no-padding {
  padding: 0;
}

.chart-container {
  height: 260px;
  width: 100%;
}

/* 
 * ==========================================
 * TABLAS DE DATOS
 * ==========================================
 * Comentario para el equipo:
 * En .table-responsive aplicamos un overflow-x para que en pantallas 
 * pequeñas la tabla no rompa el diseño y permita hacer scroll horizontal.
 */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.saas-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 600px; /* Asegura que no se aplaste el contenido */
}

.saas-table th {
  padding: 16px 24px;
  font-size: 12px;
  text-transform: uppercase;
  color: #5c6e58;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: #fdfbf7;
  border-bottom: 1px solid #f4f1ea;
}

.saas-table td {
  padding: 16px 24px;
  font-size: 14px;
  color: #2c3e2d;
  border-bottom: 1px solid #f4f1ea;
  vertical-align: middle;
}

.saas-table tbody tr:last-child td {
  border-bottom: none;
}

.saas-table tbody tr:hover {
  background: #fdfbf7;
}

.cell-user {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #2c3e2d;
}

.user-main-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
  color: #2c3e2d;
}

.user-role {
  font-size: 12px;
  font-weight: 700;
  color: #8ba888;
  text-transform: uppercase;
  margin-top: 2px;
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f4f1ea;
  color: #3e4f24;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.success { background: #eaf0e6; color: #3e4f24; }
.status-badge.error { background: #fce8e8; color: #b71c1c; }

.role-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: #f4f1ea;
  color: #5c6e58;
}

.role-badge.admin { background: #f0f4f8; color: #334155; }
.role-badge.ganadero { background: #eaf0e6; color: #556b2f; }
.role-badge.veterinario { background: #fdfbf7; color: #6b8e23; }

.form-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-actions {
  margin-top: 24px;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.2s;
}
.clickable-row:active {
  background: #f4f1ea;
}

/* Modal Bottom Sheet Styles */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}
.details-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}
.avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f4f1ea;
  color: #3e4f24;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
}
.details-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #2c3e2d;
}
.details-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fdfbf7;
  border-radius: 16px;
  padding: 12px 16px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-item ion-icon {
  font-size: 20px;
  color: #5c6e58;
}
.detail-text {
  display: flex;
  flex-direction: column;
}
.detail-text small {
  font-size: 11px;
  color: #8ba888;
  font-weight: 700;
  text-transform: uppercase;
}
.detail-text p {
  margin: 2px 0 0;
  font-size: 14px;
  color: #2c3e2d;
  font-weight: 600;
}
.details-actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
.details-actions-row .action-btn {
  flex: 1;
  margin: 0;
  --border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  height: 42px;
}

/* 
 * ==========================================
 * RESPONSIVE MEDIA QUERIES (Optimización Móvil)
 * ==========================================
 * Comentario para el equipo:
 * Esta sección es crítica para que la aplicación se vea bien en celulares.
 * Cambiamos los paddings, ocultamos elementos innecesarios y convertimos 
 * las grillas de 2 columnas en 1 sola columna.
 */
@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.mobile-only {
  display: none;
}

/* Mobile Bottom Navigation Bar */
.mobile-bottom-tabs {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  height: 68px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  display: none; /* Oculto en desktop */
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 10px 30px rgba(44, 62, 45, 0.15);
  border: 1px solid rgba(85, 107, 47, 0.15);
  z-index: 999;
}

.bottom-tab-btn {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(44, 62, 45, 0.45); /* Inactivo más tenue pero legible */
  font-size: 11px;
  font-weight: 600;
  transition: all 0.25s ease;
  cursor: pointer;
  flex: 1;
  height: 100%;
  border-radius: 12px;
  position: relative;
  padding-bottom: 8px; /* Espacio para el indicador inferior */
}

.bottom-tab-btn ion-icon {
  font-size: 22px;
  color: rgba(44, 62, 45, 0.5); /* Icono inactivo */
  transition: all 0.25s ease;
}

.bottom-tab-btn.active {
  color: #111827 !important; /* Negro de altísimo contraste */
  font-weight: 850 !important; /* Texto más grueso y visible */
  transform: translateY(-2px);
}

.bottom-tab-btn.active ion-icon {
  color: #111827 !important; /* Icono activo en negro profundo */
  font-size: 24px; /* Aumenta el tamaño del icono activo */
  transform: scale(1.1);
}

/* Indicador visual inferior para mayor accesibilidad de adultos mayores */
.bottom-tab-btn::after {
  content: '';
  position: absolute;
  bottom: 8px;
  width: 14px;
  height: 4px;
  background: #111827; /* Línea indicadora en negro profundo */
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-tab-btn.active::after {
  transform: scaleX(1);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: block !important;
  }
  
  .mobile-bottom-tabs.mobile-only {
    display: flex !important;
  }
  
  .mobile-nav {
    margin-bottom: 24px;
    background: #FFFFFF;
    padding: 4px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  }
  
  /* Ajuste visual para IonSegment en tema beige/verde */
  ion-segment {
    --background: transparent;
  }
  ion-segment-button {
    --indicator-color: #f4f1ea;
    --color: #5c6e58;
    --color-checked: #2c3e2d;
    font-weight: 700;
  }
  
  .main-content {
    padding: 16px 16px 100px 16px !important;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .user-info {
    display: none; /* Ocultar el correo en móvil para salvar espacio */
  }

  /* Ajustes en tarjetas para que no se peguen a los bordes */
  .panel-card {
    border-radius: 16px;
  }

  /* 
   * Comentario para el equipo:
   * Transformamos las tablas estándar en un diseño de "tarjetas" (cards)
   * apiladas para móviles. Esto evita el scroll horizontal y hace que
   * la información sea fácil de leer en pantallas pequeñas.
   */
  .saas-table, .saas-table tbody, .saas-table tr, .saas-table td {
    display: block;
    width: 100%;
  }

  .saas-table thead {
    display: none; /* Ocultamos el encabezado original */
  }

  .saas-table tr {
    margin-bottom: 16px;
    border: 1px solid #e2dcd0;
    border-radius: 12px;
    padding: 12px;
    background: #FFFFFF;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .saas-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f4f1ea;
    padding: 12px 8px;
    text-align: right;
  }
  
  .saas-table td:last-child {
    border-bottom: none;
  }

  /* 
   * Simplificamos la lista para usabilidad de adultos mayores:
   * Solo mostramos el nombre y rol, ocultando etiquetas complicadas 
   * y añadiendo un ícono de flecha (chevron) para indicar interacción.
   */
  .table-responsive {
    overflow-x: hidden;
  }
  
  .saas-table {
    min-width: 0; /* Removemos el min-width que causaba scroll */
  }

  .saas-table td:not(:first-child), .saas-table th:not(:first-child) {
    display: none !important; /* Ocultar todo menos la primera celda */
  }

  .saas-table td:first-child {
    padding: 16px;
    border-bottom: none;
  }

  .saas-table td::before {
    display: none; /* Quitamos las etiquetas */
  }

  .saas-table tr {
    padding: 0;
    position: relative;
  }

  .saas-table tr::after {
    content: '›';
    font-size: 32px;
    color: #8ba888;
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .cell-user {
    justify-content: flex-start;
    text-align: left;
  }
  
  .cell-user .mini-avatar {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .hide-on-mobile {
    display: none !important;
  }
}

/* Estilos de Logs */
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.logs-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(139, 168, 136, 0.4);
  background: #fdfbf7;
  font-size: 14px;
  color: #2c3e2d;
  outline: none;
  transition: all 0.3s ease;
  width: 200px;
}

.search-input:focus {
  border-color: #556b2f;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(85, 107, 47, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* Styling for custom premium toast to make it look like a native push notification */
:global(ion-toast.premium-toast) {
  --background: rgba(255, 255, 255, 0.95);
  --color: #2c3e2d;
  --box-shadow: 0 10px 30px rgba(44, 62, 45, 0.15);
  --border-radius: 16px;
  --button-color: #556b2f;
  border: 1px solid rgba(85, 107, 47, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: 'Inter', sans-serif;
  margin-top: 10px;
}

:global(.ios ion-toast.premium-toast) {
  --background: rgba(255, 255, 255, 0.96);
}

:global(ion-toast.premium-toast.toast-success) {
  --background: rgba(234, 240, 230, 0.96);
  --color: #3e4f24;
  --button-color: #3e4f24;
  border: 1px solid rgba(62, 79, 36, 0.2);
}

:global(ion-toast.premium-toast.toast-danger) {
  --background: rgba(252, 232, 232, 0.96);
  --color: #b71c1c;
  --button-color: #b71c1c;
  border: 1px solid rgba(183, 28, 28, 0.2);
}

:global(ion-toast.premium-toast.toast-warning) {
  --background: rgba(255, 247, 237, 0.96);
  --color: #d97706;
  --button-color: #d97706;
  border: 1px solid rgba(217, 119, 6, 0.2);
}

:global(ion-toast.premium-toast::part(message)) {
  font-size: 14px;
  font-weight: 600;
}

:global(ion-toast.premium-toast::part(button)) {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Premium alert styling inside the app */
:global(.premium-alert) {
  --background: #fdfbf7;
  --backdrop-opacity: 0.4;
  font-family: 'Inter', sans-serif;
}

:global(.premium-alert .alert-wrapper) {
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(44, 62, 45, 0.2);
  border: 1px solid rgba(85, 107, 47, 0.15);
}

:global(.premium-alert .alert-title) {
  color: #2c3e2d;
  font-weight: 800;
  font-size: 18px;
}

:global(.premium-alert .alert-sub-title) {
  color: #b71c1c;
  font-weight: 600;
  font-size: 13px;
}

:global(.premium-alert .alert-message) {
  color: #5c6e58;
  font-size: 14px;
}

:global(.premium-alert .alert-button-group) {
  padding: 8px;
}

:global(.premium-alert .alert-button) {
  font-weight: 700;
  border-radius: 8px;
}

:global(.premium-alert .alert-button-role-destructive) {
  color: #b71c1c;
}

/* Empresa Subtab Segment Selector */
.empresa-segment {
  display: flex;
  gap: 8px;
  background: #f4f1ea;
  padding: 6px;
  border-radius: 14px;
  margin-bottom: 24px;
  border: 1px solid rgba(139, 168, 136, 0.2);
}
.subtab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 700;
  color: #5c6e58;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.subtab-btn.active {
  background: #ffffff;
  color: #2c3e2d;
  box-shadow: 0 4px 10px rgba(44, 62, 45, 0.08);
}

/* Fincas Cards Grid */
.fincas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
.finca-card {
  background: #ffffff;
  border: 1px solid #e2dcd0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(44, 62, 45, 0.03);
  transition: transform 0.2s, box-shadow 0.2s;
}
.finca-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(44, 62, 45, 0.08);
}
.finca-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f4f1ea;
  padding-bottom: 12px;
}
.finca-icon {
  font-size: 24px;
}
.finca-title-info h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #2c3e2d;
}
.finca-title-info span {
  font-size: 12px;
  color: #8ba888;
  font-weight: 600;
}
.finca-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.finca-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.finca-info-row strong {
  color: #5c6e58;
}
.finca-info-row span {
  color: #2c3e2d;
  font-weight: 600;
}
.finca-badge {
  background: #eaf0e6;
  color: #3e4f24;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}
</style>
