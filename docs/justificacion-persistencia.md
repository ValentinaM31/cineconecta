# Justificación de persistencia

## Datos por motor

- **Oracle.** Cuentas, perfiles, planes, suscripciones y pagos siguen el modelo del anexo. Las claves foráneas mantienen las relaciones y la transacción de contratación registra juntos el pago aprobado y la suscripción.
- **MongoDB.** Las fichas comparten campos de búsqueda y contienen atributos propios de películas, series o documentales. Los episodios se leen con su temporada y se embeben en ella. La lista y las sesiones se guardan por entrada para consultar la actividad de un perfil y conservar su historial. Los usuarios administrativos se autentican con cuentas independientes de los clientes.

## Enlace entre motores

Antes de iniciar una reproducción, el servidor comprueba en Oracle que el perfil pertenece al titular, está activo y tiene una suscripción vigente para su cuenta. En MongoDB comprueba que la ficha esté publicada y que su clasificación sea apta. Si es una serie, valida también la temporada y el episodio.

MongoDB conserva `perfilId` en la lista y en las sesiones. El `suscripcionId` de cada sesión permite recuperar en Oracle el plan que estaba vigente al iniciarla, incluso si la cuenta cambió de plan después. La sesión también conserva la duración de la unidad al inicio para que las ediciones del catálogo no cambien el cálculo de su progreso.

## Fallos de conexión y operaciones interrumpidas

Si Oracle está fuera de servicio, se suspenden las operaciones que requieren verificar cuentas, perfiles o suscripciones. La administración del catálogo puede continuar con MongoDB. Si MongoDB falla, el cliente puede seguir gestionando su cuenta y suscripciones mediante Oracle. Cuando falte un motor necesario para autorizar una reproducción o calcular un informe, el sistema comunica el error y permite reintentar.

Los controles de reproducción se reintentan con el mismo ID de sesión y número de secuencia. La actualización de la sesión comprueba la secuencia para evitar sumar segundos por duplicado. Las transacciones de contratación afectan únicamente a Oracle.
