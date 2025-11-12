# Parts Movement Demo

This workspace contains two static pages and a tiny demo API server so you can run and test the Part Movement Form and an admin view of the movement logs.

Files created:
- `public/form.html` — the Part Movement React form (uses `/api` endpoints)
- `public/jogs.html` — admin page to view/search/download movement logs
- `public/index.html` — simple index linking to both pages
- `server.js` — small Express server exposing `/api/*` endpoints and serving `public/`
- `package.json` — start script and dependencies

Run locally (Node.js required):

1. Install dependencies

```bash
cd /workspaces/codespaces-blank
npm install
```

2. Start the server

```bash
npm start
```

3. Open in your browser:

- `http://localhost:5000/form.html` — fill and submit the form
- `http://localhost:5000/jogs.html` — admin view to see submitted logs and download CSV

Notes:
- This demo uses in-memory storage for logs and sample etchings/submitters — it's suitable for local testing only.
- To integrate with a real backend or persistent DB, replace `server.js` or point the form to your API.
