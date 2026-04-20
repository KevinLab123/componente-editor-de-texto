const API_URL = 'http://localhost:3000';
let templateToDelete = null;

/** Plantillas cargadas desde el servidor (filtrado en cliente). */
let allTemplates = [];
let templateFilterListenersWired = false;
/** Evita filtrar antes de que termine la primera carga (no pisar el spinner). */
let templateListFetched = false;

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
    loadTemplates();
    setupEventListeners();
    setupTemplateFilterListenersOnce();
});

function getFilteredTemplates() {
    const q = (document.getElementById('template-search-input')?.value || '').trim().toLowerCase();
    const formatVal = (document.getElementById('template-format-filter')?.value || '').trim();

    return allTemplates.filter((t) => {
        const name = (t.name || '').toLowerCase();
        const dept = (t.department || '').toLowerCase();
        const matchQ =
            !q ||
            name.includes(q) ||
            dept.includes(q) ||
            String(t.id).includes(q);
        const pf = (t.pageformat || 'A4').toString();
        const matchF = !formatVal || pf.toUpperCase() === formatVal.toUpperCase();
        return matchQ && matchF;
    });
}

function populateTemplateFormatOptions() {
    const sel = document.getElementById('template-format-filter');
    if (!sel) return;
    const previous = sel.value;
    const set = new Set();
    allTemplates.forEach((t) => set.add((t.pageformat || 'A4').toString()));
    sel.innerHTML = '<option value="">Todos los formatos</option>';
    [...set]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .forEach((pf) => {
            const opt = document.createElement('option');
            opt.value = pf;
            opt.textContent = pf;
            sel.appendChild(opt);
        });
    if ([...sel.options].some((o) => o.value === previous)) {
        sel.value = previous;
    }
}

function clearTemplateFilters() {
    const si = document.getElementById('template-search-input');
    const sf = document.getElementById('template-format-filter');
    if (si) si.value = '';
    if (sf) sf.value = '';
    renderTemplateRows();
}

function renderTemplateRows() {
    const tbody = document.getElementById('template-list-body');
    if (!tbody) return;
    if (!templateListFetched) return;

    if (allTemplates.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay plantillas creadas actualmente.
                    </td>
                </tr>`;
        return;
    }

    const filtered = getFilteredTemplates();
    const showDelete = isCurrentUserAdmin();

    if (filtered.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay resultados con los filtros actuales.
                        <button type="button" class="btn btn-link btn-sm py-0" id="template-reset-empty">Restablecer filtros</button>
                    </td>
                </tr>`;
        document.getElementById('template-reset-empty')?.addEventListener('click', clearTemplateFilters, { once: true });
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach((template) => {
        const tr = document.createElement('tr');
        const deleteBtn = showDelete
            ? `<button type="button" class="btn btn-outline-danger" onclick='prepareDelete(${template.id}, ${JSON.stringify(template.name || 'Sin nombre')})' title="Eliminar">
                            <i class="bi bi-trash-fill"></i>
                        </button>`
            : '';
        tr.innerHTML = `
                <td class="ps-4 fw-bold">${template.id}</td>
                <td>
                    <div class="fw-semibold">${template.name || 'Sin nombre'}</div>
                    <small class="text-muted">${template.department || 'General'}</small>
                </td>
                <td><span class="badge bg-secondary">${template.pageformat || 'A4'}</span></td>
                <td><i class="bi bi-fonts me-1"></i>${template.font || 'Arial'}</td>
                <td class="text-center">
                    <div class="btn-group table-actions">
                        <button type="button" class="btn btn-outline-primary" onclick="editTemplate(${template.id})" title="Editar Estructura">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button type="button" class="btn btn-outline-success" onclick="useTemplate(${template.id})" title="Crear para Reporte">
                            <i class="bi bi-file-earmark-plus"></i>
                        </button>
                        ${deleteBtn}
                    </div>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

function setupTemplateFilterListenersOnce() {
    if (templateFilterListenersWired) return;
    const search = document.getElementById('template-search-input');
    const fmt = document.getElementById('template-format-filter');
    const clearBtn = document.getElementById('template-clear-filters');
    if (!search && !fmt && !clearBtn) return;
    templateFilterListenersWired = true;
    search?.addEventListener('input', () => renderTemplateRows());
    fmt?.addEventListener('change', () => renderTemplateRows());
    clearBtn?.addEventListener('click', () => clearTemplateFilters());
}

// 1. CARGAR TODAS LAS PLANTILLAS
async function loadTemplates() {
    const tbody = document.getElementById('template-list-body');
    templateListFetched = false;

    try {
        const response = await fetch(`${API_URL}/documents`);
        const templates = await response.json();
        allTemplates = Array.isArray(templates) ? templates : [];
        templateListFetched = true;

        if (allTemplates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay plantillas creadas actualmente.
                    </td>
                </tr>`;
            return;
        }

        populateTemplateFormatOptions();
        renderTemplateRows();
    } catch (error) {
        console.error('Error al cargar plantillas:', error);
        templateListFetched = false;
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error de conexión con el servidor.</td></tr>`;
    }
}

// 2. REDIRECCIONES
function editTemplate(id) {
    // Redirige al Creador de Plantillas pasando el ID
    window.location.href = `templateCreator.html?edit=${id}`;
}


function useTemplate(id) {
    // Redirige al Manejador para crear un reporte basado en esta plantilla
    window.location.href = `templateHandler.html?id=${id}`;
}

// 3. LÓGICA DE ELIMINACIÓN
function getDeleteTemplateModal() {
    const el = document.getElementById('deleteModal');
    if (!el) return null;
    return bootstrap.Modal.getOrCreateInstance(el);
}

function prepareDelete(id, name) {
    templateToDelete = id;
    const nameEl = document.getElementById('delete-template-name');
    if (nameEl) nameEl.innerText = name;
    const modal = getDeleteTemplateModal();
    if (modal) modal.show();
}

async function confirmDelete() {
    if (!templateToDelete) return;

    const accessQs = buildReportAccessQuery();
    if (!accessQs) {
        alert('Sesión inválida. Vuelve a iniciar sesión.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/documents/${templateToDelete}${accessQs}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await response.json().catch(() => ({}));
            try {
                getDeleteTemplateModal()?.hide();
            } catch (e) {
                console.warn(e);
            }
            templateToDelete = null;
            await loadTemplates();
        } else if (response.status === 403) {
            const err = await response.json().catch(() => ({}));
            alert(err.message || 'No tienes permiso para eliminar plantillas.');
        } else {
            alert("Error al eliminar la plantilla.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión.");
    }
}

function setupEventListeners() {
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
}