'use strict';

const user = require('../models/user');
const bcrypt = require('bcryptjs');

const USER_NOT_FOUND ='User Not Found on Login';
const INVALID_CREDENTIALS ='Invalid Credentials on Login';
const INTERNAL_SERVER_ERROR ='Internal Server Error on Login';


exports.loginUser = (email, password) => 

	new Promise((resolve,reject) => {

		user.find({email: email}).then(users => {
			if (users.length == 0) {
				reject({ status: 404, message: USER_NOT_FOUND});
			} else {
				return users[0];
			}
		}).then(user => {
			const hashed_password = user.hashed_password;
			if (bcrypt.compareSync(password, hashed_password)) {
				resolve({ status: 200, message: email });
			} else {
				reject({ status: 401, message: INVALID_CREDENTIALS});
			}
		}).catch(err => reject({ status: 500, message: INTERNAL_SERVER_ERROR}));
	});

	
