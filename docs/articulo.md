---
title: "Construye y despliega una app con Cloud Firestore (NoSQL) en Firebase usando GitHub Actions"
published: false
description: "Paso a paso: una app web de biblioteca con Cloud Firestore, reglas de seguridad, índices y despliegue automático a Firebase Hosting con CI/CD."
tags: nosql, firebase, firestore, githubactions
---

> **Repositorio:** https://github.com/saulalvarado1/NoSQL-App-development
> **App en vivo:** https://biblioteca-nosql-upt.web.app
> **Video (≤ 5 min):** `<URL_DEL_VIDEO>`

## Introducción

Cuando pensamos en bases de datos NoSQL, los nombres que aparecen siempre son MongoDB o Redis. En este artículo uso otra opción muy popular y con plan gratuito: **Cloud Firestore**, la base de datos NoSQL **orientada a documentos** de Google Cloud / Firebase.

Vamos a construir una pequeña app web, **Biblioteca NoSQL**, que permite registrar libros, filtrarlos por género y marcarlos como leídos, con **actualizaciones en tiempo real**. Después la publicaremos en **Firebase Hosting** con un pipeline de **GitHub Actions** que despliega automáticamente en cada `push`.

**Lo que vas a aprender:**

1. Cómo modelar datos en Firestore (colecciones y documentos).
2. Cómo hacer CRUD y consultas en tiempo real con el SDK web.
3. Cómo proteger y validar datos con *Security Rules*.
4. Cómo automatizar el despliegue con GitHub Actions.

## ¿Qué es Cloud Firestore?

Firestore guarda los datos como **documentos** (parecidos a objetos JSON) agrupados en **colecciones**. No hay tablas ni esquema fijo: cada documento puede tener campos distintos, y podemos anidar subcolecciones.

| Concepto relacional | Concepto en Firestore |
|---|---|
| Tabla | Colección |
| Fila | Documento |
| Columna | Campo |
| `JOIN` | Desnormalizar o subcolecciones |
| Índice | Índice simple (automático) o compuesto |

Ventajas que aprovechamos en este proyecto:

- **Serverless:** no administramos servidores ni conexiones.
- **Tiempo real:** con `onSnapshot` cada cliente recibe los cambios al instante.
- **Escala automática** y réplicas gestionadas por Google.
- **Plan gratuito (Spark):** 1 GiB de almacenamiento, 50 000 lecturas y 20 000 escrituras diarias.

## Arquitectura

```
Navegador ──HTTPS──▶ Firebase Hosting (HTML/CSS/JS)
    └── SDK de Firebase ──▶ Cloud Firestore (colección "libros")

GitHub push ─▶ GitHub Actions: npm test ─▶ firebase deploy
```

No hay backend propio: el navegador habla directamente con Firestore y las **reglas de seguridad** hacen de "capa de servidor" validando cada escritura.

## 1. Modelo de datos

Una sola colección `libros`. Cada documento:

```json
{
  "titulo": "Cien años de soledad",
  "autor": "Gabriel García Márquez",
  "genero": "Novela",
  "anio": 1967,
  "leido": false,
  "creadoEn": "timestamp del servidor"
}
```

## 2. El código de la app

La configuración de Firebase **no se guarda en el repositorio**: Firebase Hosting la expone automáticamente en `/__/firebase/init.json`.

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy,
         onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const config = await fetch("/__/firebase/init.json").then(r => r.json());
const db = getFirestore(initializeApp(config));
const librosRef = collection(db, "libros");
```

**Crear un documento:**

```js
await addDoc(librosRef, { titulo, autor, genero, anio, leido: false,
                          creadoEn: serverTimestamp() });
```

**Consultar en tiempo real**, filtrando por género y ordenando por fecha:

```js
const q = query(librosRef, where("genero", "==", "Novela"), orderBy("creadoEn", "desc"));
onSnapshot(q, snap => snap.forEach(doc => console.log(doc.id, doc.data())));
```

**Actualizar y eliminar:**

```js
await updateDoc(doc(db, "libros", id), { leido: true });
await deleteDoc(doc(db, "libros", id));
```

## 3. Índices compuestos

Firestore indexa cada campo automáticamente, pero una consulta que combina `where` en un campo y `orderBy` en otro necesita un **índice compuesto**. Lo declaramos como código en `firestore.indexes.json` para que se despliegue solo:

```json
{
  "indexes": [{
    "collectionGroup": "libros",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "genero", "order": "ASCENDING" },
      { "fieldPath": "creadoEn", "order": "DESCENDING" }
    ]
  }]
}
```

## 4. Reglas de seguridad (validación en el servidor)

Como el cliente escribe directamente en la base de datos, **nunca** dejamos las reglas abiertas sin validar. `firestore.rules` comprueba tipos, longitudes y campos permitidos:

```
match /libros/{id} {
  function libroValido(d) {
    return d.keys().hasOnly(['titulo','autor','genero','anio','leido','creadoEn'])
      && d.titulo is string && d.titulo.size() > 0 && d.titulo.size() <= 120
      && d.autor is string && d.autor.size() > 0 && d.autor.size() <= 80
      && d.anio is int && d.anio >= 1000 && d.anio <= 2100
      && d.leido is bool;
  }
  allow read: if true;
  allow create: if libroValido(request.resource.data)
                && request.resource.data.creadoEn == request.time;
  allow update: if request.resource.data.diff(resource.data)
                     .affectedKeys().hasOnly(['leido']);
  allow delete: if true;
}
```

Si alguien intenta guardar un año como texto o un campo extra desde la consola del navegador, Firestore responde `PERMISSION_DENIED`.

## 5. Probar en local con el emulador

Firebase incluye emuladores, así que se puede desarrollar sin tocar la nube:

```bash
npm install -g firebase-tools
npm test
firebase emulators:start --project demo-biblioteca
```

La app queda en `http://localhost:5000` y la UI del emulador en `http://localhost:4000`, donde se ven los documentos creados.

## 6. Despliegue automático con GitHub Actions

### Preparar Firebase

1. Crear un proyecto en la [consola de Firebase](https://console.firebase.google.com).
2. **Firestore Database → Crear base de datos** (modo producción).
3. En Google Cloud → **IAM → Cuentas de servicio**, crear una cuenta con rol **Firebase Admin** y descargar su clave JSON.

### Configurar GitHub

En el repositorio → *Settings → Secrets and variables → Actions*:

- **Secret** `FIREBASE_SERVICE_ACCOUNT`: el JSON de la cuenta de servicio.
- **Variable** `FIREBASE_PROJECT_ID`: el ID del proyecto.

### El workflow

Versión resumida de [`.github/workflows/deploy.yml`](https://github.com/saulalvarado1/NoSQL-App-development/blob/main/.github/workflows/deploy.yml) (la del repo además valida los secretos y muestra los errores de Firebase en el resumen de la ejecución):

```yaml
name: CI/CD · Despliegue en Firebase
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22 }
      - run: npm test
  deploy:
    needs: test
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22 }
      - run: npm install -g firebase-tools
      - run: printf '%s' "$SA" > "$RUNNER_TEMP/sa.json"
        env: { SA: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}" }
      - run: firebase deploy --only hosting,firestore --project "${{ vars.FIREBASE_PROJECT_ID }}" --non-interactive --force
        env: { GOOGLE_APPLICATION_CREDENTIALS: "${{ runner.temp }}/sa.json" }
```

En cada `push` a `main`:

1. Se ejecutan las pruebas unitarias.
2. Si pasan, se despliegan **a la vez** el frontend (Hosting), las **reglas** y los **índices** de Firestore.

En cada *pull request* solo corren los tests, así nada roto llega a producción.

## Resultado

La app queda pública en https://biblioteca-nosql-upt.web.app. Abriéndola en dos navegadores se ve cómo un libro agregado en uno aparece al instante en el otro gracias a `onSnapshot`.

<!-- Inserta aquí capturas: la app, la consola de Firestore con los documentos y la ejecución del workflow en GitHub Actions. -->

## Problemas que encontramos (y cómo los resolvimos)

- **"Seleccionar recurso superior" al crear el proyecto:** pasa con cuentas institucionales, que pertenecen a una organización y suelen bloquear la creación de claves. Usamos una cuenta de Gmail personal.
- **Firebase exige verificación en 2 pasos (MFA):** tras activarla en la cuenta de Google hay que cerrar sesión y volver a entrar para que la consola la reconozca.
- **`Failed to authenticate` en GitHub Actions:** el secreto no contenía el JSON completo de la cuenta de servicio. Añadimos un paso que valida el JSON antes de desplegar.
- **"The query requires an index… currently building":** el índice compuesto tarda unos minutos en construirse después del primer despliegue; luego el filtro por género funciona.

## Conclusiones

- Firestore permite tener una base de datos NoSQL en la nube **sin servidor propio** y con tiempo real incluido.
- Las **Security Rules** son obligatorias cuando el cliente escribe directo en la base de datos: son nuestra validación del lado servidor.
- Declarar **reglas e índices como código** y desplegarlos con **GitHub Actions** hace que el entorno sea reproducible y que cada cambio llegue a producción en minutos.

**Autores:** `<Integrantes del grupo>` — Base de Datos II, Universidad Privada de Tacna.
