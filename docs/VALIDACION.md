# Verificación de la entrega

Comprobado el 30 de septiembre de 2026 en Linux, Node y Chromium Headless 134.

## Simulación

13 pruebas aprobadas:

1. Las rutas a los objetivos existen en el orden correcto.
2. Las puertas cerradas permiten interacción y bloquean la visión.
3. Las paredes bloquean al jugador y la diagonal no duplica su velocidad.
4. El inventario y la cerradura eléctrica hacen cumplir la secuencia.
5. Las botellas consumen inventario y producen un objetivo de investigación.
6. Un escondite no observado protege; un escondite observado queda registrado.
7. El intruso persigue y captura a un jugador visible a corta distancia.
8. Los puntos de control conservan el progreso al cargar y reintentar.
9. Recordar un escondite no revela automáticamente al jugador oculto.
10. El portón requiere tiempo para abrir y permite la victoria después.
11. El intruso encuentra rutas, abre puertas y permanece en celdas transitables.
12. Una puerta no puede encerrar al intruso dentro de su celda de colisión.
13. Un controlador recorre físicamente todas las rutas, con el enemigo activo, y escapa usando cobertura y una botella.

## Navegador

Se abrió `JUGAR.html` directamente mediante `file://`, sin servidor. Se verificó movimiento con teclado, linterna, plano y pausa; se completó el recorrido usando los objetos, puertas y reglas reales; se recargó el archivo y se continuó desde el punto de control. También se comprobó la interfaz de captura y reintento, el control de volumen y los efectos de sonido.

No hubo excepciones de JavaScript durante el recorrido. Las tres peticiones observadas eran lecturas locales del propio HTML; no hubo peticiones a Internet.

Las capturas muestran inicio, plano, tablero, encuentro cercano con el intruso y salida. Algunas capturas utilizan un controlador de prueba o posiciones preparadas para mostrar el estado de la interfaz. Las pruebas del recorrido sí simulan movimiento sobre el mapa y mantienen al enemigo activo.

## Límites

No se ejecutó en una computadora Windows física. Se probó el mismo HTML autocontenido en Chromium sobre Linux. El archivo BAT solo abre ese HTML. El guardado bajo `file://` y las voces locales disponibles dependen del navegador; el recorrido no necesita voz ni guardado persistente para completarse.

## Comodidad
Mirada vertical con mouse y flechas arriba/abajo, sin movimiento automático de cámara. Carteles de tutorial desactivados, plano disponible con M y subtítulos temporales. Se verificó la mirada arriba/abajo y que los subtítulos desaparecen. La voz española depende del navegador y usa tono normal; no se incluye una grabación humana.
