const API_URL = 'http://localhost:3000';
let reportToDelete = null;

/** Lista en memoria para abrir la vista previa sin repetir fetch */
let allReports = [];

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    setupEventListeners();
});

// 1. CARGAR TODOS LOS REPORTES
async function loadReports() {
    const tbody = document.getElementById('report-list-body');
    
    try {
        const response = await fetch(`${API_URL}/reports`);
        const reports = await response.json();
        allReports = Array.isArray(reports) ? reports : [];

        tbody.innerHTML = ''; 

        if (reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay reportes en la base de datos.
                    </td>
                </tr>`;
            return;
        }

        reports.forEach(report => {
            const tr = document.createElement('tr');
            const st = (report.state && String(report.state).trim()) || '—';
            let badgeClass = 'bg-secondary';
            const low = st.toLowerCase();
            if (low.includes('aprobado')) badgeClass = 'bg-success';
            else if (low.includes('revisión') || low.includes('revision')) badgeClass = 'bg-warning text-dark';
            else if (low.includes('revisar')) badgeClass = 'bg-info text-dark';
            
            // Renderizado de cada fila de reporte
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
                        <button class="btn btn-outline-primary" onclick="modifyReport(${report.id})" title="Modificar Reporte">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        
                        <button class="btn btn-outline-danger" onclick="prepareDeleteReport(${report.id})" title="Eliminar">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error al conectar con la API.</td></tr>`;
    }
}

// Variable global para el ID seleccionado
let reportIdToDelete = null;

// 1. Prepara el ID (se llama desde el botón de la tabla)
function prepareDeleteReport(id) {
    reportIdToDelete = id; // Guardamos solo el ID numérico
    
    // Opcional: Mostrar el ID en el modal para estar seguros
    const idDisplay = document.getElementById('delete-report-id-display');
    if(idDisplay) idDisplay.innerText = id;

    const deleteModal = new bootstrap.Modal(document.getElementById('deleteReportModal'));
    deleteModal.show();
}

// 2. Ejecuta la eliminación real
async function confirmDeleteReport() {
    if (!reportIdToDelete) return;

    try {
        const response = await fetch(`http://localhost:3000/reports/${reportIdToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // 1. CERRAR EL MODAL
            const modalElement = document.getElementById('deleteReportModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            
            if (modalInstance) {
                modalInstance.hide();
            }
            // 2. MOSTRAR MENSAJE DE ÉXITO
            // Opción A: Alert sencillo (funcional)
            alert(`El reporte ha sido eliminado con éxito.`);
            // 3. RECARGAR LA TABLA
            reportIdToDelete = null;
            loadReports();
        } else {
            const errorText = await response.text();
            console.error("Error del servidor:", errorText);
            alert("No se pudo eliminar el registro. Intente de nuevo.");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de conexión con el servidor.");
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