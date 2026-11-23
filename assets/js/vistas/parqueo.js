/** Vista "Vehiculos en parqueo": consulta en vivo, cobro de salida, edicion y anulacion. */
import { REFRESCO_MS } from '../config.js';
import { obtenerTipos } from '../almacen.js';
import { formatearDuracion, formatearFechaHora, formatearMoneda } from '../formato.js';
import { icono } from '../iconos.js';
import { ir } from '../navegacion.js';
import { anularIngreso, calcularCobroVehiculo, cobrarSalida, listarVehiculos } from '../servicios/parqueo.js';
import { ErrorValidacion } from '../validaciones.js';
import { abrirModal, cabeceraVista, confirmar, escapar, estadoVacio, notificar } from '../ui.js';
import { mostrarComprobante } from './comprobante.js';

function filaVehiculo(vehiculo) {
    const cobro = calcularCobroVehiculo(vehiculo);
    return `
        <tr data-id="${vehiculo.id}">
            <td data-label="Placa"><strong>${escapar(vehiculo.placa)}</strong></td>
            <td data-label="Tipo">${escapar(vehiculo.tipo.nombre)}</td>
            <td data-label="Espacio">${vehiculo.espacio}</td>
            <td data-label="Entrada">${formatearFechaHora(vehiculo.entrada)}</td>
            <td data-label="Tiempo">${formatearDuracion(cobro.minutos)}</td>
            <td data-label="Cobro estimado">${formatearMoneda(cobro.total)}</td>
            <td class="tabla__acciones">
                <button type="button" class="boton boton--primario boton--pequeno" data-accion="cobrar">${icono('dinero', 15)}Cobrar</button>
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono" data-accion="editar" title="Editar" aria-label="Editar ${escapar(vehiculo.placa)}">${icono('editar', 15)}</button>
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono boton--riesgo" data-accion="anular" title="Anular ingreso" aria-label="Anular ingreso de ${escapar(vehiculo.placa)}">${icono('papelera', 15)}</button>
            </td>
        </tr>`;
}

function cuerpoResumenCobro(vehiculo, cobro) {
    return `
        <dl class="detalle">
            <div><dt>Placa</dt><dd>${escapar(vehiculo.placa)}</dd></div>
            <div><dt>Tipo</dt><dd>${escapar(vehiculo.tipo.nombre)}</dd></div>
            <div><dt>Entrada</dt><dd>${formatearFechaHora(vehiculo.entrada)}</dd></div>
            <div><dt>Salida</dt><dd>${formatearFechaHora(cobro.salida)}</dd></div>
            <div><dt>Tiempo</dt><dd>${formatearDuracion(cobro.minutos)}</dd></div>
            <div><dt>Horas a cobrar</dt><dd>${cobro.horasCobradas} x ${formatearMoneda(cobro.tarifa)}</dd></div>
            <div class="detalle__total"><dt>Total a pagar</dt><dd>${formatearMoneda(cobro.total)}</dd></div>
        </dl>`;
}

async function iniciarCobro(vehiculo) {
    const cobro = calcularCobroVehiculo(vehiculo);
    const confirmado = await abrirModal({
        titulo: 'Cobrar salida',
        cuerpo: cuerpoResumenCobro(vehiculo, cobro),
        textoEnviar: 'Confirmar pago',
        alEnviar: () => cobrarSalida(vehiculo.id),
    });
    if (confirmado && confirmado !== true) {
        notificar(`Salida registrada: ${confirmado.placa}.`);
        mostrarComprobante(confirmado);
    }
}

export function montar(contenedor) {
    const tipos = obtenerTipos();

    contenedor.innerHTML = `
        ${cabeceraVista(
            'Vehículos en parqueo',
            'Seguimiento en tiempo real de los vehículos que se encuentran dentro.',
            '<button type="button" class="boton boton--primario" data-ir-ingreso>Registrar ingreso</button>',
        )}
        <section class="tarjeta">
            <div class="barra-herramientas">
                <div class="campo campo--buscador">
                    <label class="visualmente-oculto" for="filtro-texto">Buscar por placa</label>
                    ${icono('buscar', 16)}
                    <input id="filtro-texto" type="search" placeholder="Buscar por placa" autocomplete="off">
                </div>
                <div class="campo">
                    <label class="visualmente-oculto" for="filtro-tipo">Filtrar por tipo</label>
                    <select id="filtro-tipo">
                        <option value="">Todos los tipos</option>
                        ${tipos.map((t) => `<option value="${t.id}">${escapar(t.nombre)}</option>`).join('')}
                    </select>
                </div>
                <p class="barra-herramientas__conteo" id="conteo-vehiculos"></p>
            </div>
            <div class="tabla-contenedor" id="contenedor-tabla"></div>
        </section>`;

    const campoTexto = contenedor.querySelector('#filtro-texto');
    const campoTipo = contenedor.querySelector('#filtro-tipo');
    const contenedorTabla = contenedor.querySelector('#contenedor-tabla');
    const conteo = contenedor.querySelector('#conteo-vehiculos');

    const dibujarTabla = () => {
        const texto = campoTexto.value.trim().toUpperCase();
        const todos = listarVehiculos();
        const visibles = todos.filter(
            (v) => v.placa.includes(texto) && (campoTipo.value === '' || v.tipoId === campoTipo.value),
        );

        conteo.textContent = `${visibles.length} de ${todos.length} vehículos`;

        if (visibles.length === 0) {
            contenedorTabla.innerHTML = estadoVacio(
                todos.length === 0 ? 'No hay vehículos dentro del parqueo.' : 'Ningún vehículo coincide con el filtro.',
            );
            return;
        }

        contenedorTabla.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr>
                        <th>Placa</th><th>Tipo</th><th>Espacio</th><th>Entrada</th><th>Tiempo</th><th>Cobro estimado</th><th><span class="visualmente-oculto">Acciones</span></th>
                    </tr>
                </thead>
                <tbody>${visibles.map(filaVehiculo).join('')}</tbody>
            </table>`;
    };

    contenedor.querySelector('[data-ir-ingreso]').addEventListener('click', () => ir('ingreso'));
    campoTexto.addEventListener('input', dibujarTabla);
    campoTipo.addEventListener('change', dibujarTabla);

    contenedorTabla.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) return;

        const id = boton.closest('tr').dataset.id;
        const vehiculo = listarVehiculos().find((v) => v.id === id);
        if (!vehiculo) return dibujarTabla();

        try {
            if (boton.dataset.accion === 'cobrar') {
                await iniciarCobro(vehiculo);
            } else if (boton.dataset.accion === 'editar') {
                ir(`ingreso/editar/${id}`);
            } else if (boton.dataset.accion === 'anular') {
                const anular = await confirmar({
                    titulo: 'Anular ingreso',
                    mensaje: `Se eliminará el ingreso de <strong>${escapar(vehiculo.placa)}</strong> sin generar cobro. Úsalo solo para registros hechos por error.`,
                    textoEnviar: 'Anular ingreso',
                    peligro: true,
                });
                if (anular) {
                    anularIngreso(id);
                    notificar('Ingreso anulado.', 'info');
                }
            }
        } catch (error) {
            if (!(error instanceof ErrorValidacion)) throw error;
            notificar(error.message, 'error');
        }
        dibujarTabla();
    });

    dibujarTabla();
    const temporizador = setInterval(dibujarTabla, REFRESCO_MS);
    return () => clearInterval(temporizador);
}
