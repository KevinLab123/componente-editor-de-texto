function formatDoc(cmd, value=null) {
    const editor = document.getElementById("content"); 
    editor.focus();
    if(value){
        document.execCommand(cmd, false, value);
    }else{
        document.execCommand(cmd);
    }
}

function addLink(){
    const url = prompt("Enter the link URL:");
    if(url){
        document.execCommand("createLink", false, url);
        updateLinkListeners();
    }
}

const content = document.getElementById('content');

// Función para actualizar listeners en enlaces
function updateLinkListeners() {
    const links = content.querySelectorAll('a');
    links.forEach(item => {
        // Remover listeners anteriores para evitar duplicados
        item.replaceWith(item.cloneNode(true));
    });
    
    // Reasignar listeners
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
}

// Actualizar links cuando haya cambios en el contenido
content.addEventListener('input', updateLinkListeners);

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
                
                updateLinkListeners();
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