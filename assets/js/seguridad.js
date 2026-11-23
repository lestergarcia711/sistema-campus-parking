/**
 * Autenticacion y sesion.
 *
 * Es un sistema 100 % del lado del cliente: la contrasena se guarda como hash SHA-256 y la sesion
 * vive en sessionStorage (se cierra al cerrar la pestana). Esto evita guardar claves en texto
 * plano, pero NO sustituye a una autenticacion real con servidor.
 */
import { CLAVES, LIMITES, USUARIO_INICIAL } from './config.js';
import { guardarUsuario, obtenerUsuario } from './almacen.js';
import { ErrorValidacion } from './validaciones.js';

async function hashear(texto) {
    const datos = new TextEncoder().encode(texto);
    const resumen = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(resumen), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Crea la cuenta de demostracion si el sistema se abre por primera vez. */
export async function asegurarUsuarioInicial() {
    if (obtenerUsuario()) return;
    guardarUsuario({
        usuario: USUARIO_INICIAL.usuario,
        nombre: USUARIO_INICIAL.nombre,
        claveHash: await hashear(USUARIO_INICIAL.clave),
    });
}

export async function iniciarSesion(usuario, clave) {
    const cuenta = obtenerUsuario();
    if (!cuenta) return false;

    const usuarioValido = cuenta.usuario.toLowerCase() === usuario.trim().toLowerCase();
    const claveValida = cuenta.claveHash === (await hashear(clave));
    if (!usuarioValido || !claveValida) return false;

    sessionStorage.setItem(CLAVES.sesion, JSON.stringify({ usuario: cuenta.usuario, inicio: Date.now() }));
    return true;
}

export function haySesionActiva() {
    return sessionStorage.getItem(CLAVES.sesion) !== null;
}

export function cerrarSesion() {
    sessionStorage.removeItem(CLAVES.sesion);
}

/**
 * Actualiza el nombre visible y, opcionalmente, la contrasena.
 * Exige la contrasena actual para cualquier cambio de credenciales.
 */
export async function actualizarPerfil({ nombre, claveActual, claveNueva, claveConfirmacion }) {
    const cuenta = obtenerUsuario();
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 2) throw new ErrorValidacion('Escribe un nombre de al menos 2 caracteres.');

    const cambiaClave = claveNueva !== '' || claveConfirmacion !== '';
    if (cambiaClave) {
        if ((await hashear(claveActual)) !== cuenta.claveHash) {
            throw new ErrorValidacion('La contraseña actual no es correcta.');
        }
        if (claveNueva.length < LIMITES.claveMinima) {
            throw new ErrorValidacion(`La nueva contraseña debe tener al menos ${LIMITES.claveMinima} caracteres.`);
        }
        if (claveNueva !== claveConfirmacion) {
            throw new ErrorValidacion('La confirmación no coincide con la nueva contraseña.');
        }
    }

    const actualizado = {
        ...cuenta,
        nombre: nombreLimpio,
        claveHash: cambiaClave ? await hashear(claveNueva) : cuenta.claveHash,
    };
    guardarUsuario(actualizado);
    return actualizado;
}
