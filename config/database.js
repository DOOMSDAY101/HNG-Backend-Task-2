require('dotenv').config();
const { Client } = require('pg');

const DB_DATABASE = process.env.DB_DATABASE;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT

const client = new Client({
    user: DB_USERNAME,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_DATABASE
});

client.connect().then(() => {
    console.log('Connected to postgresSql database');
})
    .catch(err => {
        console.log('Error connecting to DB', err)
    })

module.exports = {
    query: (text, params) => client.query(text, params),
};