'use strict';

const user = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const randomstring = require("randomstring");
const config = require('../../config/config.json');


const INVALID_OLD_PASSWORD ='Invalid Old Password';
const PASSWORD_UPDATED_OK ='Password Updated Sucessfully' ;
const INTERNAL_SERVER_ERROR ='Internal Server Error';
const USER_NOT_FOUND ='User Not Found on reset-Password';
const RESET_PASSWORD_OK = 'Check your email to get the intructions';
const TIMEOUT = 'Time Out ! Try again';
const INVALID_TOKEN = 'The token is invalid';



exports.changePassword = (email, password, newPassword) =>
	new Promise((resolve, reject) => {
		user.find({ email: email }).then(users => {
			let user = users[0];
			if (bcrypt.compareSync(password, user.hashed_password)) {
				const salt = bcrypt.genSaltSync(10);
				const hash = bcrypt.hashSync(newPassword, salt);
				user.hashed_password = hash;
				return user.save();
			} else {
				reject({ status: 401, message: INVALID_OLD_PASSWORD });
			}
		})
		.then(user => resolve({ status: 200, message: PASSWORD_UPDATED_OK }))
		.catch(err => reject({ status: 500, message: INTERNAL_SERVER_ERROR}));

	});

exports.resetPasswordInit = email =>
	new Promise((resolve, reject) => {
		const random = randomstring.generate(8);

		user.find({ email: email }).then(users => {

			if (users.length == 0) {
				reject({ status: 404, message: USER_NOT_FOUND});
			} else {
				let user = users[0];
				const salt = bcrypt.genSaltSync(10);
				user.temp_password = bcrypt.hashSync(random, salt);
				user.temp_password_time = new Date();

				return user.save();
			}
		})

		.then(user => {

			const transporter = nodemailer.createTransport(`smtps://${config.email}:${config.password}@smtp.gmail.com`);
			const mailOptions = {
    			from: `"${config.name}" <${config.email}>`,
    			to: email,  
    			subject: 'Reset Password Request ', 
    			html:
                    `Hello ${user.name},<br><br>
    			&nbsp;&nbsp;&nbsp;&nbsp; Your reset password token is <b>${random}</b>. The token is valid for 2 minutes.<br><br>`
			};
			return transporter.sendMail(mailOptions);
		}).then(info => {
			console.log(info);
			resolve({ status: 200, message: RESET_PASSWORD_OK })
		}).catch(err => {
			console.log(err);
			reject({ status: 500, message: INTERNAL_SERVER_ERROR});
		});
	});

exports.resetPasswordFinish = (email, token, password) => 

	new Promise((resolve, reject) => {
		user.find({ email: email }).then(users => {
			let user = users[0];
			const diff = new Date() - new Date(user.temp_password_time); 
			const seconds = Math.floor(diff / 1000);
			console.log(`Seconds : ${seconds}`);

			if (seconds < 120) {
				return user;
			} else {
				reject({ status: 401, message: TIMEOUT});
			}
		})
		.then(user => {
			if (bcrypt.compareSync(token, user.temp_password)) {
				const salt = bcrypt.genSaltSync(10);
				user.hashed_password = bcrypt.hashSync(password, salt);
				user.temp_password = undefined;
				user.temp_password_time = undefined;

				return user.save();

			} else {
				reject({ status: 401, message: INVALID_TOKEN});
			}
		}).then(user => resolve({ status: 200, message: PASSWORD_UPDATED_OK }))
		.catch(err => reject({ status: 500, message: INTERNAL_SERVER_ERROR}));

	});