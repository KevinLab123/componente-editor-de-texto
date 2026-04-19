/**
 * Inicialización y helpers para Flashy.js (fallback a alert si no cargó la librería).
 */
(function initFlashyDefaults() {
    if (typeof flashy !== "undefined" && typeof flashy.setDefaults === "function") {
        flashy.setDefaults({
            position: "top-right",
            duration: 4500,
            animation: "slide",
            theme: "light",
            closable: true
        });
    }
})();

function notifyInfo(message, options) {
    if (typeof flashy !== "undefined") {
        return flashy.info(message, options || {});
    }
    window.alert(message);
}

function notifySuccess(message, options) {
    if (typeof flashy !== "undefined") {
        return flashy.success(message, options || {});
    }
    window.alert(message);
}

function notifyWarning(message, options) {
    if (typeof flashy !== "undefined") {
        return flashy.warning(message, options || {});
    }
    window.alert(message);
}

function notifyError(message, options) {
    if (typeof flashy !== "undefined") {
        return flashy.error(message, options || {});
    }
    window.alert(message);
}

/**
 * Textos de ayuda compartidos (templateCreator / templateHandler).
 * @type {Readonly<Record<string, string>>}
 */
var UI_HINT = {
    activateEditor:
        "Haz clic en el encabezado, en el contenido o en el pie para activar el editor.",
    selectNonEmptyText:
        "Selecciona un texto no vacío (arrastra el cursor) para aplicar el formato.",
    selectTextOrBlock:
        "Selecciona texto o coloca el cursor en un párrafo o título.",
    selectTextAlign:
        "Selecciona el texto o el bloque al que quieres aplicar la alineación.",
    alignNoChange:
        "No se pudo alinear: elige un párrafo o título dentro del contenido.",
    colorNeedSelection:
        "Selecciona texto para aplicar color de fuente o de fondo.",
    tableNeedCell:
        "Coloca el cursor dentro de una celda de la tabla (incluye celdas de encabezado si las hay).",
    tableMergeExplain:
        "Combinar fila: se unen todas las celdas de la fila actual en una sola celda ancha.",
    tableInserted:
        "Tabla 2×2 insertada. Usa los botones sobre la tabla para filas, columnas o combinar celdas.",
    protectedNoClear:
        "No se puede limpiar el formato en tablas, imágenes, botones u otras zonas protegidas.",
    selectContentArea:
        "El texto debe estar dentro del área de edición activa (encabezado, contenido o pie).",
    listNeedSelection:
        "Selecciona texto para crear una lista o convierte el párrafo actual.",
    formatBlockNeedSelection:
        "Selecciona texto o un bloque para cambiarlo a encabezado o párrafo.",
    fontSizeNeedSelection:
        "Selecciona texto para cambiar el tamaño de fuente."
};
