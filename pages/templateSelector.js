// Variable global para acceder a los datos sin repetir peticiones fetch
let allTemplates = [];

document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cards-container');

    const loadTemplates = async () => {
        try {
            const response = await fetch('http://localhost:3000/documents');
            if (!response.ok) throw new Error('Error al obtener plantillas');
            
            // Guardamos en la variable global
            allTemplates = await response.json();
            renderCards(allTemplates);
        } catch (error) {
            console.error('Error:', error);
            cardsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger">
                        No se pudieron cargar las plantillas. ¿Está encendido el servidor?
                    </div>
                </div>`;
        }
    };

    const renderCards = (templates) => {
        cardsContainer.innerHTML = ''; 

        templates.forEach((doc) => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col';

            cardCol.innerHTML = `
                <div class="card template-card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-center text-dark mb-3 fw-bold">
                            ${doc.name}
                        </h5>
                        
                        <div class="p-3 mb-3 template-details-box bg-light border rounded shadow-sm" style="font-size: 0.9rem;">
                            <h6 class="fw-bold border-bottom pb-1 mb-2">Detalles</h6>
                            <ul class="list-unstyled mb-0 text-secondary">
                                <li class="mb-1"><strong>Nombre:</strong> ${doc.name}</li>
                                <li class="mb-1"><strong>Departamento:</strong> ${doc.department}</li>
                                <li class="mb-1"><strong>Fuente:</strong> ${doc.font}</li>
                                <li><strong>Formato:</strong> ${doc.pageFormat || doc.pageformat || 'N/A'}</li>
                            </ul>
                        </div>

                        <div class="mt-auto d-grid gap-2">
                            <button onclick="previewTemplate(${doc.id})" class="btn btn-primary shadow-sm">
                                <i class="bi bi-eye me-2"></i>Pre visualizar
                            </button>
                            <button onclick="selectTemplate(${doc.id})" class="btn btn-success shadow-sm">
                                <i class="bi bi-check2-circle me-2"></i>Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(cardCol);
        });
    };

    loadTemplates();
});

/** * FUNCIONES GLOBALES */

function selectTemplate(id) {
    window.location.href = `templateHandler.html?id=${id}`;
}

function previewTemplate(id) {
    // 1. Buscar la plantilla en los datos cargados
    const template = allTemplates.find(t => t.id === id);

    if (!template || !template.preview) {
        alert("Esta plantilla no cuenta con una vista previa generada.");
        return;
    }

    // 2. Referenciar elementos del modal
    const modalElement = document.getElementById('previewModal');
    const pdfViewer = document.getElementById('pdf-viewer');
    const modalTitle = document.getElementById('previewModalLabel');

    // 3. Adaptación: Inyectar parámetros de visualización
    // #toolbar=0: Oculta la barra de herramientas (guardar/imprimir)
    // &navpanes=0: Oculta el panel de navegación lateral
    // &view=FitH: Ajusta el zoom al ancho del visor automáticamente
    const viewOptions = "#toolbar=0&navpanes=0&view=FitH";
    
    // Asignamos el Base64 concatenando las opciones
    pdfViewer.src = template.preview + viewOptions;
    
    modalTitle.textContent = `Vista Previa: ${template.name}`;

    // 4. Mostrar el modal
    // Usamos 'getOrCreateInstance' para evitar duplicados si se abre varias veces
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();

    // 5. Limpieza al cerrar (Opcional pero recomendado)
    // Esto evita que el PDF se quede cargado en memoria o reproduciendo sonidos si los hubiera
    modalElement.addEventListener('hidden.bs.modal', () => {
        pdfViewer.src = "";
    }, { once: true });
}