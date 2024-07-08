const validateUser = (user) => {
    const errors = [];

    if (!user.firstName) {
        errors.push({ field: 'firstName', message: 'First name is required' });
    }
    if (!user.lastName) {
        errors.push({ field: 'lastName', message: 'Last name is required' });
    }
    if (!user.email) {
        errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!user.password) {
        errors.push({ field: 'password', message: 'Password is required' });
    }

    return errors;
};

module.exports = {
    validateUser,
};