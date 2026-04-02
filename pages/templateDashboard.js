const API_URL = 'http://localhost:3000';
let templateToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    setupEventListeners();
});

// 1. CARGAR TODAS LAS PLANTILLAS
async function loadTemplates() {
    const tbody = document.getElementById('template-list-body');
    
    try {
        const response = await fetch(`${API_URL}/documents`);
        const templates = await response.json();

        if (templates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No hay plantillas creadas actualmente.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = ''; // Limpiar spinner
        templates.forEach(template => {
            const tr = document.createElement('tr');
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
                        <button class="btn btn-outline-primary" onclick="editTemplate(${template.id})" title="Editar Estructura">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="useTemplate(${template.id})" title="Crear para Reporte">
                            <i class="bi bi-file-earmark-plus"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="prepareDelete(${template.id}, '${template.name}')" title="Eliminar">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar plantillas:", error);
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
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

function prepareDelete(id, name) {
    templateToDelete = id;
    document.getElementById('delete-template-name').innerText = name;
    deleteModal.show();
}

async function confirmDelete() {
    if (!templateToDelete) return;

    try {
        const response = await fetch(`${API_URL}/documents/${templateToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            deleteModal.hide();
            loadTemplates(); // Recargar la tabla
            // Opcional: Mostrar un Toast de éxito
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