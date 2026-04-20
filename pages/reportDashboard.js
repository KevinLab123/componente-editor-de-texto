const API_URL = 'http://localhost:3000';
let reportToDelete = null;

/** Lista en memoria para abrir la vista previa sin repetir fetch */
let allReports = [];
let reportFilterListenersWired = false;
let reportListFetched = false;

function buildReportAccessQuery() {
    try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return '';
        const u = JSON.parse(raw);
        if (u == null || u.id == null) return '';
        const role = u.role != null ? String(u.role) : '';
        return `?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(String(u.id))}`;
    } catch {
        return '';
    }
}

function isCurrentUserAdmin() {
    try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return false;
        const u = JSON.parse(raw);
        return Boolean(u && u.role === 'admin');
    } catch {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    setupEventListeners();
    setupReportFilterListenersOnce();
});

function getFilteredReports() {
    const q = (document.getElementById('report-search-input')?.value || '').trim().toLowerCase();
    const stateVal = document.getElementById('report-state-filter')?.value || '';

    return allReports.filter((r) => {
        const stRaw = (r.state && String(r.state).trim()) || '';
        let matchState = true;
        if (stateVal === '__EMPTY__') {
            matchState = !stRaw;
        } else if (stateVal) {
            matchState = stRaw.toLowerCase() === stateVal.toLowerCase();
        }

        const con = (r.consecutive || '').toLowerCase();
        const bid = String(r.baseTemplate ?? r.basetemplate ?? '');
        const matchQ =
            !q ||
            String(r.id).toLowerCase().includes(q) ||
            con.includes(q) ||
            bid.toLowerCase().includes(q);

        return matchState && matchQ;
    });
}

function populateReportStateOptions() {
    const sel = document.getElementById('report-state-filter');
    if (!sel) return;
    const previous = sel.value;
    const keys = new Set();
    allReports.forEach((r) => {
        const s = (r.state && String(r.state).trim()) || '';
        keys.add(s || '__EMPTY__');
    });
    sel.innerHTML = '<option value="">Todos los estados</option>';
    [...keys]
        .sort((a, b) => {
            if (a === '__EMPTY__') return 1;
            if (b === '__EMPTY__') return -1;
            return a.localeCompare(b, undefined, { sensitivity: 'base' });
        })
        .forEach((key) => {
            const opt = document.createElement('option');
            if (key === '__EMPTY__') {
                opt.value = '__EMPTY__';
                opt.textContent = '(Sin estado)';
            } else {
                opt.value = key;
                opt.textContent = key;
            }
            sel.appendChild(opt);
        });
    if ([...sel.options].some((o) => o.value === previous)) {
        sel.value = previous;
    }
}

function clearReportFilters() {
    const si = document.getElementById('report-search-input');
    const sf = document.getElementById('report-state-filter');
    if (si) si.value = '';
    if (sf) sf.value = '';
    renderReportRows();
}

function renderReportRows() {
    const tbody = document.getElementById('report-list-body');
    if (!tbody) return;
    if (!reportListFetched) return;

    if (allReports.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay reportes en la base de datos.
                    </td>
                </tr>`;
        return;
    }

    const filtered = getFilteredReports();
    const showDelete = isCurrentUserAdmin();

    if (filtered.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay resultados con los filtros actuales.
                        <button type="button" class="btn btn-link btn-sm py-0" id="report-reset-empty">Restablecer filtros</button>
                    </td>
                </tr>`;
        document.getElementById('report-reset-empty')?.addEventListener('click', clearReportFilters, { once: true });
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach((report) => {
        const tr = document.createElement('tr');
        const st = (report.state && String(report.state).trim()) || '—';
        let badgeClass = 'bg-secondary';
        const low = st.toLowerCase();
        if (low.includes('aprobado')) badgeClass = 'bg-success';
        else if (low.includes('revisión') || low.includes('revision')) badgeClass = 'bg-warning text-dark';
        else if (low.includes('revisar')) badgeClass = 'bg-info text-dark';

        const deleteBtn = showDelete
            ? `<button type="button" class="btn btn-outline-danger" onclick="prepareDeleteReport(${report.id})" title="Eliminar">
                            <i class="bi bi-trash-fill"></i>
                        </button>`
            : '';

        tr.innerHTML = `
                <td class="ps-4 fw-bold text-secondary">${report.id}</td>
                <td>
                    <span class="badge ${badgeClass} badge-status">${st}</span>
                </td>
                <td>
                    <div class="fw-semibold text-dark">${report.consecutive || 'SIN CONSECUTIVO'}</div>
                </td>
                <td>
                    <div class="text-muted">
                        <i class="bi bi-layout-text-sidebar-reverse me-1"></i> ID: ${report.baseTemplate ?? report.basetemplate}
                    </div>
                </td>
                <td class="text-center">
                    <div class="btn-group table-actions">
                        <button type="button" class="btn btn-outline-info" onclick="previewReport(${report.id})" title="Vista previa PDF">
                            <i class="bi bi-file-earmark-pdf"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="modifyReport(${report.id})" title="Modificar Reporte">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        ${deleteBtn}
                    </div>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

function setupReportFilterListenersOnce() {
    if (reportFilterListenersWired) return;
    const search = document.getElementById('report-search-input');
    const st = document.getElementById('report-state-filter');
    const clearBtn = document.getElementById('report-clear-filters');
    if (!search && !st && !clearBtn) return;
    reportFilterListenersWired = true;
    search?.addEventListener('input', () => renderReportRows());
    st?.addEventListener('change', () => renderReportRows());
    clearBtn?.addEventListener('click', () => clearReportFilters());
}

// 1. CARGAR REPORTES (todos si admin/viewer; solo propios si editor u otros roles)
async function loadReports() {
    const tbody = document.getElementById('report-list-body');
    reportListFetched = false;

    try {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (!userData) {
            window.location.href = '../index.html';
            return;
        }

        const accessQs = buildReportAccessQuery();
        if (!accessQs) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Sesión inválida. Vuelve a iniciar sesión.</td></tr>`;
            return;
        }

        const response = await fetch(`${API_URL}/reports${accessQs}`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${err.message || 'No se pudieron cargar los reportes.'}</td></tr>`;
            return;
        }

        const reports = await response.json();
        allReports = Array.isArray(reports) ? reports : [];
        reportListFetched = true;

        if (allReports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay reportes en la base de datos.
                    </td>
                </tr>`;
            return;
        }

        populateReportStateOptions();
        renderReportRows();
    } catch (error) {
        console.error('Error:', error);
        reportListFetched = false;
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error al conectar con la API.</td></tr>`;
    }
}

// Variable global para el ID seleccionado
let reportIdToDelete = null;

// 1. Prepara el ID (se llama desde el botón de la tabla)
function prepareDeleteReport(id) {
    reportIdToDelete = id;

    const idDisplay = document.getElementById('delete-report-id-display');
    if (idDisplay) idDisplay.innerText = id;

    const el = document.getElementById('deleteReportModal');
    if (el) {
        bootstrap.Modal.getOrCreateInstance(el).show();
    }
}

// 2. Ejecuta la eliminación real
async function confirmDeleteReport() {
    if (!reportIdToDelete) return;

    const confirmBtn = document.getElementById('confirm-delete-report-btn');
    if (confirmBtn) confirmBtn.disabled = true;

    try {
        const accessQs = buildReportAccessQuery();
        if (!accessQs) {
            alert('Sesión inválida. Vuelve a iniciar sesión.');
            return;
        }

        const response = await fetch(`${API_URL}/reports/${reportIdToDelete}${accessQs}`, {
            method: 'DELETE'
        });

        // 200: borrado OK. 404: ya no existe (p. ej. segundo clic o carrera) — mismo resultado para el usuario.
        const deletedOrGone = response.ok || response.status === 404;

        if (deletedOrGone) {
            await response.json().catch(() => ({}));

            reportIdToDelete = null;

            try {
                const modalEl = document.getElementById('deleteReportModal');
                const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
                if (modalInstance) modalInstance.hide();
            } catch (e) {
                console.warn(e);
            }

            await loadReports();
        } else if (response.status === 403) {
            alert('No tienes permiso para eliminar este reporte.');
        } else {
            const errorText = await response.text();
            console.error('Error del servidor al eliminar reporte:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error de red:', error);
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

function setupEventListeners() {
    const confirmBtn = document.getElementById('confirm-delete-report-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmDeleteReport);
    }
}

/**
 * Abre el PDF almacenado en report.preview (data URI base64), igual que en templateSelector.
 */
function previewReport(id) {
    const report = allReports.find((r) => r.id === id);
    if (!report || !report.preview) {
        alert(
            "Este reporte no tiene vista previa PDF. Ábrelo en el editor, guarda de nuevo y se generará el preview."
        );
        return;
    }

    const modalElement = document.getElementById("previewReportModal");
    const pdfViewer = document.getElementById("report-pdf-viewer");
    const modalTitle = document.getElementById("previewReportModalLabel");

    const viewOptions = "#toolbar=0&navpanes=0&view=FitH";
    pdfViewer.src = report.preview + viewOptions;
    modalTitle.textContent = `Vista previa — Reporte #${report.id}`;

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();

    modalElement.addEventListener(
        "hidden.bs.modal",
        () => {
            pdfViewer.src = "";
        },
        { once: true }
    );
}

function modifyReport(id) {
    if (!id) {
        console.error("No se proporcionó un ID válido para modificar.");
        return;
    }
    // Redirigimos a la página del manejador pasando el ID como parámetro de búsqueda
    // Usamos 'reportId' para que sea capturado por el script del manejador
    window.location.href = `templateHandler.html?reportId=${id}`;
}