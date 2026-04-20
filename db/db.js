import pg from 'pg'; //postgres

import dotenv from 'dotenv'; //import dotenv to load env variables
dotenv.config(); //load env variables from .env file

const { Pool } = pg; //pool for multiple database connections

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool; 