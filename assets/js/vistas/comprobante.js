/** Comprobante de salida: se muestra al cobrar y puede consultarse desde el historial. */
import { formatearDuracion, formatearFechaHora, formatearMoneda } from '../formato.js';
import { abrirModal, escapar } from '../ui.js';

export function mostrarComprobante(registro) {
    const cuerpo = `
        <div class="comprobante">
            <p class="comprobante__marca">CampusParking</p>
            <p class="comprobante__subtitulo">Comprobante de salida</p>
            <dl class="detalle">
                <div><dt>Placa</dt><dd>${escapar(registro.placa)}</dd></div>
                <div><dt>Tipo</dt><dd>${escapar(registro.tipoNombre)}</dd></div>
                <div><dt>Espacio</dt><dd>${registro.espacio}</dd></div>
                <div><dt>Entrada</dt><dd>${formatearFechaHora(registro.entrada)}</dd></div>
                <div><dt>Salida</dt><dd>${formatearFechaHora(registro.salida)}</dd></div>
                <div><dt>Tiempo</dt><dd>${formatearDuracion(registro.minutos)}</dd></div>
                <div><dt>Horas cobradas</dt><dd>${registro.horasCobradas} x ${formatearMoneda(registro.tarifa)}</dd></div>
                <div class="detalle__total"><dt>Total</dt><dd>${formatearMoneda(registro.total)}</dd></div>
            </dl>
        </div>`;

    return abrirModal({
        titulo: 'Comprobante',
        cuerpo,
        textoEnviar: 'Imprimir',
        textoCancelar: 'Cerrar',
        cerrarAlEnviar: false,
        clase: 'modal--comprobante',
        alEnviar: () => window.print(),
    });
}
