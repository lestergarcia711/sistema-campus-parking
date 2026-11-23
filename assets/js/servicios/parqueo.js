/**
 * Operaciones sobre los vehiculos que estan dentro del parqueo y su salida al historial.
 */
import {
    crearId,
    guardarHistorial,
    guardarVehiculos,
    obtenerConfig,
    obtenerHistorial,
    obtenerTipos,
    obtenerVehiculos,
} from '../almacen.js';
import { ErrorValidacion, validarVehiculo } from '../validaciones.js';
import { calcularCobro } from './tarifas.js';

const TIPO_DESCONOCIDO = Object.freeze({ nombre: 'Sin tipo', prefijo: '', tarifa: 0 });

/** Vehiculos dentro del parqueo, con su tipo ya resuelto, ordenados por ingreso mas reciente. */
export function listarVehiculos() {
    const tipos = new Map(obtenerTipos().map((tipo) => [tipo.id, tipo]));
    return obtenerVehiculos()
        .map((vehiculo) => ({ ...vehiculo, tipo: tipos.get(vehiculo.tipoId) ?? TIPO_DESCONOCIDO }))
        .sort((a, b) => b.entrada - a.entrada);
}

export function buscarVehiculo(id) {
    return listarVehiculos().find((vehiculo) => vehiculo.id === id) ?? null;
}

export function obtenerEspaciosLibres(idExcluido = null) {
    const ocupados = new Set(obtenerVehiculos().filter((v) => v.id !== idExcluido).map((v) => v.espacio));
    const { capacidad } = obtenerConfig();
    return Array.from({ length: capacidad }, (_, i) => i + 1).filter((numero) => !ocupados.has(numero));
}

export function registrarIngreso(datos) {
    const { placa, tipo, espacio } = validarVehiculo(datos);
    const vehiculo = { id: crearId(), placa, tipoId: tipo.id, espacio, entrada: Date.now() };
    guardarVehiculos([...obtenerVehiculos(), vehiculo]);
    return vehiculo;
}

export function actualizarVehiculo(id, datos) {
    const { placa, tipo, espacio } = validarVehiculo({ ...datos, idActual: id });
    const vehiculos = obtenerVehiculos();
    const indice = vehiculos.findIndex((v) => v.id === id);
    if (indice === -1) throw new ErrorValidacion('El vehículo ya no se encuentra en el parqueo.');

    vehiculos[indice] = { ...vehiculos[indice], placa, tipoId: tipo.id, espacio };
    guardarVehiculos(vehiculos);
}

/** Elimina un ingreso registrado por error, sin generar cobro ni historial. */
export function anularIngreso(id) {
    guardarVehiculos(obtenerVehiculos().filter((v) => v.id !== id));
}

export function calcularCobroVehiculo(vehiculo, salida = Date.now()) {
    const { graciaMinutos } = obtenerConfig();
    const tarifa = vehiculo.tipo.tarifa;
    return { ...calcularCobro({ entrada: vehiculo.entrada, salida, tarifa, graciaMinutos }), salida, tarifa };
}

/**
 * Cierra la estadia: calcula el cobro, mueve el vehiculo al historial y devuelve el comprobante.
 * El historial guarda una copia de los datos (nombre de tipo y tarifa) para que cambios posteriores
 * en la configuracion no alteren registros ya cobrados.
 */
export function cobrarSalida(id) {
    const vehiculo = buscarVehiculo(id);
    if (!vehiculo) throw new ErrorValidacion('El vehículo ya no se encuentra en el parqueo.');

    const cobro = calcularCobroVehiculo(vehiculo);
    const comprobante = {
        id: crearId(),
        placa: vehiculo.placa,
        tipoNombre: vehiculo.tipo.nombre,
        espacio: vehiculo.espacio,
        entrada: vehiculo.entrada,
        salida: cobro.salida,
        tarifa: cobro.tarifa,
        minutos: cobro.minutos,
        horasCobradas: cobro.horasCobradas,
        total: cobro.total,
    };

    guardarHistorial([...obtenerHistorial(), comprobante]);
    anularIngreso(id);
    return comprobante;
}

export function eliminarDelHistorial(id) {
    guardarHistorial(obtenerHistorial().filter((registro) => registro.id !== id));
}
