/**
 * Reglas de validacion del dominio. Todas las funciones lanzan ErrorValidacion con un mensaje
 * listo para mostrar al usuario, y devuelven los datos ya normalizados cuando son validos.
 */
import { LIMITES } from './config.js';
import { obtenerConfig, obtenerTipos, obtenerVehiculos } from './almacen.js';

export class ErrorValidacion extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = 'ErrorValidacion';
    }
}

const PATRON_PLACA = /^[A-Z0-9-]{4,10}$/;
const PATRON_PREFIJO = /^[A-Z]$/;

export function normalizarPlaca(placa) {
    return placa.replace(/\s+/g, '').toUpperCase();
}

export function validarVehiculo({ placa, tipoId, espacio, idActual = null }) {
    const tipo = obtenerTipos().find((t) => t.id === tipoId);
    if (!tipo) throw new ErrorValidacion('Selecciona un tipo de vehículo.');

    const placaNormalizada = normalizarPlaca(placa);
    if (!PATRON_PLACA.test(placaNormalizada)) {
        throw new ErrorValidacion('La placa debe tener entre 4 y 10 caracteres alfanuméricos (se permite el guion).');
    }
    if (!placaNormalizada.startsWith(tipo.prefijo)) {
        throw new ErrorValidacion(`La placa de un vehículo tipo ${tipo.nombre} debe iniciar con "${tipo.prefijo}".`);
    }

    const { capacidad } = obtenerConfig();
    const numeroEspacio = Number(espacio);
    if (!Number.isInteger(numeroEspacio) || numeroEspacio < 1 || numeroEspacio > capacidad) {
        throw new ErrorValidacion(`El espacio debe estar entre 1 y ${capacidad}.`);
    }

    const otros = obtenerVehiculos().filter((v) => v.id !== idActual);
    if (otros.some((v) => v.espacio === numeroEspacio)) {
        throw new ErrorValidacion(`El espacio ${numeroEspacio} ya está ocupado.`);
    }
    // "P-123ABC" y "P123ABC" identifican el mismo vehiculo.
    const sinGuion = (placaVehiculo) => placaVehiculo.replaceAll('-', '');
    if (otros.some((v) => sinGuion(v.placa) === sinGuion(placaNormalizada))) {
        throw new ErrorValidacion(`La placa ${placaNormalizada} ya se encuentra dentro del parqueo.`);
    }

    return { placa: placaNormalizada, tipo, espacio: numeroEspacio };
}

export function validarTipo({ id = null, nombre, prefijo, tarifa }) {
    const nombreLimpio = nombre.trim();
    const prefijoLimpio = prefijo.trim().toUpperCase();
    const tarifaNumerica = Number(tarifa);

    if (nombreLimpio.length < 2 || nombreLimpio.length > 30) {
        throw new ErrorValidacion('El nombre debe tener entre 2 y 30 caracteres.');
    }
    if (!PATRON_PREFIJO.test(prefijoLimpio)) {
        throw new ErrorValidacion('El prefijo de placa debe ser una sola letra.');
    }
    if (!Number.isFinite(tarifaNumerica) || tarifaNumerica <= 0 || tarifaNumerica > LIMITES.tarifaMaxima) {
        throw new ErrorValidacion(`La tarifa debe ser mayor que 0 y no superar ${LIMITES.tarifaMaxima}.`);
    }

    const otros = obtenerTipos().filter((t) => t.id !== id);
    if (otros.some((t) => t.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
        throw new ErrorValidacion(`Ya existe un tipo llamado "${nombreLimpio}".`);
    }
    if (otros.some((t) => t.prefijo === prefijoLimpio)) {
        throw new ErrorValidacion(`El prefijo "${prefijoLimpio}" ya pertenece a otro tipo.`);
    }

    return { nombre: nombreLimpio, prefijo: prefijoLimpio, tarifa: Math.round(tarifaNumerica * 100) / 100 };
}

export function validarConfig({ capacidad, graciaMinutos, moneda }) {
    const capacidadNumerica = Number(capacidad);
    const graciaNumerica = Number(graciaMinutos);
    const monedaLimpia = moneda.trim();

    if (!Number.isInteger(capacidadNumerica) || capacidadNumerica < 1 || capacidadNumerica > LIMITES.capacidadMaxima) {
        throw new ErrorValidacion(`La capacidad debe ser un número entero entre 1 y ${LIMITES.capacidadMaxima}.`);
    }

    const espacioMasAlto = Math.max(0, ...obtenerVehiculos().map((v) => v.espacio));
    if (capacidadNumerica < espacioMasAlto) {
        throw new ErrorValidacion(
            `No se puede reducir la capacidad a ${capacidadNumerica}: el espacio ${espacioMasAlto} está ocupado.`,
        );
    }
    if (!Number.isInteger(graciaNumerica) || graciaNumerica < 0 || graciaNumerica > LIMITES.graciaMaxima) {
        throw new ErrorValidacion(`El tiempo de gracia debe estar entre 0 y ${LIMITES.graciaMaxima} minutos.`);
    }
    if (monedaLimpia.length < 1 || monedaLimpia.length > 3) {
        throw new ErrorValidacion('El símbolo de moneda debe tener entre 1 y 3 caracteres.');
    }

    return { capacidad: capacidadNumerica, graciaMinutos: graciaNumerica, moneda: monedaLimpia };
}
