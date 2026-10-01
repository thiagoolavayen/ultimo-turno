# Último Turno

Demo de terror y sigilo en primera persona. Un empleado queda encerrado en un depósito durante el cierre; necesita reparar la corriente, encontrar la llave y levantar el portón mientras evita a un intruso.

## Experiencia

El objetivo aparece desde la pantalla inicial y se actualiza al completar cada paso. Una flecha señala el siguiente tramo de la ruta. El plano muestra el objetivo, las puertas, los escondites y una ruta sugerida; al abrirlo se pausa la simulación. Un supervisor por radio da indicaciones breves basadas en el progreso real.

La amenaza está inactiva durante la primera exploración y se activa cuando el jugador recoge el fusible. Eso permite aprender a caminar, abrir puertas y usar el plano antes de la persecución.

El juego tiene una sola ubicación continua. Las estanterías bloquean el movimiento y la visión; las puertas mantienen su estado. Los ruidos dirigen al enemigo hacia su origen. La linterna modifica la distancia de detección. Correr ayuda a escapar y consume resistencia, pero también genera más ruido.

El jugador puede esconderse en armarios. Si el intruso lo ve entrar, el escondite no lo protege. El enemigo registra ese lugar y puede revisarlo cuando vuelve a pasar por la zona. Haber usado antes un escondite no revela automáticamente la ubicación actual del jugador.

El portón tarda diez segundos en subir. El ruido del motor atrae al intruso y el jugador puede alejarse, esconderse o distraerlo mientras abre. La victoria se activa al cruzar el portón o usar E junto a él después de la apertura.

Los sustos incluyen golpes de chapa, fallos de luz al recoger el fusible, el golpe eléctrico y el parpadeo al restablecer la corriente, y la aparición cercana del intruso. La captura muestra su máscara de cerca y permite reintentar desde el último punto de control.

## Implementación

| Archivo | Responsabilidad |
|---|---|
| `src/core.js` | Mapa, colisiones, inventario, objetivos, puertas, puntos de control e IA |
| `src/game.js` | Renderizado, interfaz, entradas, efectos, sonido y almacenamiento |
| `src/index.html` | Pantallas de juego, inicio, pausa, plano, derrota y victoria |
| `src/style.css` | Interfaz adaptable y controles visibles |
| `build.py` | Combina los cuatro archivos en un HTML autocontenido |
| `tests/core.test.cjs` | Pruebas de reglas y recorrido físico |
| `tests/browser.cjs` | Verificación del HTML en navegador |

El renderizador usa raycasting con DDA y sprites originales dibujados mediante Canvas. La iluminación combina ambiente, distancia y un haz de linterna. Los gráficos siguen una estética retro; no utiliza un motor 3D externo.

El intruso tiene estados de patrulla, investigación y persecución. Un recorrido en anchura encuentra caminos transitables. La detección visual comprueba distancia, campo de visión y obstáculos. Los sonidos llevan una posición y un alcance; si puede oírlos, investiga ese punto. En una persecución no abandona inmediatamente a un jugador visible para seguir una botella.

Las puertas cerradas frenan al intruso durante su apertura. No puede atravesar estanterías ni paredes. Tampoco puede cerrarse una puerta mientras el jugador o el intruso ocupan su marco.

El estado se guarda en `localStorage` al completar objetivos. Un reintento recupera inventario, puertas y progreso de ese punto; devuelve al enemigo a su punto inicial con un breve margen para orientarse. El guardado no representa una partida multijugador ni una base de datos remota.

Los efectos de sonido se sintetizan con Web Audio. La radio tiene texto permanente y síntesis opcional con voces españolas locales del navegador. El juego no realiza peticiones HTTP.

## Editar y verificar

Para editarlo, modificar `src`. Su `index.html` se puede abrir directamente mientras los otros tres archivos estén en la misma carpeta. Para reconstruir el archivo de entrega, con Python instalado:

```bash
python build.py
```

El usuario que juega no necesita Python. Para ejecutar las pruebas de simulación, con Node instalado:

```bash
node tests/core.test.cjs
```

La verificación de navegador requiere Playwright y Chromium, únicamente para desarrollo:

```bash
npm install --no-save playwright@1.51.1
npx playwright install chromium
node tests/browser.cjs
```

## Alcance

Incluye un mapa, un intruso, una cadena de objetivos, finales de derrota y victoria, puntos de control y audio original. La duración depende de la exploración y de los reintentos. Es una demo corta ampliable; no incluye Unreal, multijugador, combate, modelos de lenguaje ni assets comerciales.
