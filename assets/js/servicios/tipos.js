/** Mantenimiento del catalogo de tipos de vehiculo y sus tarifas. */
import { crearId, guardarTipos, obtenerTipos, obtenerVehiculos } from '../almacen.js';
import { ErrorValidacion, validarTipo } from '../validaciones.js';

export function crearTipo(datos) {
    const tipo = { id: crearId(), ...validarTipo(datos) };
    guardarTipos([...obtenerTipos(), tipo]);
    return tipo;
}

export function actualizarTipo(id, datos) {
    const cambios = validarTipo({ ...datos, id });
    const tipos = obtenerTipos();
    const indice = tipos.findIndex((t) => t.id === id);
    if (indice === -1) throw new ErrorValidacion('El tipo de vehículo ya no existe.');

    const vehiculosAfectados = obtenerVehiculos().filter((v) => v.tipoId === id && !v.placa.startsWith(cambios.prefijo));
    if (vehiculosAfectados.length > 0) {
        throw new ErrorValidacion(
            `No se puede cambiar el prefijo a "${cambios.prefijo}": hay vehículos dentro del parqueo con otro prefijo.`,
        );
    }

    tipos[indice] = { ...tipos[indice], ...cambios };
    guardarTipos(tipos);
}

export function eliminarTipo(id) {
    const tipos = obtenerTipos();
    if (tipos.length <= 1) throw new ErrorValidacion('Debe existir al menos un tipo de vehículo.');
    
    if (obtenerVehiculos().some((v) => v.tipoId === id)) {
        throw new ErrorValidacion('Hay vehículos de este tipo dentro del parqueo. Cobra su salida antes de eliminarlo.');
    }
    guardarTipos(tipos.filter((t) => t.id !== id));
}
