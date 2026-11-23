/** Vista "Panel": estado actual del parqueo de un vistazo. */
import { obtenerConfig, obtenerHistorial, obtenerTipos } from '../almacen.js';
import { formatearHora, formatearMoneda } from '../formato.js';
import { ir } from '../navegacion.js';
import { resumenRecaudacion } from '../servicios/estadisticas.js';
import { listarVehiculos } from '../servicios/parqueo.js';
import { cabeceraVista, escapar, estadoVacio } from '../ui.js';

function tarjetaMetrica(etiqueta, valor, detalle = '') {
    return `
        <article class="metrica">
            <p class="metrica__etiqueta">${etiqueta}</p>
            <p class="metrica__valor">${valor}</p>
            ${detalle ? `<p class="metrica__detalle">${detalle}</p>` : ''}
        </article>`;
}

function mapaDeEspacios(capacidad, vehiculos) {
    const porEspacio = new Map(vehiculos.map((v) => [v.espacio, v]));
    const celdas = Array.from({ length: capacidad }, (_, i) => {
        const numero = i + 1;
        const vehiculo = porEspacio.get(numero);
        const clase = vehiculo ? 'espacio espacio--ocupado' : 'espacio';
        const titulo = vehiculo ? `${vehiculo.placa} (${vehiculo.tipo.nombre})` : 'Disponible, clic para registrar ingreso';
        return `<button type="button" class="${clase}" data-espacio="${numero}" title="${escapar(titulo)}">${numero}</button>`;
    });
    return `<div class="mapa-espacios">${celdas.join('')}</div>`;
}

function ocupacionPorTipo(vehiculos) {
    const filas = obtenerTipos().map((tipo) => ({
        nombre: tipo.nombre,
        cantidad: vehiculos.filter((v) => v.tipoId === tipo.id).length,
    }));
    const maximo = Math.max(1, ...filas.map((f) => f.cantidad));

    return `<ul class="lista-barras">${filas
        .map(
            (fila) => `
            <li>
                <div class="lista-barras__texto"><span>${escapar(fila.nombre)}</span><strong>${fila.cantidad}</strong></div>
                <div class="barra"><div class="barra__relleno" style="width:${(fila.cantidad / maximo) * 100}%"></div></div>
            </li>`,
        )
        .join('')}</ul>`;
}

function ultimasSalidas() {
    const recientes = [...obtenerHistorial()].sort((a, b) => b.salida - a.salida).slice(0, 5);
    if (recientes.length === 0) return estadoVacio('Aún no se registran salidas.');

    return `<ul class="lista-simple">${recientes
        .map(
            (r) => `
            <li>
                <div><strong>${escapar(r.placa)}</strong><span class="texto-suave"> ${escapar(r.tipoNombre)}</span></div>
                <div class="lista-simple__derecha"><strong>${formatearMoneda(r.total)}</strong><span class="texto-suave">${formatearHora(r.salida)}</span></div>
            </li>`,
        )
        .join('')}</ul>`;
}

export function montar(contenedor) {
    const { capacidad } = obtenerConfig();
    const vehiculos = listarVehiculos();
    const ocupados = vehiculos.length;
    const porcentaje = Math.round((ocupados / capacidad) * 100);
    const recaudacion = resumenRecaudacion();

    contenedor.innerHTML = `
        ${cabeceraVista('Panel', 'Estado actual del parqueo y movimiento del día.')}

        <section class="cuadricula-metricas">
            ${tarjetaMetrica('Ocupación', `${porcentaje}%`, `${ocupados} de ${capacidad} espacios`)}
            ${tarjetaMetrica('Espacios disponibles', capacidad - ocupados)}
            ${tarjetaMetrica('Recaudado hoy', formatearMoneda(recaudacion.hoy))}
            ${tarjetaMetrica('Salidas de hoy', recaudacion.vehiculosHoy)}
        </section>

        <section class="tarjeta">
            <div class="tarjeta__cabecera">
                <h2>Mapa de espacios</h2>
                <div class="leyenda">
                    <span><i class="leyenda__punto"></i>Disponible</span>
                    <span><i class="leyenda__punto leyenda__punto--ocupado"></i>Ocupado</span>
                </div>
            </div>
            ${mapaDeEspacios(capacidad, vehiculos)}
        </section>

        <div class="rejilla-dos">
            <section class="tarjeta">
                <h2>Ocupación por tipo</h2>
                ${ocupacionPorTipo(vehiculos)}
            </section>
            <section class="tarjeta">
                <h2>Últimas salidas</h2>
                ${ultimasSalidas()}
            </section>
        </div>`;

    contenedor.querySelector('.mapa-espacios').addEventListener('click', (evento) => {
        const celda = evento.target.closest('[data-espacio]');
        if (!celda) return;
        ir(celda.classList.contains('espacio--ocupado') ? 'parqueo' : `ingreso/${celda.dataset.espacio}`);
    });
}
