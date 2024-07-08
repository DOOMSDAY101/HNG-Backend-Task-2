const db = require('../config/database')

const createTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(255) PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(255)
    );
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS organisations (
          orgId VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description VARCHAR
        );
      `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS user_organisations (
          userId VARCHAR(255) REFERENCES users(userId),
          orgId VARCHAR(255) REFERENCES organisations(orgId),
          PRIMARY KEY (userId, orgId)
        );
      `);
}

createTables().then(()=>{
    console.log('Tables created successfully')
}).catch((err) => console.error('Error creating tables:', err))