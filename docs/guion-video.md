# Guion del video (máx. 5 minutos)

Grabar pantalla con OBS Studio o la Grabación de pantalla de Windows (Win + Alt + R). Subir a YouTube como **Público** o **No listado**.

| Tiempo | Qué se muestra en pantalla | Qué se dice |
|---|---|---|
| 0:00–0:20 | Portada / la app abierta | "Hola, somos el grupo ___. Vamos a construir y desplegar una app con Cloud Firestore, una base de datos NoSQL de Google, usando despliegue automático con GitHub Actions." |
| 0:20–0:50 | Diagrama del README | Arquitectura: navegador → Firebase Hosting → Firestore; GitHub → Actions → deploy. |
| 0:50–1:40 | VS Code: `public/js/app.js` | Conexión con `init.json`, `addDoc`, la consulta con `where` + `orderBy`, y `onSnapshot` para el tiempo real. |
| 1:40–2:20 | `firestore.rules` y `firestore.indexes.json` | La validación en el servidor y por qué hace falta el índice compuesto. |
| 2:20–3:20 | `.github/workflows/deploy.yml`, luego un cambio pequeño (p. ej. el texto del footer), `git commit` y `git push` | Mostrar la pestaña **Actions**: job de tests y luego job de deploy en verde. |
| 3:20–4:20 | La URL `https://<proyecto>.web.app` en dos ventanas, lado a lado | Agregar un libro en una ventana y verlo aparecer en la otra; filtrar por género; marcar como leído; eliminar. Mostrar los documentos en la consola de Firestore. |
| 4:20–4:50 | El artículo publicado y el repositorio | Enlaces al repositorio y al artículo. Despedida. |
