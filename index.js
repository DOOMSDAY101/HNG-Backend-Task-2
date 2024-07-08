require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { register, login, getUserDetails, getAllOrganisations, getOrganisation, createNewOrganisation, addUserToNewOrganisation } = require('./src/controller');
const { authenticateToken } = require('./middleware/auth')



const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.send("Hello")
})

// Register Endpoint
app.post('/auth/register', register);
// Login Endpoint
app.post('/auth/login', login);

//Protected Routes
//An Endpoint to get a users information through their id
app.get('/api/users/:id', authenticateToken, getUserDetails);

//Protected Routes
//An Endpint to get all the organisations the user belongs to or created
app.get('/api/organisations', authenticateToken, getAllOrganisations);

//Protected Routes
//An Endpoint to get the a single sroganisation 
app.get('/api/organisations/:orgId', authenticateToken, getOrganisation);

//Protected Routes
// An Endpoint that allows a logged in user to create a new organisation
app.post('/api/organisations', authenticateToken, createNewOrganisation);

//Protected Routes
// An Endpoint that allows a user to be added into a particular organisation
app.post('/api/organisations/:orgId/users', authenticateToken, addUserToNewOrganisation);


// Handle 404
app.use((req, res) => {
    res.status(404).json({
        status: 'Not found',
        message: 'Resource not found',
        statusCode: 404
    });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log('Server listening on port ', port);
    });
}

module.exports = app
