const db = require('../config/database');

const createUser = async (user) => {
    const { userId, firstName, lastName, email, password, phone } = user;
    const query = `
    INSERT INTO users (userId, firstName, lastName, email, password, phone)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

    const values = [userId, firstName, lastName, email, password, phone];
    const res = await db.query(query, values);
    return res.rows[0];
}

const createOrganisation = async (org) => {
    const { orgId, name, description } = org;
    const query = `
    INSERT INTO organisations (orgId, name, description)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

    const values = [orgId, name, description];
    const res = await db.query(query, values);
    return res.rows[0];
}

const addUserToOrganisation = async (userId, orgId) => {
    const query = `
    INSERT INTO user_organisations (userId, orgId)
    VALUES ($1, $2);
  `;
    const values = [userId, orgId];
    await db.query(query, values);
}

const findUserByEmail = async (email) => {
    const res = await db.query(`SELECT * FROM users WHERE email = $1;`, [email]);
    return res.rows[0];
};


module.exports = {
    createUser,
    createOrganisation,
    addUserToOrganisation,
    findUserByEmail
};