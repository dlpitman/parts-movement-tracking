Migrations
----------

This folder contains guidance and sample files for applying database schema changes.

Approaches:
- Use a migration tool (recommended): `knex`, `node-pg-migrate`, or the database's native tooling.
- For simple demos, plain SQL files (in this folder) can be applied manually.

Suggested workflow using `knex`:
1. Add `knex` as a dev dependency and `knex` CLI.
2. Edit `knexfile.js` with your environment settings.
3. Create migrations with `npx knex migrate:make init_schema` and implement them in `migrations/`.

Sample SQL file included: `001_init.sql` — can be applied against most SQL DBs (may require minor syntax tweaks).
