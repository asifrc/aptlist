
/**
* User Model
* -----------
* Contains User schema for Mongoose,
* CRUD interface to mongoDB
*
* Instantiated with a constructor,
*  - takes mongoose as parameter
*/

var crypto = require('crypto');

//Export Constructor
module.exports = function(mongoose) {

	/**
	* User Schema and Model
	*/

	//User Schema
	var schema = new mongoose.Schema({
		username: String,
		email: String,
		password: String,
		TS: Date
	});

	//User Model
	var User = mongoose.model('User', schema);

	//Export Model
	this.model = User;

	//JSON response object
	var Resp = function(obj) {
		this.error = null;
		this.data = (typeof obj === "object") ? obj : null;
	};

	var respond = function(ret, cb) {
		if (typeof cb === "function")
		{
			cb(ret);
		}
		return ret;
	};
	
	/**
	* Encrypt a password
	*/
	var hashPW = function(pw) {
		var pwhash = crypto.createHash('md5');
		pwhash.update(pw);
		return pwhash.digest('hex');
	};
	this.hashPW = hashPW;
	
	/**
	* Register User (Save to Database)
	*/
	this.register = function(postData, cb) {
		//JSON response object
		var resp = new Resp();

		//Check for required fields

		var reqFields = [
			'username',
			'email',
			'password'
		];
		var optFields = [];

		var userObj = {};
		//Add all required fields to userObj, return error if missing
		for (var i=0; i<reqFields.length; i++)
		{
			var field = reqFields[i];
			if (typeof postData[field] === "undefined")
			{
				resp.error = "Bad request: "+field+" field is missing";
				return respond(resp, cb);
			}
			userObj[field] = postData[field];
		}
		//Add all optional fields if they exist
		/*for (var i=0; i<optFields.length; i++)
		{
			var field = optFields[i];
			if (typeof postData[field] !== "undefined")
			{
				userObj[field] = postData[field];
			}
		}*/

		//Check for matching passwords and encrypt on success
		if (typeof postData.cpassword !== "undefined")
		{
			if (userObj.password==postData.cpassword)
			{
				if (userObj.password.length>0)
				{
					//On successful match, encrypt password
					userObj.password = hashPW(userObj.password);
				}
				else
				{
					resp.error = "Password cannot be blank";
					return respond(resp, cb);
				}
			}
			else
			{
				resp.error = "Passwords do not match";
				return respond(resp, cb);
			}
		}
		else
		{
			resp.error = "Password must be confirmed";
			return respond(resp, cb);
		}

		//Create user object from model
		var user = new User(userObj);

		//Save to database
		user.save(function(err) {
			resp.error = err;
			//Return User Object
			resp = new Resp({ "users": [ user ] });
			return respond(resp, cb);
		});
	};

	/**
	* Retrieve Users by Criteria
	*/
	var findUser = function(criteria, cb) {
		var resp = new Resp({ users: [] });

		if (typeof criteria.password === "string")
		{
			var pwhash = crypto.createHash('md5');
			pwhash.update(criteria.password);
			criteria.password = pwhash.digest('hex');
		}

		User.find(criteria, function(err, data) {
			resp = new Resp({ users: data });
			resp.error = err;
			return respond(resp,cb);
		});
	};
	this.find = findUser;

	/**
	* Find a Single User
	*/
	var findById = function(criteria, cb, handler) {
		var resp = new Resp();
		if (typeof criteria._id !== "string")
		{
			resp.error = "Invalid format - userID is invalid";
			return handler(resp);
		}
		findUser({_id: criteria._id}, function(response) {
			if (response.error)
			{
				return handler(response);
			}
			if (response.data.users.length != 1)
			{
				resp.error = "The user id return an invalid number of users("+response.data.users.length+")";
				return handler(resp);
			}
			handler(response);
		});
	};

	/**
	* Update User by ID
	*/
	this.update = function(criteria, cb) {
		var resp = new Resp();
		findById(criteria, cb, function(response) {
			if (response.error)
			{
				return respond(response, cb);
			}
			user = response.data.users[0];
			for (var field in criteria)
			{
				user[field] = criteria[field];
			}
			user.save(function(err, usr) {
				resp = new Resp({users: [usr] });
				resp.error = err;
				return respond(resp, cb);
			});
		});
	};

	/**
	* Remove User by ID
	*/
	this.remove = function(criteria, cb) {
		var resp = new Resp();
		findById(criteria, cb, function(response) {
			if (response.error)
			{
				return respond(response, cb);
			}
			response.data.users[0].remove(function(err) {
				resp.error = err;
				return respond(resp, cb);
			});
		});
	};
	return this;
};