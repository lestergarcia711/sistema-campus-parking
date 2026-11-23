/** Utilidades de navegacion basadas en el hash de la URL (#/ruta/parametro). */
export function ir(ruta) {
    location.hash = `#/${ruta}`;
}

export function leerRutaActual() {
    const [ruta = '', ...parametros] = location.hash.replace(/^#\/?/, '').split('/');
    return { ruta, parametros: parametros.map(decodeURIComponent) };
}
