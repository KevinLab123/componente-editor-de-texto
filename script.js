function formatDoc(cmd, value=null) {
    const editor = document.getElementById("content"); 
    editor.focus();
    if(value){
        document.execCommand(cmd, false, value);
    }else{
        document.execCommand(cmd);
    }
}

function bold() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.parentElement;

    if (parent.closest('strong')) {
        const strong = parent.closest('strong');
        strong.replaceWith(...strong.childNodes);
    } else {
        const fragment = range.extractContents();
        
        // 1. Eliminar etiquetas <strong> internas para evitar duplicados
        const nestedStrong = fragment.querySelectorAll('strong');
        nestedStrong.forEach(el => el.replaceWith(...el.childNodes));

        // 2. Limpiar estilos inline que apliquen negrita
        const styledElements = fragment.querySelectorAll('[style*="font-weight"]');
        styledElements.forEach(el => {
            el.style.fontWeight = '';
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        });

        const strong = document.createElement('strong');
        strong.appendChild(fragment);
        range.insertNode(strong);
    }
    sel.removeAllRanges();
}

function underline() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 3 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer;

    const underlineElement = parent.closest('u');

    if (underlineElement) {
        underlineElement.replaceWith(...underlineElement.childNodes);
    } else {
        const fragment = range.extractContents();

        // 1. Eliminar etiquetas <u> internas para evitar duplicados
        const nestedUnderline = fragment.querySelectorAll('u');
        nestedUnderline.forEach(el => el.replaceWith(...el.childNodes));

        // 2. Limpiar estilos inline de text-decoration: underline
        const styledElements = fragment.querySelectorAll('[style*="text-decoration"]');
        styledElements.forEach(el => {
            el.style.textDecoration = '';
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        });

        const u = document.createElement('u');
        u.appendChild(fragment);
        range.insertNode(u);
    }

    sel.removeAllRanges();
}

function italic() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 3 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer;

    const italicElement = parent.closest('em, i'); // Buscamos em o i

    if (italicElement) {
        italicElement.replaceWith(...italicElement.childNodes);
    } else {
        const fragment = range.extractContents();

        // 1. Eliminar etiquetas de itálica internas (em e i)
        const nestedItalics = fragment.querySelectorAll('em, i');
        nestedItalics.forEach(el => el.replaceWith(...el.childNodes));

        // 2. Limpiar estilos inline de font-style: italic
        const styledElements = fragment.querySelectorAll('[style*="font-style"]');
        styledElements.forEach(el => {
            el.style.fontStyle = '';
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        });

        const em = document.createElement('em');
        em.appendChild(fragment);
        range.insertNode(em);
    }
    sel.removeAllRanges();
}

function strikethrough() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 3 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer;

    const sElement = parent.closest('s, strike, del');
    if (sElement) {
        sElement.replaceWith(...sElement.childNodes); 
    } else {
        const fragment = range.extractContents();

        // 1. Eliminar etiquetas de tachado internas para evitar duplicados
        const nestedS = fragment.querySelectorAll('s, strike, del');
        nestedS.forEach(el => el.replaceWith(...el.childNodes));

        // 2. Limpiar estilos inline de line-through
        const styledElements = fragment.querySelectorAll('[style*="text-decoration"]');
        styledElements.forEach(el => {
            if (el.style.textDecoration.includes('line-through')) {
                el.style.textDecoration = el.style.textDecoration.replace('line-through', '').trim();
            }
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        });

        const s = document.createElement('s');
        s.appendChild(fragment);
        range.insertNode(s);
    }
    sel.removeAllRanges();
}

function alignText(mode) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    let range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;

    // 1. Identificar el ancestro de bloque más cercano (P, H1-H6, DIV)
    if (node.nodeType === 3) node = node.parentElement;
    const blockElement = node.closest('p, h1, h2, h3, h4, h5, h6, div, li');

    if (blockElement) {
        // 2. Limpiar alineaciones previas en elementos hijos para evitar conflictos
        const nestedAlignments = blockElement.querySelectorAll('[style*="text-align"]');
        nestedAlignments.forEach(el => {
            el.style.textAlign = '';
            if (el.getAttribute('style') === '') el.removeAttribute('style');
        });

        // 3. Aplicar la alineación al bloque raíz
        blockElement.style.textAlign = mode; 
    }
    
    sel.removeAllRanges();
}

function setFontFamily(font) {
  const editor = document.getElementById('content');
    if (!editor) return;

    editor.style.fontFamily = font; // Cubre texto base y párrafos

    const allDescendants = editor.querySelectorAll('*');
    allDescendants.forEach(el => {
        el.style.fontFamily = 'inherit'; // Fuerza a listas y tablas a seguir al padre
        if (el.getAttribute('style') === '') el.removeAttribute('style');
    });
}

function addLink(){
    const url = prompt("Enter the link URL:");
    if(url){
        document.execCommand("createLink", false, url);
        updateInteractiveListeners();
    }
}

const content = document.getElementById('content');
let history = [];
let currentIndex = -1;

function saveState(){
    // Si estamos en medio del historial y escribimos algo nuevo,eliminamos los estados futuros
    if (currentIndex < history.length - 1) { history = history.slice(0, currentIndex + 1); }
    // Guardamos el nuevo estado 
    history.push(content.innerHTML);
    // Ajustamos el índice al último estado
    currentIndex = history.length - 1;
}

function undo(){
    if(currentIndex > 0){
        currentIndex--;
        content.innerHTML = history[currentIndex];
    }
}

function redo(){
    if(currentIndex < history.length - 1){
        currentIndex++;
        content.innerHTML = history[currentIndex];
    }
}
//Detectar cambios en el editor y inicializar con el contenido inicial
content.addEventListener("input", saveState);
saveState();

// Función para actualizar listeners en elementos interactivos (enlaces y botones de plantilla)
function updateInteractiveListeners() {
    // --- Enlaces: remover y reasignar listeners ---
    const links = content.querySelectorAll('a');
    links.forEach(item => item.replaceWith(item.cloneNode(true)));
    const linksUpdated = content.querySelectorAll('a');
    linksUpdated.forEach(item => {
        item.addEventListener('mouseenter', function () {
            content.contentEditable = false;
            item.style.cursor = 'pointer';
        });
        item.addEventListener('mouseleave', function () {
            content.contentEditable = true;
        });
        item.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(item.href, '_blank');
        });
    });

    // --- Botones de plantilla: no realizan acción por ahora ---
    const tplButtons = content.querySelectorAll('button.template-btn, button.dynamic-button');
    tplButtons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    const tplButtonsUpdated = content.querySelectorAll('button.template-btn, button.dynamic-button');
    tplButtonsUpdated.forEach(btn => {
        // Evitar que el botón mueva el foco fuera del editor o cambie la selección
        btn.addEventListener('mousedown', function(e){
            e.preventDefault();
        });
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Template button clicked:', this.textContent);
            // Intencionalmente sin acción; aquí se podrán agregar métodos en el futuro
        });
    });
}

// Actualizar elementos interactivos cuando haya cambios en el contenido
content.addEventListener('input', updateInteractiveListeners);

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('content');
    const showCode = document.querySelector('.show-code');
    
    let isCodeMode = false;
    let htmlBackup = '';

    if(showCode) {
        console.log('Botón encontrado:', showCode); // Debug
        
        showCode.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botón clickeado'); // Debug
            
            isCodeMode = !isCodeMode;
            showCode.dataset.active = isCodeMode;
            
            if(isCodeMode){
                // Entrar en modo código - mostrar el HTML
                htmlBackup = content.innerHTML;
                
                // Obtener el HTML y mostrarlo como texto
                let htmlContent = content.innerHTML;
                console.log('HTML guardado:', htmlContent); // Debug
                
                // Limpiar y mostrar HTML
                content.innerHTML = '';
                content.textContent = htmlContent;
                
                content.contentEditable = false;
                content.style.fontFamily = 'monospace';
                content.style.fontSize = '12px';
                content.style.whiteSpace = 'pre-wrap';
                content.style.overflowWrap = 'break-word';
                content.style.backgroundColor = '#f5f5f5';
                
                // Seleccionar todo para copiar
                setTimeout(() => {
                    content.focus();
                    const range = document.createRange();
                    range.selectNodeContents(content);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }, 10);
                
            }else{
                // Salir del modo código - restaurar el HTML
                try{
                    const htmlCode = content.textContent.trim();
                    content.innerHTML = htmlCode;
                }catch(e){
                    console.error('Error al restaurar HTML:', e);
                    content.innerHTML = htmlBackup;
                }
                
                content.contentEditable = true;
                content.style.fontFamily = '';
                content.style.fontSize = '';
                content.style.whiteSpace = '';
                content.style.overflowWrap = '';
                content.style.backgroundColor = '';
                
                updateInteractiveListeners();
            }
        });
    } else {
        console.error('Botón .show-code no encontrado');
    }
});

const filename = document.getElementById('filename');

function saveAsPDF(value) {
    if(value === 'new'){
        content.innerHTML = '';
        filename.value = 'untitled';
    }else if(value === 'pdf'){
        const opt = {
            margin: 10,
            filename: filename.value + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        html2pdf().set(opt).from(content).save();
    }
}

    function insertButton() {
        const editor = document.getElementById("content");
        if(!editor) return;
        editor.focus();
        const label = prompt('Texto del botón:', 'Botón');
        if(label === null) return; // cancelado

        // Crear el botón de plantilla
        const btn = document.createElement('button');
        btn.className = 'template-btn';
        btn.setAttribute('contenteditable', 'false');
        btn.textContent = label;

        // Insertar en la posición del cursor usando Range
        const sel = window.getSelection();
        if(sel && sel.rangeCount > 0){
            const range = sel.getRangeAt(0);
            // Insertar el nodo
            range.deleteContents();
            range.insertNode(btn);
            // Añadir un espacio después para poder seguir escribiendo
            const space = document.createTextNode('\u00A0');
            btn.after(space);
            // Mover el caret después del espacio
            range.setStartAfter(space);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editor.appendChild(btn);
            editor.appendChild(document.createTextNode('\u00A0'));
        }

        // Actualizar listeners (enlaces y botones)
        updateInteractiveListeners();
    }

function toggleList(type) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 3 
        ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;

    const list = parent.closest('ul, ol');

    if (list) {
        // Revertir: Extraer contenido de los li y eliminar la lista
        const fragment = document.createDocumentFragment();
        Array.from(list.querySelectorAll('li')).forEach(li => {
            while (li.firstChild) fragment.appendChild(li.firstChild);
        });
        list.replaceWith(fragment); 
    } else {
        // Aplicar: Crear nueva estructura de lista
        const newList = document.createElement(type);
        const li = document.createElement('li');
        li.appendChild(range.extractContents());
        newList.appendChild(li);
        range.insertNode(newList);
    }
    sel.removeAllRanges();
}

function setFontSize(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    
    // Aplicamos el tamaño (ej: '16px', '20px', '1.2em')
    span.style.fontSize = size; 

    try {
        // Extraemos el contenido seleccionado y lo insertamos en el span
        span.appendChild(range.extractContents());
        range.insertNode(span);
    } catch (e) {
        console.error("Error al cambiar el tamaño de fuente:", e);
    }

    sel.removeAllRanges();
}

function setBlockFormat(tagName) {
    const editor = document.getElementById('content');
    const sel = window.getSelection();
    if (!sel.rangeCount || !editor) return;

    const range = sel.getRangeAt(0);
    let parentBlock = range.commonAncestorContainer;
    if (parentBlock.nodeType === 3) parentBlock = parentBlock.parentNode;

    const blockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'];
    const closestBlock = parentBlock.closest(blockTags.join(','));

    const newBlock = document.createElement(tagName);
    // Sincronizar con la fuente global del editor
    newBlock.style.fontFamily = editor.style.fontFamily;

    if (closestBlock) {
        newBlock.innerHTML = closestBlock.innerHTML;
        closestBlock.replaceWith(newBlock);
    } else {
        newBlock.appendChild(range.extractContents());
        range.insertNode(newBlock);
    }
    sel.removeAllRanges();
}

 function insertTable() {
    const editor = document.getElementById("content");
    if (!editor) return;
    editor.focus();

    // Fijar siempre 2 filas y 2 columnas
    const rows = 2;
    const cols = 2;

    // Contenedor principal
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    // Controles superiores
    const controlsTop = document.createElement("div");
    controlsTop.className = "table-controls-top";

    const addColBtn = document.createElement("button");
    addColBtn.textContent = "+ Columna";
    addColBtn.className = "table-control";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar tabla";
    deleteBtn.className = "table-control delete";

    controlsTop.appendChild(addColBtn);
    controlsTop.appendChild(deleteBtn);

    // Contenedor horizontal: tabla + controles laterales
    const rowContainer = document.createElement("div");
    rowContainer.style.display = "flex";
    rowContainer.style.alignItems = "center";

    const table = document.createElement("table");
    table.className = "editor-table";

    // Crear tabla 2x2
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
            const td = document.createElement("td");
            td.textContent = "Celda";
            td.contentEditable = "true"; // editable
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    const controlsSide = document.createElement("div");
    controlsSide.className = "table-controls-side";

    const addRowBtn = document.createElement("button");
    addRowBtn.textContent = "+ Fila";
    addRowBtn.className = "table-control";

    controlsSide.appendChild(addRowBtn);

    // Eventos dinámicos
    addColBtn.addEventListener("click", () => {
        table.querySelectorAll("tr").forEach(tr => {
            const td = document.createElement("td");
            td.textContent = "Celda";
            td.contentEditable = "true";
            tr.appendChild(td);
        });
    });

    addRowBtn.addEventListener("click", () => {
        const tr = document.createElement("tr");
        const colCount = table.rows[0].cells.length;
        for (let c = 0; c < colCount; c++) {
            const td = document.createElement("td");
            td.textContent = "Celda";
            td.contentEditable = "true";
            tr.appendChild(td);
        }
        table.appendChild(tr);
    });

    deleteBtn.addEventListener("click", () => {
        wrapper.remove();
    });

    // Ensamblar
    rowContainer.appendChild(table);
    rowContainer.appendChild(controlsSide);

    wrapper.appendChild(controlsTop);
    wrapper.appendChild(rowContainer);

    // Insertar en el editor
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(wrapper);
        range.setStartAfter(wrapper);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        editor.appendChild(wrapper);
    }
}

function insertImageBase64() {
    const editor = document.getElementById("content");
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function() {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const wrapper = document.createElement("div");
            wrapper.className = "image-wrapper align-center"; // por defecto centrada
            wrapper.setAttribute("contenteditable", "false");

            const controlsTop = document.createElement("div");
            controlsTop.className = "image-controls-top";

            const btnLeft = document.createElement("button");
            btnLeft.textContent = "Izquierda";
            btnLeft.onclick = () => {
                wrapper.classList.remove("align-center", "align-right");
                wrapper.classList.add("align-left");
            };

            const btnCenter = document.createElement("button");
            btnCenter.textContent = "Centro";
            btnCenter.onclick = () => {
                wrapper.classList.remove("align-left", "align-right");
                wrapper.classList.add("align-center");
            };

            const btnRight = document.createElement("button");
            btnRight.textContent = "Derecha";
            btnRight.onclick = () => {
                wrapper.classList.remove("align-left", "align-center");
                wrapper.classList.add("align-right");
            };

            controlsTop.appendChild(btnLeft);
            controlsTop.appendChild(btnCenter);
            controlsTop.appendChild(btnRight);

            // Contenedor exclusivo para la imagen
            const imgContainer = document.createElement("div");
            imgContainer.className = "img-container";

            const img = document.createElement("img");
            img.src = e.target.result;
            imgContainer.appendChild(img);

            img.onload = function() {
                img.style.width = img.naturalWidth + "px";
                img.style.height = "auto";

                // Crear los 4 handles
                const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
                positions.forEach(pos => {
                    const handle = document.createElement("div");
                    handle.className = "resize-handle " + pos;
                    imgContainer.appendChild(handle);

                    let isResizing = false;

                    handle.addEventListener("mousedown", (e) => {
                        e.preventDefault();
                        isResizing = true;
                        document.addEventListener("mousemove", resize);
                        document.addEventListener("mouseup", stopResize);
                    });

                    function resize(e) {
                        if (!isResizing) return;
                        const rect = imgContainer.getBoundingClientRect();
                        let newWidth;

                        if (pos.includes("right")) {
                            newWidth = e.clientX - rect.left;
                        } else {
                            newWidth = rect.right - e.clientX;
                        }

                        const maxWidth = 600, minWidth = 100;
                        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const newHeight = newWidth / aspectRatio;

                        img.style.width = newWidth + "px";
                        img.style.height = newHeight + "px";
                        imgContainer.style.width = img.style.width;
                        imgContainer.style.height = img.style.height;
                    }

                    function stopResize() {
                        isResizing = false;
                        document.removeEventListener("mousemove", resize);
                        document.removeEventListener("mouseup", stopResize);
                    }
                });
            };

            wrapper.appendChild(controlsTop);
            wrapper.appendChild(imgContainer);

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(wrapper);

                const space = document.createElement("p");
                space.innerHTML = "<br>";
                wrapper.after(space);

                range.setStart(space, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                saveState();
            } else {
                editor.appendChild(wrapper);
                const space = document.createElement("p");
                space.innerHTML = "<br>";
                editor.appendChild(space);
                saveState();
            }
        };

        reader.readAsDataURL(file);
    };

    input.click();
}

async function saveContent() {
    const editorContent = document.getElementById('content').innerHTML;
    const url = 'http://localhost:3000/documents';

    try {
        // 1. Obtener documentos para calcular ID
        const res = await fetch(url);
        const data = await res.json();
        
        // 2. Calcular Max ID + 1
        const nextId = data.length > 0 
            ? Math.max(...data.map(d => d.id)) + 1 
            : 1;

        // 3. Guardar nuevo registro
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: nextId, content: editorContent })
        });

        alert('Documento guardado con ID: ' + nextId);
    } catch (error) {
        console.error('Error:', error);
    }
}










