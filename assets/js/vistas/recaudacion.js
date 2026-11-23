/** Vista "Recaudacion": indicadores economicos del parqueo. */
import { formatearMoneda } from '../formato.js';
import { recaudacionPorTipo, recaudacionUltimosDias, resumenRecaudacion } from '../servicios/estadisticas.js';
import { cabeceraVista, escapar, estadoVacio } from '../ui.js';

function tarjetaMetrica(etiqueta, valor, detalle = '') {
    return `
        <article class="metrica">
            <p class="metrica__etiqueta">${etiqueta}</p>
            <p class="metrica__valor">${valor}</p>
            ${detalle ? `<p class="metrica__detalle">${detalle}</p>` : ''}
        </article>`;
}

function graficoDiario(dias) {
    const maximo = Math.max(1, ...dias.map((d) => d.total));
    return `
        <div class="grafico-dias" role="img" aria-label="Recaudación de los últimos 7 días">
            ${dias
                .map(
                    (dia) => `
                <div class="grafico-dias__columna ${dia.esHoy ? 'grafico-dias__columna--hoy' : ''}">
                    <span class="grafico-dias__valor">${dia.total > 0 ? formatearMoneda(dia.total) : ''}</span>
                    <div class="grafico-dias__barra" style="height:${Math.max(2, (dia.total / maximo) * 100)}%"></div>
                    <span class="grafico-dias__etiqueta">${escapar(dia.etiqueta)}</span>
                </div>`,
                )
                .join('')}
        </div>`;
}

function listaPorTipo(filas, total) {
    if (filas.length === 0) return estadoVacio('Aún no hay cobros registrados.');

    return `<ul class="lista-barras">${filas
        .map(
            (fila) => `
            <li>
                <div class="lista-barras__texto">
                    <span>${escapar(fila.tipo)} <span class="texto-suave">(${fila.cantidad} ${fila.cantidad === 1 ? 'salida' : 'salidas'})</span></span>
                    <strong>${formatearMoneda(fila.total)}</strong>
                </div>
                <div class="barra"><div class="barra__relleno" style="width:${(fila.total / total) * 100}%"></div></div>
            </li>`,
        )
        .join('')}</ul>`;
}

export function montar(contenedor) {
    const resumen = resumenRecaudacion();

    contenedor.innerHTML = `
        ${cabeceraVista('Recaudación', 'Ingresos generados por el cobro de estacionamiento.')}

        <section class="cuadricula-metricas">
            ${tarjetaMetrica('Total recaudado', formatearMoneda(resumen.total), `${resumen.cobros} cobros en total`)}
            ${tarjetaMetrica('Hoy', formatearMoneda(resumen.hoy), `${resumen.vehiculosHoy} salidas`)}
            ${tarjetaMetrica('Este mes', formatearMoneda(resumen.mes))}
            ${tarjetaMetrica('Cobro promedio', formatearMoneda(resumen.ticketPromedio), 'Por vehículo')}
        </section>

        <div class="rejilla-dos">
            <section class="tarjeta">
                <h2>Últimos 7 días</h2>
                ${graficoDiario(recaudacionUltimosDias(7))}
            </section>
            <section class="tarjeta">
                <h2>Recaudación por tipo de vehículo</h2>
                ${listaPorTipo(recaudacionPorTipo(), resumen.total)}
            </section>
        </div>`;
}
