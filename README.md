# CampusParking

Sistema web para administrar un parqueo: registra ingresos y salidas, calcula el cobro por tiempo de permanencia y muestra la ocupación y la recaudación en tiempo real. Reemplaza las bitácoras en papel por un panel digital que funciona completamente en el navegador.

Autor: Lester Garcia

## Contenido

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Acceso de demostración](#acceso-de-demostración)
- [Reglas de negocio](#reglas-de-negocio)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Almacenamiento de datos](#almacenamiento-de-datos)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Convención de commits](#convención-de-commits)

## Características

**Operación diaria**

- Registro de ingreso con tipo de vehículo, placa y espacio asignado. La fecha y hora de entrada se toman automáticamente.
- Listado en vivo de los vehículos dentro del parqueo, con tiempo transcurrido y cobro estimado que se actualizan solos.
- Búsqueda por placa y filtro por tipo de vehículo.
- Edición de un ingreso y anulación de registros hechos por error.
- Cobro de salida con resumen del cálculo y comprobante imprimible.

**Control y consulta**

- Panel principal con ocupación, espacios disponibles, recaudación del día y mapa visual de espacios. Un clic en un espacio libre abre el registro de ingreso con ese espacio seleccionado.
- Historial de salidas con filtro por placa y rango de fechas, y exportación a CSV compatible con Excel.
- Recaudación total, del día y del mes, cobro promedio, gráfico de los últimos 7 días y desglose por tipo de vehículo.

**Administración**

- Catálogo de tipos de vehículo con prefijo de placa y tarifa por hora (crear, editar y eliminar).
- Parámetros del parqueo: capacidad, tiempo de gracia y símbolo de moneda.
- Perfil de usuario con cambio de nombre y de contraseña.
- Restablecimiento de los datos operativos.

**Calidad de la interfaz**

- Tema oscuro con diseño responsivo: en pantallas pequeñas el menú se oculta y las tablas se convierten en tarjetas.
- Diálogos y notificaciones propias en lugar de `alert` y `confirm`.
- Navegación con teclado, etiquetas accesibles y respeto de la preferencia de movimiento reducido.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| HTML5 | Estructura semántica de las dos páginas y uso del elemento `dialog` |
| CSS3 | Variables de diseño, Grid, Flexbox y diseño responsivo, sin librerías |
| JavaScript (ES2022) | Módulos nativos, sin frameworks ni dependencias |
| Web Crypto API | Hash SHA-256 de la contraseña |
| localStorage / sessionStorage | Persistencia de datos y de la sesión |
| Git y GitHub Pages | Control de versiones y publicación |

El proyecto no necesita instalar dependencias ni compilar nada.

## Ejecución local

Al usar módulos ES, la aplicación debe servirse por HTTP; abrir el archivo con doble clic no funciona porque el navegador bloquea los módulos desde `file://`. Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Luego abrir `http://localhost:8000` en el navegador. También sirve la extensión Live Server de Visual Studio Code o cualquier servidor estático.

## Acceso de demostración

En el primer arranque se crea una cuenta de ejemplo:

| Campo | Valor |
| --- | --- |
| Usuario | `admin` |
| Contraseña | `admin123` |

La contraseña puede cambiarse desde el perfil, dentro del panel.

## Reglas de negocio

**Cobro**

- Se cobra por hora según la tarifa del tipo de vehículo.
- Toda estadía paga como mínimo una hora.
- Superada la primera hora, una hora adicional se cobra solo si los minutos excedentes superan el tiempo de gracia (10 minutos por defecto).

| Permanencia | Gracia de 10 min | Horas cobradas |
| --- | --- | --- |
| 25 min | - | 1 |
| 1 h 08 min | dentro de la gracia | 1 |
| 1 h 25 min | excede la gracia | 2 |
| 3 h 05 min | dentro de la gracia | 3 |

**Validaciones de ingreso**

- La placa debe tener entre 4 y 10 caracteres alfanuméricos e iniciar con el prefijo del tipo de vehículo (por ejemplo `P` para automóvil).
- Un mismo vehículo no puede estar dos veces dentro del parqueo; `P-123ABC` y `P123ABC` se consideran la misma placa.
- El espacio debe existir y estar libre.

**Integridad del catálogo**

- No se puede eliminar un tipo con vehículos dentro del parqueo ni dejar el sistema sin tipos.
- No se puede reducir la capacidad por debajo de un espacio ocupado.
- Cada cobro guarda una copia del nombre del tipo y la tarifa aplicada, por lo que cambiar tarifas no altera el historial.

## Estructura del proyecto

```
sistema-campus-parking/
├── index.html                  Pantalla de acceso
├── panel.html                  Panel de administración (aplicación de una página)
├── README.md
└── assets/
    ├── img/
    │   ├── logo.png            Logo del sistema (fondo transparente)
    │   ├── favicon.png         Icono de la pestaña
    │   └── logo-original.webp  Imagen original sin tratar
    ├── css/
    │   ├── base.css            Tokens de diseño y componentes compartidos
    │   ├── acceso.css          Estilos de la pantalla de acceso
    │   └── panel.css           Estructura del panel y de cada vista
    └── js/
        ├── config.js           Constantes y valores iniciales
        ├── almacen.js          Lectura y escritura en localStorage
        ├── seguridad.js        Autenticación, sesión y perfil
        ├── validaciones.js     Reglas de validación del dominio
        ├── formato.js          Formato de dinero, fechas y duraciones
        ├── exportar.js         Exportación del historial a CSV
        ├── iconos.js           Iconos SVG
        ├── ui.js               Diálogos, notificaciones y utilidades de interfaz
        ├── navegacion.js       Utilidades de enrutamiento por hash
        ├── login.js            Punto de entrada de index.html
        ├── panel.js            Punto de entrada de panel.html y enrutador
        ├── servicios/
        │   ├── tarifas.js      Cálculo del cobro
        │   ├── parqueo.js      Ingresos, salidas e historial
        │   ├── tipos.js        Catálogo de tipos de vehículo
        │   └── estadisticas.js Indicadores de recaudación
        └── vistas/
            ├── resumen.js      Panel principal
            ├── ingreso.js      Registro y edición de ingresos
            ├── parqueo.js      Vehículos dentro del parqueo y cobro
            ├── historial.js    Historial de salidas
            ├── recaudacion.js  Indicadores económicos
            ├── configuracion.js Parámetros y tarifas
            ├── perfil.js       Diálogo de perfil
            └── comprobante.js  Comprobante de salida
```

## Arquitectura

El código se organiza en tres capas con dependencias en un solo sentido:

1. **Datos** (`almacen.js`, `config.js`): única puerta de acceso a `localStorage`. No guarda estado en memoria, por lo que cada lectura refleja siempre lo almacenado.
2. **Dominio** (`servicios/`, `validaciones.js`, `seguridad.js`): reglas de negocio puras y operaciones sobre los datos. No tocan el DOM. Los errores esperados se lanzan como `ErrorValidacion` con un mensaje apto para el usuario.
3. **Interfaz** (`vistas/`, `ui.js`, `panel.js`): cada vista exporta `montar(contenedor, parametros)`, que dibuja su contenido y puede devolver una función de limpieza (por ejemplo, para detener un temporizador). El enrutador de `panel.js` usa el hash de la URL (`#/parqueo`, `#/ingreso/editar/ID`), por lo que se puede recargar o compartir cualquier pantalla.

Todo texto que proviene del usuario se escapa antes de insertarse en el HTML.

## Almacenamiento de datos

| Clave | Contenido | Almacén |
| --- | --- | --- |
| `campusparking:usuario` | Usuario, nombre y hash de la contraseña | localStorage |
| `campusparking:tipos` | Tipos de vehículo y tarifas | localStorage |
| `campusparking:vehiculos` | Vehículos dentro del parqueo | localStorage |
| `campusparking:historial` | Salidas cobradas | localStorage |
| `campusparking:config` | Capacidad, tiempo de gracia y moneda | localStorage |
| `campusparking:sesion` | Sesión activa | sessionStorage |

Los datos viven únicamente en el navegador donde se usa el sistema. Para inspeccionarlos: herramientas de desarrollo, pestaña Aplicación, Almacenamiento local.

## Limitaciones conocidas

- Al no existir servidor, la autenticación protege la interfaz pero no los datos: cualquier persona con acceso al navegador puede leer `localStorage`. El hash de la contraseña evita guardarla en texto plano, pero no sustituye a una autenticación real.
- Los datos no se comparten entre dispositivos ni navegadores, y se pierden si se borra el almacenamiento del sitio. El CSV del historial sirve como respaldo parcial.
- Existe una única cuenta de administrador.

Para un uso en producción, el siguiente paso natural es mover la persistencia y la autenticación a un servicio con base de datos.

