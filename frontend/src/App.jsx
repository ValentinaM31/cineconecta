import { useEffect, useState } from 'react'

const nombresDeTipo = {
  SERIE: 'Serie',
  PELICULA: 'Película',
  DOCUMENTAL: 'Documental',
}

export default function App() {
  const [contenidos, setContenidos] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const solicitud = new AbortController()

    async function cargarCatalogo() {
      try {
        const respuesta = await fetch('/api/contenidos', { signal: solicitud.signal })
        if (!respuesta.ok) {
          throw new Error(`HTTP ${respuesta.status}`)
        }
        const catalogo = await respuesta.json()
        if (!Array.isArray(catalogo)) {
          throw new Error('La respuesta del catálogo no es una lista')
        }
        if (!solicitud.signal.aborted) {
          setContenidos(catalogo)
        }
      } catch {
        if (!solicitud.signal.aborted) {
          setError(true)
        }
      }
    }

    cargarCatalogo()

    // Cancela la petición pendiente al desmontar la pantalla.
    return () => solicitud.abort()
  }, [])

  return (
    <>
      <header className="cabecera">
        <div className="contenedor marca">CineConecta</div>
      </header>
      <main className="contenedor catalogo">
        <h1>Catálogo</h1>

        {error && (
          <p className="mensaje error" role="alert">
            No se pudo cargar el catálogo. Comprueba que el backend esté en ejecución y recarga la página.
          </p>
        )}
        {!error && contenidos === null && <p className="mensaje" role="status">Cargando catálogo…</p>}
        {contenidos?.length === 0 && <p className="mensaje" role="status">El catálogo está vacío.</p>}
        {contenidos?.length > 0 && (
          <ul className="lista">
            {contenidos.map(({ id, titulo, tipo }) => (
              <li className="ficha" key={id}>
                <p className="tipo">{nombresDeTipo[tipo] ?? tipo}</p>
                <h2>{titulo}</h2>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
