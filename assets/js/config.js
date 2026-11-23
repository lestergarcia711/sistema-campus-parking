/**
 * Constantes y valores iniciales del sistema.
 * Todo lo que sea "dato de arranque" vive aqui para no repetirlo en el resto del codigo.
 */

const PREFIJO_ALMACEN = 'campusparking';

export const CLAVES = Object.freeze({
    usuario: `${PREFIJO_ALMACEN}:usuario`,
    tipos: `${PREFIJO_ALMACEN}:tipos`,
    vehiculos: `${PREFIJO_ALMACEN}:vehiculos`,
    historial: `${PREFIJO_ALMACEN}:historial`,
    config: `${PREFIJO_ALMACEN}:config`,
    sesion: `${PREFIJO_ALMACEN}:sesion`,
});

export const CONFIG_INICIAL = Object.freeze({
    capacidad: 50,
    graciaMinutos: 10,
    moneda: 'Q',
});

export const TIPOS_INICIALES = Object.freeze([
    { id: 'tipo-automovil', nombre: 'Automóvil', prefijo: 'P', tarifa: 40 },
    { id: 'tipo-moto', nombre: 'Moto', prefijo: 'M', tarifa: 20 },
    { id: 'tipo-camioneta', nombre: 'Camioneta', prefijo: 'C', tarifa: 50 },
    { id: 'tipo-bicicleta', nombre: 'Bicicleta', prefijo: 'B', tarifa: 10 },
    { id: 'tipo-camion', nombre: 'Camión', prefijo: 'T', tarifa: 60 },
]);

/** Cuenta de demostracion que se crea en el primer arranque. */
export const USUARIO_INICIAL = Object.freeze({
    usuario: 'admin',
    nombre: 'Administrador',
    clave: 'admin123',
});

export const LIMITES = Object.freeze({
    capacidadMaxima: 500,
    graciaMaxima: 59,
    tarifaMaxima: 10000,
    claveMinima: 6,
});

/** Intervalo con el que se refrescan los tiempos y cobros estimados en pantalla. */
export const REFRESCO_MS = 30_000;
