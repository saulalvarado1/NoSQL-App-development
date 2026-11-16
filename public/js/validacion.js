// Reglas de validación compartidas por la UI y los tests.
// Las mismas restricciones se repiten en firestore.rules (validación del lado servidor).

export const GENEROS = ["Novela", "Ciencia", "Tecnología", "Historia", "Poesía", "Otro"];

export function validarLibro(libro) {
  const errores = [];
  const titulo = (libro.titulo ?? "").trim();
  const autor = (libro.autor ?? "").trim();
  const anio = Number(libro.anio);
  const anioActual = new Date().getFullYear();

  if (titulo.length < 1 || titulo.length > 120) errores.push("El título debe tener entre 1 y 120 caracteres.");
  if (autor.length < 1 || autor.length > 80) errores.push("El autor debe tener entre 1 y 80 caracteres.");
  if (!GENEROS.includes(libro.genero)) errores.push("Selecciona un género válido.");
  if (!Number.isInteger(anio) || anio < 1000 || anio > anioActual) {
    errores.push(`El año debe ser un entero entre 1000 y ${anioActual}.`);
  }
  return errores;
}

export function normalizarLibro(libro) {
  return {
    titulo: libro.titulo.trim(),
    autor: libro.autor.trim(),
    genero: libro.genero,
    anio: Number(libro.anio),
    leido: false,
  };
}
