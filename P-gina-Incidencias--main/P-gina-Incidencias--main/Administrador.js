let ticketsData = [];
let chartInstances = [];
let currentTab = 'tab-equipos';
let currentModalType = ''; // Para saber qué estamos agregando

// --- DATOS INICIALES (Ahora son objetos para soportar estado Activo/Inactivo) ---
let tecnicosDB = [
    { id: 1, nombre: 'Juan Pérez', activo: true },
    { id: 2, nombre: 'María Gómez', activo: true },
    { id: 3, nombre: 'Carlos Rodríguez', activo: true },
    { id: 4, nombre: 'Ana López', activo: true }
];

let empresasDB = [
    { id: 1, nombre: 'Zoxo', activo: true },
    { id: 2, nombre: 'Codiversa', activo: true },
    { id: 3, nombre: 'Copesa', activo: true },
    { id: 4, nombre: 'Sitraq', activo: true },
    { id: 5, nombre: 'Corevsa', activo: true }
];

// Datos Gestión Técnica (Simples arrays de strings por ahora, o objetos si quisieras estado)
const gestionData = {
    equipos: ['CEIBA', 'MDVR', 'VALIDADOR', 'RADIOS'],
    elementos: ['PLATAFORMA', 'CÁMARA OPERADOR', 'CÁMARA PASILLO', 'CÁMARA TRASERA', 'CÁMARA VIAL', 'CONTADOR DELANTERO', 'CONTADOR TRASERO', 'BOTÓN DE PANICO', 'ARNES DE ALARMAS', 'CABLE VIDEO', 'CABLE IPC', 'ARNES DE CORRIENTE', 'FUSIBLE', 'RELAY', 'DIODO', 'DISPLAY / TOUCH', 'BOCINA', 'GPS', 'TRANSMISION DE DATOS', 'NO ENCIENDE', 'INTERFACE FLANGE', 'SIM DE DATOS', 'REDUCTOR DE VOLTAJE', 'VOLUMEN'],
    fallas: ['NO ACCESA', 'FUERA DE LINEA', 'SIN VISION DE CÁMARA', 'FUERA DE ANGULO', 'ERROR DE ALMACENAMIENTO', 'NO GEOLOCALIZA', 'NO CUENTA', 'FALSO CONTACTO', 'ROTO/A', 'QUEMADO/A', 'NO LEE TARJETAS MI', 'NO TRANSMITE', 'NO FUNCIONA EL TOUCH', 'NO SE VE LA PANTALLA', 'NO SE ESCUCHA / RONCA', 'NO FUNCIONA EL PTT'],
    accesorios: ['EQUIPO DE COMPUTO', 'INTERNET', 'CAPA 8', 'ANTENA GPS', 'ANTENA GSM', 'SIM DE DATOS', 'MEMORIA SD', 'SENSOR P1', 'SENSOR P2', 'TARJETA PRINCIPAL', 'MODULO FEIG', 'MODULOS GSM', 'MODULO SAM', 'TARJETA SAM'],
    revision: ['APAGADO/A', 'NO CONECTADO', 'OBSTRUIDO/A', 'FALSO CONTACTO', 'ROTO/A', 'QUEMADO/A', 'CONFIGURACIÓN DE FECHA Y HORA', 'SOBRE CALENTAMIENTO'],
    solucion: ['SE RESTABLECE CONEXIÓN', 'SE SUSTITUYE SENSOR MAGNÉTICO', 'SE RETIRA EQUIPO PARA SU REVISIÓN EN LABORATORIO', 'SE CONECTA']
};

const tiposFalla = ['EQUIPOS - MDVR', 'ELEMENTOS - Cámara Operador', 'ACCESORIOS - Antena GPS', 'FALLA REPORTADA - No accesa'];
const estados = ['abierto', 'espera', 'cerrado', 'resuelto'];
const estadosTexto = ['Abierto', 'En Espera', 'Cerrado', 'Resuelto'];

document.addEventListener('DOMContentLoaded', function() {
    const sesion = localStorage.getItem('sesion');
    let userRole = 'tecnico';
    if (sesion) {
        const datosUsuario = JSON.parse(sesion);
        userRole = datosUsuario.rol.toLowerCase();
    }

    inicializarFechas();
    inicializarDatos(); // Genera tickets aleatorios
    inicializarEventos();
    inicializarNavegacion(); 
    
    // Renderizados iniciales
    actualizarVista();
    renderAllTechTables(userRole);
    renderGestionTecnicos(userRole); // Nueva tabla detallada
    renderGestionEmpresas(userRole); // Nueva tabla detallada
    renderAllTecnicosCards(); // Tarjetas visuales originales
    renderAllEmpresasCards(); // Tarjetas visuales originales
});

// --- GENERACIÓN DE DATOS ALEATORIOS ---
function inicializarDatos() {
    ticketsData = [];
    const hoy = new Date();
    // Usamos solo técnicos y empresas activas para los tickets nuevos
    const tecActivos = tecnicosDB.filter(t => t.activo).map(t => t.nombre);
    const empActivas = empresasDB.filter(e => e.activo).map(e => e.nombre);

    for (let i = 1; i <= 48; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - Math.floor(Math.random() * 30));
        const estadoIndex = Math.floor(Math.random() * estados.length);
        
        ticketsData.push({
            id: i,
            tecnico: tecActivos[Math.floor(Math.random() * tecActivos.length)] || 'Desconocido',
            empresa: empActivas[Math.floor(Math.random() * empActivas.length)] || 'Desconocida',
            fecha: fecha.toLocaleDateString('es-ES'),
            tiempo: (Math.random() * 5 + 0.5).toFixed(1) + 'h',
            tipoFalla: tiposFalla[Math.floor(Math.random() * tiposFalla.length)],
            estado: estados[estadoIndex],
            estadoTexto: estadosTexto[estadoIndex]
        });
    }
}

// --- NAVEGACIÓN ---
function inicializarNavegacion() {
    const links = document.querySelectorAll('.menu-link');
    const views = {
        'nav-dashboard': 'view-dashboard',
        'nav-incidencias': 'view-incidencias',
        'nav-tecnicos': 'view-tecnicos',
        'nav-empresas': 'view-empresas',
        'nav-reportes': 'view-reportes',
        'nav-gestion-tecnica': 'view-gestion-tecnica'
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            if(link.getAttribute('href').includes('.html')) return; // Permitir enlaces reales
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            Object.values(views).forEach(viewId => {
                const el = document.getElementById(viewId);
                if(el) el.style.display = 'none';
            });
            
            const targetId = views[link.id];
            if(targetId) {
                document.getElementById(targetId).style.display = 'block';
                if(targetId === 'view-incidencias') renderAllIncidencias();
                if(targetId === 'view-reportes') renderReportesHistory();
            }
        });
    });
}

// --- GESTIÓN TÉCNICA (PESTAÑAS) ---
window.cambiarTab = function(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tech-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
};

function renderAllTechTables(role) {
    // Renderiza las tablas del catálogo general
    renderTechTable('body-equipos', gestionData.equipos, role, 'equipos');
    renderTechTable('body-elementos', gestionData.elementos, role, 'elementos');
    renderTechTable('body-fallas', gestionData.fallas, role, 'fallas');
    renderTechTable('body-accesorios', gestionData.accesorios, role, 'accesorios');
    renderTechTable('body-revision', gestionData.revision, role, 'revision');
    renderTechTable('body-solucion', gestionData.solucion, role, 'solucion');
}

function renderTechTable(tbodyId, dataArray, role, type) {
    const tbody = document.getElementById(tbodyId);
    if(!tbody) return;
    tbody.innerHTML = '';
    
    dataArray.forEach((item, index) => {
        let actionHtml = '';
        if (role === 'administrador') {
            actionHtml = `
                <button class="btn-icon" style="color:red;" onclick="eliminarItemCatalogo('${type}', ${index})" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        } else {
            actionHtml = '<span style="color:#999; font-size:0.8rem;">Solo lectura</span>';
        }

        tbody.innerHTML += `<tr><td>${item}</td><td class="col-accion">${actionHtml}</td></tr>`;
    });
}

// --- GESTIÓN DETALLADA: TÉCNICOS Y EMPRESAS (NUEVO) ---
function renderGestionTecnicos(role) {
    const tbody = document.getElementById('tabla-gestion-tecnicos');
    if(!tbody) return;
    tbody.innerHTML = '';

    tecnicosDB.forEach(tec => {
        const estadoClass = tec.activo ? 'status-resuelto' : 'status-abierto'; // Verde/Rojo
        const estadoText = tec.activo ? 'Activo' : 'Inactivo';
        
        let actions = '<span style="color:#999;">Solo lectura</span>';
        if(role === 'administrador') {
            const btnColor = tec.activo ? '#e74c3c' : '#27ae60';
            const btnIcon = tec.activo ? 'fa-ban' : 'fa-check';
            const btnTitle = tec.activo ? 'Desactivar' : 'Activar';
            
            actions = `
                <button class="btn-icon" style="color:${btnColor};" onclick="toggleEstadoEntidad('tecnico', ${tec.id})" title="${btnTitle}">
                    <i class="fas ${btnIcon}"></i>
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>${tec.nombre}</td>
                <td><span class="status-badge ${estadoClass}">${estadoText}</span></td>
                <td class="col-accion">${actions}</td>
            </tr>
        `;
    });
}

function renderGestionEmpresas(role) {
    const tbody = document.getElementById('tabla-gestion-empresas');
    if(!tbody) return;
    tbody.innerHTML = '';

    empresasDB.forEach(emp => {
        const estadoClass = emp.activo ? 'status-resuelto' : 'status-abierto';
        const estadoText = emp.activo ? 'Activo' : 'Inactivo';
        
        let actions = '<span style="color:#999;">Solo lectura</span>';
        if(role === 'administrador') {
            const btnColor = emp.activo ? '#e74c3c' : '#27ae60';
            const btnIcon = emp.activo ? 'fa-ban' : 'fa-check';
            const btnTitle = emp.activo ? 'Desactivar' : 'Activar';
            
            actions = `
                <button class="btn-icon" style="color:${btnColor};" onclick="toggleEstadoEntidad('empresa', ${emp.id})" title="${btnTitle}">
                    <i class="fas ${btnIcon}"></i>
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>${emp.nombre}</td>
                <td><span class="status-badge ${estadoClass}">${estadoText}</span></td>
                <td class="col-accion">${actions}</td>
            </tr>
        `;
    });
}

window.toggleEstadoEntidad = function(tipo, id) {
    if(tipo === 'tecnico') {
        const index = tecnicosDB.findIndex(t => t.id === id);
        if(index !== -1) {
            tecnicosDB[index].activo = !tecnicosDB[index].activo;
            renderGestionTecnicos('administrador');
            renderAllTecnicosCards(); // Actualizar tarjetas visuales
        }
    } else if (tipo === 'empresa') {
        const index = empresasDB.findIndex(e => e.id === id);
        if(index !== -1) {
            empresasDB[index].activo = !empresasDB[index].activo;
            renderGestionEmpresas('administrador');
            renderAllEmpresasCards(); // Actualizar tarjetas visuales
        }
    }
    actualizarEstadisticas(ticketsData); // Actualizar contadores globales
};

// --- VISUALIZACIÓN ORIGINAL (TARJETAS) ---
function renderAllTecnicosCards() {
    const container = document.getElementById('tecnicos-list-container');
    if(!container) return;
    container.innerHTML = '';
    
    // Mostramos solo los activos en las tarjetas o todos, según prefieras. 
    // Generalmente las tarjetas de resumen muestran actividad de todos.
    tecnicosDB.forEach(tec => {
        if(!tec.activo) return; // Opcional: Ocultar inactivos de las tarjetas
        const count = ticketsData.filter(t => t.tecnico === tec.nombre).length;
        container.innerHTML += `
            <div class="summary-card">
                <i class="fas fa-user-tie"></i>
                <h3>${tec.nombre}</h3>
                <p>${count} Incidencias</p>
            </div>
        `;
    });
}

function renderAllEmpresasCards() {
    const container = document.getElementById('empresas-list-container');
    if(!container) return;
    container.innerHTML = '';
    
    empresasDB.forEach(emp => {
        if(!emp.activo) return;
        const count = ticketsData.filter(t => t.empresa === emp.nombre).length;
        container.innerHTML += `
            <div class="summary-card">
                <i class="fas fa-building"></i>
                <h3>${emp.nombre}</h3>
                <p>${count} Reportes</p>
            </div>
        `;
    });
}

// --- HISTORIAL DE REPORTES (CON HORA Y FECHA) ---
function renderReportesHistory() {
    const tbody = document.getElementById('reportes-history-body');
    if(!tbody) return;
    
    // Datos simulados con fecha Y HORA
    let historial = [
        { nombre: 'Reporte Mensual Diciembre', fecha: '2024-12-30', hora: '09:30 AM', periodo: '01/12 - 30/12', user: 'Admin' },
        { nombre: 'Reporte Cierre Zoxo', fecha: '2025-01-15', hora: '06:45 PM', periodo: '01/01 - 15/01', user: 'Admin' },
        { nombre: 'Incidencias Críticas', fecha: '2025-01-28', hora: '10:15 AM', periodo: '20/01 - 28/01', user: 'Admin' }
    ];

    // Ordenar por fecha descendente
    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tbody.innerHTML = '';
    historial.forEach(h => {
        // Formatear fecha para mostrar
        const fechaShow = h.fecha.split('-').reverse().join('/');
        tbody.innerHTML += `
            <tr>
                <td><i class="fas fa-file-pdf" style="color:red"></i> ${h.nombre}</td>
                <td>${fechaShow}</td>
                <td>${h.hora}</td> <td>${h.periodo}</td>
                <td>${h.user}</td>
                <td><span class="status-badge status-resuelto">Completado</span></td>
            </tr>
        `;
    });
}

// --- MODAL AGREGAR ---
window.abrirModalAgregar = function(tipo) {
    currentModalType = tipo; // 'tecnico', 'empresa', 'catalogo'
    document.getElementById('input-agregar-nombre').value = '';
    
    let titulo = 'Agregar';
    if(tipo === 'tecnico') titulo = 'Agregar Nuevo Técnico';
    if(tipo === 'empresa') titulo = 'Agregar Nueva Empresa';
    if(tipo === 'catalogo') titulo = 'Agregar Item al Catálogo';

    document.getElementById('modal-titulo').innerHTML = `<i class="fas fa-plus-circle"></i> ${titulo}`;
    document.getElementById('modal-agregar-generico').style.display = 'flex';
    document.getElementById('input-agregar-nombre').focus();
};

window.cerrarModalAgregar = function() {
    document.getElementById('modal-agregar-generico').style.display = 'none';
};

window.guardarNuevoGenerico = function() {
    const nombre = document.getElementById('input-agregar-nombre').value.trim();
    if (!nombre) return alert("Escribe un nombre");
    
    const role = JSON.parse(localStorage.getItem('sesion')).rol.toLowerCase();

    if(currentModalType === 'tecnico') {
        const newId = tecnicosDB.length > 0 ? Math.max(...tecnicosDB.map(t=>t.id)) + 1 : 1;
        tecnicosDB.push({ id: newId, nombre: nombre, activo: true });
        renderGestionTecnicos(role);
        renderAllTecnicosCards();
    } 
    else if(currentModalType === 'empresa') {
        const newId = empresasDB.length > 0 ? Math.max(...empresasDB.map(e=>e.id)) + 1 : 1;
        empresasDB.push({ id: newId, nombre: nombre, activo: true });
        renderGestionEmpresas(role);
        renderAllEmpresasCards();
    }
    else if(currentModalType === 'catalogo') {
        let targetArray = '';
        if(currentTab === 'tab-equipos') targetArray = 'equipos';
        else if(currentTab === 'tab-elementos') targetArray = 'elementos';
        else if(currentTab === 'tab-fallas') targetArray = 'fallas';
        else if(currentTab === 'tab-accesorios') targetArray = 'accesorios';
        else if(currentTab === 'tab-revision') targetArray = 'revision';
        else if(currentTab === 'tab-solucion') targetArray = 'solucion';
        
        if(targetArray) {
            gestionData[targetArray].push(nombre.toUpperCase());
            renderTechTable(`body-${targetArray}`, gestionData[targetArray], role, targetArray);
        }
    }

    cerrarModalAgregar();
    showNotification('Agregado correctamente', 'success');
};

window.eliminarItemCatalogo = function(type, index) {
    if(confirm('¿Eliminar este elemento del catálogo?')) {
        gestionData[type].splice(index, 1);
        const role = JSON.parse(localStorage.getItem('sesion')).rol.toLowerCase();
        renderTechTable(`body-${type}`, gestionData[type], role, type);
    }
};

// --- FUNCIONES CORE (DASHBOARD) ---
function inicializarFechas() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    const inputInicio = document.getElementById('fecha-inicio');
    const inputFin = document.getElementById('fecha-fin');
    if(inputInicio) inputInicio.value = hace30Dias.toISOString().split('T')[0];
    if(inputFin) inputFin.value = hoy.toISOString().split('T')[0];
}

function actualizarTabla(tickets) {
    const tbody = document.getElementById('tickets-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Sin resultados</td></tr>';
        return;
    }
    
    // --- AQUÍ ESTÁ LA VISTA PREVIA CON ACCIONES QUE PEDISTE NO QUITAR ---
    tickets.forEach(ticket => {
        tbody.innerHTML += `
            <tr>
                <td>${ticket.tecnico}</td>
                <td>${ticket.fecha}</td>
                <td><span class="empresa-badge">${ticket.empresa}</span></td>
                <td>${ticket.tiempo}</td>
                <td>${ticket.tipoFalla}</td>
                <td><span class="status-badge status-${ticket.estado}">${ticket.estadoTexto}</span></td>
                <td>
                    <select class="status-select" onchange="cambiarEstadoTicket(${ticket.id}, this.value)">
                        <option value="abierto" ${ticket.estado==='abierto'?'selected':''}>Abierto</option>
                        <option value="espera" ${ticket.estado==='espera'?'selected':''}>En Espera</option>
                        <option value="cerrado" ${ticket.estado==='cerrado'?'selected':''}>Cerrado</option>
                        <option value="resuelto" ${ticket.estado==='resuelto'?'selected':''}>Resuelto</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

window.cambiarEstadoTicket = function(id, nuevoEstado) {
    const ticket = ticketsData.find(t => t.id === id);
    if(ticket) {
        ticket.estado = nuevoEstado;
        ticket.estadoTexto = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);
        actualizarVista(); // Refresca contadores
        showNotification('Estado actualizado', 'success');
    }
};

function actualizarEstadisticas(tickets) {
    document.getElementById('total-incidencias').textContent = tickets.length;
    document.getElementById('abiertas-count').textContent = tickets.filter(t=>t.estado==='abierto').length;
    document.getElementById('espera-count').textContent = tickets.filter(t=>t.estado==='espera').length;
    document.getElementById('cerradas-count').textContent = tickets.filter(t=>t.estado==='cerrado'||t.estado==='resuelto').length;
    
    // Actualizar contadores de activos
    if(document.getElementById('active-tecnicos-count'))
        document.getElementById('active-tecnicos-count').textContent = tecnicosDB.filter(t=>t.activo).length;
    if(document.getElementById('active-empresas-count'))
        document.getElementById('active-empresas-count').textContent = empresasDB.filter(e=>e.activo).length;
}

function inicializarEventos() {
    const btnLimpiar = document.getElementById('limpiar-filtros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            document.getElementById('empresa').value = '';
            document.getElementById('tecnico').value = '';
            document.getElementById('tipo-falla').value = '';
            document.getElementById('estado').value = '';
            inicializarFechas();
            actualizarVista();
            showNotification('Filtros limpiados', 'success');
        });
    }
    
    document.querySelectorAll('.filter-control').forEach(input => {
        if(input.id.includes('agregar')) return;
        input.addEventListener('change', actualizarVista);
    });
}

function actualizarVista() {
    const filtros = obtenerFiltros();
    if (!filtros) return;
    const ticketsFiltrados = filtrarTickets(filtros);
    actualizarTabla(ticketsFiltrados);
    actualizarEstadisticas(ticketsFiltrados);
}

function obtenerFiltros() {
    const emp = document.getElementById('empresa');
    if(!emp) return null;
    return {
        empresa: emp.value,
        tecnico: document.getElementById('tecnico').value,
        tipoFalla: document.getElementById('tipo-falla').value,
        estado: document.getElementById('estado').value,
        fechaInicio: document.getElementById('fecha-inicio').value,
        fechaFin: document.getElementById('fecha-fin').value
    };
}

function filtrarTickets(filtros) {
    return ticketsData.filter(ticket => {
        if (filtros.empresa && !ticket.empresa.toLowerCase().includes(filtros.empresa.toLowerCase())) return false;
        if (filtros.tecnico) {
            const tecnicoKey = ticket.tecnico.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const filtroNormalizado = filtros.tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!tecnicoKey.includes(filtroNormalizado)) return false;
        }
        if (filtros.tipoFalla && !ticket.tipoFalla.toLowerCase().includes(filtros.tipoFalla.toLowerCase())) return false;
        if (filtros.estado && ticket.estado !== filtros.estado) return false;
        return true;
    });
}

function renderAllIncidencias() {
    const tbody = document.getElementById('all-tickets-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    ticketsData.forEach(t => {
        tbody.innerHTML += `<tr><td>#${t.id}</td><td>${t.tecnico}</td><td>${t.empresa}</td><td>${t.tipoFalla}</td><td>${t.fecha}</td><td>${t.estadoTexto}</td></tr>`;
    });
}

function showNotification(msg, type) {
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px;border-radius:8px;color:white;font-weight:600;z-index:9999;background:${type==='success'?'#AB096A':'#3498db'};box-shadow:0 4px 10px rgba(0,0,0,0.2);animation:fadeIn 0.5s;`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(), 3000);
}