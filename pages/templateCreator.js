function formatDoc(cmd, value=null) {
    if (!activeEditor){
        alert("Selecciona un editor antes de insertar la tabla.");
        return
    };
    const editor = activeEditor;
    editor.focus();
    if(value){
        document.execCommand(cmd, false, value);
    }else{
        document.execCommand(cmd);
    }
}



function handleFileMenu(option) {

    switch(option){

        case "pdf":
            saveAsPDF("pdf");
            break;

        case "save":
            saveContent();
            break;

        case "new":
            newDocument();
            break;

    }

}

let currentPageFormat = "A4";
let currentFont = 'Arial';
const filename = document.getElementById('filename');
let savedRange = null;
let buttonModal = null;

const pageFormats = {
    A4: {
        width: 794,
        height: 1123
    },
    LETTER: {
        width: 816,
        height: 1056
    },
    LEGAL: {
        width: 816,
        height: 1344
    }
};

function setPageFormat(format) {

    const preview = document.getElementById("pdf-preview");
    const page = pageFormats[format];

    if (!page) return;

    // guardar formato seleccionado
    currentPageFormat = format;

    preview.style.width = page.width + "px";
    preview.style.minHeight = page.height + "px";

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
    setFontFamily(currentFont)
    commitChange(); // Guardar estado después de aplicar formato
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
    commitChange(); // Guardar estado después de aplicar formato
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
    commitChange(); // Guardar estado después de aplicar formato
}

function strikethrough() {

    if (!activeEditor){
        alert("Selecciona un editor antes de aplicar formato.");
        return;
    }

    const editor = activeEditor;
    editor.focus();

    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);

    const parent = range.commonAncestorContainer.nodeType === 3 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer;

    const sElement = parent.closest('s, strike, del');

    // ===== SI YA ESTÁ TACHADO → QUITAR =====
    if (sElement) {
        sElement.replaceWith(...sElement.childNodes);
    } 
    // ===== SI NO ESTÁ TACHADO → APLICAR =====
    else {

        const fragment = range.extractContents();

        // Eliminar tachados internos
        const nestedS = fragment.querySelectorAll('s, strike, del');
        nestedS.forEach(el => el.replaceWith(...el.childNodes));

        // Limpiar estilos inline
        const styledElements = fragment.querySelectorAll('[style*="text-decoration"]');
        styledElements.forEach(el => {
            if (el.style.textDecoration.includes('line-through')) {
                el.style.textDecoration = '';
            }
            if (el.getAttribute('style') === '') {
                el.removeAttribute('style');
            }
        });

        const s = document.createElement('s');
        s.appendChild(fragment);
        range.insertNode(s);

        // Reposicionar cursor
        range.setStartAfter(s);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    commitChange();
}

function alignText(mode) {

    if (!activeEditor) return;

    activeEditor.focus();

    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    let node = range.startContainer;

    if (node.nodeType === 3) {
        node = node.parentElement;
    }

    if (!activeEditor.contains(node)) return;

    let block = node.closest('p, h1, h2, h3, h4, h5, h6, li');

    // 🔥 Si no existe bloque, crearlo
    if (!block) {
        const p = document.createElement('p');
        p.innerHTML = activeEditor.innerHTML;
        activeEditor.innerHTML = '';
        activeEditor.appendChild(p);
        block = p;
    }

    // 🔥 Guardar estado antes del cambio
    const before = activeEditor.innerHTML;

    block.style.textAlign = mode;

    const after = activeEditor.innerHTML;

    // 🔥 Solo guardar si realmente cambió
    if (before !== after) {
        saveState();
    }
}

function setFontFamily(font) {

    currentFont = font;

    document.querySelectorAll('.editor-section').forEach(editor => {

        // 1 Eliminar etiquetas <font>
        editor.querySelectorAll('font').forEach(node => {
            const parent = node.parentNode;
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
        });

        // 2 Limpiar font-family inline en TODOS los nodos internos
        editor.querySelectorAll('*').forEach(node => {
            if (node.style && node.style.fontFamily) {
                node.style.fontFamily = '';
            }
        });

        // 3 Aplicar fuente global al editor
        editor.style.fontFamily = font;

        // 4 Forzar herencia explícita en TODOS los elementos estructurales
        editor.querySelectorAll(
            'h1,h2,h3,h4,h5,h6,p,div,span,li,ul,ol,' +
            'table,thead,tbody,tr,td,th'
        ).forEach(node => {
            node.style.fontFamily = 'inherit';
        });

    });
}

function addLink() {
    if (!activeEditor) return;
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        alert("Selecciona el texto que deseas enlazar.");
        return;
    }

    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    //  Si ya está dentro de un enlace → no hacer nada
    if (parent.closest("a")) {
        alert("La selección ya está enlazada.");
        return;
    }

    let url = prompt("Ingresa la URL o correo:");
    if (!url) return;

    url = url.trim();

    if (url.includes("@") && !url.startsWith("mailto:")) {
        url = "mailto:" + url;
    }

    if (!url.startsWith("http") && !url.startsWith("mailto:")) {
        url = "https://" + url;
    }

    const content = range.extractContents();
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(content);
    range.insertNode(a);
    sel.removeAllRanges();
    saveState();
}

function buildCleanSection(editorId) {

    const original = document.getElementById(editorId);
    const clone = original.cloneNode(true);

    clone.removeAttribute("contenteditable");
    clone.classList.remove("editor-section");

    //  1. Eliminar todo lo marcado para ignorar
    clone.querySelectorAll("[data-html2canvas-ignore]").forEach(el => el.remove());

    clone.querySelectorAll(
        ".image-controls-top, .image-controls-bottom, .resize-handle, " +
        ".table-controls-top, .image-clear-fix, .no-print, .no-pdf"
    ).forEach(el => el.remove());

    //  2. LIMPIAR IMÁGENES PERO RESPETAR ALINEACIÓN
    clone.querySelectorAll(".image-wrapper").forEach(wrapper => {

        const img = wrapper.querySelector("img");
        if (!img) return;

        let alignmentClass = "pdf-align-center";

        if (wrapper.classList.contains("align-left")) {
            alignmentClass = "pdf-align-left";
        }
        else if (wrapper.classList.contains("align-right")) {
            alignmentClass = "pdf-align-right";
        }

        const cleanContainer = document.createElement("div");
        cleanContainer.className = "pdf-image-container " + alignmentClass;

        cleanContainer.appendChild(img.cloneNode(true));

        wrapper.replaceWith(cleanContainer);
    });

    //  3. LIMPIAR TABLAS
    clone.querySelectorAll(".table-wrapper").forEach(wrapper => {

        const table = wrapper.querySelector("table");
        if (!table) return;

        const cleanTable = table.cloneNode(true);
        wrapper.replaceWith(cleanTable);
    });

    return clone;
}

function updatePreview() {

    const preview = document.getElementById("pdf-preview");
    preview.innerHTML = "";

    const header = buildCleanSection("header-editor");
    const body   = buildCleanSection("body-editor");
    const footer = buildCleanSection("footer-editor");

    const documentWrapper = document.createElement("div");
    documentWrapper.className = "pdf-document";

    const headerContainer = document.createElement("div");
    headerContainer.className = "pdf-header";
    headerContainer.appendChild(header);

    const bodyContainer = document.createElement("div");
    bodyContainer.className = "pdf-content";
    bodyContainer.appendChild(body);

    const footerContainer = document.createElement("div");
    footerContainer.className = "pdf-footer";
    footerContainer.appendChild(footer);

    documentWrapper.append(headerContainer, bodyContainer, footerContainer);
    preview.appendChild(documentWrapper);
}

const headerEditor = document.getElementById('header-editor');
const bodyEditor = document.getElementById('body-editor');
const footerEditor = document.getElementById('footer-editor');

let histories = {
    header: {
        history: [],
        currentIndex: -1
    },
    body: {
        history: [],
        currentIndex: -1
    },
    footer: {
        history: [],
        currentIndex: -1
    }
};

let activeEditor = null;
let activeKey = null;
let isResizing = false;
let currentHandle = null;
let currentContainer = null;
let currentImage = null;

function setActiveEditor(editor, key) {
    activeEditor = editor;
    activeKey = key;
}
// Actualizar elementos interactivos cuando haya cambios en el contenido
const editors = document.querySelectorAll('.editor-section');

function toggleCodeMode(editor, button) {

    let isCodeMode = button.dataset.active === "true";
    isCodeMode = !isCodeMode;

    button.dataset.active = isCodeMode;

    if (isCodeMode) {

        const html = editor.innerHTML;
        editor.dataset.htmlBackup = html;

        editor.innerHTML = "";
        editor.textContent = html;

        editor.contentEditable = false;
        editor.style.fontFamily = 'monospace';
        editor.style.fontSize = '12px';
        editor.style.whiteSpace = 'pre-wrap';
        editor.style.backgroundColor = '#f5f5f5';

    } else {

        try {
            editor.innerHTML = editor.textContent;
        } catch (e) {
            editor.innerHTML = editor.dataset.htmlBackup;
        }

        editor.contentEditable = true;
        editor.removeAttribute("style");

        updateInteractiveListeners();
    }
}
function commitChange() {
    if (!activeEditor) return;

    activeEditor.focus();   // asegurar foco
    saveState();            // guardar estado
}

function saveState() {

    if (!activeEditor || !activeKey) return;

    let editorHistory = histories[activeKey];

    // Obtener HTML actual
    let rawHTML = activeEditor.innerHTML.trim();

    // Normalizar HTML si es el header (evita inconsistencias con tablas)
    if (activeKey === 'header') {
        const temp = document.createElement('div');
        temp.innerHTML = rawHTML;

        // Forzar estructura estable de tabla
        const tables = temp.querySelectorAll('table');

        tables.forEach(table => {
            if (!table.querySelector('tbody')) {
                const tbody = document.createElement('tbody');
                tbody.innerHTML = table.innerHTML;
                table.innerHTML = '';
                table.appendChild(tbody);
            }
        });

        rawHTML = temp.innerHTML.trim();
    }

    // Evitar guardar estados duplicados
    if (
        editorHistory.history.length > 0 &&
        editorHistory.history[editorHistory.currentIndex] === rawHTML
    ) {
        return;
    }

    // Si el usuario hizo undo y luego edita algo nuevo
    if (editorHistory.currentIndex < editorHistory.history.length - 1) {
        editorHistory.history = editorHistory.history.slice(
            0,
            editorHistory.currentIndex + 1
        );
    }

    // Guardar estado
    editorHistory.history.push(rawHTML);
    editorHistory.currentIndex = editorHistory.history.length - 1;
}

function undo() {

    if (!activeEditor) return;

    let editorHistory = histories[activeKey];

    if (editorHistory.currentIndex > 0) {
        editorHistory.currentIndex--;
        activeEditor.innerHTML = editorHistory.history[editorHistory.currentIndex];
    }
}

function redo() {

    if (!activeEditor) return;

    let editorHistory = histories[activeKey];

    if (editorHistory.currentIndex < editorHistory.history.length - 1) {
        editorHistory.currentIndex++;
        activeEditor.innerHTML = editorHistory.history[editorHistory.currentIndex];
    }
}
// Inicializar historial
function initializeHistories() {
    Object.keys(histories).forEach(key => {
        let editor;

        if (key === 'header') editor = headerEditor;
        if (key === 'body') editor = bodyEditor;
        if (key === 'footer') editor = footerEditor;

        histories[key].history.push(editor.innerHTML);
        histories[key].currentIndex = 0;
    });
}
initializeHistories();

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

function saveAsPDF(action) {

    if (action === "pdf") {

        const preview = document.getElementById("pdf-preview");
        const filenameInput = document.getElementById("filename").value.trim();

        const filename = filenameInput !== "" 
            ? filenameInput 
            : "Sin-nombre";

            

        const options = {
            margin: 0,
            filename: filename + ".pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true
            },
            jsPDF: { 
            unit: "px",
            format: [preview.offsetWidth, preview.offsetHeight],
            orientation: "portrait"
            }
        };

        html2pdf()
            .set(options)
            .from(preview)
            .save();
    }

    if (action === "new") {
        document.querySelectorAll(".editor-section").forEach(e => e.innerHTML = "");
        document.getElementById("pdf-preview").innerHTML = "";
    }

    if (action === "save") {
        saveTemplate();
    }
}

function openButtonModal() {

    if (!activeEditor){
        alert("Selecciona un editor antes de insertar el botón.");
        return
    };
    const editor = activeEditor;
    editor.focus();


    const sel = window.getSelection();

    if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
    }

    buttonModal.show();
}

function insertButton() {
    if (!activeEditor){
        alert("Selecciona un editor antes de insertar el botón.");
        return
    };
    const editor = activeEditor;
    editor.focus();

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
        saveState();

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
        saveState();
    } else {

        editor.appendChild(btn);
        editor.appendChild(document.createTextNode('\u00A0'));
        saveState();
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

    if (!activeEditor){
        alert("Selecciona un editor antes de cambiar el tamaño de fuente.");
        return;
    }

    const editor = activeEditor;
    editor.focus();

    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const span = document.createElement('span');

    span.style.fontSize = size;

    try {
        span.appendChild(range.extractContents());
        range.insertNode(span);

        // Colocar cursor después del span
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        saveState();
    } catch (e) {
        console.error("Error al cambiar el tamaño de fuente:", e);
    }

    // Solo si existe esta función
    if (typeof setFontFamily === "function") {
        setFontFamily(currentFont);
    }
}

function setBlockFormat(tagName) {
 if (!activeEditor){
        alert("Selecciona un editor antes de insertar el botón.");
        return
    };
    const editor = activeEditor;
    editor.focus();
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
        saveState();
    } else {
        newBlock.appendChild(range.extractContents());
        range.insertNode(newBlock);
        saveState();
    }
    sel.removeAllRanges();
}

function getSelectedCell() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    let node = selection.getRangeAt(0).startContainer;

    while (node && node.nodeName !== "TD") {
        node = node.parentNode;
    }

    return node;
}

function mergeRight() {

    const td = getSelectedCell();
    if (!td) {
        alert("Selecciona una celda primero.");
        return;
    }

    const tr = td.parentElement;
    const table = tr.closest("table");

    const matrix = buildTableMatrix(table);

    const rowIndex = tr.rowIndex;

    // Total real de columnas de la tabla
    const totalColumns = matrix[0].length;

    // Obtener todas las celdas reales de esa fila
    const realCells = Array.from(tr.children);

    // Eliminar todas menos la seleccionada
    realCells.forEach(cell => {
        if (cell !== td) {
            cell.remove();
        }
    });

    // Expandir la celda seleccionada
    td.setAttribute("colspan", totalColumns);
    saveState();
}

function buildTableMatrix(table) {
    const matrix = [];

    for (let r = 0; r < table.rows.length; r++) {
        const row = table.rows[r];
        matrix[r] = [];
        let colIndex = 0;

        for (let cell of row.cells) {
            while (matrix[r][colIndex]) colIndex++;

            const rowspan = parseInt(cell.getAttribute("rowspan")) || 1;
            const colspan = parseInt(cell.getAttribute("colspan")) || 1;

            for (let i = 0; i < rowspan; i++) {
                for (let j = 0; j < colspan; j++) {
                    if (!matrix[r + i]) matrix[r + i] = [];
                    matrix[r + i][colIndex + j] = cell;
                }
            }

            colIndex += colspan;
        }
    }

    return matrix;
}

function addColumn(table) {

    const matrix = buildTableMatrix(table);

    const totalRows = matrix.length;
    const insertIndex = matrix[0].length; // insertar al final

    for (let r = 0; r < totalRows; r++) {

        const row = table.rows[r];

        const cellBeforeInsert = matrix[r][insertIndex - 1];

        const colspan = parseInt(cellBeforeInsert.getAttribute("colspan")) || 1;
        const realIndex = matrix[r].indexOf(cellBeforeInsert);

        // Si la celda cubre la nueva posición → extender colspan
        if (realIndex + colspan > insertIndex - 1) {

            cellBeforeInsert.setAttribute("colspan", colspan + 1);

        } else {

            const td = document.createElement("td");
            td.contentEditable = "true";
            td.textContent = "Nueva celda";
            td.style.fontFamily = table.style.fontFamily;

            td.setAttribute("colspan", "1");
            td.setAttribute("rowspan", "1");

            row.appendChild(td);
        }
    }

    saveState();
}

let resizing = false;
let startX = 0;
let startWidth = 0;
let resizeCell = null;
function insertTable() {
    if (!activeEditor){
        alert("Selecciona un editor antes de insertar la tabla.");
        return;
    };

    const editor = activeEditor;
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

    const mergeRightBtn = document.createElement("button");
    mergeRightBtn.textContent = "Combinar →";
    mergeRightBtn.className = "table-control btn-merge-right";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar tabla";
    deleteBtn.className = "table-control-delete-table btn-delete-table";

    [
        addColBtn,
        addRowBtn,
        deleteRowBtn,
        deleteColBtn,
        mergeRightBtn,
        deleteBtn
    ].forEach(btn => {
        btn.setAttribute("contenteditable", "false");
        controlsTop.appendChild(btn);
    });

    // Crear tabla
    const table = document.createElement("table");
    table.className = "editor-table";
    table.style.fontFamily = currentFont;

    for (let r = 0; r < rows; r++) {
        const tr = document.createElement("tr");

        for (let c = 0; c < cols; c++) {
            const td = document.createElement("td");
            td.textContent = "Celda";
            td.contentEditable = "true";
            td.style.fontFamily = currentFont;

            // Inicializar explícitamente colspan y rowspan
            td.setAttribute("colspan", "1");
            td.setAttribute("rowspan", "1");

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

function insertHeaderImage() {

    const container = document.getElementById("header-logo-container");

    // Si ya hay imagen, no hacer nada
    if (container.querySelector(".image-wrapper")) {
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {

        const file = input.files[0];
        if (!file) return;

        new Compressor(file, {
            quality: 0.5,
            maxWidth: 1024,

            success(result) {

                const reader = new FileReader();

                reader.onload = function (e) {

                    const wrapper = document.createElement("div");
                    wrapper.className = "image-wrapper align-center";
                    wrapper.setAttribute("contenteditable", "false");

                    const imgContainer = document.createElement("div");
                    imgContainer.className = "img-container";

                    const img = document.createElement("img");
                    img.src = e.target.result;

                    imgContainer.appendChild(img);

                    //  Handles EXACTAMENTE como los tenías antes
                    ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(pos => {
                        const handle = document.createElement("div");
                        handle.className = "resize-handle " + pos;
                        handle.setAttribute("data-html2canvas-ignore", "true");
                        imgContainer.appendChild(handle);
                    });

                    //  Controles inferiores
                    const controlsBottom = document.createElement("div");
                    controlsBottom.className = "image-controls-bottom";
                    controlsBottom.setAttribute("data-html2canvas-ignore", "true");

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Eliminar imagen";
                    deleteBtn.className = "image-control-delete";

                    controlsBottom.appendChild(deleteBtn);

                    wrapper.append(imgContainer, controlsBottom);
                    container.appendChild(wrapper);

                    //  Aquí reactivas TU sistema ya existente
                    enableImageControls(wrapper);

                    deleteBtn.onclick = function () {
                        wrapper.remove();
                        saveState();
                    };

                    saveState();
                };

                reader.readAsDataURL(result);
            }
        });
    };

    input.click();
}

function insertImageBase64() {

    if (!activeEditor) {
        alert("Selecciona un editor antes de insertar la imagen.");
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {

        const file = input.files[0];
        if (!file) return;

        new Compressor(file, {
            quality: 0.5,
            maxWidth: 1024,

            success(result) {

                const reader = new FileReader();

                console.log("Tamaño original:", (file.size / 1024).toFixed(2), "KB");
                console.log("Tamaño comprimido:", (result.size / 1024).toFixed(2), "KB");

                reader.onload = function (e) {

                    // --- WRAPPER PRINCIPAL ---
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

                    // --- CONTENEDOR IMAGEN ---
                    const imgContainer = document.createElement("div");
                    imgContainer.className = "img-container";

                    const img = document.createElement("img");
                    img.src = e.target.result;

                    imgContainer.appendChild(img);

                    // --- CONTROLES INFERIORES ---
                    const controlsBottom = document.createElement("div");
                    controlsBottom.className = "image-controls-bottom";
                    controlsBottom.setAttribute("data-html2canvas-ignore", "true");

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Eliminar imagen";
                    deleteBtn.className = "image-control-delete";

                    controlsBottom.appendChild(deleteBtn);

                    // --- HANDLES RESIZE ---
                    ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(pos => {
                        const handle = document.createElement("div");
                        handle.className = "resize-handle " + pos;
                        handle.setAttribute("data-html2canvas-ignore", "true");
                        imgContainer.appendChild(handle);
                    });

                    wrapper.append(controlsTop, imgContainer, controlsBottom);

                    // --- ESPACIADO ---
                    const clearDiv = document.createElement("div");
                    clearDiv.className = "image-clear-fix";
                    clearDiv.setAttribute("contenteditable", "false");

                    const spaceAbove = document.createElement("p");
                    spaceAbove.innerHTML = "<br>";

                    const spaceBelow = document.createElement("p");
                    spaceBelow.innerHTML = "<br>";

                    // --- INSERTAR EN EL EDITOR ACTIVO ---
                    const sel = window.getSelection();

                    if (sel && sel.rangeCount > 0) {

                        const range = sel.getRangeAt(0);

                        //  Validar que el rango pertenece al editor activo
                        const container = range.commonAncestorContainer;
                        const parentEditor = container.nodeType === 3
                            ? container.parentNode.closest(".editor-section")
                            : container.closest(".editor-section");

                        if (parentEditor !== activeEditor) {
                            activeEditor.append(spaceAbove, wrapper, clearDiv, spaceBelow);
                        } else {

                            range.deleteContents();

                            range.insertNode(spaceAbove);
                            spaceAbove.after(wrapper);
                            wrapper.after(clearDiv);
                            clearDiv.after(spaceBelow);

                            range.setStart(spaceBelow, 0);
                            range.collapse(true);

                            sel.removeAllRanges();
                            sel.addRange(range);
                        }

                    } else {
                        activeEditor.append(spaceAbove, wrapper, clearDiv, spaceBelow);
                    }

                    saveState();
                };

                reader.readAsDataURL(result);
            },

            error(err) {
                console.error("Error al comprimir imagen:", err);
            }
        });
    };

    input.click();
}

// Función auxiliar para generar el string Base64 del PDF
async function generatePDFBase64() {
    const previewElement = document.getElementById("pdf-preview");
    
    // Obtenemos las dimensiones reales del elemento tal cual se ve en pantalla
    const rect = previewElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const options = {
        margin: 0,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { 
            scale: 2, // Subir a 2 mejora la precisión del renderizado de tablas
            useCORS: true,
            logging: false,
            width: width,  // Forzamos el ancho del canvas al ancho del elemento
            height: height, // Forzamos el alto del canvas al alto del elemento
            scrollX: 0,    // Evita desplazamientos si el usuario tiene scroll horizontal
            scrollY: 0
        },
        jsPDF: { 
            unit: "px", 
            format: [width, height], 
            orientation: "portrait",
            hotfixes: ["px_scaling"] // Ayuda a jsPDF a entender mejor los píxeles
        }
    };

    return await html2pdf()
        .set(options)
        .from(previewElement)
        .outputPdf('datauristring');
}

async function saveContent() {
    const headerContent = document.getElementById('header-editor').innerHTML;
    const bodyContent = document.getElementById('body-editor').innerHTML;
    const footerContent = document.getElementById('footer-editor').innerHTML;
    const filename = document.getElementById('filename').value || "Sin-nombre";

    // 1. Generamos el Preview en Base64 antes de enviar
    let pdfBase64 = "";
    try {
        pdfBase64 = await generatePDFBase64();
    } catch (e) {
        console.error("Error generando preview:", e);
    }

    const url = 'http://localhost:3000/documents';

    try {
        const res = await fetch(url);
        const data = await res.json();

        const nextId = data.length > 0
            ? Math.max(...data.map(d => d.id)) + 1
            : 1;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: nextId,
                name: filename,
                font: currentFont || "Arial",
                department: "sin asignar",
                header: headerContent,
                content: bodyContent,
                footer: footerContent,
                pageFormat: currentPageFormat,
                preview: pdfBase64 // <-- Aquí enviamos el Base64 a la columna 'preview'
            })
        });

        if (response.ok) {
            alert("Plantilla y Preview guardados correctamente");
        }
    } catch (error) {
        console.error('Error guardando documento:', error);
    }
}

function clearFormattingToParagraph() {
    if (!activeEditor){
        alert("Selecciona un editor antes de insertar la tabla.");
        return
    };
    const editor = activeEditor;
    editor.focus();
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

document.addEventListener("mousemove", function(e){

    const cell = e.target.closest("td");

    if(!cell) return;

    const rect = cell.getBoundingClientRect();
    const offset = 6;

    if(rect.right - e.clientX < offset){
        cell.style.cursor = "col-resize";
    }else{
        cell.style.cursor = "";
    }

});

document.addEventListener("mousedown", function(e){

    const cell = e.target.closest("td");
    if(!cell) return;

    const rect = cell.getBoundingClientRect();

    if(rect.right - e.clientX < 6){

        resizing = true;
        resizeCell = cell;
        startX = e.pageX;
        startWidth = cell.offsetWidth;

        e.preventDefault();
    }

});

document.addEventListener("mousemove", function(e){

    if(!resizing || !resizeCell) return;

    const table = resizeCell.closest("table");
    const columnIndex = resizeCell.cellIndex;

    const newWidth = startWidth + (e.pageX - startX);

    if(newWidth < 40) return;

    table.querySelectorAll("tr").forEach(row =>{

        const cell = row.children[columnIndex];
        if(cell){
            cell.style.width = newWidth + "px";
        }

    });

});

document.addEventListener("mouseup", function(){

    if(resizing){
        resizing = false;
        resizeCell = null;

        saveState(); // guardar cambio en historial
    }

});

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("btn-merge-right")) {
        mergeRight();
    }

});

headerEditor.addEventListener('input', (e) => {

    // Solo reaccionar si el cambio ocurre dentro de un contenteditable
    if (e.target.closest('[contenteditable="true"]')) {
        setActiveEditor(headerEditor, 'header');
        saveState();
    }

});

// --- CLICK: tablas + imágenes ---
document.addEventListener("click", function (e) {
    const editor = e.target.closest('.editor-section');
    if(!editor) return;
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

    const matrix = buildTableMatrix(table);

    if (!matrix.length) return;

    const totalCols = matrix[0].length;
    const lastRowIndex = matrix.length - 1;

    const newRow = table.insertRow();

    for (let c = 0; c < totalCols; c++) {

        const cellAbove = matrix[lastRowIndex][c];

        if (!cellAbove) continue;

        const rowspan = parseInt(cellAbove.getAttribute("rowspan")) || 1;

        // Si la celda viene extendida hacia abajo
        if (cellAbove.parentElement.rowIndex !== lastRowIndex) {

            cellAbove.setAttribute("rowspan", rowspan + 1);

        } else {

            const td = document.createElement("td");
            td.contentEditable = "true";
            td.textContent = "Celda";
            td.style.fontFamily = table.style.fontFamily;

            td.setAttribute("colspan", "1");
            td.setAttribute("rowspan", "1");

            newRow.appendChild(td);
        }
    }

    saveState();
}

if (target.classList.contains("btn-add-col")) {

    const matrix = buildTableMatrix(table);

    if (!matrix.length || !matrix[0].length) return;

    const totalRows = matrix.length;
    const insertIndex = matrix[0].length; // insertar al final

    for (let r = 0; r < totalRows; r++) {

        const row = table.rows[r];

        // Última celda visible en esa fila
        const lastCell = matrix[r][insertIndex - 1];

        //  Si por alguna razón no existe, crear celda normal
        if (!lastCell) {

            const td = document.createElement("td");
            td.contentEditable = "true";
            td.textContent = "Celda";
            td.setAttribute("colspan", "1");
            td.setAttribute("rowspan", "1");

            row.appendChild(td);
            continue;
        }

        const colspan = parseInt(lastCell.getAttribute("colspan")) || 1;

        // Verificar si la celda realmente pertenece a esta fila
        if (lastCell.parentElement === row) {

            // Si ocupa múltiples columnas → extender
            if (colspan > 1) {
                lastCell.setAttribute("colspan", colspan + 1);
            } else {

                const td = document.createElement("td");
                td.contentEditable = "true";
                td.textContent = "Celda";
                td.setAttribute("colspan", "1");
                td.setAttribute("rowspan", "1");

                row.appendChild(td);
            }

        } else {

            // Si la celda viene de arriba (rowspan) → extender horizontalmente
            lastCell.setAttribute("colspan", colspan + 1);
        }
    }

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
    if (!cell) return;

    const matrix = buildTableMatrix(table);
    if (!matrix.length) return;

    const rowIndex = cell.parentElement.rowIndex;
    const colIndex = matrix[rowIndex].indexOf(cell);

    if (colIndex === -1) return;

    const totalRows = matrix.length;
    const totalCols = matrix[0].length;

    // No permitir eliminar si es la última columna real
    if (totalCols <= 1) return;

    for (let r = 0; r < totalRows; r++) {

        const targetCell = matrix[r][colIndex];

        if (!targetCell) continue;

        const colspan = parseInt(targetCell.getAttribute("colspan")) || 1;

        // Si la celda ocupa varias columnas → reducir colspan
        if (colspan > 1) {

            targetCell.setAttribute("colspan", colspan - 1);

        } else {

            // Solo eliminar si pertenece realmente a esa fila
            if (targetCell.parentElement.rowIndex === r) {
                targetCell.remove();
            }
        }
    }

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

document.addEventListener("mousedown", function (e) {

    if (!e.target.classList.contains("resize-handle")) return;

    const editor = e.target.closest('.editor-section');
    if (!editor) return;

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

    const minWidth = 100;
    const maxWidth = 600;

    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

    const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
    const newHeight = newWidth / aspectRatio;

    currentImage.style.width = newWidth + "px";
    currentImage.style.height = newHeight + "px";

    currentContainer.style.width = currentImage.style.width;
    currentContainer.style.height = currentImage.style.height;
});

document.addEventListener("mouseup", function () {

    if (!isResizing) return;

    isResizing = false;
    currentHandle = null;
    currentContainer = null;
    currentImage = null;

    saveState();
});

editors.forEach(editor => {
    editor.addEventListener('input', updateInteractiveListeners);
});
// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.show-code').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = button.closest('.card');
            const editor = card.querySelector('.editor-section');
            toggleCodeMode(editor, button);
        });
    });
});

headerEditor.addEventListener('focus', () => {
    setActiveEditor(headerEditor, 'header');
});

headerEditor.addEventListener('input', () => {
    commitChange();
});

bodyEditor.addEventListener('focus', () => {
    setActiveEditor(bodyEditor, 'body');
});

footerEditor.addEventListener('focus', () => {
    setActiveEditor(footerEditor, 'footer');
});

document.querySelectorAll(".editor-section").forEach(editor => {
    editor.addEventListener("input", updatePreview);
});

document.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById('buttonModal');
    if (modalEl) {
        buttonModal = new bootstrap.Modal(modalEl);
    }
});

// Listeners de input
headerEditor.addEventListener("input", saveState);
bodyEditor.addEventListener("input", saveState);
footerEditor.addEventListener("input", saveState);















