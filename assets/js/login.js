/** Pantalla de acceso. */
import { asegurarUsuarioInicial, haySesionActiva, iniciarSesion } from './seguridad.js';

const DESTINO = 'panel.html';

if (haySesionActiva()) {
    location.replace(DESTINO);
}

const formulario = document.getElementById('formulario-login');
const campoClave = document.getElementById('login-clave');
const botonVerClave = document.getElementById('boton-ver-clave');
const botonEntrar = document.getElementById('boton-entrar');
const zonaError = document.getElementById('error-login');

botonVerClave.addEventListener('click', () => {
    const visible = campoClave.type === 'text';
    campoClave.type = visible ? 'password' : 'text';
    botonVerClave.textContent = visible ? 'Mostrar' : 'Ocultar';
    botonVerClave.setAttribute('aria-pressed', String(!visible));
});

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    zonaError.hidden = true;
    botonEntrar.disabled = true;

    try {
        await asegurarUsuarioInicial();
        const acceso = await iniciarSesion(formulario.elements.usuario.value, campoClave.value);
        if (acceso) {
            location.replace(DESTINO);
            return;
        }
        zonaError.textContent = 'Usuario o contraseña incorrectos.';
    } catch (error) {
        console.error(error);
        zonaError.textContent = 'No se pudo iniciar sesión en este navegador.';
    }

    zonaError.hidden = false;
    botonEntrar.disabled = false;
    campoClave.select();
});
