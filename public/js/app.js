import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore, connectFirestoreEmulator, collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { GENEROS, validarLibro, normalizarLibro } from "./validacion.js";

// Firebase Hosting expone la configuración del proyecto en /__/firebase/init.json,
// así no hace falta guardar claves en el repositorio.
const config = await fetch("/__/firebase/init.json").then((r) => r.json());
const app = initializeApp(config);
const db = getFirestore(app);
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
}
const librosRef = collection(db, "libros");

const $ = (sel) => document.querySelector(sel);
const form = $("#form-libro");
const lista = $("#lista");
const filtro = $("#filtro-genero");
const errores = $("#errores");
const contador = $("#contador");

for (const g of GENEROS) {
  form.genero.add(new Option(g, g));
  filtro.add(new Option(g, g));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  const errs = validarLibro(datos);
  errores.textContent = errs.join(" ");
  if (errs.length) return;
  form.querySelector("button").disabled = true;
  try {
    await addDoc(librosRef, { ...normalizarLibro(datos), creadoEn: serverTimestamp() });
    form.reset();
  } catch (err) {
    errores.textContent = "No se pudo guardar: " + err.message;
  } finally {
    form.querySelector("button").disabled = false;
  }
});

let cancelar = null;
function escuchar() {
  if (cancelar) cancelar();
  const g = filtro.value;
  const q = g
    ? query(librosRef, where("genero", "==", g), orderBy("creadoEn", "desc"))
    : query(librosRef, orderBy("creadoEn", "desc"));
  // onSnapshot: la lista se actualiza en tiempo real en todos los navegadores abiertos.
  cancelar = onSnapshot(q, pintar, (err) => (errores.textContent = err.message));
}
filtro.addEventListener("change", escuchar);

function pintar(snap) {
  contador.textContent = `${snap.size} libro(s)`;
  lista.replaceChildren();
  if (snap.empty) {
    lista.innerHTML = '<li class="vacio">Aún no hay libros. ¡Agrega el primero!</li>';
    return;
  }
  snap.forEach((d) => {
    const l = d.data();
    const li = document.createElement("li");
    li.className = l.leido ? "leido" : "";
    li.innerHTML = `
      <div class="info">
        <strong></strong>
        <span class="meta"></span>
      </div>
      <div class="acciones">
        <button class="toggle"></button>
        <button class="borrar" title="Eliminar">✕</button>
      </div>`;
    li.querySelector("strong").textContent = l.titulo;
    li.querySelector(".meta").textContent = `${l.autor} · ${l.genero} · ${l.anio}`;
    const toggle = li.querySelector(".toggle");
    toggle.textContent = l.leido ? "Leído ✔" : "Marcar leído";
    toggle.onclick = () => updateDoc(doc(db, "libros", d.id), { leido: !l.leido });
    li.querySelector(".borrar").onclick = () => {
      if (confirm(`¿Eliminar "${l.titulo}"?`)) deleteDoc(doc(db, "libros", d.id));
    };
    lista.append(li);
  });
}

escuchar();
