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

Se utilizó ChatGPT/Codex para ayudar con la programación, los ajustes de comodidad, la documentación y las pruebas. Los siguientes prompts son una reconstrucción ampliada de las instrucciones de desarrollo para documentar el diseño y sus requisitos; no son una transcripción literal del historial.

### 1. Idea y recorrido

> Quiero un juego de terror psicológico ambientado en un taller con un depósito. Se corta la luz y se empiezan a escuchar pasos, aunque supuestamente no queda nadie. El jugador aparece adentro y tiene que escapar. El recorrido tiene que ser claro: buscar un fusible, llevarlo al tablero para recuperar la corriente, encontrar la llave y abrir el portón. Si logra salir, gana. Si lo atrapan, quiero un screamer con imagen y sonido, y que pueda reintentar desde el último punto de control.

### 2. Programación

> Programalo en primera persona usando HTML, CSS y JavaScript. Quiero que se pueda ejecutar en una PC desde el navegador. Organizá el escenario con taller, depósito, oficina y salida. El fusible, el tablero y la llave tienen que funcionar en ese orden; no quiero que se pueda terminar sin completar los objetivos.

### 3. Controles y comodidad

> Quiero moverme con WASD, correr con Shift y mirar con el mouse para los costados, arriba y abajo. Dejá también las flechas como alternativa para mirar. E tiene que servir para usar objetos, abrir puertas y entrar o salir de los escondites. Que la cámara sea cómoda, sin balanceos constantes, y que Esc pause el juego.

### 4. Amenaza y tensión

> La amenaza tiene que patrullar el depósito, investigar los ruidos y perseguirme cuando me vea. Las paredes y estanterías tienen que cortar su visión. Quiero poder cerrar puertas, esconderme si no me vio entrar y tirar botellas para distraerlo. La linterna tiene que ayudar a ver, pero también puede delatarme. Que los pasos avisen que está cerca.

### 5. Instrucciones y audio

> No quiero carteles grandes explicándome todo durante la partida. Mostrá el objetivo actual, una indicación chica cuando pueda interactuar y un plano con M si necesito orientarme. La radio tiene que hablar en español, con una voz lo más natural posible y frases cortas. Dejá controles para apagar la voz, ajustar el volumen y desactivar los efectos de luz.

### 6. Guardado y pruebas

> Guardá puntos de control cuando consiga el fusible, arregle el tablero y encuentre la llave. Si me atrapan, el screamer tiene que aparecer antes de ofrecer el reintento, conservando el progreso del último punto. Probá el recorrido completo, las puertas, los escondites, la persecución, el guardado y la victoria. Revisá que el enemigo no atraviese paredes.

### 7. Entrega

> Prepará un repositorio de GitHub con todo el código, las pruebas y un README completo. Tiene que explicar la idea, los integrantes, los controles, los requisitos y cómo ejecutarlo en una PC. Incluí los prompts de desarrollo. Para jugar no quiero ZIP, extracción ni instalaciones de paquetes: que alcance con descargar JUGAR.html y abrirlo con doble clic. Diferenciá los requisitos para jugar de los que sirven para modificar el código.
