# Vigilancia móvil · GitHub Pages

## Publicar

1. Descomprime el ZIP.
2. Crea un repositorio en GitHub (público si utilizas el plan gratuito).
3. Sube todos los archivos de esta carpeta a la raíz del repositorio: `index.html` debe quedar directamente en la raíz, sin una carpeta intermedia. No subas solamente el ZIP.
4. Abre **Settings → Pages → Build and deployment → Deploy from a branch**.
5. Selecciona **main**, carpeta **/ (root)** y pulsa **Save**.
6. Abre la dirección HTTPS que muestra GitHub Pages cuando termine la publicación.

No requiere instalación, compilación ni claves. Las rutas relativas funcionan tanto en `usuario.github.io` como en `usuario.github.io/repositorio/`.

## Usar

Introduce exactamente 3 letras A–Z y pulsa **Activar vigilancia**. Se conserva el uso de mayúsculas y minúsculas. El teclado móvil sugiere mayúsculas.

- Al activar se envía exactamente `WIKISTOP` al usuario indicado mediante GET a `storedata.php`, con un formulario oculto dirigido a un iframe. Después se consulta `getdata.php` hasta observar ese mensaje: las lecturas antiguas se ignoran. Si no se confirma en 30 segundos, se detiene la activación y se muestra un error. No hay reenvíos automáticos. Espera a ver **Vigilancia activa** antes de enviar contenido nuevo.
- A partir de ahí se compara únicamente `data`. Otros campos se ignoran. Objetos con claves en distinto orden se consideran iguales; los tipos y el orden de los arrays sí cuentan.
- Si el nuevo contenido es una URL HTTP o HTTPS válida, se abre directamente con `location.replace()`. En cualquier otro caso, un cambio ejecuta `location.replace('https://www.google.com/search?q=CONTENIDO')`: busca el nuevo contenido de `data` en Google, codificado como parámetro `q`, y reemplaza esta entrada del historial, sin añadir otra para Google. Esto no elimina otras visitas anteriores a la web del historial.
- El valor del API nunca se muestra, se guarda en almacenamiento local ni se escribe en la consola. Solo permanece en memoria mientras dura la activación. Como en cualquier web, las herramientas de red del navegador pueden inspeccionar las respuestas.
- **Detener vigilancia** cancela la consulta pendiente y libera la pantalla. Cada nueva activación envía y confirma WIKISTOP de nuevo. Detener no puede deshacer un envío que ya haya llegado al servidor.
- Los errores de red, HTTP o JSON no cuentan como cambios y no borran la referencia. Se muestra un aviso y se reintenta. `null`, cadena vacía, `0` y `false` son valores válidos si existe el campo `data`.

## Frecuencia y pantalla

Hay un intento inmediato y un temporizador de 1 segundo. Si una petición sigue pendiente, no se solapa con otra; se cancela a los 8 segundos. La frecuencia real depende de la red y del navegador. Las consultas se omiten mientras la página está oculta y se intenta una lectura al volver, conservando la referencia.

Screen Wake Lock se solicita al pulsar Activar y se vuelve a solicitar al recuperar visibilidad. El indicador confirma si está concedido. Si el sistema lo libera o rechaza, aparece un botón para reintentar. HTTPS, un navegador compatible y una página visible son necesarios; el ahorro de batería o el sistema pueden impedirlo. No garantiza ejecución en segundo plano ni con el móvil bloqueado.

El manifest aporta nombre e icono para accesos directos donde el navegador lo admita. Usa modo navegador para mantener la navegación a Google previsible. No se incluye `sw.js`: esta web necesita conexión y no gana funcionalidad de vigilancia sin red; además evita una caché de aplicación que pudiera servir versiones antiguas. No se promete instalación como PWA.

## Requisito del API: CORS

La petición es `https://appmaz.vip/api/getdata.php?user=CODIGO`, sin cookies ni credenciales. El API debe responder con JSON como `{"data":"..."}` y autorizar las lecturas desde el dominio de GitHub Pages mediante `Access-Control-Allow-Origin` (tu origen exacto, por ejemplo `https://usuario.github.io`, o `*` para acceso público sin credenciales).

Si el servidor no autoriza CORS, una web estática de GitHub Pages no puede corregirlo. Debe hacerlo quien administre el API. No uses `mode: no-cors`: impediría leer la respuesta. La web muestra el mismo aviso de conexión cuando el navegador bloquea CORS, ya que no permite distinguirlo de algunos errores de red.

## Comprobación en tu móvil

1. Activa con un código válido: debe aparecer **Vigilancia activa** después de confirmar WIKISTOP, sin abrir Google.
2. Mantén `data` igual: debe seguir en la web. Cambia `data` en el servicio: debe buscar el contenido en Google o abrirlo directamente si es una URL HTTP/HTTPS.
3. Reabre la web y comprueba detener/reactivar, pérdida y recuperación de conexión, e indicador de pantalla al cambiar de aplicación y volver.

La lógica se ha verificado con respuestas simuladas. La integración con un código real, los permisos CORS de tu publicación y el bloqueo de pantalla en tu dispositivo requieren la comprobación anterior.

Referencias: [GitHub Pages](https://docs.github.com/en/pages/quickstart), [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).
