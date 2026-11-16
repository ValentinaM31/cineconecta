package com.cineconecta.catalogo;

public record ContenidoResumen(String id, String titulo, Tipo tipo) {

    public enum Tipo {
        SERIE,
        PELICULA,
        DOCUMENTAL
    }
}
