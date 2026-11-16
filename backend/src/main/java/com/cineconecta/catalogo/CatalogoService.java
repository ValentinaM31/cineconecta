package com.cineconecta.catalogo;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cineconecta.catalogo.ContenidoResumen.Tipo;

@Service
public class CatalogoService {

    // Fuente temporal del catálogo hasta incorporar la persistencia.
    private static final List<ContenidoResumen> CATALOGO = List.of(
            new ContenidoResumen("demo-1", "Andenes", Tipo.SERIE),
            new ContenidoResumen("demo-2", "Ruta al mar", Tipo.PELICULA),
            new ContenidoResumen("demo-3", "Ríos de Cali", Tipo.DOCUMENTAL)
    );

    public List<ContenidoResumen> listar() {
        return CATALOGO;
    }
}
