/** Indicadores derivados del historial de cobros. */
import { obtenerHistorial } from '../almacen.js';
import { inicioDelDia } from '../formato.js';

const sumar = (registros) => registros.reduce((acumulado, registro) => acumulado + registro.total, 0);

export function resumenRecaudacion() {
    const historial = obtenerHistorial();
    const ahora = new Date();
    const inicioHoy = inicioDelDia(ahora.getTime());
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();

    const hoy = historial.filter((r) => r.salida >= inicioHoy);
    const mes = historial.filter((r) => r.salida >= inicioMes);
    const total = sumar(historial);

    return {
        total,
        hoy: sumar(hoy),
        mes: sumar(mes),
        vehiculosHoy: hoy.length,
        cobros: historial.length,
        ticketPromedio: historial.length > 0 ? total / historial.length : 0,
    };
}

export function recaudacionPorTipo() {
    const acumulado = new Map();
    for (const registro of obtenerHistorial()) {
        const actual = acumulado.get(registro.tipoNombre) ?? { tipo: registro.tipoNombre, total: 0, cantidad: 0 };
        actual.total += registro.total;
        actual.cantidad += 1;
        acumulado.set(registro.tipoNombre, actual);
    }
    return [...acumulado.values()].sort((a, b) => b.total - a.total);
}

/** Recaudacion diaria de los ultimos `dias` dias, el ultimo elemento es hoy. */
export function recaudacionUltimosDias(dias = 7) {
    const historial = obtenerHistorial();
    const hoy = inicioDelDia(Date.now());

    return Array.from({ length: dias }, (_, i) => {
        const inicio = new Date(hoy);
        inicio.setDate(inicio.getDate() - (dias - 1 - i));
        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 1);

        const delDia = historial.filter((r) => r.salida >= inicio.getTime() && r.salida < fin.getTime());
        return {
            etiqueta: inicio.toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit' }),
            total: sumar(delDia),
            esHoy: i === dias - 1,
        };
    });
}
