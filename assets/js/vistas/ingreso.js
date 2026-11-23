/**
 * Vista "Registrar ingreso". Sirve tanto para crear como para editar un ingreso:
 *   #/ingreso            -> nuevo, primer espacio libre
 *   #/ingreso/12         -> nuevo, espacio 12 preseleccionado
 *   #/ingreso/editar/ID  -> edicion del vehiculo ID
 */
import { obtenerTipos } from '../almacen.js';
import { formatearMoneda } from '../formato.js';
import { ir } from '../navegacion.js';
import { actualizarVehiculo, buscarVehiculo, obtenerEspaciosLibres, registrarIngreso } from '../servicios/parqueo.js';
import { ErrorValidacion } from '../validaciones.js';
import { cabeceraVista, escapar, notificar } from '../ui.js';

function resolverModo(parametros) {
    if (parametros[0] === 'editar') {
        const vehiculo = buscarVehiculo(parametros[1]);
        return vehiculo ? { edicion: true, vehiculo } : { edicion: false, vehiculo: null };
    }
    const espacioSugerido = Number(parametros[0]);
    return { edicion: false, vehiculo: null, espacioSugerido: Number.isInteger(espacioSugerido) ? espacioSugerido : null };
}

export function montar(contenedor, parametros) {
    const { edicion, vehiculo, espacioSugerido } = resolverModo(parametros);
    const tipos = obtenerTipos();
    const espaciosLibres = obtenerEspaciosLibres(vehiculo?.id);

    if (espaciosLibres.length === 0) {
        contenedor.innerHTML = `
            ${cabeceraVista('Registrar ingreso', 'No hay espacios disponibles.')}
            <section class="tarjeta"><p>El parqueo está lleno. Cobra la salida de algún vehículo o aumenta la capacidad en Configuración.</p></section>`;
        return;
    }

    const espacioInicial = vehiculo?.espacio ?? (espaciosLibres.includes(espacioSugerido) ? espacioSugerido : espaciosLibres[0]);
    const tipoInicial = vehiculo?.tipoId ?? tipos[0].id;

    contenedor.innerHTML = `
        ${cabeceraVista(
            edicion ? 'Editar vehículo' : 'Registrar ingreso',
            edicion
                ? 'Corrige los datos del vehículo. La hora de entrada original se conserva.'
                : 'La fecha y hora de entrada se registran automáticamente al guardar.',
        )}
        <section class="tarjeta tarjeta--formulario">
            <form id="formulario-ingreso" class="formulario" novalidate>
                <div class="formulario__fila">
                    <div class="campo">
                        <label for="campo-tipo">Tipo de vehículo</label>
                        <select id="campo-tipo" name="tipoId">
                            ${tipos
                                .map(
                                    (t) => `<option value="${t.id}" ${t.id === tipoInicial ? 'selected' : ''}>${escapar(t.nombre)} (${formatearMoneda(t.tarifa)} / hora)</option>`,
                                )
                                .join('')}
                        </select>
                    </div>
                    <div class="campo">
                        <label for="campo-placa">Número de placa</label>
                        <input id="campo-placa" name="placa" type="text" maxlength="12" autocomplete="off" spellcheck="false" value="${escapar(vehiculo?.placa ?? '')}">
                        <small id="ayuda-placa" class="campo__ayuda"></small>
                    </div>
                </div>
                <div class="campo">
                    <label for="campo-espacio">Espacio de parqueo</label>
                    <select id="campo-espacio" name="espacio">
                        ${espaciosLibres.map((n) => `<option value="${n}" ${n === espacioInicial ? 'selected' : ''}>Espacio ${n}</option>`).join('')}
                    </select>
                    <small class="campo__ayuda">${espaciosLibres.length} espacios disponibles.</small>
                </div>
                <p class="modal__error" id="error-formulario" role="alert" hidden></p>
                <div class="formulario__acciones">
                    ${edicion ? '<button type="button" class="boton boton--secundario" data-cancelar>Cancelar</button>' : ''}
                    <button type="submit" class="boton boton--primario">${edicion ? 'Guardar cambios' : 'Registrar ingreso'}</button>
                </div>
            </form>
        </section>`;

    const formulario = contenedor.querySelector('#formulario-ingreso');
    const campoTipo = formulario.elements.tipoId;
    const campoPlaca = formulario.elements.placa;
    const ayudaPlaca = contenedor.querySelector('#ayuda-placa');
    const zonaError = contenedor.querySelector('#error-formulario');

    const actualizarAyudaPlaca = () => {
        const tipo = tipos.find((t) => t.id === campoTipo.value);
        ayudaPlaca.textContent = `Debe iniciar con "${tipo.prefijo}". Ejemplo: ${tipo.prefijo}-123ABC`;
    };
    actualizarAyudaPlaca();
    campoTipo.addEventListener('change', actualizarAyudaPlaca);
    campoPlaca.addEventListener('input', () => {
        campoPlaca.value = campoPlaca.value.toUpperCase();
    });

    contenedor.querySelector('[data-cancelar]')?.addEventListener('click', () => ir('parqueo'));

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        zonaError.hidden = true;
        const datos = {
            placa: campoPlaca.value,
            tipoId: campoTipo.value,
            espacio: formulario.elements.espacio.value,
        };

        try {
            if (edicion) {
                actualizarVehiculo(vehiculo.id, datos);
                notificar('Vehículo actualizado correctamente.');
            } else {
                const nuevo = registrarIngreso(datos);
                notificar(`Ingreso registrado: ${nuevo.placa} en el espacio ${nuevo.espacio}.`);
            }
            ir('parqueo');
            
        } catch (error) {
            if (!(error instanceof ErrorValidacion)) throw error;
            zonaError.textContent = error.message;
            zonaError.hidden = false;
        }
    });
}
