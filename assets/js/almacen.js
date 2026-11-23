/**
 * Capa de persistencia sobre localStorage.
 * Cada lectura consulta el almacenamiento, de modo que no existe estado duplicado en memoria
 * que pueda desincronizarse entre pestanas o vistas.
 */
import { CLAVES, CONFIG_INICIAL, TIPOS_INICIALES } from './config.js';

function leer(clave, valorPorDefecto) {
    try {
        const crudo = localStorage.getItem(clave);
        return crudo === null ? structuredClone(valorPorDefecto) : JSON.parse(crudo);
    } catch {
        return structuredClone(valorPorDefecto);
    }
}

function escribir(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

export function crearId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const obtenerTipos = () => leer(CLAVES.tipos, TIPOS_INICIALES);
export const guardarTipos = (tipos) => escribir(CLAVES.tipos, tipos);

export const obtenerVehiculos = () => leer(CLAVES.vehiculos, []);
export const guardarVehiculos = (vehiculos) => escribir(CLAVES.vehiculos, vehiculos);

export const obtenerHistorial = () => leer(CLAVES.historial, []);
export const guardarHistorial = (historial) => escribir(CLAVES.historial, historial);

export const obtenerConfig = () => ({ ...CONFIG_INICIAL, ...leer(CLAVES.config, CONFIG_INICIAL) });
export const guardarConfig = (config) => escribir(CLAVES.config, config);

export const obtenerUsuario = () => leer(CLAVES.usuario, null);
export const guardarUsuario = (usuario) => escribir(CLAVES.usuario, usuario);

/** Borra los datos operativos conservando la cuenta de acceso. */
export function restablecerDatos() {
    [CLAVES.tipos, CLAVES.vehiculos, CLAVES.historial, CLAVES.config].forEach((clave) =>
        localStorage.removeItem(clave),
    );
}
