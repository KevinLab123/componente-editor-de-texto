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
    commitChange(); // Guardar estado después de aplicar formato
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

headerEditor.addEventListener('focus', () => {
    setActiveEditor(headerEditor, 'header');
});

bodyEditor.addEventListener('focus', () => {
    setActiveEditor(bodyEditor, 'body');
});

footerEditor.addEventListener('focus', () => {
    setActiveEditor(footerEditor, 'footer');
});


// Actualizar elementos interactivos cuando haya cambios en el contenido
const editors = document.querySelectorAll('.editor-section');

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

function commitChange() {
    if (!activeEditor) return;

    activeEditor.focus();   // asegurar foco
    saveState();            // guardar estado
}

function saveState() {

    if (!activeEditor) return;

    let editorHistory = histories[activeKey];
    let rawHTML = activeEditor.innerHTML;

    //  No guardar si es igual al último estado
    if (editorHistory.history.length > 0 &&
        editorHistory.history[editorHistory.currentIndex] === rawHTML) {
        return;
    }

    if (editorHistory.currentIndex < editorHistory.history.length - 1) {
        editorHistory.history = editorHistory.history.slice(0, editorHistory.currentIndex + 1);
    }

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
// Listeners de input
headerEditor.addEventListener("input", saveState);
bodyEditor.addEventListener("input", saveState);
footerEditor.addEventListener("input", saveState);

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

                        // 🔥 Validar que el rango pertenece al editor activo
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



















