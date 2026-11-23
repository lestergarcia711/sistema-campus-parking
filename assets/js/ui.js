/**
 * Componentes de interfaz reutilizables: escape de HTML, notificaciones y cuadros de dialogo.
 * Reemplazan a alert() y confirm() para mantener una experiencia coherente.
 */
import { ErrorValidacion } from './validaciones.js';

export function escapar(texto) {
    return String(texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/* ---------- Notificaciones ---------- */

function obtenerZonaNotificaciones() {
    let zona = document.getElementById('zona-notificaciones');
    if (!zona) {
        zona = document.createElement('div');
        zona.id = 'zona-notificaciones';
        zona.className = 'zona-notificaciones';
        zona.setAttribute('aria-live', 'polite');
        document.body.append(zona);
    }
    return zona;
}

/** tipo: 'exito' | 'error' | 'info' */
export function notificar(mensaje, tipo = 'exito') {
    const aviso = document.createElement('div');
    aviso.className = `notificacion notificacion--${tipo}`;
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    aviso.textContent = mensaje;
    obtenerZonaNotificaciones().append(aviso);

    setTimeout(() => {
        aviso.classList.add('notificacion--saliendo');
        aviso.addEventListener('animationend', () => aviso.remove(), { once: true });
    }, 3500);
}

/* ---------- Dialogos ---------- */

/**
 * Abre un cuadro de dialogo modal con formulario.
 *
 * - `cuerpo`: HTML del contenido.
 * - `alEnviar(formulario)`: se ejecuta al confirmar. Puede ser asincrona; si lanza ErrorValidacion
 *   el mensaje se muestra dentro del dialogo y este permanece abierto.
 * - Devuelve una promesa con el valor retornado por `alEnviar` (o true), o null si se cancela.
 */
export function abrirModal({
    titulo,
    cuerpo,
    textoEnviar = 'Aceptar',
    textoCancelar = 'Cancelar',
    peligro = false,
    cerrarAlEnviar = true,
    clase = '',
    alEnviar = () => true,
}) {
    return new Promise((resolver) => {
        const dialogo = document.createElement('dialog');
        dialogo.className = `modal ${clase}`.trim();
        dialogo.innerHTML = `
            <form class="modal__formulario" method="dialog" novalidate>
                <header class="modal__cabecera"><h2>${escapar(titulo)}</h2></header>
                <div class="modal__cuerpo">${cuerpo}</div>
                <p class="modal__error" role="alert" hidden></p>
                <footer class="modal__acciones">
                    <button type="button" class="boton boton--secundario" data-cancelar>${escapar(textoCancelar)}</button>
                    <button type="submit" class="boton ${peligro ? 'boton--peligro' : 'boton--primario'}">${escapar(textoEnviar)}</button>
                </footer>
            </form>`;

        const formulario = dialogo.querySelector('form');
        const zonaError = dialogo.querySelector('.modal__error');
        let resultado = null;

        const cerrar = () => dialogo.close();
        dialogo.querySelector('[data-cancelar]').addEventListener('click', cerrar);
        dialogo.addEventListener('click', (evento) => {
            if (evento.target === dialogo) cerrar();
        });
        dialogo.addEventListener('close', () => {
            dialogo.remove();
            resolver(resultado);
        });

        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            zonaError.hidden = true;
            try {
                const valor = await alEnviar(formulario);
                if (cerrarAlEnviar) {
                    resultado = valor ?? true;
                    cerrar();
                }
            } catch (error) {
                if (!(error instanceof ErrorValidacion)) throw error;
                zonaError.textContent = error.message;
                zonaError.hidden = false;
            }
        });

        document.body.append(dialogo);
        dialogo.showModal();
        dialogo.querySelector('input:not([type=hidden]), select')?.focus();
    });
}

export async function confirmar({ titulo, mensaje, textoEnviar = 'Confirmar', peligro = false }) {
    const respuesta = await abrirModal({
        titulo,
        cuerpo: `<p class="modal__mensaje">${mensaje}</p>`,
        textoEnviar,
        peligro,
    });
    return respuesta === true;
}

/* ---------- Estructura de vistas ---------- */

export function cabeceraVista(titulo, descripcion, acciones = '') {
    return `
        <header class="cabecera-vista">
            <div>
                <h1>${escapar(titulo)}</h1>
                <p>${escapar(descripcion)}</p>
            </div>
            ${acciones ? `<div class="cabecera-vista__acciones">${acciones}</div>` : ''}
        </header>`;
}

export function estadoVacio(mensaje) {
    return `<div class="estado-vacio"><p>${escapar(mensaje)}</p></div>`;
}
