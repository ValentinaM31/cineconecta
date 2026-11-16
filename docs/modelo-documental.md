# Modelo documental de MongoDB

El [diagrama documental](Modelo_de_Datos.pdf) define las colecciones. Los [requerimientos](CineConecta_Requerimientos.pdf) explican cuándo se escriben y consultan sus datos. Esta propuesta concreta las validaciones y consultas de RI-06 a RI-11 y el informe RI-13.

## Colecciones

| Colección | Unidad de almacenamiento | Datos principales |
| --- | --- | --- |
| `contenidos` | Una ficha por película, serie o documental | Título, sinopsis, año, géneros, países, idiomas de audio y subtítulos, edad mínima, portada y estado. Películas y documentales tienen duración y dirección. Las películas tienen reparto y personaje cuando se conoce. Los documentales tienen temas, entrevistados y fuentes cuando aplican. |
| `temporadas` | Una temporada por documento | `serieId`, `numero`, `descripcion` y arreglo `episodios`. Cada episodio guarda `_id`, número, título, sinopsis y duración. |
| `miLista` | Una entrada por perfil y obra | `perfilId`, `contenidoId`, `agregadoEn`. El estado de retiro se lee de la ficha. |
| `sesiones` | Una sesión por cada reproducción | `perfilId`, `contenidoId`, `suscripcionId`, inicio, fin, última actividad, duración al inicio, tiempo visto, posición, completado y última secuencia procesada. Para series se guardan `temporadaId` y `episodioId`. |
| `administradores` | Una cuenta administrativa por documento | Nombre, `correoNormalizado`, `passwordHash` y `activo`. El servidor comprueba el estado y la autorización administrativa. |

## Campos y tipos

- Las claves de documento y los identificadores del catálogo son `ObjectId`. Las referencias `perfilId` y `suscripcionId` son enteros BSON `long`, asignados en Oracle y convertidos de forma exacta. La generación de esos identificadores debe mantenerse en el rango de 64 bits con signo.
- Los instantes se guardan como `date` en UTC. Año, clasificación, número de temporada y episodio, secuencia y valores de duración, posición y consumo son `int`. Los tiempos de reproducción se expresan en segundos. `activo` y `completada` son `bool`.
- Los estados de la ficha son `borrador`, `publicado` y `retirado`. Géneros, países, idiomas, dirección, temas y entrevistados son arreglos de cadenas. Los subtítulos y entrevistados admiten un arreglo vacío. Reparto y fuentes son arreglos de objetos.

## Documentos embebidos y referencias

- Los episodios se consultan con su temporada y se embeben en ella. Cada temporada guarda en `serieId` una referencia a la ficha de la serie. Así, la búsqueda de fichas puede leer el catálogo sin cargar los episodios.
- La lista y las sesiones referencian `contenidos._id`. Para reproducir un episodio, el servidor comprueba que esté dentro de la temporada indicada y que esta pertenezca a la serie. Los identificadores se conservan al editar. El retiro cambia el estado de la ficha y conserva los datos referenciados por el historial.
- `perfilId` apunta a `PROFILES.profileId`. Al iniciar una sesión, el servidor valida en Oracle la pertenencia del perfil, su estado activo y la suscripción vigente de la misma cuenta para ese instante. Guarda `SUBSCRIPTIONS.subscriptionId` para recuperar el plan histórico. En MongoDB verifica que la obra esté publicada y dentro de la clasificación del perfil.

## Validaciones

- Usar validación de esquema para tipos BSON, estados y campos comunes. Al publicar, exigir los campos del tipo y comprobar que la serie tenga al menos un episodio. Validar duraciones positivas.
- Validar en el documento de temporada que los números y los identificadores de `episodios` sean únicos dentro de su arreglo, comparando la cantidad de valores distintos con su longitud. Un índice único sobre un arreglo aplica la unicidad entre documentos. La escritura debe proteger también el arreglo ante ediciones concurrentes. [Validación de arreglos en MongoDB](https://www.mongodb.com/docs/manual/tutorial/unique-indexes-schema-validation/)
- Para cada sesión, guardar `temporadaId` y `episodioId` juntos solo si la ficha es una serie. Mantener `posicionSeg` entre `0` y `duracionSegInicio`, y `vistoSeg` como contador del tiempo efectivamente reproducido. Marcar `completada` al finalizar de forma expresa o llegar al 90 % de la duración registrada al inicio.
- Al reintentar un control de reproducción, usar el mismo ID de sesión y número de secuencia. Aplicar cada control con una actualización atómica condicionada a que sea el siguiente y que la sesión siga abierta. Si la secuencia ya se procesó, devolver el estado guardado sin volver a sumar tiempo. Un salto cambia la posición y aporta cero segundos por el tramo saltado. Al cerrar por abandono, conservar el último avance confirmado y su fecha de actividad.

## Índices

| Colección | Clave propuesta | Uso |
| --- | --- | --- |
| `contenidos` | `{ estado: 1, tituloNormalizado: 1, _id: 1 }` | Búsqueda por prefijo del título normalizado, con desempate estable al paginar. |
| `temporadas` | `{ serieId: 1, numero: 1 }` único | Orden de temporadas y unicidad del número dentro de la serie. |
| `miLista` | `{ perfilId: 1, contenidoId: 1 }` único | Consultar la lista del perfil y evitar duplicados. |
| `sesiones` | `{ perfilId: 1, ultimaActividadEn: -1, _id: -1 }` | Leer la actividad del perfil desde la más reciente. |
| `sesiones` | `{ inicio: 1 }` | Filtrar las sesiones del informe por rango de inicio. |
| `administradores` | `{ correoNormalizado: 1 }` único | Autenticación por correo y unicidad. |

Para evaluar el índice del catálogo, ejecutar la misma búsqueda por prefijo antes y después con `explain("executionStats")`. Registrar el volumen, los filtros, el plan, los documentos examinados y el tiempo. Medir también una consulta de Oracle con el mismo criterio de comparación.

## Ejemplos

Una temporada con un episodio y una sesión asociada. `serie`, `temporada`, `episodio` y `sesion` representan los `ObjectId` de cada registro.

```javascript
// temporadas
{
  _id: temporada, serieId: serie, numero: 1, descripcion: "Primera temporada",
  episodios: [{ _id: episodio, numero: 1, titulo: "La llegada",
                sinopsis: "La tripulación alcanza la costa.", duracionSeg: 1500 }]
}

// sesiones tras reproducir 120 segundos y saltar a la posición 420
{
  _id: sesion, perfilId: Long("42"), contenidoId: serie,
  temporadaId: temporada, episodioId: episodio, suscripcionId: Long("210"),
  inicio: ISODate("2026-11-10T15:00:00Z"),
  ultimaActividadEn: ISODate("2026-11-10T15:02:00Z"),
  duracionSegInicio: 1500, vistoSeg: 120, posicionSeg: 420,
  completada: false, ultimaSecuencia: 2
}
```

## Consultas

- **Catálogo.** Filtrar por `estado: "publicado"` y `clasificacionEdad` menor o igual al límite del perfil. Aplicar el prefijo normalizado y filtros de tipo, género, idioma en audio o subtítulos y año según la búsqueda. Ordenar por `tituloNormalizado` y `_id` para paginar. Los detalles de una serie consultan sus temporadas por `serieId`.
- **Mi lista.** Buscar por `perfilId` y consultar las fichas referenciadas. Mostrar el estado retirado cuando corresponda.
- **Continuar viendo.** Para el perfil, seleccionar primero la sesión más reciente por `episodioId` cuando exista o por `contenidoId` para películas y documentales. Después filtrar por sesión incompleta y ficha publicada y apta para el perfil. Ordenar por `ultimaActividadEn` descendente, con `_id` como desempate. Así una sesión reciente completada oculta las anteriores incompletas de la misma unidad.
- **Consumo.** Filtrar por `inicio` dentro del rango solicitado. Recuperar en Oracle los planes de los `suscripcionId` de esas sesiones y obtener el tipo de las fichas, incluidas las retiradas. Agrupar por plan y tipo, sumar `vistoSeg`, convertir a minutos y contar perfiles distintos por grupo.
- **Disponibilidad.** Si falla una base necesaria para verificar acceso o calcular un informe, comunicar la indisponibilidad y permitir reintentar. Los cambios de reproducción pendientes se reintentan con la misma secuencia. El pago y la suscripción se confirman juntos en Oracle, en una transacción independiente de MongoDB.
