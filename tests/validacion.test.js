import { test } from "node:test";
import assert from "node:assert/strict";
import { validarLibro, normalizarLibro } from "../public/js/validacion.js";

const valido = { titulo: "Cien años de soledad", autor: "G. García Márquez", genero: "Novela", anio: "1967" };

test("acepta un libro válido", () => {
  assert.deepEqual(validarLibro(valido), []);
});

test("rechaza título vacío", () => {
  assert.equal(validarLibro({ ...valido, titulo: "   " }).length, 1);
});

test("rechaza género fuera de la lista", () => {
  assert.equal(validarLibro({ ...valido, genero: "Terror" }).length, 1);
});

test("rechaza año futuro o no entero", () => {
  assert.equal(validarLibro({ ...valido, anio: "3000" }).length, 1);
  assert.equal(validarLibro({ ...valido, anio: "19.5" }).length, 1);
});

test("normaliza tipos y recorta espacios", () => {
  const n = normalizarLibro({ ...valido, titulo: "  X  " });
  assert.equal(n.titulo, "X");
  assert.equal(n.anio, 1967);
  assert.equal(n.leido, false);
});
