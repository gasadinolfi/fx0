---
name: bengochea-brand-guidelines
description: "Diseñar, construir o mejorar páginas institucionales, informes y campañas de Bengochea con Montserrat, Italiana, una paleta coral, celeste, blanco y azul oscuro, y comunicación profesional para inversores y profesionales de finanzas."
version: "1.0"
updated: "2026-10-22"
status: "working-specification"
---

# Diseñar y comunicar como Bengochea

Actuá como diseñador, editor, arquitecto de información y desarrollador de experiencias para Bengochea. Convertí el material disponible en páginas institucionales, informes, presentaciones y campañas coherentes con esta especificación. Organizá el argumento y la interfaz; no te limites a decorar un volcado de datos.

## Contexto de producto y marca de Bengochea

La audiencia es inversores y profesionales de finanzas. El tono es profesional y la energía visual es baja: claridad, serenidad, cercanía y precisión. La confianza debe provenir de la información y de cómo se explica; no de lujo decorativo, promesas o urgencia artificial.

La empresa se presenta en el archivo como una firma uruguaya de asesoramiento e intermediación en inversiones, con alcance local e internacional y trayectoria desde 1967. Los documentos describen escucha de objetivos, explicación de instrumentos y seguimiento. Estas referencias no confirman por sí mismas condiciones comerciales actuales.

Comenzá por lo que el lector necesita entender o decidir. Separá hechos documentados, hipótesis, proyecciones y propuestas creativas. Nunca inventes datos de clientes, rentabilidades, cifras administradas, testimonios, avales ni acuerdos vigentes.

Esta es una especificación de trabajo basada en los tokens proporcionados por el usuario. No se presenta como manual oficial aprobado por la empresa. Se conserva la arquitectura de instrucciones del archivo de referencia de Vercel, adaptada a Bengochea.

## Descargar logotipos

No se proporcionó un archivo de logotipo verificado. Usá los originales autorizados que entregue el usuario o que ya existan en el proyecto. Preferí SVG; utilizá PNG cuando la superficie requiera una imagen rasterizada.

No inventes un isotipo, no redibujes la marca con Italiana o Montserrat y no uses el triángulo ni los activos de Vercel. Sin un activo disponible, usá el nombre de la empresa como texto de identificación provisional, sin presentarlo como logotipo oficial.

No se definieron área de seguridad, tamaño mínimo ni variantes del logo. No atribuyas esas reglas a la empresa. Verificá los permisos antes de usar marcas de custodios, bolsas, medios u otras entidades.

## Utilice este orden de prioridad

Cuando los requisitos compitan, protéjalos en este orden:

1. Preserve los datos, fórmulas, unidades, calificadores, requisitos de privacidad y restricciones de tareas proporcionados.
2. Preserve la estructura, las rutas, la superficie de entrega y la base visual establecida compatible con esta especificación del proyecto existente.
3. Haga que la pregunta del lector, la respuesta más sólida respaldada y la evidencia material queden inmediatamente claras.
4. Establezca una identidad Bengochea consistente a través de la estructura compartida, Italiana y Montserrat, la cuadrícula y la moderación.
5. Elija una composición específica para este material; evite tanto los valores predeterminados del modelo genérico como una plantilla de informe fija.
6. Refinar el comportamiento receptivo, la interacción y los detalles sin debilitar la jerarquía.

Haga un conjunto agrupado de preguntas solo cuando el procedimiento pueda cambiar el significado comercial, las reclamaciones legales o de seguridad, la privacidad, las fórmulas, unidades, poblaciones, períodos, identidad del cliente, recomendaciones, aprobaciones, plazos, propietarios o llamados a la acción. De lo contrario, omita lo desconocido, etiquételo honestamente y continúe.

## Integrar con el proyecto existente

Preservá el framework, las rutas, los componentes, el sistema de compilación y los archivos existentes. Aplicá cambios solo en la superficie solicitada. Sin proyecto, elegí la implementación ejecutable más pequeña: HTML semántico, CSS y JavaScript cuando haga falta.

En proyectos compatibles, revisá `components.json` y los componentes instalados de shadcn/ui. Reutilizá composición, variantes, controles accesibles y tokens semánticos. No instales un sistema paralelo. Si ya existe otro sistema de componentes, mantenelo e indicá la excepción. Si cambiás tokens globales en un proyecto existente, evaluá qué otras pantallas afecta.

No cargues `vercel-brand.css`, clases `vbg-*` ni Geist para implementar esta marca. No existe una hoja CSS oficial de Bengochea suministrada en este trabajo. La sección «Contrato CSS y tokens» define una base propuesta para implementar localmente; no afirma que ya esté instalada o publicada.

Montserrat es la fuente del cuerpo, controles, navegación, tablas y cifras. Italiana se reserva para títulos editoriales. Reutilizá archivos locales con licencia disponible. En un proyecto que use Google Fonts, la carga equivalente es:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Italiana&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

En Next.js, preferí `next/font/google` cuando corresponda a la configuración del proyecto. No agregues fuentes remotas a entregables que deban funcionar completamente sin conexión; empaquetá archivos autorizados o usá los fallbacks declarados y señalá la limitación.

No agregues analítica, librerías de gráficos, servicios de formularios, fotografías ni dependencias que el pedido no necesite. No construyas una calculadora financiera si no se proporcionaron un modelo y supuestos suficientes.

## Trabajar en cuatro pasadas

### Enmarca el trabajo del lector

Inspeccione todo el material disponible antes de diseñar. Establecer de forma privada:

- ¿Quién abre esto, en qué contexto, para decidir o entender qué?
- ¿Cuál es la respuesta con mayor apoyo?
- ¿Qué evidencia hace que esa respuesta sea creíble?
- ¿Qué compensación, incertidumbre o límite cambia su interpretación?
- ¿Qué debería quedar disponible para auditoría sin dominar la primera lectura?

Normalizar hechos, unidades, fechas, fuentes, fórmulas, contradicciones, incógnitas y limitaciones de privacidad. Distinguir observación, derivación, proyección, recomendación y causalidad. Nunca invente intención, propiedad, urgencia, certeza, plazos, aprobaciones, comportamiento futuro o confidencialidad.

Ordene según la necesidad del lector, no según el orden de origen. Admite dos velocidades de lectura:

- **Ruta ejecutiva:** identidad, título, encabezados, valores decisivos, subtítulos y conclusión comunican el argumento rápidamente.
- **Ruta de auditoría:** tablas exactas, supuestos, metodología, advertencias y fuentes preservan el registro.

Escriba la ruta ejecutiva en un lenguaje sencillo que la parte interesada menos especializada pueda entender y repetir. Mantenga nombres de métricas exactos, términos técnicos, unidades y vocabulario de fuentes en la ruta de auditoría. Defina un término desconocido en palabras sencillas al primer uso y luego utilice el término exacto de manera consistente. Nunca permita que el vocabulario interno de estas directrices, como composición, jerarquía, relación focal o mediación, se filtre en el texto de la página.

Simplifica el lenguaje, nunca la afirmación. Preserve cada calificador, población, período, unidad, condición, base de comparación e incertidumbre que cambie el significado. No convierta una condición de prueba precisa en una afirmación humana más amplia: por ejemplo, “sin restricciones” no establece “una computadora normal” y “dentro del ruido de medición” no establece “tan rápido” Prefiera una declaración respaldada concreta a una abreviatura evaluativa como “diminuto,” “enorme,” “seguro,” o “rápido.”

Describa el método realmente utilizado y los límites que cambian su interpretación. Omita intentos fallidos, credenciales no disponibles y un diario de herramientas o entorno a menos que el motivo del cambio de métodos afecte materialmente la confianza, la reproducibilidad o la decisión.

Mantenga registros exhaustivos después de la ruta de decisión o detrás de la divulgación nativa cuando la superficie de entrega lo respalde. Una tabla de auditoría filtrable con docenas de filas debe tener como valor predeterminado un subconjunto neutral relevante para la decisión, como todas las fallas, todas las excepciones o cada fila nombrada en la decisión, no “Todas” Indique el filtro activo y la regla de selección; nunca elija manualmente filas favorables. Mantenga una forma explícita de inspeccionar todas las filas y mostrar los recuentos actuales y totales.

Cada sección debe responder una nueva pregunta del lector. Combinar duplicados. Eliminar ceremonia. Mantenga una evidencia en casa para cada reclamo: una tabla posterior puede preservar la búsqueda exacta, pero un segundo resumen, gráfico, grupo de tarjetas o conclusión no debe reformular la misma respuesta con igual prominencia.

### Elige la composición

La primera ventana gráfica es el argumento, no un encabezado seguido de una configuración. Puede basarse en afirmaciones, pruebas, comparaciones o herramientas. Elija la composición que exponga la identidad, la pregunta del lector y la evidencia más sólida con la menor mediación. Si el lector solo vio esta ventana gráfica, debe recordar la relación, decisión o herramienta central, no solo el título o el estado de ánimo.

Antes de diseñar, nombre de forma privada el diseño obvio que sugeriría la categoría de artefacto. Rechazarlo a menos que el material se lo gane. Una propuesta de renovación no necesita parecerse a todas las propuestas de renovación; una calculadora no necesita parecerse a todas las calculadoras. Deje que la pregunta del lector y la forma de la evidencia determinen la composición.

Cuando el material admite múltiples estructuras, compare de forma privada dos hipótesis de composición materialmente diferentes antes de codificarlo. Cambie la topología, la densidad y la ubicación de la evidencia, no solo la paleta o la elección de componentes. Seleccione la hipótesis que haga más claro el trabajo del lector con la menor mediación.

Relacione la apertura con el trabajo:

- **Una recomendación o conclusión decisiva:** hacer que la respuesta y su base decisiva sean coprimarias.
- **Una comparación:** poner alternativas sobre la misma base visual para que la diferencia sea vista, no reconstruida a partir de la prosa.
- **Una tendencia o punto de referencia:** deje que la relación o excepción lidere; mantenga registros exactos a continuación.
- **Una calculadora:** dejemos que la calculadora misma sea evidencia focal cuando manipular una suposición es el trabajo principal del lector. No requiera una prueba estática separada antes de ello.
- **Un escrito sin decisión respaldada:** liderar con el estado, la implicación, el límite o la pregunta no resuelta más respaldada en lugar de inventar un llamado a la acción.

Elija la geometría antes de los componentes. Asigne el material a una variable visual:

- Magnitud o rango → posición o longitud en una escala común.
- Cambio a lo largo del tiempo → orden horizontal y posición alineada.
- Composición → proporción.
- Umbral o rango → distancia desde un límite.
- Proceso o dependencia → conexión y secuencia.
- Alternativas cualitativas → filas alineadas o columnas deliberadamente contrastadas.

Utilice tablas para una búsqueda precisa, prosa para una conclusión y gráficos solo para relaciones que se vuelven más rápidas de entender visualmente. No utilice barras de forma predeterminada porque existen valores.

Componga la página como un campo, no como una pila de componentes. Establecer una línea argumental a nivel de página y una relación focal en cada momento de lectura o sección principal. Rodee cada objeto focal con una pequeña cantidad de objetos de soporte y suficiente espacio abierto para amplificar su jerarquía local. Marque el ritmo del pergamino deliberadamente: varíe la densidad y el silencio manteniendo una gramática visual. La repetición crea ritmo sólo cuando los elementos repetidos son pares verdaderos; de lo contrario, crea ruido de plantilla. Termine con la decisión resuelta, implicación, próxima acción o pregunta abierta. Deje que las fuentes y el pie de página sigan en silencio; no permita que la página simplemente se detenga después de un libro de contabilidad o una advertencia.

Dale a cada artefacto un movimiento organizador que contenga evidencia y que pertenezca a su material y que no pueda trasplantarse sin cambios a un informe no relacionado. Puede ser una geometría de comparación, un umbral, una secuencia, un diagrama específico del cliente, un ritmo de evidencia distintivo o la interacción misma. Debe aclarar el tema, no decorarlo.

Utilice una prueba de entrecerrar los ojos: de un vistazo, la afirmación o evidencia dominante debe ser obvia y la ruta de lectura debe ser estable. Utilice una prueba de máscara de texto: con las palabras borrosas, la jerarquía aún debe comunicar identidad, énfasis, agrupación y progresión. Si cada bloque tiene el mismo peso, rediseñe antes de codificar.

Crear presencia a través del compromiso, no de efectos adicionales. Cuando una página parezca demasiado segura, fortalezca una relación focal a través de la proporción, la jerarquía, la densidad, el ritmo, los saltos de línea o la ubicación de la evidencia. Haga que el contenido de soporte sea más silencioso. Cuando el material parezca delgado, mejore su selección, jerarquía, comparación o explicación; deje los espacios sin soporte honestos. Nunca llene un vacío de evidencia con paneles, bordes, íconos, campos de color, gráficos decorativos o efectos.

### Sistema visual de Bengochea

Estos valores fueron proporcionados por el usuario y son la referencia de esta edición. Las escalas auxiliares, comportamientos responsivos y asignaciones semánticas que siguen son propuestas de implementación, no nuevos datos de marca.

| Rol | Valor |
| --- | --- |
| Color primario | `#FC5D5D` |
| Acento | `#13B4D8` |
| Fondo | `#FFFFFF` |
| Texto principal | `#03065E` |
| Enlace solicitado | `#13B4D8` |
| Fuente del cuerpo | Montserrat |
| Fuente de títulos | Italiana |
| H1 de escritorio | `80px` |
| H2 de escritorio | `38px` |
| Cuerpo | `14px` |
| Unidad base de espaciado | `10px` |
| Radio de borde | `0px` |
| Tono | Profesional |
| Energía | Baja |
| Audiencia | Inversores y profesionales de finanzas |

#### Estructura de identidad

Encabezado, contenido y pie comparten la misma cuadrícula. La marca o identificación de Bengochea ocupa el inicio del encabezado. A su lado puede haber propósito, período o estado del documento, únicamente cuando se conocen.

No incluyas una autoría oficial ni un estado de aprobación si no están confirmados. El pie contiene fuentes, fecha o contacto cuando sean útiles. Evitá repetir el mismo bloque institucional antes y después de cada sección.

En HTML independiente, una estructura válida es:

```html
<body class="bg-report">
  <div class="bg-shell">
    <a class="bg-skip-link" href="#main">Saltar al contenido</a>
    <header class="bg-header">
      <span class="bg-identity">Bengochea</span>
      <nav aria-label="Navegación principal"><!-- Solo destinos reales. --></nav>
    </header>
    <main id="main"><!-- Un h1 y contenido semántico. --></main>
    <footer class="bg-footer"><!-- Contacto o fuentes verificadas. --></footer>
  </div>
</body>
```

El nombre en texto del ejemplo es identificación provisional. Sustituilo por el logotipo autorizado cuando esté disponible; no inventes una URL de activo.

#### Cuadrícula y alineación

Utilice la cuadrícula exterior compartida para el encabezado, el título, las secciones, la evidencia y el pie de página. La base es de 12 columnas en computadoras de escritorio, 6 en tabletas y 4 en dispositivos móviles. La lectura de prosa normalmente ocupa 6–7 columnas de escritorio. Las tablas, gráficos, calculadoras, diagramas y comparaciones principales pueden utilizar los 12.

Cada objeto debe alinearse con un borde compartido, una línea de base, una línea de cuadrícula o un centro óptico deliberado. Los bloques equivalentes comparten roles de tipo, posiciones de valor, filas internas y alineación de acciones. Un título dividido y un párrafo se alinean en sus líneas de base del primer texto. Las tablas poseen el ancho total de evidencia de su sección. No coloque contenido en una pista estrecha mientras las columnas utilizables permanezcan vacías.

Haga que los canalones de las columnas sean inconfundibles. Los títulos envueltos, las etiquetas y la prosa no deben pasar visualmente de una columna a la siguiente. Si las columnas adyacentes pueden malinterpretarse como una sola línea o frase, ensanche el margen, acorte o reequilibre el contenido o apile las columnas.

El espacio abierto debe amplificar el objeto focal. Los grandes rectángulos vacíos causados por una división insuficientemente llena, un tercer elemento huérfano o una prueba retrasada son fallas de diseño. Refluirlos o reequilibrarlos. Tres pares verdaderos normalmente ocupan una fila de tres columnas; un par deliberadamente dominante puede ganar más ancho, pero su diferencia debe ser significativa.

No fuerce hallazgos materialmente desiguales a células iguales. Clasifíquelos, agrupelos o dé al hallazgo decisivo una consecuencia más visual para que la geometría coincida con el argumento.

#### Tipografía y ritmo

Usá Montserrat para prosa, subtítulos funcionales, navegación, controles, tablas, valores, fechas y métricas. Usá Italiana para H1 y H2 editoriales. No uses Italiana en párrafos extensos, cifras financieras ni etiquetas pequeñas. Italiana se usa en peso 400; no simules negritas o cursivas que no se hayan proporcionado.

Los tamaños indicados por el usuario se aplican como referencia de escritorio: H1 80px, H2 38px y cuerpo 14px. Propuesta responsiva: H1 entre 40px y 80px; H2 entre 30px y 38px. No reduzcas todo el documento proporcionalmente. Mantené cuerpo de 14px y altura de línea 1,6; en textos extensos o contextos que lo necesiten, permití 16px para mejorar la lectura e indicá el ajuste.

Para niveles secundarios no definidos, la propuesta es H3 Montserrat 24px/1,25, introducción Montserrat 18px/1,5 y metadatos Montserrat 12px/1,5. Son roles auxiliares, no sustituciones de los tamaños suministrados. Inputs de formulario pueden usar 16px para facilitar su uso móvil.

Los encabezados van en estilo oración. Usá números tabulares en datos comparables y conservá unidad, moneda y precisión. No cambies el tamaño de una cifra aislada para hacerla entrar; reordená el conjunto.

Construí el ritmo sobre 10px: 10, 20, 30, 40, 60, 80 y 100px. Usá 10–20px dentro de grupos, 30–40px entre grupos y 60–100px entre secciones sustanciales en escritorio. En móvil, reducí los espacios de sección a 40–60px. No uses 100px después de cada párrafo. Esta escala es una propuesta derivada de la unidad base.

Cada separación tiene un propietario: `gap` del contenedor o margen del bloque, no ambos compitiendo. Agrupá título, explicación y evidencia cuando forman una unidad.

Mantené la lectura de prosa en torno a 60–68 caracteres por línea. Ajustá el ancho antes de achicar la tipografía. Revisá saltos de línea y palabras sueltas en encabezados. Separá párrafos con espacio, sin sangría de primera línea.

#### Color, superficies y límites

El lienzo principal es blanco y el texto principal azul oscuro. El coral es el primario de marca; no tiene que ocupar la mayor superficie. Reservalo para la acción principal y énfasis puntual. El celeste organiza acentos y detalles de enlaces. Energía baja significa pocas zonas de color compitiendo, no ausencia de identidad.

Radio de borde: 0px en botones, inputs, paneles, tablas y contenedores. No uses píldoras ni tarjetas redondeadas. Los círculos solo corresponden a datos, fotografías o controles cuya forma tenga un propósito real.

Contrastes calculados para los valores suministrados, redondeados a dos decimales:

| Combinación | Contraste aproximado | Aplicación |
| --- | --- | --- |
| Azul oscuro sobre blanco | 17,62:1 | Texto y enlaces legibles. |
| Azul oscuro sobre coral | 5,76:1 | Texto de botón primario. |
| Azul oscuro sobre celeste | 7,17:1 | Texto en superficies de acento. |
| Celeste sobre blanco | 2,46:1 | No usar para texto funcional pequeño. |
| Coral sobre blanco | 3,06:1 | No usar para cuerpo de 14px. |

El token de enlace de marca conserva `#13B4D8`. Para enlaces sobre blanco, la variante accesible propuesta usa texto `#03065E`, subrayado y detalle celeste decorativo. El subrayado por sí solo no corrige el contraste del texto celeste. No cambies el color solicitado silenciosamente: explicá esta asignación semántica al aplicar el documento. El texto celeste puede usarse sobre azul oscuro cuando mantenga contraste suficiente.

En botones coral o celestes, utilizá texto azul oscuro. Evitá texto blanco pequeño en estos fondos. Los estados de error y éxito llevan texto o símbolo además de color; el coral de marca no significa pérdida financiera por defecto ni el celeste significa ganancia.

Las superficies y bordes deben comunicar agrupación, selección o interacción. Preferí alineación y espacio antes que cajas. Si hace falta un divisor, usá un tono derivado del azul oscuro identificado como auxiliar. No agregues colores de marca no suministrados.

No se suministró paleta de tema oscuro. Mantené el tema claro como base; no inventes ni actives automáticamente una identidad oscura. Si se pide, derivá y verificá sus tokens por separado. Un bloque azul oscuro con texto blanco es un campo de contraste local, no una nueva paleta oficial.

Rechazá degradados decorativos, brillo, vidrio, sombras ornamentales, fondos de cuadrícula y texturas de papel. Un gradiente solo tiene lugar como escala de datos continua y etiquetada.

#### Datos y evidencia

Haga que la codificación visual sea honesta. Mostrar unidades, períodos, poblaciones, bases y comparadores de materiales cerca de la evidencia que califican. Utilice líneas de base cero para codificaciones de longitud a menos que una vista de rango o delta claramente marcada responda mejor la pregunta. No exagere las pequeñas diferencias con barras recortadas ni las oculte con barras totales casi idénticas; muestre el delta exacto sobre la misma base. Nunca utilice una pista de barra como divisor u adorno. Cada barra de pares comparte una escala documentada y su longitud debe codificar el valor; de lo contrario, utilice texto alineado.

Cuando los denominadores de pares difieren, elija contar o calificar explícitamente a partir de la pregunta del lector. No compare numeradores sin procesar como si las bases fueran iguales. Si la longitud codifica una tasa, muestre su recuento y base; si la longitud codifica un recuento, explique por qué el volumen, en lugar de la incidencia, responde a la pregunta. Utilice texto alineado o vistas separadas cuando ninguna codificación sea suficiente por sí sola.

Tamaño de barras horizontales repetidas como un solo diseño, nunca fila por fila. Proporcione al conjunto un carril de etiquetas compartido, un carril de gráfico y un carril compartido para cada valor alineado o columna de anotación. Cada pista de barra comienza y termina en las mismas líneas de cuadrícula; sólo varía la longitud del relleno. Una fila cuya etiqueta, valor o anotación cambia el ancho del gráfico es un error de diseño. Utilice una cuadrícula principal, una subcuadrícula o pistas compartidas fijas en lugar de columnas del tamaño del contenido resueltas de forma independiente dentro de cada fila.

Prefiero las etiquetas directas a las leyendas. Reserve un carril libre para cada etiqueta del gráfico para que ninguna marca, línea, corchete o anotación cruce su cuadro de glifo. Mantenga el texto del gráfico legible en los fondos efectivamente utilizados. Utilice un título para indicar lo que el lector debe notar y lo que el gráfico no establece. Proporcionar una tabla semántica o una alternativa de texto conciso para los datos del gráfico de materiales.

Cuando un gráfico sea la prueba principal, asígnele suficiente ancho, alto y contraste para soportar la primera lectura. La prominencia visual debe estar de acuerdo con el argumento: la serie decisiva, la excepción o el umbral recibe el mayor énfasis en los fondos utilizados, mientras que la evidencia de apoyo retrocede sin volverse ilegible.

Las tablas son evidencia, no decoración:

- Utilice un `<table>` semántico con título, cabeza, cuerpo y pie opcional.
- Abarca el ancho completo de evidencia de 12 columnas de forma predeterminada. Coloque la introducción de la sección encima; no coloque un libro de contabilidad al lado de un encabezado, nota o riel vacío simplemente para llenar una cuadrícula dividida.
- Haga coincidir la alineación del encabezado de cada columna con cada celda de esa columna. Alinee a la izquierda las columnas de texto y sus encabezados; alinee a la derecha las columnas numéricas y sus encabezados, incluidos los marcadores de posición y los totales. En tablas independientes, coloque `class="bg-numeric"` o `data-align="numeric"` en el numérico `<th>` y en cada numérico `<td>`; la alineación cuerpo-celda no alinea el encabezado automáticamente. Nunca centre ni alinee a la izquierda un encabezado por encima de los valores alineados a la derecha.
- Mantenga las unidades de pares y la precisión consistentes; no agregue precisión falsa.
- Alinee únicamente los encabezados de columnas de varias líneas. Las celdas del cuerpo usan `vertical-align: baseline` para que cada celda se alinee con la primera línea base de texto de la fila, incluso cuando una celda se envuelve; nunca alinee verticalmente las filas del cuerpo con el centro o la parte inferior.
- Dale a la columna de etiquetas de fila suficiente ancho para que las etiquetas cortas comunes permanezcan en una línea. No envuelva una etiqueta de fila corta mientras las columnas hermanas contengan ancho no utilizado. Si las etiquetas realmente necesitan varias líneas, envuélvalas en los límites de las palabras y conserve la primera línea de base compartida.
- No dedique una columna a repetir la misma categoría durante una serie de filas. Agrupe filas relacionadas con grupos de filas semánticas o tablas separadas cuando la categoría cambie la forma en que se interpretan las filas. Mantenga la columna de categoría solo cuando los lectores necesiten su valor para ordenar o filtrar a nivel de fila.
- Utilice la densidad normal para tablas cortas ordinarias; la densidad compacta es para búsquedas realmente densas.
- Resalte una fila recomendada solo cuando la fuente admita la recomendación.
- Reordene las columnas alrededor de la tarea de búsqueda del lector antes de reducirlas o envolverlas.
- Proporcione evidencia densa con suficiente ancho antes de elegir un diseño dividido. Una tabla con cinco o más columnas, o cualquier tabla cuyos encabezados se envuelven en el ancho normal del escritorio, normalmente posee el ancho completo de la sección. Nunca recorte, trunca ni encoja un encabezado para preservar un riel de prosa vecino; mueva la introducción sobre la tabla o simplifique las columnas.

```html
<th scope="col">Página</th>
<th scope="col" class="bg-numeric">Visitantes</th>
<!-- ... -->
<th scope="row">Página de inicio</th>
<td class="bg-numeric">12,757</td>
```

Utilice una comparación cualitativa para diferencias concisas; utilice una tabla comparativa cuando el escaneo exacto fila por fila sea importante. Las columnas de pares deben tener roles de tipo coincidentes e inicios de fila alineados. Si un par necesita una estructura diferente, no es una cuadrícula de pares.

#### Calculadoras e interacción

Trate la interacción como evidencia, no como decoración. Una calculadora debe hacer legible un modelo y permitir al lector probar las suposiciones que cambian materialmente el resultado.

Defina un modelo de estado canónico: variables, entradas fijas, fórmulas, unidades, precisión total, rangos, incrementos, valores predeterminados, precisión de visualización y dependencias. Un control posee cada variable. Los parámetros fijos no son controles. Represente previamente el resultado predeterminado. Actualice las salidas dependientes de forma atómica desde el estado de precisión total y luego formatee para su visualización.

Mantenga el resultado focal, los controles y los resultados de soporte en una herramienta coherente. Cuando el uso de la calculadora es el trabajo principal del lector, la herramienta de trabajo es el objeto dominante en la primera ventana gráfica; no la retrase por debajo de una copia de orientación de gran tamaño o un héroe disperso. No lo preceda con una versión estática ceremonial de la misma respuesta ni lo siga con un resumen del escenario predeterminado. Explique fórmulas, suposiciones, límites o interpretaciones sólo cuando ayuden al lector a confiar o utilizar el modelo.

Utilice controles nativos con etiquetas visibles, ayudantes solo cuando sea necesario, unidades claras, enfoque visible y un estado en vivo conciso. Conservar las entradas no válidas y el último resultado válido en lugar de bloquearlas o establecer valores predeterminados de forma silenciosa. Mantenga todos los controles y resultados utilizables mediante el teclado y el lector de pantalla.

Al implementar la base local propuesta, la estructura propuesta `.bg-calculator` contiene `.bg-calculator-inputs` y `.bg-calculator-output`; no interpone un contenedor de diseño. Un control de unidad utiliza este anidamiento para que su etiqueta y su ayudante permanezcan fuera del campo delimitado:

```html
<div class="bg-field">
  <label class="bg-label" for="rate">Tasa hipotética del escenario</label>
  <div class="bg-unit-field">
    <input id="rate" type="number" value="8">
    <span class="bg-unit-suffix">%</span>
  </div>
  <p class="bg-helper">Ejemplo ilustrativo: rango definido por el modelo, no una rentabilidad prometida.</p>
</div>
```

#### Movimiento y deleite

Predeterminado en quietud. Nunca agregue marquesinas con desplazamiento automático, cursores de escritura simulados o indicadores decorativos de estado pulsante. Agregue movimiento solo cuando explique un cambio de estado, preserve la continuidad o confirme una acción. Nunca introduzca la lectura detrás de la animación, revele cada sección al desplazarse, mueva imágenes al pasar el mouse sobre ellas o agregue rebote, paralaje, transiciones cinematográficas, sonido o espectáculo. Mantenga la experiencia base completa sin movimiento y respete las preferencias de movimiento reducido.

Para las páginas institucionales de Bengochea, genere deleite a través de evidencia inusualmente clara o una fricción de interacción inusualmente baja: una comparación entendida de inmediato, una calculadora que haga que un modelo sea obvio o una interacción específica del cliente que elimine el trabajo. No fabriques personalidad con chistes, celebraciones, huevos de Pascua, movimientos decorativos o efectos.

#### Medios e iconos

Utilice capturas de pantalla, diagramas, medios de clientes o logotipos proporcionados solo cuando sean evidencia o mejoren materialmente la comprensión. Nunca agregue imágenes de archivo, ilustraciones decorativas de IA, formas abstractas, capturas de pantalla de productos falsos o medios heroicos obligatorios. No utilice iconos como decoración ni los coloque en azulejos de colores. Prefiera etiquetas de texto a menos que un ícono establecido haga que una acción sea materialmente más rápida de reconocer.

### Inspeccionar y revisar en privado

Represente el resultado real cuando existan herramientas. Inspeccione la primera ventana gráfica, la página completa y todos los temas efectivamente implementados. Verifique también el reflujo responsivo antes de la transferencia, pero no exponga una matriz de evaluación o un informe de crítica a menos que el usuario lo solicite.

Revise en este orden:

1. **Primera lectura:** ¿Es inmediata la autoría de Bengochea? Si el lector viera sólo la primera ventana gráfica, ¿recordaría la relación, decisión o herramienta central en lugar de sólo el título o el estado de ánimo?
2. **Idioma:** ¿Puede la parte interesada menos especializada explicar la respuesta después de leer los títulos y subtítulos? ¿Todo término desconocido está definido en palabras sencillas? ¿La simplificación preservó todos los calificadores materiales y evitó afirmaciones más amplias que las que admite la fuente? ¿La metodología describe el método elegido y sus límites más que un diario de ejecución?
3. **Composición:** ¿Existe un objeto dominante? ¿Cada sección promueve el argumento? ¿Algún espacio vacío es accidental?
4. **Tipografía:** ¿Los roles son consistentes, los valores entre pares son iguales, las líneas de base están alineadas, la prosa es legible, las canaletas son inconfundibles y el ritmo vertical es relacional en lugar de uniforme? ¿Cada espacio visible tiene un propietario?
5. **Evidencia:** ¿La geometría prueba la afirmación? ¿Las filas repetidas comparten etiquetas exactas, gráficos, valores y líneas de cuadrícula de anotaciones? ¿Las tablas tienen ancho completo? ¿Los encabezados coinciden con la alineación de las celdas representativas en cada columna? ¿Una etiqueta de fila corta se envuelve mientras que otra columna tiene espacio? ¿Una categoría repetida desperdicia una columna? ¿Algún subconjunto de auditoría predeterminado es neutral y declarado? ¿Son claras las etiquetas de los gráficos? ¿Se repite algo sin una nueva tarea de lectura?
6. **Restricción:** ¿Se puede eliminar cualquier superficie, borde, píldora, ícono, etiqueta, color, párrafo o sección sin perder significado, asequibilidad o ritmo? Si es así, elimínelo.
7. **Temas y reflujo:** ¿El tema claro mantiene jerarquía y contraste y cualquier variante solicitada fue verificada? ¿La página se recompone sin desbordamiento ni envoltura a nivel de caracteres?
8. **Confianza y acceso:** ¿Son sólidos la semántica, el enfoque, las etiquetas, las alternativas de texto, las fuentes, las advertencias y el comportamiento de interacción?

Corrija el defecto sistémico de mayor impacto, renderice nuevamente y repita hasta que no quede ningún problema visual o de usabilidad del material conocido. Mantenga este trabajo interno. Entregue la implementación solicitada, no una puntuación, un diario de proceso, un registro de comparación o una autocrítica.

## Rechazar los reflejos del diseño generado

No envíe ninguno de estos valores predeterminados reconocibles:

- Antetítulos en mayúsculas con espaciado excesivo entre letras, rótulos decorativos y numeración de secciones sin función.
- Guiones largos usados como recurso repetitivo de redacción.
- Gradientes decorativos, brillos, manchas, rayas, texturas, vidrios u sombras ornamentales.
- Un encabezado promocional genérico y centrado seguido de una cuadrícula de tarjetas.
- Cuadros métricos repetidos cuando una relación compuesta sería más clara.
- Una insignia, píldora o cápsula redondeada para metadatos ordinarios, anotaciones de gráficos o etiquetas editoriales.
- Tarjetas anidadas dentro de tarjetas o bordes utilizados para reparar jerarquías débiles.
- Un rectángulo oscuro y redondeado alrededor de cada gráfico o calculadora.
- Azulejos de iconos arbitrarios, iconos de gran tamaño o estilos de iconos mixtos.
- Prosa pequeña y apagada, tamaños de fuente arbitrarios, valores entre pares inconsistentes o líneas de base desalineadas.
- Una tabla estrecha dentro de una sección ancha o una tabla comprimida con palabras partidas.
- Gráficos decorativos, visualizaciones redundantes, leyendas que sustituyen a las etiquetas directas o color sin significado.
- Barras repetidas de ancho completo que no comparten una escala ni codifican una diferencia visible.
- Siluetas de secciones idénticas en preguntas de lectores no relacionadas.
- Secciones repetidas de recomendaciones, resúmenes, fundamentos y conclusiones que dicen lo mismo.
- Narración del proceso de creación, como cómo se organizó la página, por qué se eligió una representación o cómo se cambiaron los nombres de los campos fuente. Mantenga subtítulos interpretativos concisos que indiquen una conclusión o limitación basada en evidencia.
- Controles de temas visibles, interfaz de usuario de solo impresión, imágenes de archivo, capturas de pantalla falsas o marcas de marca decorativas.

No compense el hecho de evitar estos incumplimientos produciendo una plantilla sin jerarquía. La moderación de Bengochea es una jerarquía precisa, una tipografía excelente, evidencia clara, una alineación fuerte y una tensión deliberada. No se trata simplemente de reglas negras, blancas, delgadas y grandes márgenes vacíos.

## Contrato CSS y tokens

La siguiente base es una propuesta de implementación local de este documento. No es una API publicada por Bengochea. Los tokens de color, fuentes, tamaños principales, unidad y radio reproducen los valores suministrados; los roles auxiliares se distinguen por nombre.

```css
:root {
  color-scheme: light;
  --bg-color-primary: #FC5D5D;
  --bg-color-accent: #13B4D8;
  --bg-color-background: #FFFFFF;
  --bg-color-text-primary: #03065E;
  --bg-color-link-brand: #13B4D8;
  --bg-color-link-readable: var(--bg-color-text-primary);
  --bg-font-body: "Montserrat", sans-serif;
  --bg-font-heading: "Italiana", Georgia, serif;
  --bg-h1-desktop: 80px;
  --bg-h2-desktop: 38px;
  --bg-body-size: 14px;
  --bg-space-unit: 10px;
  --bg-radius: 0px;
  /* Roles auxiliares propuestos. */
  --bg-space-1: 10px;
  --bg-space-2: 20px;
  --bg-space-3: 30px;
  --bg-space-4: 40px;
  --bg-space-6: 60px;
  --bg-space-8: 80px;
  --bg-space-10: 100px;
  --bg-color-border: rgb(3 6 94 / 18%);
}
.bg-report {
  margin: 0;
  background: var(--bg-color-background);
  color: var(--bg-color-text-primary);
  font: 400 var(--bg-body-size)/1.6 var(--bg-font-body);
}
.bg-report *, .bg-report *::before, .bg-report *::after {
  box-sizing: border-box;
}
.bg-shell {
  width: min(100% - 40px, 1240px);
  margin-inline: auto;
}
.bg-report h1, .bg-report h2 {
  font-family: var(--bg-font-heading);
  font-weight: 400;
}
.bg-report h1 { font-size: clamp(40px, 6.25vw, var(--bg-h1-desktop)); line-height: 1.05; }
.bg-report h2 { font-size: clamp(30px, 4vw, var(--bg-h2-desktop)); line-height: 1.15; }
.bg-reading { max-width: 65ch; }
.bg-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--bg-space-3); }
.bg-grid > * { min-width: 0; }
.bg-report a {
  color: var(--bg-color-link-readable);
  text-decoration: underline;
  text-decoration-color: currentColor;
  text-underline-offset: 0.2em;
}
.bg-report a:hover { text-decoration-color: var(--bg-color-accent); }
.bg-report button, .bg-report input, .bg-report select, .bg-report textarea {
  font-family: var(--bg-font-body);
  border-radius: var(--bg-radius);
}
.bg-button {
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid var(--bg-color-text-primary);
  background: var(--bg-color-primary);
  color: var(--bg-color-text-primary);
  font: 600 var(--bg-body-size)/1.4 var(--bg-font-body);
}
.bg-report :focus-visible { outline: 2px solid var(--bg-color-text-primary); outline-offset: 3px; }
.bg-numeric { font-variant-numeric: tabular-nums; text-align: right; }
.bg-table-wrap { max-width: 100%; overflow-x: auto; }
.bg-report table { width: 100%; border-collapse: collapse; }
.bg-report th, .bg-report td { padding: 10px; text-align: left; vertical-align: baseline; }
.bg-report th.bg-numeric, .bg-report td.bg-numeric { text-align: right; }
.bg-report th, .bg-report td { border-bottom: 1px solid var(--bg-color-border); }
@media (max-width: 900px) {
  .bg-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--bg-space-2); }
}
@media (max-width: 600px) {
  .bg-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .bg-report input, .bg-report select, .bg-report textarea { font-size: 16px; }
}
```

En un sistema de componentes existente, mapeá estos valores a sus tokens semánticos en el alcance adecuado, sin duplicar temas globales. Mantener nombres de roles no obliga a reescribir componentes que ya cumplen el contrato.

Las clases propuestas son ganchos de implementación. Solo las declaradas en el CSS anterior tienen estilo en ese ejemplo. Clases del esquema como `bg-header`, `bg-skip-link`, `bg-chart` o `bg-calculator` necesitan su implementación local antes de utilizarse. No asumas que existe una librería remota que las resuelve.

Para un gráfico, conservá etiquetas, ejes y cifras en azul oscuro. Diferenciá series con coral, celeste, trazos o patrones identificados; dos colores no justifican inventar seis series cromáticas. Si se necesitan más, acordá una escala accesible y documentala como auxiliar.

## Accesibilidad y comportamiento responsivo

Usá regiones semánticas, un H1 descriptivo, encabezados ordenados, enlace para saltar al contenido, controles nativos, tablas con encabezados, figuras con textos alternativos y foco visible. Implementá y verificá el estilo del enlace de salto; el nombre de la clase no lo resuelve.

No confíes solo en el color para comunicar selección, error, enlace o cambios financieros. Comprobá contraste en cada estado real, incluidas tablas, foco y botones. La variante accesible de enlaces se explica en la sección de color y no altera el token de marca original.

No ocultes el desbordamiento de la página. Dales `min-width: 0` a los hijos de grid y flex. Reordená antes de encoger. Las tablas extensas pueden tener desplazamiento local; no recortes encabezados ni montos para sostener una composición lateral.

Verificá móvil, tableta y escritorio, navegación con teclado, zoom y preferencias de movimiento reducido. Si un componente porta contenido fuera de la raíz, asegurá que también reciba fuentes, colores y estados correctos.

No actives un modo oscuro no definido. Para PDF o impresión, conservá fuentes, unidades, tablas, fuentes documentales y enlaces útiles; asegurá que el contenido no dependa de hover, animación o controles interactivos para entenderse.

## Criterios de contenido financiero y comunicación

Presentá información histórica con fecha y fuente. No conviertas previsiones de un informe anterior en una afirmación actual. Distinguí asesoramiento general de una propuesta adaptada a un cliente.

Confirmá condiciones actuales antes de publicar tarifas, mínimos, modalidad de custodia, inscripción o acuerdos con terceros. No equivalen «sin mínimo de apertura», «sin mínimo de inversión» y «sin comisión mínima». No presentes regulación o adhesión a códigos como garantía de rentabilidad.

No inventes testimonios, citas de empleados, volumen de activos, cantidad de clientes ni resultados. No expongas cuentas, documentación, posiciones o información personal de clientes en ejemplos, capturas o URLs.

Identificá la autoría y permisos del research que reutilices. Usá llamados a la acción con destinos reales y canales confirmados. No prometas apertura inmediata ni tiempos de respuesta sin respaldo operativo.

Referencias de contexto disponibles: `Bengochea-guia-de-la-empresa.md`, `Bengochea-manual-marketing-comunicacion.md` y las fuentes documentales que ambos citan. Estos archivos no reemplazan una verificación de vigencia.

## Cómo mejorar estas directrices

Al construir una pieza con este documento, registrá fallas observadas y corregí la regla más específica que corresponda. Mantené instrucciones de criterio en este archivo; mecanismos repetibles en CSS o componentes; verificaciones mecánicas en comprobaciones del proyecto cuando hagan falta.

Una revisión propuesta usa los mismos datos y tamaños de pantalla para comparar una página institucional, una tabla de costos, un informe de mercado y una página de campaña. Esta es una pauta de evaluación futura; no implica que esas pruebas se hayan ejecutado o validado para esta edición.

Conservá los tokens dados por el usuario. Cuando una corrección requiera cambiar un dato de marca, diferenciá el cambio de una decisión de implementación y obtené la indicación correspondiente antes de sustituirlo.

## Procedencia y estado

Estructura de referencia: texto adjunto por el usuario y [How our agents build on-brand pages with design.md](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md). La adaptación conserva el método de encuadre, composición, evidencia y revisión; los valores visuales proceden del usuario.

Estado: especificación de trabajo para Bengochea. Las decisiones auxiliares de accesibilidad, tipografía responsiva y CSS están identificadas como propuestas. No se modificaron la biblioteca HTML ni los PDF existentes.

El objetivo es que cada pieza se reconozca por su claridad, su criterio y su coherencia con Bengochea.
