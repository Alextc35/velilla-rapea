# VelillaRapea

Estudio de entrenamiento para improvisar en grupo. La biblioteca organiza las bases por artista y estilo; cada ronda usa un patrón de cuatro barras y un pulso visual configurable.

## Arranque

- Instala dependencias con **npm install**.
- Inicia la beta con **npm run dev**.
- Abre [http://localhost:3000](http://localhost:3000).

La carpeta **public/beats/** contiene las colecciones reales que sirve la beta. Si aún no está disponible, la aplicación abre con una pista de demostración de 90 BPM.

## Organización de la biblioteca

El catálogo se descubre desde el contenido de **public/beats/**; no hace falta editar una lista cada vez que se añade una pista:

    public/beats/
      Nombre del artista/
        channels4_banner.jpg
        1/
          beat.mp4
          hq720.avif
        2/
          beat.mp4
          hq720.avif

Cada subcarpeta numerada representa una base. Se leen miniaturas **hq720.avif** o **hqdefault.avif** y banners **channels4_banner.jpg** (también **.jpeg**, **.png** y **.avif**). Los formatos de pista admitidos son MP4, MP3, M4A, WAV y OGG.

Los estilos se sugieren a partir del título del archivo —por ejemplo, *trap*, *drill*, *boom bap*, *guitarra* o *piano*— y se pueden buscar o filtrar. El catálogo solo asigna BPM cuando el título incluye un valor explícito, como **92 BPM**; la biblioteca permite guardar el tempo correcto a mano y filtrar después por rangos. Ese dato y los favoritos se guardan en el almacenamiento local del navegador.

Las pistas y sus imágenes se sirven desde rutas estáticas como **/beats/Nombre%20del%20artista/1/beat.mp4**. Los MP4 se guardan como archivos normales del repo; se han retirado las dos pistas que superaban el límite de 100 MiB por archivo de GitHub. Quedan 68 bases reproducibles y **public/beats/** ocupa aproximadamente 1,6 GB. La carpeta debe viajar con la aplicación al publicarla. Para probar desde móviles en la misma red, inicia el servidor escuchando en la red local (`npm run dev -- --hostname 0.0.0.0`) y abre en cada móvil la dirección local del ordenador. Para una publicación accesible por Internet, el alojamiento debe admitir el tamaño de la biblioteca.

## Ronda de freestyle

En móvil, elige una colección para pasar directamente a sus bases. Cada miniatura ofrece una prueba de audio de 10 segundos y filtros por estilo y BPM; después se configura el formato y se confirma la ronda. En escritorio, el catálogo mantiene la vista completa.

1. Elige una colección y una base, o usa **Sorpréndeme**.
2. Marca **AAAA**, **ABAB**, **ABBA** o **Libre** y ajusta los BPM.
3. Entra al estudio. Cada fila es una barra de cuatro tiempos; la barra activa avanza con el pulso y las ya terminadas se atenúan. Las palabras guía caen en el cuarto tiempo.

Una ronda dura 32 barras y se puede parar antes. El BPM del patrón se ajusta a la sesión; para alinear una pista con el pulso, etiqueta primero su BPM real.
