/**
 * Punto de entrada del panel: protege el acceso, construye el menu y enruta las vistas.
 * Cada vista exporta `montar(contenedor, parametros)` y puede devolver una funcion de limpieza.
 */
import { obtenerUsuario } from './almacen.js';
import { icono } from './iconos.js';
import { leerRutaActual } from './navegacion.js';
import { cerrarSesion, haySesionActiva } from './seguridad.js';
import { escapar } from './ui.js';
import * as historial from './vistas/historial.js';
import * as ingreso from './vistas/ingreso.js';
import * as parqueo from './vistas/parqueo.js';
import * as recaudacion from './vistas/recaudacion.js';
import * as resumen from './vistas/resumen.js';

const RUTAS = [
    { ruta: 'resumen', etiqueta: 'Panel', icono: 'panel', vista: resumen },
    { ruta: 'ingreso', etiqueta: 'Registrar ingreso', icono: 'ingreso', vista: ingreso },
    { ruta: 'parqueo', etiqueta: 'En parqueo', icono: 'lista', vista: parqueo },
    { ruta: 'historial', etiqueta: 'Historial', icono: 'reloj', vista: historial },
    { ruta: 'recaudacion', etiqueta: 'Recaudación', icono: 'dinero', vista: recaudacion },
];
const RUTA_INICIAL = 'resumen';

if (!haySesionActiva()) {
    location.replace('index.html');
}

const menu = document.getElementById('menu-navegacion');
const contenido = document.getElementById('contenido');
const barraLateral = document.getElementById('barra-lateral');
const botonMenu = document.getElementById('boton-menu');
const nombreUsuario = document.getElementById('nombre-usuario');
const inicialUsuario = document.getElementById('inicial-usuario');

let limpiezaVistaActual = null;

function dibujarMenu() {
    menu.innerHTML = RUTAS.map(
        (r) => `<li><a class="enlace-menu" href="#/${r.ruta}" data-ruta="${r.ruta}">${icono(r.icono)}<span>${r.etiqueta}</span></a></li>`,
    ).join('');
}

function dibujarUsuario() {
    const { nombre } = obtenerUsuario();
    nombreUsuario.textContent = nombre;
    inicialUsuario.textContent = nombre.charAt(0).toUpperCase();
}

function marcarRutaActiva(ruta) {
    menu.querySelectorAll('.enlace-menu').forEach((enlace) => {
        const activa = enlace.dataset.ruta === ruta;
        enlace.classList.toggle('enlace-menu--activo', activa);
        if (activa) enlace.setAttribute('aria-current', 'page');
        else enlace.removeAttribute('aria-current');
    });
}

function mostrarVista() {
    const { ruta, parametros } = leerRutaActual();
    const definicion = RUTAS.find((r) => r.ruta === ruta);

    if (!definicion) {
        location.hash = `#/${RUTA_INICIAL}`;
        return;
    }

    limpiezaVistaActual?.();
    limpiezaVistaActual = null;

    document.title = `${definicion.etiqueta} | CampusParking`;
    marcarRutaActiva(definicion.ruta);
    barraLateral.classList.remove('barra-lateral--abierta');

    try {
        limpiezaVistaActual = definicion.vista.montar(contenido, parametros) ?? null;
    } catch (error) {
        console.error(error);
        contenido.innerHTML = `<section class="tarjeta"><h2>No se pudo cargar la vista</h2><p>${escapar(error.message)}</p></section>`;
    }
    contenido.focus({ preventScroll: true });
    window.scrollTo(0, 0);
}

dibujarMenu();
dibujarUsuario();

window.addEventListener('hashchange', mostrarVista);
botonMenu.addEventListener('click', () => barraLateral.classList.toggle('barra-lateral--abierta'));
document.getElementById('boton-salir').addEventListener('click', () => {
    cerrarSesion();
    location.replace('index.html');
});

mostrarVista();
