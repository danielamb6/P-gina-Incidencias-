let ticketsData = [];
let chartInstances = [];

const empresas = ['Zoxo', 'Codiversa', 'Copesa', 'Sitraq', 'Corevsa'];
const tecnicos = ['Juan Pérez', 'María Gómez', 'Carlos Rodríguez', 'Ana López'];
const tiposFalla = ['EQUIPOS - MDVR', 'ELEMENTOS - Cámara Operador', 'ACCESORIOS - Antena GPS', 'FALLA REPORTADA - No accesa', 'SOLUCIÓN - Se restablece conexión', 'CONFIGURACIÓN - Parámetros GPS', 'HARDWARE - Tarjeta SIM'];
const estados = ['abierto', 'espera', 'cerrado', 'resuelto'];
const estadosTexto = ['Abierto', 'En Espera', 'Cerrado', 'Resuelto'];

document.addEventListener('DOMContentLoaded', function() {
    // 1. OBTENER SESIÓN
    const sesion = localStorage.getItem('sesion');
    
    // Si no hay sesión, se redirige al login
    if (!sesion) {
        window.location.href = "login.html";
        return;
    }

    try {
        const datosUsuario = JSON.parse(sesion);
        if (document.getElementById('display-user-name')) {
            document.getElementById('display-user-name').textContent = datosUsuario.nombre;
        }
        if (document.getElementById('display-user-role')) {
            const rolDisplay = datosUsuario.rol === 'supervisor' ? 'SUPERVISOR (Solo Lectura)' : datosUsuario.rol.toUpperCase();
            document.getElementById('display-user-role').textContent = rolDisplay;
        }
    } catch (e) {
        console.error("Error al leer datos de sesión", e);
    }

    // 2. LÓGICA DEL BOTÓN "SALIR"
    const btnSalir = document.getElementById('btn-logout');
    if (btnSalir) {
        btnSalir.onmouseover = () => btnSalir.style.transform = "scale(1.05)";
        btnSalir.onmouseout = () => btnSalir.style.transform = "scale(1)";

        btnSalir.addEventListener('click', function() {
            localStorage.removeItem('sesion');
            localStorage.removeItem('sesion_activa'); 
            sessionStorage.clear();
            window.location.href = "login.html"; 
        });
    }

    inicializarFechas();
    inicializarDatos();
    inicializarEventos();
    inicializarNavegacion(); 
    actualizarVista();
});

function inicializarFechas() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    const inputInicio = document.getElementById('fecha-inicio');
    const inputFin = document.getElementById('fecha-fin');
    if(inputInicio) inputInicio.value = hace30Dias.toISOString().split('T')[0];
    if(inputFin) inputFin.value = hoy.toISOString().split('T')[0];
}

function inicializarDatos() {
    ticketsData = [];
    const hoy = new Date();
    for (let i = 1; i <= 48; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - Math.floor(Math.random() * 30));
        const estadoIndex = Math.floor(Math.random() * estados.length);
        ticketsData.push({
            id: i,
            tecnico: tecnicos[Math.floor(Math.random() * tecnicos.length)],
            fecha: fecha.toLocaleDateString('es-ES'),
            empresa: empresas[Math.floor(Math.random() * empresas.length)],
            tiempo: (Math.random() * 5 + 0.5).toFixed(1) + 'h',
            tipoFalla: tiposFalla[Math.floor(Math.random() * tiposFalla.length)],
            estado: estados[estadoIndex],
            estadoTexto: estadosTexto[estadoIndex]
        });
    }
}

function inicializarNavegacion() {
    const links = document.querySelectorAll('.menu-link');
    const views = {
        'nav-dashboard': 'view-dashboard',
        'nav-incidencias': 'view-incidencias',
        'nav-tecnicos': 'view-tecnicos',
        'nav-empresas': 'view-empresas',
        'nav-reportes': 'view-reportes'
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') !== '#') return;

            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            Object.values(views).forEach(viewId => {
                const el = document.getElementById(viewId);
                if(el) el.style.display = 'none';
            });
            
            const targetId = views[link.id];
            if(targetId) {
                const targetEl = document.getElementById(targetId);
                if(targetEl) targetEl.style.display = 'block';
                
                if(targetId === 'view-incidencias') renderAllIncidencias();
                if(targetId === 'view-tecnicos') renderAllTecnicos();
                if(targetId === 'view-empresas') renderAllEmpresas();
                if(targetId === 'view-reportes') renderReportesHistory(); // <--- AQUÍ SE CARGA EL HISTORIAL
            }
        });
    });
}

// ==========================================
// NUEVA LÓGICA DE HISTORIAL DE REPORTES
// ==========================================

function registrarReporteEnHistorial(filtros) {
    // 1. Obtener historial actual
    let historial = JSON.parse(localStorage.getItem('historial_reportes')) || [];
    
    // 2. Obtener datos del usuario actual
    const sesion = JSON.parse(localStorage.getItem('sesion'));
    const nombreUsuario = sesion ? sesion.nombre : 'Desconocido';

    // 3. Definir periodo
    let periodoTexto = "Todo el historial";
    if (filtros.fechaInicio && filtros.fechaFin) {
        periodoTexto = `${filtros.fechaInicio} al ${filtros.fechaFin}`;
    } else if (filtros.fechaInicio) {
        periodoTexto = `Desde ${filtros.fechaInicio}`;
    }

    // 4. Crear objeto de nuevo reporte
    const nuevoReporte = {
        id: Date.now(), // ID único basado en tiempo
        nombre: `Reporte General ${new Date().toLocaleDateString('es-ES')}`,
        fechaGeneracion: new Date().toLocaleString('es-ES'),
        periodo: periodoTexto,
        usuario: nombreUsuario,
        estado: "Completado"
    };

    // 5. Guardar al principio del array (más reciente primero)
    historial.unshift(nuevoReporte);
    localStorage.setItem('historial_reportes', JSON.stringify(historial));
}

function renderReportesHistory() {
    const tbody = document.getElementById('reportes-history-body');
    if(!tbody) return;
    
    // 1. Leer de LocalStorage
    const historial = JSON.parse(localStorage.getItem('historial_reportes')) || [];
    
    tbody.innerHTML = '';

    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">No se han generado reportes aún.</td></tr>';
        return;
    }

    // 2. Renderizar filas
    historial.forEach(h => {
        tbody.innerHTML += `
            <tr>
                <td><i class="fas fa-file-pdf" style="color:red; margin-right:8px;"></i> ${h.nombre}</td>
                <td>${h.fechaGeneracion}</td>
                <td>${h.periodo}</td>
                <td>${h.usuario}</td>
                <td><span class="status-badge status-resuelto">${h.estado}</span></td>
            </tr>
        `;
    });
}

// ==========================================
// FIN NUEVA LÓGICA
// ==========================================

function renderAllIncidencias() {
    const tbody = document.getElementById('all-tickets-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    ticketsData.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td>#${t.id}</td>
                <td>${t.tecnico}</td>
                <td><span class="empresa-badge">${t.empresa}</span></td>
                <td>${t.tipoFalla}</td>
                <td>${t.fecha}</td>
                <td><span class="status-badge status-${t.estado}">${t.estadoTexto}</span></td>
            </tr>
        `;
    });
}

function renderAllTecnicos() {
    const container = document.getElementById('tecnicos-list-container');
    if(!container) return;
    container.innerHTML = '';
    tecnicos.forEach(tec => {
        const count = ticketsData.filter(t => t.tecnico === tec).length;
        container.innerHTML += `
            <div class="summary-card">
                <i class="fas fa-user-tie"></i>
                <h3>${tec}</h3>
                <p>${count} Incidencias</p>
            </div>
        `;
    });
}

function renderAllEmpresas() {
    const container = document.getElementById('empresas-list-container');
    if(!container) return;
    container.innerHTML = '';
    empresas.forEach(emp => {
        const count = ticketsData.filter(t => t.empresa === emp).length;
        container.innerHTML += `
            <div class="summary-card">
                <i class="fas fa-building"></i>
                <h3>${emp}</h3>
                <p>${count} Reportes</p>
            </div>
        `;
    });
}

function inicializarEventos() {
    const filtrosInputs = document.querySelectorAll('.filter-control');
    filtrosInputs.forEach(input => {
        input.addEventListener('change', () => actualizarVista());
    });

    const btnLimpiar = document.getElementById('limpiar-filtros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
            document.getElementById('empresa').value = '';
            document.getElementById('tecnico').value = '';
            document.getElementById('tipo-falla').value = '';
            document.getElementById('estado').value = '';
            inicializarFechas();
            actualizarVista();
            showNotification('Filtros limpiados', 'success');
        });
    }
    
    const btnPdf = document.getElementById('generar-pdf');
    if(btnPdf) {
        btnPdf.addEventListener('click', function() {
            this.classList.add('loading');
            setTimeout(() => {
                this.classList.remove('loading');
                generarReporteVistaPrevia();
            }, 500);
        });
    }

    const btnDescargar = document.getElementById('btn-descargar-final');
    if(btnDescargar) {
        btnDescargar.addEventListener('click', function() {
            if(confirm("¿Descargar este reporte en PDF?")) {
                descargarPDFFinal();
            }
        });
    }
    
    const btnCloseModal = document.getElementById('close-modal');
    if(btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            document.getElementById('pdf-preview-modal').style.display = 'none';
        });
    }
    
    const modal = document.getElementById('pdf-preview-modal');
    if(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
    
    const logoImg = document.querySelector('.logo-img');
    const logoPlaceholder = document.getElementById('logo-placeholder');
    if (logoImg && logoPlaceholder) {
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
            logoPlaceholder.style.display = 'none';
        }
        logoImg.onerror = function() {
            logoPlaceholder.style.display = 'flex';
            this.style.display = 'none';
        };
    }
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
        empresa: document.getElementById('empresa').value,
        tecnico: document.getElementById('tecnico').value,
        tipoFalla: document.getElementById('tipo-falla').value,
        estado: document.getElementById('estado').value,
        fechaInicio: document.getElementById('fecha-inicio').value,
        fechaFin: document.getElementById('fecha-fin').value
    };
}

function filtrarTickets(filtros) {
    if (!filtros) return ticketsData;
    return ticketsData.filter(ticket => {
        if (filtros.empresa && !ticket.empresa.toLowerCase().includes(filtros.empresa.toLowerCase())) return false;
        if (filtros.tecnico) {
            const tecnicoKey = ticket.tecnico.toLowerCase().replace(' ', '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const filtroNormalizado = filtros.tecnico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!tecnicoKey.includes(filtroNormalizado)) return false;
        }
        if (filtros.tipoFalla && !ticket.tipoFalla.toLowerCase().includes(filtros.tipoFalla.toLowerCase())) return false;
        if (filtros.estado && ticket.estado !== filtros.estado) return false;
        if (filtros.fechaInicio || filtros.fechaFin) {
            const ticketFecha = new Date(ticket.fecha.split('/').reverse().join('-'));
            if (filtros.fechaInicio && ticketFecha < new Date(filtros.fechaInicio)) return false;
            if (filtros.fechaFin) {
                const fin = new Date(filtros.fechaFin);
                fin.setHours(23,59,59);
                if (ticketFecha > fin) return false;
            }
        }
        return true;
    });
}

function actualizarTabla(tickets) {
    const tbody = document.getElementById('tickets-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // --- VERIFICACIÓN DE ROL ---
    const sesion = JSON.parse(localStorage.getItem('sesion'));
    const esSupervisor = sesion && sesion.rol === 'supervisor';
    const disabledAttr = esSupervisor ? 'disabled style="opacity: 0.6; cursor: not-allowed; background-color: #f0f0f0;"' : '';
    // ---------------------------

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Sin resultados</td></tr>';
        return;
    }
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
                    <select class="status-select" data-ticket="${ticket.id}" ${disabledAttr}>
                        <option value="abierto" ${ticket.estado==='abierto'?'selected':''}>Abierto</option>
                        <option value="espera" ${ticket.estado==='espera'?'selected':''}>En Espera</option>
                        <option value="cerrado" ${ticket.estado==='cerrado'?'selected':''}>Cerrado</option>
                        <option value="resuelto" ${ticket.estado==='resuelto'?'selected':''}>Resuelto</option>
                    </select>
                </td>
            </tr>
        `;
    });
    
    if(!esSupervisor) {
        document.querySelectorAll('.status-select').forEach(s => {
            s.addEventListener('change', function() {
                cambiarEstadoTicket(parseInt(this.dataset.ticket), this.value);
            });
        });
    }
}

function actualizarEstadisticas(tickets) {
    const elTotal = document.getElementById('total-incidencias');
    if(elTotal) {
        elTotal.textContent = tickets.length;
        document.getElementById('abiertas-count').textContent = tickets.filter(t=>t.estado==='abierto').length;
        document.getElementById('espera-count').textContent = tickets.filter(t=>t.estado==='espera').length;
        document.getElementById('cerradas-count').textContent = tickets.filter(t=>t.estado==='cerrado'||t.estado==='resuelto').length;
    }
}

function cambiarEstadoTicket(ticketId, nuevoEstado) {
    const ticket = ticketsData.find(t => t.id === ticketId);
    if (ticket) {
        ticket.estado = nuevoEstado;
        ticket.estadoTexto = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);
        actualizarVista();
        showNotification('Estado actualizado', 'success');
    }
}

// PDF Y GRÁFICOS
function generarReporteVistaPrevia() {
    const filtros = obtenerFiltros();
    const ticketsFiltrados = filtrarTickets(filtros);
    const modal = document.getElementById('pdf-preview-modal');
    const content = document.getElementById('pdf-content');
    
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3>Reporte de Incidencias</h3>
            <p><strong>Tickets:</strong> ${ticketsFiltrados.length}</p>
        </div>
        <div class="metrics-grid">
            <div class="metric-card"><div class="metric-value">${ticketsFiltrados.length}</div><div class="metric-label">Total</div></div>
            <div class="metric-card"><div class="metric-value">${ticketsFiltrados.filter(t=>t.estado==='abierto').length}</div><div class="metric-label">Abiertas</div></div>
            <div class="metric-card"><div class="metric-value">${ticketsFiltrados.filter(t=>t.estado==='cerrado'||t.estado==='resuelto').length}</div><div class="metric-label">Resueltas</div></div>
        </div>
        <div class="chart-container">
            <h3 class="chart-title">Distribución por Empresa</h3>
            <canvas id="chartEmpresas" width="400" height="200"></canvas>
        </div>
        <div class="chart-container">
            <h3 class="chart-title">Rendimiento Técnico</h3>
            <canvas id="chartTecnicos" width="400" height="200"></canvas>
        </div>
        <div class="chart-container">
            <h3 class="chart-title">Estados</h3>
            <canvas id="chartEstados" width="400" height="200"></canvas>
        </div>
    `;
    modal.style.display = 'flex';
    inicializarGraficosPDF(ticketsFiltrados);
}

function inicializarGraficosPDF(tickets) {
    const empData = {}; tickets.forEach(t => empData[t.empresa] = (empData[t.empresa]||0)+1);
    chartInstances.push(new Chart(document.getElementById('chartEmpresas').getContext('2d'), {
        type: 'pie', data: { labels: Object.keys(empData), datasets: [{ data: Object.values(empData), backgroundColor: ['#1a2980','#26d0ce','#AB096A','#7b112f','#2c3e50'] }] }, options: { animation: false }
    }));
    
    const tecData = {}; tickets.forEach(t => { if(t.estado==='cerrado'||t.estado==='resuelto') tecData[t.tecnico] = (tecData[t.tecnico]||0)+1; });
    chartInstances.push(new Chart(document.getElementById('chartTecnicos').getContext('2d'), {
        type: 'bar', data: { labels: Object.keys(tecData), datasets: [{ label: 'Resueltos', data: Object.values(tecData), backgroundColor: '#AB096A' }] }, options: { animation: false, scales: { y: { beginAtZero: true } } }
    }));
    
    const estData = {}; tickets.forEach(t => estData[t.estadoTexto] = (estData[t.estadoTexto]||0)+1);
    chartInstances.push(new Chart(document.getElementById('chartEstados').getContext('2d'), {
        type: 'doughnut', data: { labels: Object.keys(estData), datasets: [{ data: Object.values(estData), backgroundColor: ['#e74c3c','#f39c12','#27ae60','#2ecc71'] }] }, options: { animation: false }
    }));
}

function descargarPDFFinal() {
    const filtros = obtenerFiltros();
    const tickets = filtrarTickets(filtros);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    pdf.setFontSize(20);
    pdf.setTextColor(26, 41, 128);
    pdf.text('REPORTE DE INCIDENCIAS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Fecha
    pdf.setFontSize(10);
    pdf.setTextColor(102);
    pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Filtros
    pdf.setFontSize(12);
    pdf.setTextColor(51);
    pdf.text('Filtros Aplicados:', 20, yPos);
    yPos += 8;
    pdf.setFontSize(10);
    let fText = [];
    if(filtros.empresa) fText.push(`Empresa: ${filtros.empresa}`);
    if(filtros.tecnico) fText.push(`Técnico: ${filtros.tecnico}`);
    if(filtros.tipoFalla) fText.push(`Falla: ${filtros.tipoFalla}`);
    if(filtros.estado) fText.push(`Estado: ${filtros.estado}`);
    if(fText.length===0) fText.push('Ninguno');
    fText.forEach(t => { pdf.text(`• ${t}`, 25, yPos); yPos+=6; });
    yPos += 10;

    // Métricas
    pdf.setFontSize(14);
    pdf.setTextColor(171, 9, 106);
    pdf.text('Métricas Principales', 20, yPos);
    yPos += 10;
    const metricWidth = (pageWidth - 40) / 4;
    const metrics = [
        { l: 'Total', v: tickets.length, c: [26,41,128] },
        { l: 'Abiertas', v: tickets.filter(t=>t.estado==='abierto').length, c: [231,76,60] },
        { l: 'Espera', v: tickets.filter(t=>t.estado==='espera').length, c: [243,156,18] },
        { l: 'Resueltas', v: tickets.filter(t=>t.estado==='cerrado'||t.estado==='resuelto').length, c: [39,174,96] }
    ];
    metrics.forEach((m, i) => {
        const x = 20 + (i*metricWidth);
        pdf.setFillColor(245,245,245);
        pdf.rect(x, yPos, metricWidth-5, 20, 'F');
        pdf.setDrawColor(171,9,106);
        pdf.rect(x, yPos, metricWidth-5, 20);
        pdf.setFontSize(16); pdf.setTextColor(...m.c);
        pdf.text(m.v.toString(), x+(metricWidth-5)/2, yPos+10, {align:'center'});
        pdf.setFontSize(9); pdf.setTextColor(102);
        pdf.text(m.l, x+(metricWidth-5)/2, yPos+16, {align:'center'});
    });
    yPos += 30;

    // Gráficos
    if(yPos > 200) { pdf.addPage(); yPos=20; }
    try {
        const c1 = document.getElementById('chartEmpresas').toDataURL('image/png');
        const c2 = document.getElementById('chartTecnicos').toDataURL('image/png');
        const c3 = document.getElementById('chartEstados').toDataURL('image/png');
        pdf.addImage(c1, 'PNG', 20, yPos, 80, 50);
        pdf.addImage(c3, 'PNG', 110, yPos, 80, 50);
        yPos += 60;
        pdf.addImage(c2, 'PNG', 20, yPos, 170, 60);
        yPos += 70;
    } catch(e) { console.log(e); }

    // Tabla
    if(yPos > 250) { pdf.addPage(); yPos=20; }
    pdf.setFontSize(14); pdf.setTextColor(171,9,106);
    pdf.text('Detalle de Incidencias', 20, yPos);
    yPos += 10;
    
    // Header
    pdf.setFillColor(26,41,128);
    pdf.rect(20, yPos, pageWidth-40, 8, 'F');
    pdf.setFontSize(9); pdf.setTextColor(255);
    const cols = [35, 30, 25, 50, 30];
    const headers = ['Técnico', 'Fecha', 'Empresa', 'Falla', 'Estado'];
    let x = 22;
    headers.forEach((h,i) => { pdf.text(h, x, yPos+6); x+=cols[i]; });
    yPos += 10;

    // Rows
    pdf.setFontSize(8); pdf.setTextColor(51);
    tickets.slice(0, 25).forEach((t, i) => { 
        if(yPos > 270) { pdf.addPage(); yPos=20; }
        if(i%2===0) { pdf.setFillColor(250); pdf.rect(20, yPos, pageWidth-40, 6, 'F'); }
        let xr = 22;
        pdf.text(t.tecnico.substring(0,18), xr, yPos+4); xr+=cols[0];
        pdf.text(t.fecha, xr, yPos+4); xr+=cols[1];
        pdf.text(t.empresa, xr, yPos+4); xr+=cols[2];
        pdf.text(t.tipoFalla.substring(0,28), xr, yPos+4); xr+=cols[3];
        pdf.text(t.estadoTexto, xr, yPos+4);
        yPos += 6;
    });

    // Guardar el archivo PDF
    pdf.save(`reporte-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // REGISTRAR EN HISTORIAL (NUEVO)
    registrarReporteEnHistorial(filtros);
    
    showNotification('Reporte descargado y guardado en historial', 'success');
}

function showNotification(msg, type) {
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px;border-radius:8px;color:white;font-weight:600;z-index:9999;background:${type==='success'?'#AB096A':'#3498db'}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(), 3000);
}