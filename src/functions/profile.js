'use strict';

const user = require('../models/user');

const INTERNAL_SERVER_ERROR ='Internal Server Error';

/**
 *Bring the Name,email and created-date
 **/
exports.getProfile = email =>
	new Promise((resolve,reject) => {
		user.find({ email: email }, { name: 1, email: 1, created_at: 1, _id: 0 })
		.then(users => resolve(users[0]))
		.catch(err => reject({ status: 500, message:INTERNAL_SERVER_ERROR }))
	});