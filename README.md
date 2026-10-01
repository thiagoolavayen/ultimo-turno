# Último Turno

Juego corto de terror y sigilo en primera persona. Un empleado queda encerrado en un depósito durante el cierre. Para escapar tiene que recuperar un fusible, reparar la corriente, encontrar una llave y levantar el portón mientras evita a un intruso.

## Integrantes

- Benjamin Alcibar
- Thiago Lavayen
- Franco Carnessali
- Franco Albanese
- Maximo Mayandes

## Ejecutar el juego en una PC

**El archivo listo para jugar es [`JUGAR.html`](JUGAR.html).** Incluye todos los gráficos, sonidos y código del juego.

**No se necesita descargar ni extraer un ZIP.** Tampoco hace falta compilar, instalar Python, Node.js, paquetes npm ni un motor para jugar: es HTML, CSS y JavaScript que ejecuta el navegador.

1. Guardá `JUGAR.html` en una carpeta de tu PC. Si lo descargás desde GitHub, abrí ese archivo en el repositorio y presioná **Download raw file** (icono de descarga). Guardá el archivo con el nombre `JUGAR.html`, sin agregar `.txt`.
2. Hacé doble clic en `JUGAR.html` para abrirlo en tu navegador.
3. Presioná **Empezar turno**. En Windows, podés usar **F11** para pantalla completa.

También podés abrir `ABRIR_WINDOWS.bat` si descargaste o clonaste el proyecto completo. Ese archivo simplemente abre `JUGAR.html`.

### Revisar el proyecto completo desde el repositorio

Todo el código está disponible en la carpeta [`src/`](src/). Se puede revisarlo en GitHub sin descargar archivos.

Si se desea obtener el proyecto completo sin ZIP, con Git instalado:

```bash
git clone https://github.com/thiagoolavayen/ultimo-turno.git
cd ultimo-turno
```

Después se abre `JUGAR.html` con doble clic. También se puede abrir `src/index.html` directamente para ejecutar el código fuente. **No hay una etapa de compilación obligatoria.** El script `build.py` solo reconstruye el HTML autocontenido después de modificar el código.

### Requisitos para jugar

- Una PC con teclado y navegador compatible con Canvas y Web Audio: Chrome, Edge o Firefox.
- El mouse es opcional: también podés girar con las flechas del teclado.
- El juego funciona sin Internet y no necesita instalar un motor ni dependencias de programación.

La radio elige una voz española local, priorizando voces naturales cuando están disponibles, con tono normal y frases breves. La calidad depende de las voces instaladas en la PC. Si no hay una disponible, las indicaciones aparecen escritas. El guardado depende del almacenamiento que permita el navegador para archivos locales.

La cámara permite mirar arriba y abajo con el mouse o con las flechas ↑ / ↓, sin balanceo automático. El tutorial permanente está desactivado y los subtítulos desaparecen. La ayuda sigue disponible con H.

## Objetivo y controles

La misión actual aparece en la pantalla. **M** abre un plano con la ruta sugerida y pausa la amenaza. Para terminar:

1. Recogé el fusible del **taller**.
2. Colocalo en el **tablero eléctrico**.
3. Buscá la llave en la **oficina**.
4. Activá el **portón**, esperá a que suba y escapá.

| Control | Acción |
|---|---|
| WASD | Caminar y moverte a los costados |
| Flechas izquierda/derecha | Girar la vista |
| Flechas arriba/abajo | Subir o bajar la mirada |
| Clic en el escenario + mouse | Mirar con el mouse |
| Shift | Correr |
| E | Usar objetos y puertas; entrar o salir de escondites |
| F | Encender o apagar la linterna |
| Q | Arrojar una botella para distraer al intruso |
| M | Abrir o cerrar el plano |
| H | Repetir la indicación del objetivo |
| Esc | Liberar el mouse y abrir la pausa |

El intruso sigue los ruidos y persigue a un jugador visible. Las estanterías bloquean su visión, las puertas lo demoran y los escondites protegen al jugador si no lo vio entrar. Puede recordar y revisar escondites observados anteriormente.

Al completar objetivos se guarda un punto de control. Si te encuentra, podés reintentar desde el último objetivo completado. Al abrir otra vez el mismo archivo en el mismo navegador, **Continuar partida** permite recuperar ese punto si el almacenamiento está disponible.

## Estructura del proyecto

| Ruta | Contenido |
|---|---|
| `JUGAR.html` | Versión autocontenida lista para ejecutar |
| `src/index.html` | Pantallas e interfaz |
| `src/style.css` | Estilos |
| `src/core.js` | Simulación, mapa, objetivos e inteligencia del enemigo |
| `src/game.js` | Renderizado, controles, audio y almacenamiento |
| `build.py` | Generación del HTML autocontenido |
| `tests/` | Pruebas de la simulación y del navegador |
| `docs/` | Explicación técnica, validación y capturas |

## Desarrollo

Los requisitos de esta sección son únicamente para modificar el proyecto, no para jugar.

Podés editar los archivos de `src/` y abrir `src/index.html` en el navegador. Para reconstruir `JUGAR.html`, con Python instalado:

```bash
python build.py
```

Para ejecutar las pruebas de reglas y recorrido, con Node.js instalado:

```bash
node tests/core.test.cjs
```

La prueba de navegador es opcional y requiere Playwright con Chromium. Los detalles están en [`docs/PROYECTO.md`](docs/PROYECTO.md).

## Tecnología y alcance

JavaScript, HTML, CSS, Canvas, Web Audio y almacenamiento local. El escenario se dibuja mediante raycasting; los gráficos y los efectos de sonido son originales y están incluidos en el proyecto. La IA del intruso utiliza reglas de patrulla, investigación, persecución y búsqueda de caminos.

Esta entrega contiene un mapa, un enemigo, objetivos de escape, escondites, puntos de control y pantallas de derrota y victoria. La validación de la versión jugable está documentada en [`docs/VALIDACION.md`](docs/VALIDACION.md).

## Uso de inteligencia artificial y prompts

Se utilizó ChatGPT/Codex para ayudar con la idea, la programación, los ajustes de comodidad, la documentación y las pruebas. Los siguientes prompts son una reconstrucción resumida de las instrucciones de desarrollo; no son una transcripción literal del historial.

1. “Haceme un juego de terror corto, pero que se entienda de una. Que tenga suspenso y algún susto, y una idea mejor que la anterior.”
2. “Bueno, programalo. Que sea intuitivo, que tenga un objetivo claro y que no tenga que adivinar qué hacer.”
3. “Quiero que sea cómodo. Que pueda mirar para arriba y bajar la mirada con el mouse, y que también se pueda jugar con teclado.”
4. “No me llenes la pantalla de instrucciones. Dejá la ayuda cuando la pida y hacé que la voz suene más humana, con frases cortas.”
5. “Preparame el repo con todo el código y un README que explique cómo ejecutarlo en una PC, qué necesita y cuáles son los controles.”
6. “Probalo completo: que pueda terminar la partida, guardar el progreso y volver a intentar si me encuentra el enemigo.”
7. “Lo tengo que entregar mañana. Nada de zips ni extraer archivos. Que el profesor abra el repo y tenga todo explicado: ejecución, integrantes, prompts y código.”
