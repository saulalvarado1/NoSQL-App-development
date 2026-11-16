# 📚 Biblioteca NoSQL — Cloud Firestore + Firebase Hosting + GitHub Actions

App web para registrar libros (CRUD en tiempo real) que usa **Cloud Firestore**, una base de datos **NoSQL orientada a documentos**, desplegada en **Firebase Hosting** (Google Cloud) de forma **automática con GitHub Actions** en cada `push` a `main`.

- 🔗 App en producción: `https://<TU_PROYECTO>.web.app`
- 📝 Artículo: `<enlace a Dev.to / Medium / Hashnode>`
- 🎬 Video: `<enlace a YouTube / TikTok>`

## Arquitectura

```
Navegador ──HTTPS──▶ Firebase Hosting (HTML/CSS/JS estático)
    │
    └──── SDK Web de Firebase (WebSocket/gRPC) ───▶ Cloud Firestore
                                                    colección "libros"
GitHub (push a main) ─▶ GitHub Actions: tests ─▶ firebase deploy
                                               (hosting + reglas + índices)
```

| Pieza | Tecnología |
|---|---|
| Base de datos | Cloud Firestore (NoSQL, documentos y colecciones) |
| Frontend | HTML + CSS + JavaScript (módulos ES, sin build) |
| Hosting | Firebase Hosting (plan Spark, gratis) |
| CI/CD | GitHub Actions + Firebase CLI |
| Seguridad | `firestore.rules` (validación del lado servidor) |

### Modelo de datos

Colección `libros`, un documento por libro:

```json
{
  "titulo": "Cien años de soledad",
  "autor": "Gabriel García Márquez",
  "genero": "Novela",
  "anio": 1967,
  "leido": false,
  "creadoEn": "<timestamp del servidor>"
}
```

Índice compuesto (`firestore.indexes.json`): `genero ASC, creadoEn DESC`, necesario para filtrar por género y ordenar por fecha.

## Ejecutar en local (sin cuenta de Google)

Requisitos: Node.js 20+ y Java 21+ (para el emulador de Firestore).

```bash
npm install -g firebase-tools
npm test
npm run dev
```

Abre http://localhost:5000 (app) y http://localhost:4000 (UI del emulador, para ver los documentos).

## Despliegue automático

1. Crea un proyecto en https://console.firebase.google.com y, dentro, **Firestore Database → Crear base de datos** (modo producción, región p. ej. `southamerica-east1`).
2. En Google Cloud Console → **IAM → Cuentas de servicio**, crea una cuenta (p. ej. `github-deploy`) con el rol **Firebase Admin** y descarga una **clave JSON**.
3. En el repositorio de GitHub → **Settings → Secrets and variables → Actions**:
   - Secret `FIREBASE_SERVICE_ACCOUNT` = contenido completo del JSON.
   - Variable `FIREBASE_PROJECT_ID` = ID del proyecto (p. ej. `biblioteca-nosql-upt`).
4. Haz `push` a `main`. El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) ejecuta los tests y luego `firebase deploy --only hosting,firestore`.
5. La app queda publicada en `https://<FIREBASE_PROJECT_ID>.web.app`.

> La configuración web de Firebase no se guarda en el repo: la app la lee de `/__/firebase/init.json`, que Firebase Hosting genera automáticamente.

## Estructura

```
public/            frontend estático (index.html, css/, js/)
tests/             pruebas unitarias (node:test)
firestore.rules    reglas de seguridad y validación
firestore.indexes.json
firebase.json      configuración de Hosting, Firestore y emuladores
.github/workflows/deploy.yml   pipeline CI/CD
```
