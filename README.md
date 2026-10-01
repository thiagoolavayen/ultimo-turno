# Último Turno

Juego corto de terror y sigilo en primera persona. Un empleado queda encerrado en un depósito durante el cierre. Para escapar tiene que recuperar un fusible, reparar la corriente, encontrar una llave y levantar el portón mientras evita a un intruso.

## Ejecutar el juego en una PC

**El archivo listo para jugar es [`JUGAR.html`](JUGAR.html).** Incluye todos los gráficos, sonidos y código del juego.

1. Guardá `JUGAR.html` en una carpeta de tu PC. Si lo descargás desde GitHub, abrí ese archivo en el repositorio y utilizá la opción de descargar el archivo original.
2. Hacé doble clic en `JUGAR.html` para abrirlo en tu navegador.
3. Presioná **Empezar turno**. En Windows, podés usar **F11** para pantalla completa.

También podés abrir `ABRIR_WINDOWS.bat` si descargaste o clonaste el proyecto completo. Ese archivo simplemente abre `JUGAR.html`.

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
