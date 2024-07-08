const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, createOrganisation, addUserToOrganisation, findUserByEmail } = require('../models/model');
const { validateUser } = require('../utils/validateUser');
const generateUniqueId = require('../utils/generateUniqueId');
const db = require('../config/database');


const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Validate user input
        const errors = validateUser(req.body);
        if (errors.length > 0) {
            return res.status(422).json({ errors });
        }

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(422).json({
                errors: [
                    { field: 'email', message: 'Email already in use' }
                ]
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            userId: generateUniqueId(),
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone
        }
        await createUser(user)

        // Create Organisation
        const organisation = {
            orgId: generateUniqueId(),
            name: `${firstName}'s Organisation`,
            description: ''
        }
        await createOrganisation(organisation)

        // Associate User with Organisation
        await addUserToOrganisation(user.userId, organisation.orgId);

        // Generate JWT
        const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                accessToken: token,
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            status: 'Bad request',
            message: 'Registration unsuccessful',
            statusCode: 400
        });

    }
}
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate user input
        if (!email || !password) {
            return res.status(422).json({
                errors: [
                    { message: 'Email and Password is required' }
                ]
            });
        }

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                status: 'Bad request',
                message: 'Authentication failed',
                statusCode: 401
            });
        }

        // Check password       
        const isPasswordValid = bcrypt.compareSync(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'Bad request',
                message: 'Authentication failed',
                statusCode: 401
            });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.userid, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                accessToken: token,
                user: {
                    userId: user.userid,
                    firstName: user.firstname,
                    lastName: user.lastname,
                    email: user.email,
                    phone: user.phone
                }
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'Bad request',
            message: 'Login unsuccessful',
            statusCode: 400
        });

    }
}

// Protected route
const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const userResult = await db.query('SELECT * FROM users WHERE userId = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({
                status: "Not found",
                message: "User not found",
                statusCode: 404,
            });
        }

        res.status(200).json({
            status: "success",
            message: "User retrieved successfully",
            data: {
                userId: user.userid,
                firstName: user.firstname,
                lastName: user.lastname,
                email: user.email,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Bad request',
            message: 'Failed to retrieve user',
            statusCode: 400
        });
    }
}

//Get all the organisations the user belongs to or created
const getAllOrganisations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgResult = await db.query(`
            SELECT o.orgId, o.name, o.description
            FROM organisations o
            JOIN user_organisations uo ON o.orgId = uo.orgId
            WHERE uo.userId = $1
          `, [userId]);

        res.status(200).json({
            status: "success",
            message: "Organisations retrieved successfully",
            data: {
                organisations: orgResult.rows,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Bad request',
            message: 'Failed to retrieve organisations',
            statusCode: 400
        });
    }
}

//Get Single Organisation function
const getOrganisation = async (req, res) => {
    try {
        const orgId = req.params.orgId;
        const orgResult = await db.query('SELECT * FROM organisations WHERE orgId = $1', [orgId]);
        const organisation = orgResult.rows[0];

        if (!organisation) {
            return res.status(404).json({
                status: "Not found",
                message: "Organisation not found",
                statusCode: 404,
            });
        }

        res.status(200).json({
            status: "success",
            message: "Organisation retrieved successfully",
            data: {
                orgId: organisation.orgid,
                name: organisation.name,
                description: organisation.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Bad request',
            message: 'Failed to retrieve organisation',
            statusCode: 400
        });
    }
}

// function for user to create a new organisation
const createNewOrganisation = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(422).json({
                errors: [
                    { field: 'name', message: 'Name is required' }
                ]
            });
        }

        const organisation = {
            orgId: generateUniqueId(),
            name: `${name}'s Organisation`,
            description
        };
        await createOrganisation(organisation);
        await addUserToOrganisation(req.user.userId, organisation.orgId);

        res.status(201).json({
            status: 'success',
            message: 'Organisation created successfully',
            data: {
                orgId: organisation.orgId,
                name: organisation.name,
                description: organisation.description
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Bad request',
            message: 'Client error',
            statusCode: 400
        });
    }
}
// function to add a user to an organisation
const addUserToNewOrganisation = async (req, res) => {
    try {
        const { userId } = req.body;
        const orgId = req.params.orgId;
        if (!userId) {
            return res.status(422).json({
                errors: [
                    { field: 'userId', message: 'User ID is required' }
                ]
            });
        }
        await addUserToOrganisation(userId, orgId);

        res.status(201).json({
            status: 'success',
            message: 'User added to organisation successfully',
            data: {
                userId,
                orgId
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 'Bad request',
            message: 'Failed to add user to organisation',
            statusCode: 400
        });
    }
}
module.exports = {
    register,
    login,
    getUserDetails,
    getAllOrganisations,
    getOrganisation,
    createNewOrganisation,
    addUserToNewOrganisation
};