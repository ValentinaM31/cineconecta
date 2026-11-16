# cineConecta

CineConecta es un proyecto del curso SID para gestionar suscripciones y simular la visualización de películas, series y documentales.

- **Oracle** guarda cuentas, perfiles, planes, suscripciones y pagos según el modelo relacional del enunciado.
- **MongoDB** guarda el catálogo, «Mi lista», la actividad de visualización y los usuarios administrativos.

## Primera entrega · Modelado de datos

- [Modelo documental](docs/modelo-documental.md)
- [Catálogo relacional](docs/catalogo-relacional.md)
- [Justificación de persistencia](docs/justificacion-persistencia.md)

## Ejecución local

Usa JDK 21 y Node.js 22.12 o posterior con npm. Vite también admite Node.js 20.19 dentro de la rama 20. Configura `JAVA_HOME` para que apunte al JDK. El Maven Wrapper descarga la versión de Maven del proyecto en la primera ejecución.

Abre dos terminales de PowerShell desde la raíz del repositorio.

**Terminal del backend**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Terminal del frontend**

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Abre la URL `Local` que indica Vite, normalmente [http://localhost:5173/](http://localhost:5173/). Si el puerto está ocupado, Vite muestra el siguiente disponible. React consulta `/api/contenidos` en el mismo origen y el proxy de Vite envía la solicitud al backend en el puerto `8080`. El catálogo de esta etapa se carga en memoria.

Con ambos servicios en ejecución, puedes consultar el catálogo directamente y a través del proxy. Sustituye `5173` por el puerto que muestre Vite si es distinto.

```powershell
Invoke-RestMethod http://localhost:8080/api/contenidos
Invoke-RestMethod http://localhost:5173/api/contenidos
```
