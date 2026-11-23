/** Vista "Historial": consulta, filtro, comprobantes y exportacion de las salidas cobradas. */
import { obtenerHistorial } from '../almacen.js';
import { descargarHistorialCsv } from '../exportar.js';
import { fechaDeInput, formatearDuracion, formatearFechaHora, formatearMoneda } from '../formato.js';
import { icono } from '../iconos.js';
import { eliminarDelHistorial } from '../servicios/parqueo.js';
import { cabeceraVista, confirmar, escapar, estadoVacio, notificar } from '../ui.js';
import { mostrarComprobante } from './comprobante.js';

const UN_DIA_MS = 86_400_000;

function filaHistorial(registro) {
    return `
        <tr data-id="${registro.id}">
            <td data-label="Placa"><strong>${escapar(registro.placa)}</strong></td>
            <td data-label="Tipo">${escapar(registro.tipoNombre)}</td>
            <td data-label="Entrada">${formatearFechaHora(registro.entrada)}</td>
            <td data-label="Salida">${formatearFechaHora(registro.salida)}</td>
            <td data-label="Tiempo">${formatearDuracion(registro.minutos)}</td>
            <td data-label="Total pagado"><strong>${formatearMoneda(registro.total)}</strong></td>
            <td class="tabla__acciones">
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono" data-accion="comprobante" title="Ver comprobante" aria-label="Ver comprobante de ${escapar(registro.placa)}">${icono('recibo', 15)}</button>
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono boton--riesgo" data-accion="eliminar" title="Eliminar registro" aria-label="Eliminar registro de ${escapar(registro.placa)}">${icono('papelera', 15)}</button>
            </td>
        </tr>`;
}

export function montar(contenedor) {
    contenedor.innerHTML = `
        ${cabeceraVista(
            'Historial',
            'Vehículos que ya abandonaron el parqueo y su cobro.',
            `<button type="button" class="boton boton--secundario" data-exportar>${icono('descarga', 16)}Exportar CSV</button>`,
        )}
        <section class="tarjeta">
            <div class="barra-herramientas">
                <div class="campo campo--buscador">
                    <label class="visualmente-oculto" for="filtro-texto">Buscar por placa</label>
                    ${icono('buscar', 16)}
                    <input id="filtro-texto" type="search" placeholder="Buscar por placa" autocomplete="off">
                </div>
                <div class="campo campo--en-linea">
                    <label for="filtro-desde">Desde</label>
                    <input id="filtro-desde" type="date">
                </div>
                <div class="campo campo--en-linea">
                    <label for="filtro-hasta">Hasta</label>
                    <input id="filtro-hasta" type="date">
                </div>
            </div>
            <div class="tabla-contenedor" id="contenedor-tabla"></div>
            <p class="pie-tabla" id="pie-tabla"></p>
        </section>`;

    const campoTexto = contenedor.querySelector('#filtro-texto');
    const campoDesde = contenedor.querySelector('#filtro-desde');
    const campoHasta = contenedor.querySelector('#filtro-hasta');
    const contenedorTabla = contenedor.querySelector('#contenedor-tabla');
    const pie = contenedor.querySelector('#pie-tabla');

    const filtrar = () => {
        const texto = campoTexto.value.trim().toUpperCase();
        const desde = campoDesde.value ? fechaDeInput(campoDesde.value) : -Infinity;
        const hasta = campoHasta.value ? fechaDeInput(campoHasta.value) + UN_DIA_MS : Infinity;

        return obtenerHistorial()
            .filter((r) => r.placa.includes(texto) && r.salida >= desde && r.salida < hasta)
            .sort((a, b) => b.salida - a.salida);
    };

    const dibujarTabla = () => {
        const registros = filtrar();
        const total = registros.reduce((suma, r) => suma + r.total, 0);

        pie.textContent = registros.length > 0 ? `${registros.length} registros, total ${formatearMoneda(total)}` : '';

        if (registros.length === 0) {
            contenedorTabla.innerHTML = estadoVacio(
                obtenerHistorial().length === 0 ? 'Aún no hay salidas registradas.' : 'Ningún registro coincide con el filtro.',
            );
            return;
        }

        contenedorTabla.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Placa</th><th>Tipo</th><th>Entrada</th><th>Salida</th><th>Tiempo</th><th>Total pagado</th><th><span class="visualmente-oculto">Acciones</span></th>
                    </tr>
                </thead>
                <tbody>${registros.map(filaHistorial).join('')}</tbody>
            </table>`;
    };

    [campoTexto, campoDesde, campoHasta].forEach((campo) => campo.addEventListener('input', dibujarTabla));

    contenedor.querySelector('[data-exportar]').addEventListener('click', () => {
        const registros = filtrar();
        if (registros.length === 0) return notificar('No hay registros para exportar.', 'info');
        descargarHistorialCsv(registros);
    });

    contenedorTabla.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) return;

        const id = boton.closest('tr').dataset.id;
        const registro = obtenerHistorial().find((r) => r.id === id);
        if (!registro) return dibujarTabla();

        if (boton.dataset.accion === 'comprobante') {
            mostrarComprobante(registro);
            return;
        }

        const eliminar = await confirmar({
            titulo: 'Eliminar registro',
            mensaje: `Se eliminará el cobro de <strong>${escapar(registro.placa)}</strong> por ${formatearMoneda(registro.total)}. Esto reduce la recaudación total y no se puede deshacer.`,
            textoEnviar: 'Eliminar',
            peligro: true,
        });
        if (eliminar) {
            eliminarDelHistorial(id);
            notificar('Registro eliminado del historial.', 'info');
            dibujarTabla();
        }
    });

    dibujarTabla();
}
