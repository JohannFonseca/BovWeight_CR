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
                        <span class="mobile-title mobile-only">Reportes Médicos</span>
                    </div>
                </ion-title>

                <ion-buttons slot="end">
                    <div class="user-profile">
                        <div class="avatar vet">
                            {{ usuarioSesion?.nombre_completo ? usuarioSesion.nombre_completo.charAt(0).toUpperCase() : 'V' }}
                        </div>
                        <div class="user-info desktop-only">
                            <span class="name">{{ usuarioSesion?.nombre_completo || 'Ana Veterinaria' }}</span>
                            <span class="role">{{ usuarioSesion?.usuario || 'veterinario@test.com' }}</span>
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

                        <a @click.prevent="router.push('/veterinario/agenda')" class="nav-item">
                            <ion-icon :icon="calendarOutline"></ion-icon>
                            <span>Agenda de Visitas</span>
                        </a>

                        <a @click.prevent="router.push('/veterinario/reportes')" class="nav-item active">
                            <ion-icon :icon="documentTextOutline"></ion-icon>
                            <span>Reportes Médicos</span>
                        </a>
                    </nav>
                </aside>

                <main class="main-content">
                    <div class="content-header">
                        <div>
                            <h1 class="page-title">Historial de Reportes Médicos</h1>
                            <p class="page-subtitle">
                                Visualiza, filtra, actualiza y descarga los reportes clínicos emitidos.
                            </p>
                        </div>
                    </div>

                    <div class="filters-card">
                        <div class="search-box">
                            <input type="text"
                                   v-model="search"
                                   placeholder="Buscar por animal, arete, ganadero o diagnóstico..."
                                   class="form-input search-input" />
                        </div>

                        <div class="filter-options">
                            <div class="filter-group">
                                <label class="filter-label">Prioridad</label>
                                <select v-model="filterPriority" class="form-select">
                                    <option value="all">Todas</option>
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Estado</label>
                                <select v-model="filterStatus" class="form-select">
                                    <option value="all">Todos</option>
                                    <option value="abierto">Abiertos</option>
                                    <option value="en_seguimiento">En seguimiento</option>
                                    <option value="resuelto">Resueltos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div v-if="isLoading" class="loading-state">
                        <ion-spinner name="crescent"></ion-spinner>
                        <p>Cargando reportes médicos...</p>
                    </div>

                    <div v-else-if="filteredReports.length === 0" class="empty-state">
                        <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
                        <h3>No se encontraron reportes</h3>
                        <p>Intenta ajustar la búsqueda o los filtros.</p>
                    </div>

                    <div v-else class="report-grid">
                        <div v-for="rep in filteredReports"
                             :key="rep.id"
                             class="report-card"
                             :class="rep.prioridad"
                             @click="openReporteDetail(rep)">
                            <div class="report-card-header">
                                <span class="prio-tag" :class="rep.prioridad">
                                    {{ formatPrioridadText(rep.prioridad) }}
                                </span>
                                <span class="date">{{ formatDateShort(rep.created_at) }}</span>
                            </div>

                            <div class="report-card-body">
                                <h4 class="animal-name">
                                    🐄 {{ rep.animal?.nombre || 'Animal' }}
                                    <small>#{{ rep.animal?.numero_arete || 'Sin arete' }}</small>
                                </h4>

                                <p class="diagnostico">
                                    {{ rep.diagnostico_preliminar || 'Sin diagnóstico registrado' }}
                                </p>

                                <p class="ganadero">
                                    <strong>Ganadero:</strong>
                                    {{ rep.ganadero?.nombre_completo || 'No especificado' }}
                                </p>

                                <p class="observaciones">
                                    {{ rep.observaciones || 'Sin observaciones registradas.' }}
                                </p>
                            </div>

                            <div class="report-card-footer">
                                <span class="status-tag" :class="rep.estado">
                                    {{ formatEstadoText(rep.estado) }}
                                </span>

                                <div class="footer-actions">
                                    <button class="pdf-card-btn"
                                            type="button"
                                            @click.stop="downloadReporteClinicoPdf(rep)">
                                        PDF
                                    </button>
                                    <span class="read-more">Ver detalles &rarr;</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <div v-if="showDetailModal" class="modal-overlay">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3>🩺 Detalle de Reporte Clínico</h3>

                        <div class="modal-header-actions">
                            <button v-if="selectedReporte"
                                    type="button"
                                    class="download-pdf-btn"
                                    @click="downloadReporteClinicoPdf(selectedReporte)">
                                Descargar PDF
                            </button>

                            <button class="close-btn" @click="closeReporteDetail">×</button>
                        </div>
                    </div>

                    <div class="modal-body" v-if="selectedReporte">
                        <div class="info-grid-2">
                            <div class="info-item">
                                <span class="label">Animal</span>
                                <span class="value">
                                    🐄 {{ selectedReporte.animal?.nombre || 'Animal' }}
                                    (#{{ selectedReporte.animal?.numero_arete || 'Sin arete' }})
                                </span>
                            </div>

                            <div class="info-item">
                                <span class="label">Finca</span>
                                <span class="value">🏡 {{ selectedReporte.finca?.nombre || 'Sin finca' }}</span>
                            </div>

                            <div class="info-item">
                                <span class="label">Ganadero</span>
                                <span class="value">
                                    👤 {{ selectedReporte.ganadero?.nombre_completo || 'No especificado' }}
                                </span>
                            </div>

                            <div class="info-item">
                                <span class="label">Fecha</span>
                                <span class="value">📅 {{ formatDate(selectedReporte.created_at) }}</span>
                            </div>
                        </div>

                        <div class="form-group mt-4">
                            <label class="form-label">Diagnóstico preliminar</label>
                            <p class="value-highlight">
                                {{ selectedReporte.diagnostico_preliminar || 'Sin diagnóstico registrado' }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Observaciones</label>
                            <p class="value-text">
                                {{ selectedReporte.observaciones || 'Sin observaciones registradas.' }}
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Recomendaciones</label>
                            <p class="value-text">
                                {{ selectedReporte.recomendaciones || 'Sin recomendaciones registradas.' }}
                            </p>
                        </div>

                        <div class="form-group" v-if="selectedReporte.medicamentos_sugeridos">
                            <label class="form-label">Medicamentos sugeridos</label>
                            <p class="value-box">
                                {{ selectedReporte.medicamentos_sugeridos }}
                            </p>
                        </div>

                        <div class="form-group" v-if="selectedReporte.proxima_revision">
                            <label class="form-label">Próxima revisión sugerida</label>
                            <p class="value-text">
                                📅 {{ formatDate(selectedReporte.proxima_revision) }}
                            </p>
                        </div>

                        <div class="form-group"
                             v-if="selectedReporte.veterinario_id === currentUserId"
                             style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd4c3;">
                            <label class="form-label">Actualizar estado de seguimiento</label>

                            <div class="status-edit-row">
                                <select v-model="editForm.estado" class="form-select">
                                    <option value="abierto">Abierto</option>
                                    <option value="en_seguimiento">En seguimiento</option>
                                    <option value="resuelto">Resuelto</option>
                                </select>

                                <button type="button"
                                        class="submit-btn"
                                        @click="updateReportStatus"
                                        :disabled="isUpdating">
                                    {{ isUpdating ? 'Actualizando...' : 'Actualizar' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ion-content>

        <ion-toast :is-open="toast.show"
                   :message="toast.message"
                   :color="toast.color"
                   :duration="3000"
                   @didDismiss="toast.show = false"></ion-toast>
    </ion-page>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButton,
        IonIcon,
        IonButtons,
        IonSpinner,
        IonToast
    } from '@ionic/vue';
    import {
        medkitOutline,
        pawOutline,
        calendarOutline,
        documentTextOutline,
        arrowBackOutline,
        logOutOutline
    } from 'ionicons/icons';
    import jsPDF from 'jspdf';
    import autoTable from 'jspdf-autotable';
    import { animalRepository } from '@/services';

    const router = useRouter();

    const usuarioSesion = ref<any>(null);
    const reports = ref<any[]>([]);
    const isLoading = ref(true);
    const isUpdating = ref(false);

    const search = ref('');
    const filterPriority = ref('all');
    const filterStatus = ref('all');

    const showDetailModal = ref(false);
    const selectedReporte = ref<any>(null);
    const currentUserId = ref<number | null>(null);

    const editForm = ref({
        estado: 'abierto'
    });

    const toast = ref({
        show: false,
        message: '',
        color: 'success' as 'success' | 'danger'
    });

    const loadSession = () => {
        const sessionStr = localStorage.getItem('usuario_sesion');

        if (!sessionStr) {
            return;
        }

        try {
            const parsedSession = JSON.parse(sessionStr);
            usuarioSesion.value = parsedSession;
            currentUserId.value = Number(parsedSession.id);
        } catch (error) {
            console.error('Error parseando usuario_sesion:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('usuario_sesion');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        router.push('/login');
    };

    const goBack = () => {
        router.push('/veterinario');
    };

    const showToast = (message: string, color: 'success' | 'danger' = 'success') => {
        toast.value.message = message;
        toast.value.color = color;
        toast.value.show = true;
    };

    const fetchReports = async () => {
        isLoading.value = true;

        try {
            reports.value = await animalRepository.getReportesVeterinarios();
        } catch (err: any) {
            console.error('Error al cargar reportes:', err);
            showToast('Error al cargar reportes médicos.', 'danger');
        } finally {
            isLoading.value = false;
        }
    };

    const filteredReports = computed(() => {
        return reports.value.filter((reporte) => {
            const term = search.value.toLowerCase().trim();

            const matchesSearch =
                !term ||
                (reporte.animal?.nombre || '').toLowerCase().includes(term) ||
                (reporte.animal?.numero_arete || '').toLowerCase().includes(term) ||
                (reporte.ganadero?.nombre_completo || '').toLowerCase().includes(term) ||
                (reporte.diagnostico_preliminar || '').toLowerCase().includes(term);

            const matchesPriority =
                filterPriority.value === 'all' || reporte.prioridad === filterPriority.value;

            const matchesStatus =
                filterStatus.value === 'all' || reporte.estado === filterStatus.value;

            return matchesSearch && matchesPriority && matchesStatus;
        });
    });

    const openReporteDetail = (reporte: any) => {
        selectedReporte.value = reporte;
        editForm.value.estado = reporte.estado || 'abierto';
        showDetailModal.value = true;
    };

    const closeReporteDetail = () => {
        showDetailModal.value = false;
        selectedReporte.value = null;
    };

    const updateReportStatus = async () => {
        if (!selectedReporte.value) {
            return;
        }

        isUpdating.value = true;

        try {
            await animalRepository.actualizarReporteVeterinario(selectedReporte.value.id, {
                estado: editForm.value.estado
            });

            showToast('Estado del reporte actualizado correctamente.');
            closeReporteDetail();
            await fetchReports();
        } catch (err: any) {
            console.error('Error al actualizar reporte:', err);
            showToast(err.message || 'Error al actualizar el estado del reporte.', 'danger');
        } finally {
            isUpdating.value = false;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return 'Sin fecha';
        }

        const date = new Date(dateString);

        return date.toLocaleDateString('es-CR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ' ' + date.toLocaleTimeString('es-CR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString: string) => {
        if (!dateString) {
            return 'Sin fecha';
        }

        return new Date(dateString).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatEstadoText = (estado: string): string => {
        const map: Record<string, string> = {
            abierto: 'Abierto',
            en_seguimiento: 'En seguimiento',
            resuelto: 'Resuelto'
        };

        return map[estado] || estado || 'Sin estado';
    };

    const formatPrioridadText = (prioridad: string): string => {
        const map: Record<string, string> = {
            baja: 'BAJA',
            media: 'MEDIA',
            alta: 'ALTA',
            urgente: 'URGENTE'
        };

        return map[prioridad] || 'SIN PRIORIDAD';
    };

    const safeText = (value: any, fallback = 'No especificado'): string => {
        if (value === null || value === undefined || String(value).trim() === '') {
            return fallback;
        }

        return String(value);
    };

    const sanitizeFileName = (value: string): string => {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
    };

    const addMultilineText = (
        doc: jsPDF,
        label: string,
        text: string,
        startY: number,
        pageWidth: number
    ): number => {
        const marginX = 14;
        const maxWidth = pageWidth - 28;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 45);
        doc.text(label, marginX, startY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);

        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, marginX, startY + 7);

        return startY + 12 + lines.length * 5;
    };

    const generateReporteClinicoPdf = (reporte: any): jsPDF => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        const animalNombre = safeText(reporte.animal?.nombre, 'Animal');
        const numeroArete = safeText(reporte.animal?.numero_arete, 'Sin arete');
        const fincaNombre = safeText(reporte.finca?.nombre, 'Sin finca');
        const ganaderoNombre = safeText(reporte.ganadero?.nombre_completo, 'No especificado');
        const veterinarioNombre = safeText(usuarioSesion.value?.nombre_completo, 'Veterinario');
        const fechaReporte = formatDate(reporte.created_at);
        const estado = formatEstadoText(reporte.estado);
        const prioridad = formatPrioridadText(reporte.prioridad);

        doc.setFillColor(139, 168, 136);
        doc.rect(0, 0, pageWidth, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('BovWeight CR', 14, 13);

        doc.setFontSize(12);
        doc.text('Reporte Clinico Veterinario', 14, 22);

        doc.setTextColor(44, 62, 45);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('Ficha de diagnostico y recomendaciones clinicas', 14, 42);

        autoTable(doc, {
            startY: 50,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [44, 62, 45]
            },
            headStyles: {
                fillColor: [139, 168, 136],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            head: [['Campo', 'Detalle']],
            body: [
                ['Animal', `${animalNombre} (#${numeroArete})`],
                ['Finca', fincaNombre],
                ['Ganadero', ganaderoNombre],
                ['Veterinario', veterinarioNombre],
                ['Fecha del reporte', fechaReporte],
                ['Prioridad', prioridad],
                ['Estado', estado],
                ['Proxima revision', reporte.proxima_revision ? formatDate(reporte.proxima_revision) : 'No programada']
            ]
        });

        let y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 120;

        y = addMultilineText(
            doc,
            'Diagnostico preliminar',
            safeText(reporte.diagnostico_preliminar, 'Sin diagnostico registrado.'),
            y,
            pageWidth
        );

        y = addMultilineText(
            doc,
            'Observaciones clinicas',
            safeText(reporte.observaciones, 'Sin observaciones registradas.'),
            y + 3,
            pageWidth
        );

        y = addMultilineText(
            doc,
            'Recomendaciones',
            safeText(reporte.recomendaciones, 'Sin recomendaciones registradas.'),
            y + 3,
            pageWidth
        );

        y = addMultilineText(
            doc,
            'Medicamentos sugeridos',
            safeText(reporte.medicamentos_sugeridos, 'No se registraron medicamentos sugeridos.'),
            y + 3,
            pageWidth
        );

        if (y > 255) {
            doc.addPage();
            y = 20;
        }

        doc.setDrawColor(139, 168, 136);
        doc.line(14, y + 8, 85, y + 8);
        doc.line(125, y + 8, 196, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text('Firma del veterinario', 14, y + 15);
        doc.text('Firma del responsable de finca', 125, y + 15);

        const pageCount = doc.getNumberOfPages();

        for (let page = 1; page <= pageCount; page++) {
            doc.setPage(page);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text('BovWeight CR - Reporte clinico generado desde el modulo veterinario.', 14, 287);
            doc.text(`Pagina ${page} de ${pageCount}`, pageWidth - 14, 287, { align: 'right' });
        }

        return doc;
    };

    const downloadReporteClinicoPdf = (reporte: any) => {
        try {
            const doc = generateReporteClinicoPdf(reporte);

            const animal = sanitizeFileName(
                reporte.animal?.numero_arete || reporte.animal?.nombre || 'animal'
            );

            const reporteId = sanitizeFileName(String(reporte.id || 'reporte'));

            doc.save(`reporte_clinico_${animal}_${reporteId}.pdf`);
            showToast('Reporte clínico PDF descargado correctamente.');
        } catch (error) {
            console.error('Error al generar PDF clínico:', error);
            showToast('No se pudo generar el PDF clínico.', 'danger');
        }
    };

    onMounted(() => {
        loadSession();
        fetchReports();
    });
</script>

<style scoped>
    .dashboard-content {
        --background: #f4f1ea;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .header-toolbar {
        --background: rgba(255, 255, 255, 0.85);
        --min-height: 70px;
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
    }

    .app-logo {
        font-weight: 800;
        color: #2c3e2d;
        letter-spacing: -0.5px;
        font-size: 20px;
    }

    .badge-vet {
        background: linear-gradient(135deg, #c0c5b1, #8ba888);
        color: #2c3e2d;
        font-size: 10px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 8px;
    }

    .mobile-title {
        font-weight: 800;
        color: #2c3e2d;
        font-size: 17px;
    }

    .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .avatar.vet {
        background: #8ba888;
        color: white;
        border-radius: 12px;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
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
            font-size: 10px;
            color: #7c8e76;
        }

    .logout-btn {
        --color: #5c6e58;
    }

    .dashboard-layout {
        display: flex;
        min-height: calc(100vh - 70px);
    }

    .sidebar {
        width: 260px;
        background: #ffffff;
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
        cursor: pointer;
    }

        .nav-item:hover {
            background: #f4f1ea;
            color: #2c3e2d;
        }

        .nav-item.active {
            background: #fdfbf7;
            color: #8ba888;
        }

        .nav-item ion-icon {
            font-size: 22px;
        }

    .main-content {
        flex: 1;
        padding: 32px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .page-title {
        font-size: 26px;
        font-weight: 800;
        color: #2c3e2d;
        margin: 0 0 6px;
    }

    .page-subtitle {
        font-size: 14px;
        color: #5c6e58;
        margin: 0;
    }

    .filters-card {
        background: white;
        border-radius: 20px;
        padding: 20px;
        display: flex;
        gap: 16px;
        align-items: flex-end;
        box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        border: 1px solid rgba(0,0,0,0.02);
    }

    .search-box {
        flex: 1;
    }

    .filter-options {
        display: flex;
        gap: 16px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 150px;
    }

    .filter-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #5c6e58;
    }

    .form-input,
    .form-select {
        border: 1px solid #cbd4c3;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        color: #2c3e2d;
        background: white;
        transition: border-color 0.2s;
        width: 100%;
    }

        .form-input:focus,
        .form-select:focus {
            border-color: #8ba888;
        }

    .report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
        gap: 20px;
    }

    .report-card {
        background: white;
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        border: 1px solid rgba(0,0,0,0.03);
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

        .report-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }

        .report-card.baja {
            border-left: 4px solid #455a64;
        }

        .report-card.media {
            border-left: 4px solid #00897b;
        }

        .report-card.alta {
            border-left: 4px solid #d97706;
        }

        .report-card.urgente {
            border-left: 4px solid #c62828;
        }

    .report-card-header,
    .report-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .prio-tag {
        font-size: 9px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 6px;
    }

        .prio-tag.baja {
            background: #eceff1;
            color: #455a64;
        }

        .prio-tag.media {
            background: #e0f2f1;
            color: #00897b;
        }

        .prio-tag.alta {
            background: #fff7ed;
            color: #d97706;
        }

        .prio-tag.urgente {
            background: #ffebee;
            color: #c62828;
        }

    .date {
        font-size: 11px;
        color: #7c8e78;
    }

    .report-card-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
    }

    .animal-name {
        font-size: 15px;
        font-weight: 800;
        color: #2c3e2d;
        margin: 0;
    }

        .animal-name small {
            color: #7c8e78;
            font-weight: 500;
        }

    .diagnostico {
        font-size: 14px;
        font-weight: 700;
        color: #1b5e20;
        margin: 2px 0 0;
    }

    .ganadero,
    .observaciones {
        font-size: 12.5px;
        color: #5c6e58;
        margin: 0;
    }

    .observaciones {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .report-card-footer {
        border-top: 1px solid #f4f1ea;
        padding-top: 10px;
    }

    .status-tag {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
    }

        .status-tag.abierto {
            background: #e3f2fd;
            color: #1565c0;
        }

        .status-tag.en_seguimiento {
            background: #fffde7;
            color: #f57f17;
        }

        .status-tag.resuelto {
            background: #e8f5e9;
            color: #2e7d32;
        }

    .footer-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .pdf-card-btn {
        border: 1px solid #8ba888;
        background: #f4f6f0;
        color: #1b5e20;
        border-radius: 8px;
        padding: 5px 10px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
    }

        .pdf-card-btn:hover {
            background: #e8f5e9;
        }

    .read-more {
        font-size: 11px;
        font-weight: 700;
        color: #2e7d32;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
    }

    .modal-card {
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 680px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        border: 1px solid rgba(46, 125, 50, 0.1);
    }

    .modal-header {
        padding: 16px 20px;
        background: #f4f6f0;
        border-bottom: 1px solid #cbd4c3;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

        .modal-header h3 {
            margin: 0;
            font-size: 18px;
            color: #1b5e20;
            font-weight: 800;
        }

    .modal-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .download-pdf-btn {
        border: none;
        background: #00897b;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 800;
    }

        .download-pdf-btn:hover {
            background: #00796b;
        }

    .close-btn {
        background: transparent;
        border: none;
        font-size: 26px;
        color: #5c6e58;
        cursor: pointer;
    }

    .modal-body {
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .info-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        background: #f4f6f0;
        padding: 16px;
        border-radius: 12px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
    }

    .label {
        font-size: 10px;
        color: #5c6e58;
        font-weight: 700;
        text-transform: uppercase;
    }

    .value {
        font-size: 13.5px;
        color: #2c3e2d;
        font-weight: 700;
        margin-top: 2px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-label {
        font-size: 12px;
        font-weight: 700;
        color: #5c6e58;
    }

    .value-highlight {
        font-size: 15px;
        color: #1b5e20;
        font-weight: 800;
        margin: 0;
    }

    .value-text {
        font-size: 13.5px;
        color: #2c3e2d;
        margin: 0;
        font-weight: 500;
        line-height: 1.5;
    }

    .value-box {
        background: #f4f6f0;
        padding: 10px;
        border-radius: 8px;
        border-left: 3px solid #00897b;
        font-weight: 500;
        font-size: 13.5px;
        color: #2c3e2d;
        margin: 0;
    }

    .status-edit-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-top: 6px;
    }

    .submit-btn {
        background: #00897b;
        border: none;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
    }

        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

    .loading-state,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 60px 0;
        color: #5c6e58;
        background: white;
        border-radius: 20px;
        border: 1px solid rgba(0,0,0,0.02);
    }

    .empty-icon {
        font-size: 48px;
        color: #8ba888;
    }

    .empty-state h3 {
        font-size: 16px;
        font-weight: 800;
        color: #2c3e2d;
        margin: 0;
    }

    .empty-state p {
        font-size: 13px;
        color: #7c8e78;
        margin: 0;
    }

    @media (min-width: 769px) {
        .mobile-only {
            display: none !important;
        }
    }

    @media (max-width: 768px) {
        .desktop-only {
            display: none !important;
        }

        .dashboard-layout {
            display: block;
        }

        .main-content {
            padding: 16px;
        }

        .filters-card {
            flex-direction: column;
            align-items: stretch;
        }

        .filter-options {
            flex-direction: column;
        }

        .filter-group {
            width: 100%;
        }

        .info-grid-2 {
            grid-template-columns: 1fr;
        }

        .status-edit-row {
            flex-direction: column;
            align-items: stretch;
        }

        .modal-card {
            width: 94%;
        }
    }
</style>