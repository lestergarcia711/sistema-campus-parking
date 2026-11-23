/** Dialogo "Mi perfil": nombre visible y cambio de contrasena. */
import { obtenerUsuario } from '../almacen.js';
import { actualizarPerfil } from '../seguridad.js';
import { abrirModal, escapar, notificar } from '../ui.js';

export async function abrirPerfil(alActualizar) {
    const cuenta = obtenerUsuario();

    const guardado = await abrirModal({
        titulo: 'Mi perfil',
        textoEnviar: 'Guardar cambios',
        cuerpo: `
            <div class="campo">
                <label for="perfil-usuario">Usuario</label>
                <input id="perfil-usuario" type="text" value="${escapar(cuenta.usuario)}" disabled>
            </div>
            <div class="campo">
                <label for="perfil-nombre">Nombre</label>
                <input id="perfil-nombre" name="nombre" type="text" maxlength="40" value="${escapar(cuenta.nombre)}" autocomplete="name">
            </div>
            <fieldset class="grupo-campos">
                <legend>Cambiar contraseña (opcional)</legend>
                <div class="campo">
                    <label for="perfil-clave-actual">Contraseña actual</label>
                    <input id="perfil-clave-actual" name="claveActual" type="password" autocomplete="current-password">
                </div>
                <div class="formulario__fila">
                    <div class="campo">
                        <label for="perfil-clave-nueva">Nueva contraseña</label>
                        <input id="perfil-clave-nueva" name="claveNueva" type="password" autocomplete="new-password">
                    </div>
                    <div class="campo">
                        <label for="perfil-clave-confirmacion">Confirmar</label>
                        <input id="perfil-clave-confirmacion" name="claveConfirmacion" type="password" autocomplete="new-password">
                    </div>
                </div>
            </fieldset>`,
        alEnviar: (formulario) =>
            actualizarPerfil({
                nombre: formulario.elements.nombre.value,
                claveActual: formulario.elements.claveActual.value,
                claveNueva: formulario.elements.claveNueva.value,
                claveConfirmacion: formulario.elements.claveConfirmacion.value,
            }),
    });

    if (guardado) {
        notificar('Perfil actualizado.');
        alActualizar();
    }
}
