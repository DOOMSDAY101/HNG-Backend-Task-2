const request = require('supertest');
const { app } = require('../index')
const { Client } = require('pg');
require('dotenv').config();

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

describe('Auth Endpoints', () => {
    let server;
    beforeAll(async () => {
        await client.connect();
        await client.query('CREATE TABLE IF NOT EXISTS users (userId VARCHAR(255) PRIMARY KEY, firstName VARCHAR(255), lastName VARCHAR(255), email VARCHAR(255) UNIQUE, password VARCHAR(255), phone VARCHAR(255))');
        await client.query('CREATE TABLE IF NOT EXISTS organisations (orgId VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description VARCHAR(255))');
        await client.query('CREATE TABLE IF NOT EXISTS user_organisations (userId VARCHAR(255), orgId VARCHAR(255), PRIMARY KEY(userId, orgId))');
        server = app.listen(4000);
    });

    afterAll(async () => {
        await client.query('DROP TABLE IF EXISTS user_organisations');
        await client.query('DROP TABLE IF EXISTS users');
        await client.query('DROP TABLE IF EXISTS organisations');
        await client.end();
        server.close();
    });

    describe('POST /auth/register', () => {
        it('should register user successfully with default organisation', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'password123',
                    phone: '1234567890'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body).toHaveProperty('message', 'Registration successful');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data.user).toHaveProperty('userId');
            expect(res.body.data.user).toHaveProperty('firstName', 'John');
            expect(res.body.data.user).toHaveProperty('lastName', 'Doe');
            expect(res.body.data.user).toHaveProperty('email', 'john.doe@example.com');
        });

        it('should fail if required fields are missing', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    lastName: 'Doe',
                    email: 'jane.doe@example.com',
                });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'firstName', message: 'First name is required' }),
                    expect.objectContaining({ field: 'password', message: 'Password is required' })
                ])
            );
        });

        it('should fail if there is a duplicate email', async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane.doe@example.com',
                    password: 'password123',
                    phone: '1234567890'
                });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane.doe@example.com',
                    password: 'password123',
                    phone: '1234567890'
                });
            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'email', message: 'Email already in use' })
                ])
            );
        });
    });

    describe('POST /auth/login', () => {
        it('should log the user in successfully', async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Sam',
                    lastName: 'Smith',
                    email: 'sam.smith@example.com',
                    password: 'password123',
                    phone: '1234567890'
                });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'sam.smith@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body).toHaveProperty('message', 'Login successful');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data.user).toHaveProperty('userId');
            expect(res.body.data.user).toHaveProperty('firstName', 'Sam');
            expect(res.body.data.user).toHaveProperty('lastName', 'Smith');
            expect(res.body.data.user).toHaveProperty('email', 'sam.smith@example.com');
        });
        it('should fail if required fields are missing', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'missing@example.com',
                });
            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: 'Email and Password is required' })
                ])
            );
        });

        it('should fail if authentication fails', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'wrong.email@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('status', 'Bad request');
            expect(res.body).toHaveProperty('message', 'Authentication failed');
        });
    });
});
