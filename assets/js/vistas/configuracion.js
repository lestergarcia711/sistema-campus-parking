/** Vista "Configuracion": parametros del parqueo, catalogo de tarifas y datos del sistema. */
import { guardarConfig, obtenerConfig, obtenerTipos, restablecerDatos } from '../almacen.js';
import { formatearMoneda } from '../formato.js';
import { icono } from '../iconos.js';
import { ir } from '../navegacion.js';
import { actualizarTipo, crearTipo, eliminarTipo } from '../servicios/tipos.js';
import { abrirModal, cabeceraVista, confirmar, escapar, notificar } from '../ui.js';
import { ErrorValidacion, validarConfig } from '../validaciones.js';

function filaTipo(tipo) {
    return `
        <tr data-id="${tipo.id}">
            <td data-label="Tipo"><strong>${escapar(tipo.nombre)}</strong></td>
            <td data-label="Prefijo de placa">${escapar(tipo.prefijo)}</td>
            <td data-label="Tarifa por hora">${formatearMoneda(tipo.tarifa)}</td>
            <td class="tabla__acciones">
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono" data-accion="editar" title="Editar" aria-label="Editar ${escapar(tipo.nombre)}">${icono('editar', 15)}</button>
                <button type="button" class="boton boton--secundario boton--pequeno boton--icono boton--riesgo" data-accion="eliminar" title="Eliminar" aria-label="Eliminar ${escapar(tipo.nombre)}">${icono('papelera', 15)}</button>
            </td>
        </tr>`;
}

function formularioTipo(tipo = { nombre: '', prefijo: '', tarifa: '' }) {
    return `
        <div class="campo">
            <label for="tipo-nombre">Nombre</label>
            <input id="tipo-nombre" name="nombre" type="text" maxlength="30" value="${escapar(tipo.nombre)}" autocomplete="off">
        </div>
        <div class="formulario__fila">
            <div class="campo">
                <label for="tipo-prefijo">Prefijo de placa</label>
                <input id="tipo-prefijo" name="prefijo" type="text" maxlength="1" value="${escapar(tipo.prefijo)}" autocomplete="off">
            </div>
            <div class="campo">
                <label for="tipo-tarifa">Tarifa por hora</label>
                <input id="tipo-tarifa" name="tarifa" type="number" min="0" step="0.01" value="${tipo.tarifa}">
            </div>
        </div>`;
}

const leerFormularioTipo = (formulario) => ({
    nombre: formulario.elements.nombre.value,
    prefijo: formulario.elements.prefijo.value,
    tarifa: formulario.elements.tarifa.value,
});

export function montar(contenedor) {
    const config = obtenerConfig();

    contenedor.innerHTML = `
        ${cabeceraVista('Configuración', 'Parámetros del parqueo, tarifas y datos del sistema.')}

        <section class="tarjeta">
            <h2>Parámetros del parqueo</h2>
            <form id="formulario-config" class="formulario" novalidate>
                <div class="formulario__fila formulario__fila--tres">
                    <div class="campo">
                        <label for="config-capacidad">Capacidad total</label>
                        <input id="config-capacidad" name="capacidad" type="number" min="1" value="${config.capacidad}">
                        <small class="campo__ayuda">Cantidad de espacios disponibles.</small>
                    </div>
                    <div class="campo">
                        <label for="config-gracia">Tiempo de gracia (minutos)</label>
                        <input id="config-gracia" name="graciaMinutos" type="number" min="0" value="${config.graciaMinutos}">
                        <small class="campo__ayuda">Minutos extra tras una hora completa antes de cobrar la siguiente.</small>
                    </div>
                    <div class="campo">
                        <label for="config-moneda">Símbolo de moneda</label>
                        <input id="config-moneda" name="moneda" type="text" maxlength="3" value="${escapar(config.moneda)}">
                    </div>
                </div>
                <p class="modal__error" id="error-config" role="alert" hidden></p>
                <div class="formulario__acciones">
                    <button type="submit" class="boton boton--primario">Guardar parámetros</button>
                </div>
            </form>
        </section>

        <section class="tarjeta">
            <div class="tarjeta__cabecera">
                <h2>Tipos de vehículo y tarifas</h2>
                <button type="button" class="boton boton--primario boton--pequeno" data-accion="nuevo">${icono('ingreso', 15)}Nuevo tipo</button>
            </div>
            <div class="tabla-contenedor" id="contenedor-tipos"></div>
        </section>

        <section class="tarjeta">
            <h2>Datos del sistema</h2>
            <p class="texto-suave">Restablecer elimina los vehículos en parqueo, el historial de cobros y vuelve a los tipos y parámetros iniciales. La cuenta de acceso se conserva.</p>
            <div class="formulario__acciones">
                <button type="button" class="boton boton--peligro" data-accion="restablecer">Restablecer datos</button>
            </div>
        </section>`;

    const contenedorTipos = contenedor.querySelector('#contenedor-tipos');

    const dibujarTipos = () => {
        contenedorTipos.innerHTML = `
            <table class="tabla">
                <thead>
                    <tr><th>Tipo</th><th>Prefijo de placa</th><th>Tarifa por hora</th><th><span class="visualmente-oculto">Acciones</span></th></tr>
                </thead>
                <tbody>${obtenerTipos().map(filaTipo).join('')}</tbody>
            </table>`;
    };
    dibujarTipos();

    /* Parametros generales */
    const formularioConfig = contenedor.querySelector('#formulario-config');
    const errorConfig = contenedor.querySelector('#error-config');
    formularioConfig.addEventListener('submit', (evento) => {
        evento.preventDefault();
        errorConfig.hidden = true;
        try {
            guardarConfig(
                validarConfig({
                    capacidad: formularioConfig.elements.capacidad.value,
                    graciaMinutos: formularioConfig.elements.graciaMinutos.value,
                    moneda: formularioConfig.elements.moneda.value,
                }),
            );
            notificar('Parámetros guardados.');
            dibujarTipos();
        } catch (error) {
            if (!(error instanceof ErrorValidacion)) throw error;
            errorConfig.textContent = error.message;
            errorConfig.hidden = false;
        }
    });

    /* Catalogo de tipos */
    contenedorTipos.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) return;
        const tipo = obtenerTipos().find((t) => t.id === boton.closest('tr').dataset.id);
        if (!tipo) return;

        if (boton.dataset.accion === 'editar') {
            const guardado = await abrirModal({
                titulo: 'Editar tipo de vehículo',
                cuerpo: formularioTipo(tipo),
                textoEnviar: 'Guardar cambios',
                alEnviar: (formulario) => actualizarTipo(tipo.id, leerFormularioTipo(formulario)),
            });
            if (guardado) notificar('Tipo de vehículo actualizado.');
        } else {
            const eliminar = await confirmar({
                titulo: 'Eliminar tipo de vehículo',
                mensaje: `Se eliminará el tipo <strong>${escapar(tipo.nombre)}</strong>. Los cobros anteriores no se modifican.`,
                textoEnviar: 'Eliminar',
                peligro: true,
            });
            if (!eliminar) return;
            try {
                eliminarTipo(tipo.id);
                notificar('Tipo de vehículo eliminado.', 'info');
            } catch (error) {
                if (!(error instanceof ErrorValidacion)) throw error;
                notificar(error.message, 'error');
            }
        }
        dibujarTipos();
    });

    contenedor.querySelector('[data-accion="nuevo"]').addEventListener('click', async () => {
        const creado = await abrirModal({
            titulo: 'Nuevo tipo de vehículo',
            cuerpo: formularioTipo(),
            textoEnviar: 'Crear tipo',
            alEnviar: (formulario) => crearTipo(leerFormularioTipo(formulario)),
        });
        if (creado) {
            notificar('Tipo de vehículo creado.');
            dibujarTipos();
        }
    });

    /* Restablecer */
    contenedor.querySelector('[data-accion="restablecer"]').addEventListener('click', async () => {
        const restablecer = await confirmar({
            titulo: 'Restablecer datos',
            mensaje: 'Se eliminarán <strong>todos los vehículos en parqueo y el historial de cobros</strong>. Esta acción no se puede deshacer.',
            textoEnviar: 'Restablecer todo',
            peligro: true,
        });
        if (!restablecer) return;
        restablecerDatos();
        notificar('Datos restablecidos.', 'info');
        ir('resumen');
    });
}
