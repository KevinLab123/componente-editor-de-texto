function formatDoc(cmd, value=null) {
    const editor = document.getElementById("content"); 
    editor.focus();
    if(value){
        document.execCommand(cmd, false, value);
    }else{
        document.execCommand(cmd);
    }
}
let currentFont = 'Arial';
const filename = document.getElementById('filename');
let savedRange = null;
let buttonModal = null;
document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById('buttonModal');
    if (modalEl) {
        buttonModal = new bootstrap.Modal(modalEl);
    }
});

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
    setFontFamily(currentFont)
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
    setFontFamily(currentFont)
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
    setFontFamily(currentFont)
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
    setFontFamily(currentFont);
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
    currentFont = font;
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
        setFontFamily(currentFont)
    }
}

const content = document.getElementById('content');
let history = [];
let currentIndex = -1;

function saveState() {

    let rawHTML = content.innerHTML;

    if (currentIndex < history.length - 1) {
        history = history.slice(0, currentIndex + 1);
    }

    history.push(rawHTML);
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

function openButtonModal() {

    const editor = document.getElementById("content");
    if (!editor) return;

    editor.focus();

    const sel = window.getSelection();

    if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
    }

    buttonModal.show();
}


function insertButton() {

    const editor = document.getElementById("content");
    if (!editor) return;

    /* ===== valores desde el card/modal ===== */

    const label = document.getElementById("btnLabel").value.trim();
    if (!label) {
        alert("Debe indicar un texto");
        return;
    }

    const color = document.querySelector('input[name="btnColor"]:checked').value;
    const action = document.getElementById("btnAction").value;

    /* ===== crear botón ===== */

    const btn = document.createElement('button');
    btn.className = `btn ${color} template-btn`;
    btn.setAttribute('contenteditable', 'false');
    btn.dataset.action = action;
    btn.textContent = label;

    editor.focus();

    /* ===== TU MISMA LÓGICA RANGE ===== */

    const sel = window.getSelection();

    if (savedRange) {
        savedRange.deleteContents();
        savedRange.insertNode(btn);

        const space = document.createTextNode('\u00A0');
        btn.after(space);

        savedRange.setStartAfter(space);
        savedRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(savedRange);

    } else if (sel && sel.rangeCount > 0) {

        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(btn);

        const space = document.createTextNode('\u00A0');
        btn.after(space);

        range.setStartAfter(space);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

    } else {

        editor.appendChild(btn);
        editor.appendChild(document.createTextNode('\u00A0'));
    }

    /* ===== limpiar y cerrar ===== */

    document.getElementById("btnLabel").value = "";

    buttonModal.hide();

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
    setFontFamily(currentFont)
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

    const rows = 2;
    const cols = 2;

    // Contenedor principal
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper align-center";
    wrapper.setAttribute("contenteditable", "false");

    // --- CONTROLES SUPERIORES ---
    const controlsTop = document.createElement("div");
    controlsTop.className = "table-controls-top";
    controlsTop.setAttribute("contenteditable", "false");
    controlsTop.setAttribute("data-html2canvas-ignore", "true");

    const addColBtn = document.createElement("button");
    addColBtn.textContent = "Agregar Columna";
    addColBtn.className = "table-control btn-add-col";

    const addRowBtn = document.createElement("button");
    addRowBtn.textContent = "Agregar Fila";
    addRowBtn.className = "table-control btn-add-row";

    const deleteRowBtn = document.createElement("button");
    deleteRowBtn.textContent = "Eliminar fila";
    deleteRowBtn.className = "table-control-delete btn-delete-row";

    const deleteColBtn = document.createElement("button");
    deleteColBtn.textContent = "Eliminar columna";
    deleteColBtn.className = "table-control-delete btn-delete-col";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar tabla";
    deleteBtn.className = "table-control-delete-table btn-delete-table";

    [
        addColBtn,
        addRowBtn,
        deleteRowBtn,
        deleteColBtn,
        deleteBtn
    ].forEach(btn => {
        btn.setAttribute("contenteditable", "false");
        controlsTop.appendChild(btn);
    });

    // Crear tabla
    const table = document.createElement("table");
    table.className = "editor-table";

    for (let r = 0; r < rows; r++) {
        const tr = document.createElement("tr");

        for (let c = 0; c < cols; c++) {
            const td = document.createElement("td");
            td.textContent = "Celda";
            td.contentEditable = "true";
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    // Ensamblar
    wrapper.appendChild(controlsTop);
    wrapper.appendChild(table);

    const spaceAbove = document.createElement("p");
    spaceAbove.innerHTML = "<br>";

    const spaceBelow = document.createElement("p");
    spaceBelow.innerHTML = "<br>";

    const sel = window.getSelection();

    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();

        range.insertNode(spaceAbove);
        spaceAbove.after(wrapper);
        wrapper.after(spaceBelow);

        range.setStart(spaceBelow, 0);
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);

        saveState();
    } else {
        editor.appendChild(spaceAbove);
        editor.appendChild(wrapper);
        editor.appendChild(spaceBelow);
        saveState();
    }
}

// --- CLICK: tablas + imágenes ---
document.addEventListener("click", function (e) {

    const target = e.target;

    // --- TABLAS ---
    const tableWrapper = target.closest(".table-wrapper");
    if (tableWrapper) {
        const table = tableWrapper.querySelector("table");

        function getCurrentCell() {
            const selection = window.getSelection();
            if (!selection.rangeCount) return null;

            let node = selection.anchorNode;
            if (node.nodeType === 3) node = node.parentNode;

            while (node && node !== table) {
                if (node.tagName === "TD") return node;
                node = node.parentNode;
            }
            return null;
        }

        if (target.classList.contains("btn-add-row")) {
            const tr = document.createElement("tr");
            const colCount = table.rows[0].cells.length;

            for (let i = 0; i < colCount; i++) {
                const td = document.createElement("td");
                td.contentEditable = "true";
                td.textContent = "Celda";
                tr.appendChild(td);
            }

            table.appendChild(tr);
            saveState();
        }

        if (target.classList.contains("btn-add-col")) {
            Array.from(table.rows).forEach(row => {
                const td = document.createElement("td");
                td.contentEditable = "true";
                td.textContent = "Celda";
                row.appendChild(td);
            });
            saveState();
        }

        if (target.classList.contains("btn-delete-row")) {
            const cell = getCurrentCell();
            if (!cell || table.rows.length <= 1) return;
            cell.parentNode.remove();
            saveState();
        }

        if (target.classList.contains("btn-delete-col")) {
            const cell = getCurrentCell();
            if (!cell || table.rows[0].cells.length <= 1) return;
            const index = cell.cellIndex;
            Array.from(table.rows).forEach(row => row.deleteCell(index));
            saveState();
        }

        if (target.classList.contains("btn-delete-table")) {
            tableWrapper.remove();
            saveState();
        }

        return; // si fue tabla, no seguimos al código de imagen
    }

    // --- IMÁGENES ---
    const imageWrapper = target.closest(".image-wrapper");
    if (imageWrapper) {

        // Alineación
        if (target.classList.contains("btn-img-left")) {
            imageWrapper.classList.remove("align-center", "align-right");
            imageWrapper.classList.add("align-left");
            saveState();
        }

        if (target.classList.contains("btn-img-center")) {
            imageWrapper.classList.remove("align-left", "align-right");
            imageWrapper.classList.add("align-center");
            saveState();
        }

        if (target.classList.contains("btn-img-right")) {
            imageWrapper.classList.remove("align-left", "align-center");
            imageWrapper.classList.add("align-right");
            saveState();
        }

        // Eliminar imagen
     if (target.classList.contains("image-control-delete")) {

    const wrapper = imageWrapper;
    if (!wrapper) return;

    const prev = wrapper.previousElementSibling;
    const next = wrapper.nextElementSibling;

    //  Eliminar párrafo vacío anterior
    if (prev && prev.tagName === "P" && prev.innerHTML.trim() === "<br>") {
        prev.remove();
    }

    //  Eliminar clear div y posible párrafo vacío debajo
    if (next && next.classList.contains("image-clear-fix")) {

        const nextAfterClear = next.nextElementSibling;

        next.remove(); // elimina clear-fix

        if (nextAfterClear && 
            nextAfterClear.tagName === "P" && 
            nextAfterClear.innerHTML.trim() === "<br>") {
            nextAfterClear.remove();
        }
    }

    //  Eliminar wrapper de imagen
    wrapper.remove();

    saveState();
}

        return;
    }

});

let isResizing = false;
let currentHandle = null;
let currentContainer = null;
let currentImage = null;

document.addEventListener("mousedown", function (e) {
    if (!e.target.classList.contains("resize-handle")) return;

    e.preventDefault();

    currentHandle = e.target;
    currentContainer = currentHandle.closest(".img-container");
    currentImage = currentContainer.querySelector("img");

    if (!currentContainer || !currentImage) return;

    isResizing = true;
});

document.addEventListener("mousemove", function (e) {
    if (!isResizing || !currentHandle) return;

    const rect = currentContainer.getBoundingClientRect();
    let newWidth;

    if (currentHandle.className.includes("right")) {
        newWidth = e.clientX - rect.left;
    } else {
        newWidth = rect.right - e.clientX;
    }

    // Limites de ancho
    const minWidth = 100;
    const maxWidth = 600;
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

    // Mantener proporción
    const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
    const newHeight = newWidth / aspectRatio;

    currentImage.style.width = newWidth + "px";
    currentImage.style.height = newHeight + "px";

    currentContainer.style.width = currentImage.style.width;
    currentContainer.style.height = currentImage.style.height;
});

document.addEventListener("mouseup", function () {
    if (isResizing) {
        isResizing = false;
        currentHandle = null;
        currentContainer = null;
        currentImage = null;

        saveState(); // Guardar estado al finalizar el resize
    }
});







function insertImageBase64() {
    const editor = document.getElementById("content");
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {
        const file = input.files[0];
        
        if (!file) return;

        //  Comprimir antes de convertir a base64
        new Compressor(file, {
            quality: 0.5,       // calidad JPEG (0.1 - 1)
            maxWidth: 1024,     // ancho máximo
            success(result) {
                const reader = new FileReader();
                console.log("Tamaño original:", (file.size / 1024).toFixed(2), "KB"); console.log("Tamaño comprimido:", (result.size / 1024).toFixed(2), "KB");
                reader.onload = function (e) {
                    const wrapper = document.createElement("div");
                    wrapper.className = "image-wrapper align-center";
                    wrapper.setAttribute("contenteditable", "false");

                    // --- CONTROLES SUPERIORES ---
                    const controlsTop = document.createElement("div");
                    controlsTop.className = "image-controls-top";
                    controlsTop.setAttribute("data-html2canvas-ignore", "true");

                    const btnLeft = document.createElement("button");
                    btnLeft.textContent = "Izquierda";
                    btnLeft.className = "image-control-align btn-img-left";

                    const btnCenter = document.createElement("button");
                    btnCenter.textContent = "Centro";
                    btnCenter.className = "image-control-align btn-img-center";

                    const btnRight = document.createElement("button");
                    btnRight.textContent = "Derecha";
                    btnRight.className = "image-control-align btn-img-right";

                    controlsTop.append(btnLeft, btnCenter, btnRight);

                    // Contenedor imagen
                    const imgContainer = document.createElement("div");
                    imgContainer.className = "img-container";

                    const img = document.createElement("img");
                    img.src = e.target.result; // base64 optimizado
                    imgContainer.appendChild(img);

                    // --- CONTROLES INFERIORES ---
                    const controlsBottom = document.createElement("div");
                    controlsBottom.className = "image-controls-bottom";
                    controlsBottom.setAttribute("data-html2canvas-ignore", "true");

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Eliminar imagen";
                    deleteBtn.className = "image-control-delete";

                    controlsBottom.appendChild(deleteBtn);

                    // Crear handles SIN listeners individuales
                    const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
                    positions.forEach(pos => {
                        const handle = document.createElement("div");
                        handle.className = "resize-handle " + pos;
                        handle.setAttribute("data-html2canvas-ignore", "true");
                        imgContainer.appendChild(handle);
                    });

                    wrapper.append(controlsTop, imgContainer, controlsBottom);

                     const clearDiv = document.createElement("div");
                    clearDiv.className = "image-clear-fix";
                    clearDiv.setAttribute("contenteditable", "false");    

                    const spaceAbove = document.createElement("p");
                    spaceAbove.innerHTML = "<br>";
                    const spaceBelow = document.createElement("p");
                    spaceBelow.innerHTML = "<br>";

                    const sel = window.getSelection();

                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();

                        range.insertNode(spaceAbove);
                        spaceAbove.after(wrapper);
                        wrapper.after(spaceBelow);
                        wrapper.after(clearDiv);  

                        range.setStart(spaceBelow, 0);
                        range.collapse(true);

                        sel.removeAllRanges();
                        sel.addRange(range);

                        saveState();
                    } else {
                        editor.append(spaceAbove, wrapper, spaceBelow);
                        saveState();
                    }
                };

                reader.readAsDataURL(result); // convertir imagen comprimida a base64
            },
            error(err) {
                console.error("Error al comprimir imagen:", err);
            }
        });
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
            body: JSON.stringify({ id: nextId, content: editorContent,
                name: filename.value,
                font: currentFont,
                department: "sin asignar" })
        });
        alert('Documento guardado con ID: ' + nextId);
    } catch (error) {
        console.error('Error:', error);
    }
}

function clearFormattingToParagraph() {
    const editor = document.getElementById('content');
    const sel = window.getSelection();
    if (!sel.rangeCount || !editor) return;

    const range = sel.getRangeAt(0);

    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
    }
    const paragraph = node.closest('p, div, li, h1, h2, h3, h4, h5, h6');
    if (!paragraph || !editor.contains(paragraph)) return;
    //ZONAS PROTEGIDAS
    const protectedSelector = `
        table, thead, tbody, tfoot, tr, td, th,
        button, input, select, textarea,
        [contenteditable="false"],
        [data-wrapper],
        [data-protected]
    `;

    // Si el párrafo está dentro de zona protegida → salir
    if (paragraph.closest(protectedSelector)) {
        console.warn("Zona protegida — no se limpia formato");
        return;
    }

    // etiquetas inline que sí podemos remover
    const inlineTags = [
        'strong','b','em','i','u','s','del','strike',
        'span','font','mark','small','big','sub','sup'
    ];

    paragraph.querySelectorAll(inlineTags.join(',')).forEach(el => {

        //  No tocar si está dentro de zona protegida
        if (el.closest(protectedSelector)) return;

        while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
        }
        el.remove();
    });

    //  limpiar atributos visuales pero no funcionales
    paragraph.querySelectorAll('*').forEach(el => {

        if (el.closest(protectedSelector)) return;

        el.removeAttribute('style');
        el.removeAttribute('class');
        el.removeAttribute('color');
        el.removeAttribute('face');
        el.removeAttribute('size');
    });

    paragraph.removeAttribute('style');
    paragraph.removeAttribute('class');

    // Restaurar selección
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(paragraph);
    newRange.collapse(false);
    sel.addRange(newRange);
    setFontFamily(currentFont);
}



















