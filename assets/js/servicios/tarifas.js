/**
 * Calculo del cobro por estacionamiento.
 *
 * Regla: se cobra por hora. Toda estadia paga como minimo una hora y, pasada la primera,
 * cada hora iniciada se cobra solo si los minutos excedentes superan el tiempo de gracia.
 */
export function calcularCobro({ entrada, salida, tarifa, graciaMinutos }) {
    const minutos = Math.max(0, Math.floor((salida - entrada) / 60_000));
    const horasCompletas = Math.floor(minutos / 60);
    const excedente = minutos % 60;

    const cobraHoraExtra = horasCompletas === 0 || excedente > graciaMinutos;
    const horasCobradas = horasCompletas + (cobraHoraExtra ? 1 : 0);

    return { minutos, horasCobradas, total: horasCobradas * tarifa };
}
