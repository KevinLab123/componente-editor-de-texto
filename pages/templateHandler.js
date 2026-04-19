let resizing = false;
let startX = 0;
let startWidth = 0;
let resizeCell = null;
let templateFont = null;

/** Editor activo para la barra superior (encabezado, cuerpo o pie). */
let activeFormatSection = null;

/** HTML por defecto del encabezado al limpiar o si la plantilla no trae header. */
let defaultDocHeaderSnapshot = "";

const API_URL = "http://localhost:3000";

function getCurrentUser() {
    try {
        const raw = localStorage.getItem("currentUser");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** Rol vista (viewer): puede cambiar el estado de revisión del reporte. */
function canManageReportReviewState() {
    const u = getCurrentUser();
    return Boolean(u && u.role === "viewer");
}

function formatReportTimestamp(val) {
    if (!val) return "—";
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString("es-ES");
}

let usersByIdCache = null;
async function getUsersByIdMap() {
    if (usersByIdCache) return usersByIdCache;
    try {
        const r = await fetch(`${API_URL}/users`);
        if (!r.ok) return {};
        const list = await r.json();
        const map = {};
        (Array.isArray(list) ? list : []).forEach((u) => {
            map[u.id] = u.username;
        });
        usersByIdCache = map;
        return map;
    } catch {
        return {};
    }
}

function applyReportReviewStateControls() {
    const sel = document.getElementById("report-state-select");
    const help = document.getElementById("report-state-help");
    if (!sel) return;
    const canEdit = canManageReportReviewState();
    sel.disabled = !canEdit;
    if (help) {
        help.textContent = canEdit
            ? "Con el rol vista puedes cambiar el estado y usar Guardar documento."
            : "Solo el rol vista (viewer) puede modificar el estado de revisión.";
    }
}

function initReportWorkflowUi(reportIdFromUrl) {
    const card = document.getElementById("report-workflow-card");
    const newHint = document.getElementById("report-new-hint");
    const datesCol = document.getElementById("report-dates-col");
    const usersCol = document.getElementById("report-users-col");
    if (!card) return;

    if (reportIdFromUrl) {
        card.classList.remove("d-none");
        if (newHint) newHint.classList.add("d-none");
        if (datesCol) datesCol.classList.remove("d-none");
        if (usersCol) usersCol.classList.remove("d-none");
        return;
    }

    if (getTemplateIdFromURL()) {
        card.classList.remove("d-none");
        if (newHint) newHint.classList.remove("d-none");
        if (datesCol) datesCol.classList.add("d-none");
        if (usersCol) usersCol.classList.add("d-none");
        const sel = document.getElementById("report-state-select");
        if (sel) {
            sel.value = "por revisar";
            sel.disabled = true;
        }
        applyReportReviewStateControls();
    }
}

async function populateWorkflowFromReport(report) {
    const usersMap = await getUsersByIdMap();
    const stateVal = report.state || "por revisar";
    document.body.dataset.reportState = stateVal;
    document.body.dataset.reportCreatedBy =
        report.created_by != null ? String(report.created_by) : "";
    document.body.dataset.reportReviewedBy =
        report.reviewed_by != null ? String(report.reviewed_by) : "";
    document.body.dataset.reportCreatedAt = report.created_at || "";
    document.body.dataset.reportLastModification = report.last_modification || "";

    const sel = document.getElementById("report-state-select");
    if (sel) {
        sel.value = stateVal;
        const hasOpt = [...sel.options].some((o) => o.value === sel.value);
        if (!hasOpt) {
            const opt = document.createElement("option");
            opt.value = stateVal;
            opt.textContent = stateVal;
            sel.appendChild(opt);
            sel.value = stateVal;
        }
    }

    const cAt = document.getElementById("report-created-at-display");
    const lMod = document.getElementById("report-last-modification-display");
    const cBy = document.getElementById("report-created-by-display");
    const rBy = document.getElementById("report-reviewed-by-display");
    if (cAt) cAt.textContent = formatReportTimestamp(report.created_at);
    if (lMod) lMod.textContent = formatReportTimestamp(report.last_modification);
    if (cBy) {
        cBy.textContent =
            report.created_by != null
                ? usersMap[report.created_by] || `#${report.created_by}`
                : "—";
    }
    if (rBy) {
        rBy.textContent =
            report.reviewed_by != null
                ? usersMap[report.reviewed_by] || `#${report.reviewed_by}`
                : "—";
    }

    const card = document.getElementById("report-workflow-card");
    if (card) card.classList.remove("d-none");
    applyReportReviewStateControls();
}

function buildReportMetadataForUpdate() {
    const sel = document.getElementById("report-state-select");
    const stateVal = sel
        ? sel.value
        : document.body.dataset.reportState || "por revisar";
    const prevState = document.body.dataset.reportState || "por revisar";
    let reviewedByVal = null;
    const prevRb = document.body.dataset.reportReviewedBy;
    if (prevRb && prevRb !== "") {
        const n = parseInt(prevRb, 10);
        if (!Number.isNaN(n)) reviewedByVal = n;
    }
    if (canManageReportReviewState()) {
        const u = getCurrentUser();
        if (stateVal !== prevState && u && u.id != null) {
            reviewedByVal = u.id;
        }
    }
    return { state: stateVal, reviewed_by: reviewedByVal };
}

function getFormatTargetEditor() {
    return activeFormatSection || document.getElementById("doc-body");
}

function handleFileMenu(option) {
    switch (option) {
        case "save":
            handleSaveAction();
            break;
        case "pdf":
            saveAsPDF();
            break;
        case "new":
            if (confirm("¿Ir a la selección de plantillas para comenzar un documento nuevo?")) {
                window.location.href = "templateSelector.html";
            }
            break;
        default:
            break;
    }
}

function selectionInsideEditor(editor, range) {
    return editor.contains(range.commonAncestorContainer);
}

function maybeSaveStateAfterFormat(editor) {
    const body = document.getElementById("doc-body");
    if (editor === body) {
        saveState();
    }
}

/**
 * Color de texto: envuelve la selección en un &lt;span&gt; (sin document.execCommand).
 */
function applyTextColor(color) {
    const editor = getFormatTargetEditor();
    if (!editor) {
        return;
    }
    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        notifyWarning(UI_HINT.colorNeedSelection);
        return;
    }
    const range = sel.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) {
        notifyWarning("La selección debe estar dentro del encabezado, contenido o pie.");
        return;
    }
    const span = document.createElement("span");
    span.style.color = color;
    try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        maybeSaveStateAfterFormat(editor);
        updatePreview();
        notifyInfo("Color de texto aplicado.");
    } catch (e) {
        console.error("applyTextColor:", e);
    }
}

/**
 * Color de fondo del texto: envuelve la selección en un &lt;span&gt; (sin document.execCommand).
 */
function applyHighlightColor(color) {
    const editor = getFormatTargetEditor();
    if (!editor) {
        return;
    }
    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        notifyWarning(UI_HINT.colorNeedSelection);
        return;
    }
    const range = sel.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) {
        notifyWarning("La selección debe estar dentro del encabezado, contenido o pie.");
        return;
    }
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        maybeSaveStateAfterFormat(editor);
        updatePreview();
        notifyInfo("Color de fondo aplicado al texto seleccionado.");
    } catch (e) {
        console.error("applyHighlightColor:", e);
    }
}

/**
 * Misma idea que setBlockFormat en templateCreator: reemplaza o inserta H1–H6 / P.
 */
function setBlockFormatForActiveSection(tagName) {
    const editor = getFormatTargetEditor();
    if (!editor) {
        notifyWarning("Selecciona un editor antes de aplicar formato.");
        return;
    }
    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) {
        notifyWarning(UI_HINT.formatBlockNeedSelection);
        return;
    }
    const range = sel.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) {
        notifyWarning("Selecciona texto dentro del encabezado, contenido o pie.");
        return;
    }

    let parentBlock = range.commonAncestorContainer;
    if (parentBlock.nodeType === 3) {
        parentBlock = parentBlock.parentNode;
    }

    const blockTags = ["H1", "H2", "H3", "H4", "H5", "H6", "P"];
    const closestBlock = parentBlock.closest(blockTags.join(","));

    const newBlock = document.createElement(tagName);
    const container = document.getElementById("document-container");
    const ff =
        editor.style.fontFamily ||
        (container && container.style.fontFamily) ||
        templateFont ||
        "Arial, sans-serif";
    newBlock.style.fontFamily = ff;

    if (closestBlock && editor.contains(closestBlock)) {
        newBlock.innerHTML = closestBlock.innerHTML;
        closestBlock.replaceWith(newBlock);
        sel.removeAllRanges();
        maybeSaveStateAfterFormat(editor);
        updatePreview();
        notifyInfo("Formato de bloque aplicado (" + tagName.toUpperCase() + ").");
    } else {
        newBlock.appendChild(range.extractContents());
        range.insertNode(newBlock);
        sel.removeAllRanges();
        maybeSaveStateAfterFormat(editor);
        updatePreview();
        notifyInfo("Formato de bloque aplicado (" + tagName.toUpperCase() + ").");
    }
}

/**
 * Misma idea que setFontSize en templateCreator: &lt;span style="font-size"&gt;.
 */
function setFontSizeForActiveSection(size) {
    const editor = getFormatTargetEditor();
    if (!editor) {
        notifyWarning("Selecciona un editor antes de cambiar el tamaño de fuente.");
        return;
    }
    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        notifyWarning("Selecciona texto para cambiar el tamaño.");
        return;
    }
    const range = sel.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) {
        notifyWarning(UI_HINT.selectContentArea);
        return;
    }

    const span = document.createElement("span");
    span.style.fontSize = size;

    try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        applyTemplateFont();
        maybeSaveStateAfterFormat(editor);
        updatePreview();
        notifyInfo("Tamaño de fuente aplicado a la selección.");
    } catch (e) {
        console.error("setFontSizeForActiveSection:", e);
        notifyError("No se pudo aplicar el tamaño de fuente.");
    }
}

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
let currentPageFormat = "A4";
function insertImageBase64() {

    const editor = document.getElementById("doc-body");

    if (!editor) {
        notifyWarning("No se encontró el editor.");
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
                    updatePreview();
                    saveState();
                };

                reader.readAsDataURL(result);
                updatePreview();
                saveState();
            },

            error(err) {
                console.error("Error al comprimir imagen:", err);
            }
        });
    };

    input.click();
}

/**
 * Logo institucional en el encabezado (misma lógica que templateCreator; sin enableImageControls — el resize global ya aplica).
 */
function insertHeaderImage() {

    const container = document.getElementById("header-logo-container");

    if (!container) {
        return;
    }

    if (container.querySelector(".image-wrapper")) {
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {

        const file = input.files[0];
        if (!file) {
            return;
        }

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

                    ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(pos => {
                        const handle = document.createElement("div");
                        handle.className = "resize-handle " + pos;
                        handle.setAttribute("data-html2canvas-ignore", "true");
                        imgContainer.appendChild(handle);
                    });

                    const controlsBottom = document.createElement("div");
                    controlsBottom.className = "image-controls-bottom";
                    controlsBottom.setAttribute("data-html2canvas-ignore", "true");

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Eliminar imagen";
                    deleteBtn.className = "image-control-delete";

                    controlsBottom.appendChild(deleteBtn);

                    wrapper.append(imgContainer, controlsBottom);
                    container.appendChild(wrapper);

                    deleteBtn.onclick = function () {
                        wrapper.remove();
                        updatePreview();
                    };

                    updatePreview();
                };

                reader.readAsDataURL(result);
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
    updatePreview();
}

function redo() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    if (historyIndex < historyStack.length - 1) {

        historyIndex++;
        editor.innerHTML = historyStack[historyIndex];

    }
    updatePreview();
}

function addLink() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    const sel = window.getSelection();

    if (!sel.rangeCount || sel.isCollapsed) {
        notifyWarning("Selecciona el texto que deseas enlazar.");
        return;
    }

    const range = sel.getRangeAt(0);

    // Verificar que la selección esté dentro del editor
    if (!editor.contains(range.commonAncestorContainer)) {
        notifyWarning("La selección debe estar dentro del documento.");
        return;
    }

    const parent = range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    // Si ya está dentro de un enlace
    if (parent.closest("a")) {
        notifyWarning("La selección ya está enlazada.");
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
    updatePreview();
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

    const dh = document.getElementById("doc-header");
    if (dh) {
        defaultDocHeaderSnapshot = dh.innerHTML;
    }

    const wrap = document.getElementById("document-container");
    if (wrap) {
        wrap.addEventListener("click", function (e) {
            const sec = e.target.closest(".editor-section");
            if (sec) {
                activeFormatSection = sec;
            }
        });
        wrap.addEventListener("focusin", function (e) {
            const sec = e.target.closest(".editor-section");
            if (sec) {
                activeFormatSection = sec;
            }
        });
    }

    const editor = document.getElementById("doc-body");

    if (editor) {
        historyStack.push(editor.innerHTML);
        historyIndex = 0;
        activeFormatSection = editor;
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
    const preview = document.getElementById("pdf-preview");

    const page = pageFormats[format];

    if (!container || !preview || !page) return;

    // Editor
    container.style.width = page.width + "px";
    container.style.minHeight = page.height + "px";

    //  Preview (TU IDEA)
    preview.style.width = page.width + "px";
    preview.style.minHeight = page.height + "px";

    saveState();
}

function getEditorSelection() {

    const editor = document.getElementById("doc-body");
    const sel = window.getSelection();

    if (!sel.rangeCount) return null;

    const range = sel.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
        notifyWarning(UI_HINT.selectContentArea + " Usa el área «Contenido» para negrita, cursiva y listas.");
        return null;
    }

    return { sel, range };

}

async function getTemplateFont(documentId) {

    try {

        const response = await fetch(`http://localhost:3000/documents/${documentId}`);

        if (!response.ok) {
            throw new Error("Error HTTP: " + response.status);
        }

        const data = await response.json();

        const documentData = Array.isArray(data) ? data[0] : data;

        templateFont = documentData.font;

        return templateFont;

    } catch (error) {

        console.error("Error obteniendo la fuente:", error);
        return null;

    }

}

function applyTemplateFont() {

    if (!templateFont) return;

    const container = document.getElementById("document-container");

    // Aplicar al contenedor
    container.style.fontFamily = templateFont;

    // Aplicar a todos los elementos dentro del documento
    const allElements = container.querySelectorAll('*');

    allElements.forEach(el => {
        el.style.fontFamily = templateFont;
    });

}

function bold() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    if (range.collapsed) {
        notifyWarning(UI_HINT.selectNonEmptyText);
        return;
    }

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

    // NORMALIZAR FUENTE
    applyTemplateFont();
    updatePreview();
    saveState();

}

function underline() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    if (range.collapsed) {
        notifyWarning(UI_HINT.selectNonEmptyText);
        return;
    }

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
    // NORMALIZAR FUENTE
    applyTemplateFont();
    updatePreview();
    saveState();

}

function italic() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    if (range.collapsed) {
        notifyWarning(UI_HINT.selectNonEmptyText);
        return;
    }

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
    // NORMALIZAR FUENTE
    applyTemplateFont();
    updatePreview();
    saveState();

}

function strikethrough() {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    if (range.collapsed) {
        notifyWarning(UI_HINT.selectNonEmptyText);
        return;
    }

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
    // NORMALIZAR FUENTE
    applyTemplateFont();
    updatePreview();
    saveState();

}

function alignText(mode) {

    const selection = window.getSelection();
    if (!selection.rangeCount) {
        notifyWarning(UI_HINT.selectTextAlign);
        return;
    }

    const range = selection.getRangeAt(0);
    const editor = document.getElementById("doc-body");

    if (!editor.contains(range.commonAncestorContainer)) {
        notifyWarning(UI_HINT.selectContentArea);
        return;
    }

    const blocks = editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div');

    let changed = false;

    blocks.forEach(block => {

        if (range.intersectsNode(block)) {

            if (block.style.textAlign !== mode) {
                block.style.textAlign = mode;
                changed = true;
            }

        }

    });

    if (changed) {
        updatePreview();
        saveState();
        notifyInfo("Alineación aplicada al contenido seleccionado.");
    } else {
        notifyInfo(UI_HINT.alignNoChange);
    }

}

function toggleList(type) {

    const selectionData = getEditorSelection();
    if (!selectionData) return;

    const { sel, range } = selectionData;

    if (range.collapsed) {
        notifyWarning(UI_HINT.listNeedSelection);
        return;
    }
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

    sel.removeAllRanges();

    const after = editor.innerHTML;

    if (before !== after) {
    updatePreview();
    saveState();
    notifyInfo("Lista actualizada.");
    }

}

function getCurrentCell() {

    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    let node = selection.anchorNode;

    if (node.nodeType === 3) {
        node = node.parentNode;
    }

    return node.closest("td, th");
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
    if (!td) {
        notifyWarning(UI_HINT.tableNeedCell + " " + UI_HINT.tableMergeExplain);
        return;
    }

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
    notifySuccess("Celdas de la fila combinadas en una sola.");
    updatePreview();
    saveState();
}

function addColumn(table) {

    const currentCell = getCurrentCell();
    if (!currentCell) {
        notifyWarning(UI_HINT.tableNeedCell);
        return;
    }

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
    saveState();
    updatePreview();
}

function deleteColumn(table){

    const currentCell = getCurrentCell();
    if(!currentCell) {
        notifyWarning(UI_HINT.tableNeedCell);
        return;
    }

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
    saveState();
    updatePreview();
}

function deleteRow(table){

    const currentCell = getCurrentCell();
    if(!currentCell) {
        notifyWarning(UI_HINT.tableNeedCell);
        return;
    }

    const matrix = buildTableMatrix(table);

    let rowIndex = -1;

    for(let r = 0; r < matrix.length; r++){
        if(matrix[r].includes(currentCell)){
            rowIndex = r;
            break;
        }
    }

    if(rowIndex === -1) return;

    const row = table.rows[rowIndex];

    for(let c = 0; c < matrix[rowIndex].length; c++){

        const cell = matrix[rowIndex][c];
        if(!cell) continue;

        const cellRow = cell.parentElement.rowIndex;

        const rowspan = parseInt(cell.getAttribute("rowspan")) || 1;

        // Caso 1: la celda viene desde arriba y atraviesa la fila eliminada
        if(cellRow < rowIndex){

            cell.setAttribute("rowspan", rowspan - 1);

        }
        // Caso 2: la celda comienza en la fila eliminada y tiene rowspan
        else if(cellRow === rowIndex && rowspan > 1){

            const nextRow = table.rows[rowIndex + 1];

            if(nextRow){

                const newCell = cell.cloneNode(true);

                newCell.setAttribute("rowspan", rowspan - 1);

                nextRow.insertBefore(newCell, nextRow.cells[c] || null);

            }

        }

    }

    row.remove();
    updatePreview();
    saveState();
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
        applyTemplateFont();
    }

    // Eliminar columna
    if(target.classList.contains("btn-delete-col")){
        deleteColumn(table);
        applyTemplateFont();
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
        applyTemplateFont();
    }

    // Eliminar fila
    if(target.classList.contains("btn-delete-row")){
        deleteRow(table);
        applyTemplateFont();
    }

    // Combinar a la derecha
    if(target.classList.contains("btn-merge-right")){
        mergeRight(table);
        applyTemplateFont();
    }

});


function clearFormattingToParagraph() {

    const editor = document.getElementById("doc-body");
    if (!editor) return;

    editor.focus();

    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    const blocks = editor.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6');

    // ZONAS PROTEGIDAS
    const protectedSelector = `
        table, thead, tbody, tfoot, tr, td, th,
        button, input, select, textarea,
        [contenteditable="false"],
        [data-wrapper],
        [data-protected]
    `;

    let changed = false;

    blocks.forEach(block => {

        if (!range.intersectsNode(block)) return;

        if (block.closest(protectedSelector)) {
            notifyInfo(UI_HINT.protectedNoClear);
            return;
        }

        // Etiquetas inline a remover
        const inlineTags = [
            'strong','b','em','i','u','s','del','strike',
            'span','font','mark','small','big','sub','sup'
        ];

        block.querySelectorAll(inlineTags.join(',')).forEach(el => {

            if (el.closest(protectedSelector)) return;

            while (el.firstChild) {
                el.parentNode.insertBefore(el.firstChild, el);
            }

            el.remove();
            changed = true;
        });

        // Limpiar atributos visuales de elementos internos
        block.querySelectorAll('*').forEach(el => {

            if (el.closest(protectedSelector)) return;

            if (
                el.hasAttribute('style') ||
                el.hasAttribute('class') ||
                el.hasAttribute('color') ||
                el.hasAttribute('face') ||
                el.hasAttribute('size')
            ) {
                changed = true;
            }

            el.removeAttribute('style');
            el.removeAttribute('class');
            el.removeAttribute('color');
            el.removeAttribute('face');
            el.removeAttribute('size');

        });

        // Limpiar atributos del bloque principal
        if (
            block.hasAttribute('style') ||
            block.hasAttribute('class')
        ) {
            changed = true;
        }

        block.removeAttribute('style');
        block.removeAttribute('class');

    });

    

    if (!changed) {
        notifyInfo("No se eliminó formato: revisa que la selección incluya texto con estilo o que no esté en una zona protegida.");
        return;
    }

    sel.removeAllRanges();

    const newRange = document.createRange();
    newRange.selectNodeContents(editor);
    newRange.collapse(false);

    sel.addRange(newRange);

    applyTemplateFont();
    updatePreview();
    saveState();
    notifySuccess("Formato limpiado en la selección.");
}

function saveAsPDF() {
        const preview = document.getElementById("pdf-preview");

        const options = {
            margin: 0,
            filename: "Reporte" + ".pdf",
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

/**
 * Genera el PDF del área de previsualización como data URI (base64), igual que en templateCreator.
 */
async function generateReportPreviewBase64() {
    const previewElement = document.getElementById("pdf-preview");
    if (!previewElement) {
        return "";
    }

    const rect = previewElement.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    const options = {
        margin: 0,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            width,
            height,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: {
            unit: "px",
            format: [width, height],
            orientation: "portrait",
            hotfixes: ["px_scaling"]
        }
    };

    return await html2pdf()
        .set(options)
        .from(previewElement)
        .outputPdf("datauristring");
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


    const header = buildCleanSection("doc-header");
    const body   = buildCleanSection("doc-body");
    const footer = buildCleanSection("doc-footer");

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

["doc-header", "doc-body"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("input", updatePreview);
    }
});

function clearDocument() {

    const headerEl = document.getElementById("doc-header");
    if (headerEl) {
        headerEl.innerHTML = defaultDocHeaderSnapshot || "";
    }

    ["doc-body", "doc-footer"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
        }
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


// Variable global que ya tenías
let currentBaseTemplateId = null;

// NUEVA FUNCIÓN: Extraer el ID de la URL
function getTemplateIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id'); // Retorna el valor de ?id=X
}

async function loadTemplate() {
    clearDocument();

    // CAMBIO CLAVE: Intentamos obtener el ID de la URL primero
    let id = getTemplateIdFromURL();

    // Si por alguna razón no hay ID en la URL, podemos dejar el prompt como respaldo 
    // o redirigir de vuelta al selector
    if (!id) {
        console.warn("No se encontró ID en la URL, solicitando manualmente...");
        id = prompt("Ingrese el ID del documento");
    }

    if (!id) return;

    try {
        const response = await fetch(`http://localhost:3000/documents/${id}`);
        if (!response.ok) throw new Error("Error HTTP: " + response.status);

        const data = await response.json();
        const documentData = Array.isArray(data) ? data[0] : data;

        // Tu lógica de renderizado existente
        renderTemplate(documentData);

        // Lógica de fuente y estados
        await getTemplateFont(id);
        currentBaseTemplateId = id;
        
        updatePreview();
        saveState();

    } catch (error) {
        console.error("Error al cargar:", error);
        notifyError("No se pudo cargar la plantilla seleccionada");
    }
}

// EJECUCIÓN AUTOMÁTICA AL CARGAR LA PÁGINA
window.onload = () => {
    // Si la URL trae un ID, cargamos automáticamente
    if (getTemplateIdFromURL()) {
        loadTemplate();
    }
};

// Función para registrar el reporte sin consecutivo específico
async function saveReport() {
    if (!currentBaseTemplateId) {
        notifyWarning("Error: No hay una plantilla base cargada.");
        return;
    }

    const creator = getCurrentUser();
    if (!creator || creator.id == null) {
        notifyWarning("Inicia sesión para registrar el reporte (se requiere creador).");
        return;
    }

    try {
        updatePreview();

        let pdfBase64 = "";
        try {
            pdfBase64 = await generateReportPreviewBase64();
        } catch (e) {
            console.error("Error generando preview del reporte:", e);
        }

        // 1. Consultar reportes actuales para calcular el siguiente ID
        const response = await fetch(`${API_URL}/reports`);
        const reports = await response.json();

        // Calcular ID: si no hay reportes empezamos en 1, sino Max + 1
        const nextId = reports.length > 0 
            ? Math.max(...reports.map(r => r.id)) + 1 
            : 1;

            const headerHTML = document.getElementById('doc-header').innerHTML;
            const contentHTML = document.getElementById('doc-body').innerHTML;
            const footerHTML = document.getElementById('doc-footer').innerHTML;

        // 2. Preparar el objeto para la DB (preview = PDF en base64, data URI)
        const reportBody = {
            id: nextId,
            baseTemplate: currentBaseTemplateId,
            consecutive: "SIN_CONSECUTIVO",
            header: headerHTML,
            content: contentHTML,
            footer: footerHTML,
            preview: pdfBase64,
            state: "por revisar",
            created_by: creator.id,
            reviewed_by: null
        };

        // 3. Petición POST a la API
        const saveResponse = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportBody)
        });

        if (saveResponse.ok) {
            notifySuccess(`Reporte guardado exitosamente con ID: ${nextId}`);
        } else {
            const err = await saveResponse.json();
            notifyError("Error al guardar: " + err.error);
        }

    } catch (error) {
        console.error("Error en la operación:", error);
        notifyError("Error de conexión con el servidor.");
    }
}

function renderTemplate(doc) {

    const header = document.getElementById("doc-header");
    const body = document.getElementById("doc-body");
    const footer = document.getElementById("doc-footer");
    const container = document.getElementById("document-container");

    if (header) {
        const rawHeader = doc.header && String(doc.header).trim();
        header.innerHTML = rawHeader ? doc.header : (defaultDocHeaderSnapshot || "");
    }
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

    // --- REACTIVAR EDICIÓN DE TABLAS (el pie es solo lectura en esta página) ---
    enableTableEditing(header);
    enableTableEditing(body);

}

// templateHandler.js

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get("reportId");
    initReportWorkflowUi(reportId);
    if (reportId) {
        loadReportToEdit(reportId);
    }
});

async function loadReportToEdit(id) {
    try {
        const response = await fetch(`${API_URL}/reports/${id}`);
        const data = await response.json();
        
        // Normalizamos la respuesta (manejo de array o objeto único)
        const report = Array.isArray(data) ? data[0] : data;

        if (!report) {
            console.error("No se encontró el reporte solicitado");
            return;
        }

        console.log("Cargando reporte para edición...");

        // Almacenamos el ID en el dataset del body para referencia global
        document.body.dataset.editingReportId = report.id;
        const bt = report.baseTemplate ?? report.basetemplate;
        document.body.dataset.baseTemplateId = bt != null ? String(bt) : "";

        // Inyectamos el contenido en los 3 editores específicos
        const headerEl = document.getElementById('doc-header');
        const bodyEl = document.getElementById('doc-body');
        const footerEl = document.getElementById('doc-footer');

        if (headerEl) {
            const rawH = report.header && String(report.header).trim();
            headerEl.innerHTML = rawH ? report.header : (defaultDocHeaderSnapshot || "");
            sanitizeHeaderLogoButton(headerEl);
            sanitizeLoadedImages(headerEl);
            sanitizeLoadedTables(headerEl);
            enableTableEditing(headerEl);
        }
        if (bodyEl && report.content) {
            bodyEl.innerHTML = report.content;
            sanitizeLoadedImages(bodyEl);
            sanitizeLoadedTables(bodyEl);
            enableTableEditing(bodyEl);
        }
        if (footerEl && report.footer) {
            footerEl.innerHTML = report.footer;
            sanitizeLoadedImages(footerEl);
            sanitizeLoadedTables(footerEl);
        }

        updatePreview();

        await populateWorkflowFromReport(report);

        console.log("Reporte cargado exitosamente en los editores.");

    } catch (error) {
        console.error("Error al recuperar el reporte:", error);
    }
}

async function updateReport() {
    const id = document.body.dataset.editingReportId;
    
    if (!id) {
        notifyWarning("Error: No se encontró el ID del reporte para actualizar.");
        return; 
    }

    updatePreview();

    let pdfBase64 = "";
    try {
        pdfBase64 = await generateReportPreviewBase64();
    } catch (e) {
        console.error("Error generando preview del reporte:", e);
    }

    const meta = buildReportMetadataForUpdate();

    // Preparamos el objeto con la estructura de la tabla 'reports'
    const updatedReport = {
        baseTemplate: parseInt(document.body.dataset.baseTemplateId, 10),
        consecutive: "ACTUALIZADO", // O el valor que manejes en tu lógica
        header: document.getElementById('doc-header').innerHTML,
        content: document.getElementById('doc-body').innerHTML,
        footer: document.getElementById('doc-footer').innerHTML,
        preview: pdfBase64,
        state: meta.state,
        reviewed_by: meta.reviewed_by
    };

    try {
        const response = await fetch(`${API_URL}/reports/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedReport)
        });

        if (response.ok) {
            notifySuccess("¡Reporte actualizado correctamente!");
            document.body.dataset.reportState = meta.state;
            if (meta.reviewed_by != null) {
                document.body.dataset.reportReviewedBy = String(meta.reviewed_by);
            }
            const lMod = document.getElementById("report-last-modification-display");
            if (lMod) lMod.textContent = formatReportTimestamp(new Date());
            if (meta.reviewed_by != null) {
                const rBy = document.getElementById("report-reviewed-by-display");
                const u = getCurrentUser();
                if (rBy && u && u.id === meta.reviewed_by) {
                    rBy.textContent = u.username || `#${meta.reviewed_by}`;
                } else if (rBy) {
                    const map = await getUsersByIdMap();
                    rBy.textContent = map[meta.reviewed_by] || `#${meta.reviewed_by}`;
                }
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || "Error en la actualización");
        }
    } catch (error) {
        console.error("Error técnico al actualizar:", error);
        notifyError("Error al guardar los cambios en el servidor.");
    }
}

function handleSaveAction() {
    // Detectamos si hay un ID de reporte en el dataset del body
    const editingId = document.body.dataset.editingReportId;

    if (editingId) {
        console.log(`Modo Edición: Actualizando reporte con ID ${editingId}`);
        updateReport(); // Ejecuta la petición PUT que definimos anteriormente
    } else {
        console.log("Modo Creación: Registrando nuevo reporte");
        saveReport(); // Ejecuta tu función original de creación (POST)
    }
}