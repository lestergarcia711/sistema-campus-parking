/** Funciones de presentacion: dinero, fechas y duraciones. */
import { obtenerConfig } from './almacen.js';

const LOCALE = 'es-GT';

export function formatearMoneda(valor) {
    const { moneda } = obtenerConfig();
    const numero = valor.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${moneda}${numero}`;
}

export function formatearFechaHora(marcaTiempo) {
    return new Date(marcaTiempo).toLocaleString(LOCALE, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatearHora(marcaTiempo) {
    return new Date(marcaTiempo).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatearDuracion(minutosTotales) {
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    if (horas === 0) return `${minutos} min`;
    return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
}

export function inicioDelDia(marcaTiempo) {
    const fecha = new Date(marcaTiempo);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime();
}

/** Convierte un valor de <input type="date"> (AAAA-MM-DD) a inicio de dia local. */
export function fechaDeInput(valor) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia).getTime();
}
