let resizing = false;
let startX = 0;
let startWidth = 0;
let resizeCell = null;

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

let isResizing = false;
let currentHandle = null;
let currentContainer = null;
let currentImage = null;
function insertImageBase64() {

    const editor = document.getElementById("doc-body");

    if (!editor) {
        alert("No se encontró el editor.");
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

                    // WRAPPER
                    const wrapper = document.createElement("div");
                    wrapper.className = "image-wrapper align-center";
                    wrapper.setAttribute("contenteditable", "false");

                    // CONTROLES SUPERIORES
                    const controlsTop = document.createElement("div");
                    controlsTop.className = "image-controls-top";
                    controlsTop.setAttribute("data-html2canvas-ignore", "true");

                    const btnLeft = document.createElement("button");
                    btnLeft.textContent = "Izquierda";
                    btnLeft.className = "btn-img-left";

                    const btnCenter = document.createElement("button");
                    btnCenter.textContent = "Centro";
                    btnCenter.className = "btn-img-center";

                    const btnRight = document.createElement("button");
                    btnRight.textContent = "Derecha";
                    btnRight.className = "btn-img-right";

                    controlsTop.append(btnLeft, btnCenter, btnRight);

                    // CONTENEDOR IMAGEN
                    const imgContainer = document.createElement("div");
                    imgContainer.className = "img-container";

                    const img = document.createElement("img");
                    img.src = e.target.result;

                    imgContainer.appendChild(img);

                    // HANDLES RESIZE
                    ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(pos => {

                        const handle = document.createElement("div");

                        handle.className = "resize-handle " + pos;
                        handle.setAttribute("data-html2canvas-ignore", "true");

                        imgContainer.appendChild(handle);
                    });

                    // CONTROLES INFERIORES
                    const controlsBottom = document.createElement("div");
                    controlsBottom.className = "image-controls-bottom";
                    controlsBottom.setAttribute("data-html2canvas-ignore", "true");

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Eliminar imagen";
                    deleteBtn.className = "image-control-delete";

                    controlsBottom.appendChild(deleteBtn);

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
                        wrapper.after(clearDiv);
                        clearDiv.after(spaceBelow);

                        range.setStart(spaceBelow, 0);
                        range.collapse(true);

                        sel.removeAllRanges();
                        sel.addRange(range);

                    } else {

                        editor.append(spaceAbove, wrapper, clearDiv, spaceBelow);

                    }

                    saveState();
                };

                reader.readAsDataURL(result);
                saveState();
            },

            error(err) {
                console.error("Error al comprimir imagen:", err);
            }
        });
    };

    input.click();
}

let historyStack = [];
let historyIndex = -1;
function commitChange() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    editor.focus();
    saveState();
}



function saveState() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    let rawHTML = editor.innerHTML.trim();

    // Evitar estados duplicados
    if (
        historyStack.length > 0 &&
        historyStack[historyIndex] === rawHTML
    ) {
        return;
    }

    // Si el usuario hizo undo y luego modifica algo
    if (historyIndex < historyStack.length - 1) {

        historyStack = historyStack.slice(0, historyIndex + 1);

    }

    historyStack.push(rawHTML);
    historyIndex = historyStack.length - 1;
}

function undo() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    if (historyIndex > 0) {

        historyIndex--;
        editor.innerHTML = historyStack[historyIndex];

    }
}

function redo() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    if (historyIndex < historyStack.length - 1) {

        historyIndex++;
        editor.innerHTML = historyStack[historyIndex];

    }
}

function addLink() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    const sel = window.getSelection();

    if (!sel.rangeCount || sel.isCollapsed) {
        alert("Selecciona el texto que deseas enlazar.");
        return;
    }

    const range = sel.getRangeAt(0);

    // Verificar que la selección esté dentro del editor
    if (!editor.contains(range.commonAncestorContainer)) {
        alert("La selección debe estar dentro del documento.");
        return;
    }

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    // Si ya está dentro de un enlace
    if (parent.closest("a")) {
        alert("La selección ya está enlazada.");
        return;
    }

    let url = prompt("Ingresa la URL o correo:");
    if (!url) return;

    url = url.trim();

    // Detectar correos
    if (url.includes("@") && !url.startsWith("mailto:")) {
        url = "mailto:" + url;
    }

    // Agregar https si no existe
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

let typingTimer = null;
const editor = document.getElementById("doc-body");

editor.addEventListener("input", function () {

    // Cancelar temporizador anterior
    clearTimeout(typingTimer);

    // Guardar estado después de 500ms sin escribir
    typingTimer = setTimeout(() => {
        saveState();
    }, 500);

});

document.addEventListener("DOMContentLoaded", function () {

    const editor = document.getElementById("doc-body");

    if (editor) {
        historyStack.push(editor.innerHTML);
        historyIndex = 0;
    }

});

document.addEventListener("DOMContentLoaded", function () {

    const editor = document.getElementById("doc-body");

    if (editor) {

        historyStack.push(editor.innerHTML);
        historyIndex = 0;

    }

});

document.addEventListener("click", function (e) {

    const target = e.target;
    const imageWrapper = target.closest(".image-wrapper");

    if (!imageWrapper) return;

    // Alinear izquierda
    if (target.classList.contains("btn-img-left")) {

        imageWrapper.classList.remove("align-center", "align-right");
        imageWrapper.classList.add("align-left");

        saveState();
    }

    // Alinear centro
    if (target.classList.contains("btn-img-center")) {

        imageWrapper.classList.remove("align-left", "align-right");
        imageWrapper.classList.add("align-center");

        saveState();
    }

    // Alinear derecha
    if (target.classList.contains("btn-img-right")) {

        imageWrapper.classList.remove("align-left", "align-center");
        imageWrapper.classList.add("align-right");

        saveState();
    }

    // Eliminar imagen
    if (target.classList.contains("image-control-delete")) {

        const prev = imageWrapper.previousElementSibling;
        const next = imageWrapper.nextElementSibling;

        if (prev && prev.tagName === "P" && prev.innerHTML.trim() === "<br>") {
            prev.remove();
        }

        if (next && next.classList.contains("image-clear-fix")) {

            const nextAfterClear = next.nextElementSibling;

            next.remove();

            if (nextAfterClear &&
                nextAfterClear.tagName === "P" &&
                nextAfterClear.innerHTML.trim() === "<br>") {

                nextAfterClear.remove();
            }
        }

        imageWrapper.remove();

        saveState();
    }

});

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

function applyPageFormat(format) {

    const container = document.getElementById("document-container");
    const page = pageFormats[format];

    if (!container || !page) return;

    container.style.width = page.width + "px";
    container.style.minHeight = page.height + "px";
    saveState();
}

function getEditorSelection() {

    const editor = document.getElementById("doc-body");
    const sel = window.getSelection();

    if (!sel.rangeCount) return null;

    const range = sel.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
        alert("Selecciona texto dentro del documento.");
        return null;
    }

    return { sel, range };

}

function bold() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    const parent = range.commonAncestorContainer.parentElement;

    if (parent.closest('strong')) {

        const strong = parent.closest('strong');
        strong.replaceWith(...strong.childNodes);

    } else {

        const fragment = range.extractContents();

        const nestedStrong = fragment.querySelectorAll('strong');
        nestedStrong.forEach(el => el.replaceWith(...el.childNodes));

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
    saveState();

}

function underline() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    const underlineElement = parent.closest('u');

    if (underlineElement) {

        underlineElement.replaceWith(...underlineElement.childNodes);

    } else {

        const fragment = range.extractContents();

        const nestedUnderline = fragment.querySelectorAll('u');
        nestedUnderline.forEach(el => el.replaceWith(...el.childNodes));

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
    saveState();

}

function italic() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    const italicElement = parent.closest('em, i');

    if (italicElement) {

        italicElement.replaceWith(...italicElement.childNodes);

    } else {

        const fragment = range.extractContents();

        const nestedItalics = fragment.querySelectorAll('em, i');
        nestedItalics.forEach(el => el.replaceWith(...el.childNodes));

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
    saveState();

}

function strikethrough() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    const sElement = parent.closest('s, strike, del');

    if (sElement) {

        sElement.replaceWith(...sElement.childNodes);

    } else {

        const fragment = range.extractContents();

        const nestedS = fragment.querySelectorAll('s, strike, del');
        nestedS.forEach(el => el.replaceWith(...el.childNodes));

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

        range.setStartAfter(s);
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);

    }

    saveState();

}

function alignText(mode) {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { range } = selectionData;

    const editor = document.getElementById("doc-body");

    let node = range.startContainer;

    if (node.nodeType === 3) {
        node = node.parentElement;
    }

    if (!editor.contains(node)) return;

    let block = node.closest('p, h1, h2, h3, h4, h5, h6, li');

    // Si no existe bloque, crearlo
    if (!block) {

        const p = document.createElement('p');
        p.innerHTML = editor.innerHTML;

        editor.innerHTML = '';
        editor.appendChild(p);

        block = p;
    }

    const before = editor.innerHTML;

    block.style.textAlign = mode;

    const after = editor.innerHTML;

    if (before !== after) {
    saveState();
    }

}

function toggleList(type) {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { selection, range } = selectionData;
    const editor = document.getElementById("doc-body");

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    const list = parent.closest('ul, ol');

    const before = editor.innerHTML;

    // ===== SI YA ESTÁ DENTRO DE UNA LISTA → QUITAR =====
    if (list && editor.contains(list)) {

        const fragment = document.createDocumentFragment();

        Array.from(list.querySelectorAll('li')).forEach(li => {

            const p = document.createElement('p');

            while (li.firstChild) {
                p.appendChild(li.firstChild);
            }

            fragment.appendChild(p);

        });

        list.replaceWith(fragment);

    } 
    // ===== SI NO ESTÁ EN LISTA → CREAR =====
    else {

        const newList = document.createElement(type);
        const li = document.createElement('li');

        li.appendChild(range.extractContents());
        newList.appendChild(li);

        range.insertNode(newList);

    }

    selection.removeAllRanges();

    const after = editor.innerHTML;

    if (before !== after) {
    saveState();
    }

}

function getCurrentCell() {

    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    let node = selection.anchorNode;

    if (node.nodeType === 3) {
        node = node.parentNode;
    }

    return node.closest("td");
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

function mergeRight(table) {

    const td = getCurrentCell();
    if (!td) return;

    const tr = td.parentElement;

    const matrix = buildTableMatrix(table);

    const rowIndex = tr.rowIndex;

    const totalColumns = matrix[0].length;

    const realCells = Array.from(tr.children);

    realCells.forEach(cell => {

        if (cell !== td) {
            cell.remove();
        }

    });

    td.setAttribute("colspan", totalColumns);

}

function addColumn(table) {

    const currentCell = getCurrentCell();
    if (!currentCell) return;

    const matrix = buildTableMatrix(table);

    let colIndex = -1;

    for (let r = 0; r < matrix.length; r++) {
        const c = matrix[r].indexOf(currentCell);
        if (c !== -1) {
            colIndex = c;
            break;
        }
    }

    if (colIndex === -1) return;

    const insertIndex = colIndex + 1;

    for (let r = 0; r < matrix.length; r++) {

        const row = table.rows[r];
        const refCell = matrix[r][colIndex];

        const colspan = parseInt(refCell.getAttribute("colspan")) || 1;

        if (colspan > 1) {

            refCell.setAttribute("colspan", colspan + 1);

        } else {

            const td = document.createElement("td");

            td.contentEditable = "true";
            td.textContent = "Celda";

            td.setAttribute("colspan","1");
            td.setAttribute("rowspan","1");

            refCell.after(td);

        }
    }
}

function deleteColumn(table){

    const currentCell = getCurrentCell();
    if(!currentCell) return;

    const matrix = buildTableMatrix(table);

    let colIndex = -1;

    for(let r=0; r<matrix.length; r++){

        const c = matrix[r].indexOf(currentCell);

        if(c !== -1){
            colIndex = c;
            break;
        }

    }

    if(colIndex === -1) return;

    for(let r=0; r<matrix.length; r++){

        const cell = matrix[r][colIndex];

        if(!cell) continue;

        const colspan = parseInt(cell.getAttribute("colspan")) || 1;

        if(colspan > 1){

            cell.setAttribute("colspan", colspan - 1);

        }else{

            cell.remove();

        }

    }

}

document.addEventListener("click", function(e){

    const target = e.target;

    const tableWrapper = target.closest(".table-wrapper");
    if(!tableWrapper) return;

    const table = tableWrapper.querySelector("table");
    if(!table) return;

    // Agregar columna
    if(target.classList.contains("btn-add-col")){
        addColumn(table);
    }

    // Eliminar columna
    if(target.classList.contains("btn-delete-col")){
        deleteColumn(table);
    }

    // Agregar fila
    if(target.classList.contains("btn-add-row")){

        const matrix = buildTableMatrix(table);
        const totalCols = matrix[0].length;

        const newRow = table.insertRow();

        for(let i=0;i<totalCols;i++){

            const td = document.createElement("td");

            td.contentEditable = "true";
            td.textContent = "Celda";
            td.setAttribute("colspan","1");
            td.setAttribute("rowspan","1");

            newRow.appendChild(td);

        }
    }

    // Eliminar fila
    if(target.classList.contains("btn-delete-row")){
        deleteRow(table);
    }

    // Combinar a la derecha
    if(target.classList.contains("btn-merge-right")){
        mergeRight(table);
    }

});




function clearDocument() {

    ["doc-header", "doc-body", "doc-footer"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });

}

function sanitizeLoadedImages(container){

    const wrappers = container.querySelectorAll(".image-wrapper");

    wrappers.forEach(wrapper => {

        const topControls = wrapper.querySelector(".image-controls-top");
        if(topControls) topControls.remove();

        const bottomControls = wrapper.querySelector(".image-controls-bottom");
        if(bottomControls) bottomControls.remove();

        wrapper.querySelectorAll(".resize-handle").forEach(h => h.remove());

        wrapper.setAttribute("contenteditable", "false");

        const imgContainer = wrapper.querySelector(".img-container");
        if(imgContainer){
            imgContainer.setAttribute("contenteditable","false");
        }

    });

}

function sanitizeLoadedTables(container){

    const wrappers = container.querySelectorAll(".table-wrapper");

    wrappers.forEach(wrapper => {

        const deleteTableBtn = wrapper.querySelector(".btn-delete-table");

        if(deleteTableBtn){
            deleteTableBtn.remove();
        }

    });

}

function sanitizeHeaderLogoButton(container){

    const logoBtn = container.querySelector("#insert-header-logo-btn");

    if(logoBtn){
        logoBtn.remove();
    }

}

function enableTableEditing(container){

    const tables = container.querySelectorAll("table");

    tables.forEach(table => {

        table.querySelectorAll("td").forEach(td => {

            td.contentEditable = "true";

            if(!td.getAttribute("colspan"))
                td.setAttribute("colspan","1");

            if(!td.getAttribute("rowspan"))
                td.setAttribute("rowspan","1");

        });

    });

}


async function loadTemplate() {

    clearDocument();

    const id = prompt("Ingrese el ID del documento");

    if (!id) {
        alert("Debe ingresar un ID");
        return;
    }

    try {

        const response = await fetch(`http://localhost:3000/documents/${id}`);

        if (!response.ok) {
            throw new Error("Error HTTP: " + response.status);
        }

        const data = await response.json();

        console.log("Respuesta API:", data);

        const documentData = Array.isArray(data) ? data[0] : data;

        renderTemplate(documentData);

        //  APLICAR LA FUENTE AL DOCUMENTO
        if (documentData.font) {

            const documentContainer = document.getElementById("document-container");

            documentContainer.style.fontFamily = documentData.font;

        }

        saveState();
    } catch (error) {

        console.error("Error real:", error);
        alert("No se pudo cargar el documento");

    }

}

function renderTemplate(doc) {

    const header = document.getElementById("doc-header");
    const body = document.getElementById("doc-body");
    const footer = document.getElementById("doc-footer");
    const container = document.getElementById("document-container");

    if (header) header.innerHTML = doc.header || "";
    if (body) body.innerHTML = doc.content || "";
    if (footer) footer.innerHTML = doc.footer || "";

    // --- APLICAR FORMATO DE PÁGINA ---
    if (doc.pageformat) {
        applyPageFormat(doc.pageformat);
    }

    // --- APLICAR FUENTE DE LA PLANTILLA ---
    if (doc.font && container) {

        container.style.fontFamily = doc.font;

        const elements = container.querySelectorAll("*");

        elements.forEach(el => {
            el.style.fontFamily = doc.font;
        });

    }

    // --- ELIMINAR BOTÓN DE LOGO ---
    sanitizeHeaderLogoButton(header);

    // --- LIMPIAR IMÁGENES ---
    sanitizeLoadedImages(header);
    sanitizeLoadedImages(body);
    sanitizeLoadedImages(footer);

    // --- LIMPIAR TABLAS ---
    sanitizeLoadedTables(header);
    sanitizeLoadedTables(body);
    sanitizeLoadedTables(footer);

    // --- REACTIVAR EDICIÓN DE TABLAS ---
    enableTableEditing(header);
    enableTableEditing(body);
    enableTableEditing(footer);

}