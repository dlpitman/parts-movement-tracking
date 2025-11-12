// Minimal knexfile template — install knex and the appropriate client to use
module.exports = {
  development: {
    client: process.env.DB_CLIENT || 'sqlite3',
    connection: process.env.DB_CLIENT === 'sqlite3' ? { filename: process.env.SQLITE_FILE || './data.db' } : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'pass',
      database: process.env.DB_NAME || 'parts_movement'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};
