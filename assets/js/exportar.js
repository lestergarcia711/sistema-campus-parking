/** Exportacion del historial a CSV compatible con Excel. */
import { formatearFechaHora } from './formato.js';

const ENCABEZADOS = ['Placa', 'Tipo', 'Espacio', 'Entrada', 'Salida', 'Minutos', 'Horas cobradas', 'Tarifa por hora', 'Total'];

const escaparCelda = (valor) => `"${String(valor).replaceAll('"', '""')}"`;

export function descargarHistorialCsv(registros) {
    const filas = registros.map((r) => [
        r.placa,
        r.tipoNombre,
        r.espacio,
        formatearFechaHora(r.entrada),
        formatearFechaHora(r.salida),
        r.minutos,
        r.horasCobradas,
        r.tarifa.toFixed(2),
        r.total.toFixed(2),
    ]);

    const contenido = [ENCABEZADOS, ...filas].map((fila) => fila.map(escaparCelda).join(',')).join('\r\n');
    // El BOM inicial permite que Excel interprete correctamente las tildes.
    const archivo = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' });

    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `historial-campusparking-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}
