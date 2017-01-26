'use strict';

const user = require('../models/user');
const bcrypt = require('bcryptjs');

const USER_REGISTERED_OK ='User Registered Sucessfully';
const USER_ALREADY_REGISTERED ='User Already Registered';
const INTERNAL_SERVER_ERROR ='Internal Server Error';


exports.registerUser = (name, email, password) =>

	new Promise((resolve,reject) => {

		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);

		const newUser = new user({
			name: name,
			email: email,
			hashed_password: hash,
			created_at: new Date()
		});

		newUser.save()
			.then(() => resolve({ status: 201, message:USER_REGISTERED_OK }))

			.catch(err => {
				/**
				 * Remember we decided save just Unique Email( we did the query on the database
				 * **/
				if (err.code == 11000) {
					reject({ status: 409, message: USER_ALREADY_REGISTERED });
				} else {
					reject({ status: 500, message: INTERNAL_SERVER_ERROR });
				}
			});
	});


