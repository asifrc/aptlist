
/**
* Test for models/User
*/

var should = require("should");
var assert = require("assert");
var mongoose = require('mongoose');

//Connect to MongoDB
var mongoUrl = "mongodb://localhost/aptlisttests";
mongoose.connect(mongoUrl);
var db = mongoose.connection;

//Require User Module, passing mongoose
var user = require('../models/User')(mongoose);

var reqFields = [
	'username',
	'email',
	'password'
];
var optFields = [];
var allFields = reqFields.concat(optFields);



describe("MongoDB Connection", function() {
	it("should connect to mongo", function(done) {
		db.once('open', done);
	});
});

var newTestUser = function(reg) {
	var testUser = {
		username: "asifrc",
		email: "apthunt@asifchoudhury.com",
		password: "unhashedpassword",
	};
	reg = (typeof reg === "undefined") ? false : reg;
	if (reg)
	{
		testUser.cpassword = testUser.password;
	}
	return testUser;
};

var emptyUsers = function(done) {
	user.model.remove({}, function(err) {
		done(err);
	});
};

describe("User Model", function() {
	var bob, bobby;

	beforeEach(function(done) {
		emptyUsers(function() {
			bob = newTestUser();
			done();
		});	
	});

	//afterEach(function(done) { emptyUsers(done); });

	it("should create a User object", function() {
		bobby = new user.model(bob);
		bobby.should.be.an.instanceOf(user.model);
	});

	describe("Registration", function() {

		beforeEach(function() {
			bob = newTestUser(true);
		});

		it("should return the user when there are no errors", function(done) {
			user.register(bob, function(resp) {
				should.not.exist(resp.error);
				(typeof resp.data.users.length).should.equal("number");
				resp.data.users.length.should.equal(1);
				resp.data.users[0].username.should.equal(bob.username);
				done();
			});
		});

		describe("Required Fields", function() {
			for (var i=0; i<reqFields.length; i++)
			{
				var field = reqFields[i];
				it("should save "+field, function(done) {
					this.timeout(200000);
					var testValue = "TestValue";
					var finalValue = (field === "password") ? user.hashPW(testValue) : testValue;
					bob[field] = testValue;
					bob.cpassword = bob.password;
					user.register(bob, function(resp) {
						should.not.exist(resp.error);
						resp.data.users.length.should.equal(1);
						resp.data.users[0][field].should.equal(finalValue);
						done();
					});
				});
			}
		});

		describe("Missing Required Field", function() {
			for (var i=0; i<reqFields.length; i++)
			{
				var field = reqFields[i];
				it("should return an error when "+field+" is missing", function(done) {
					delete bob[field];
					user.register(bob, function(resp) {
						resp.error.should.equal("Bad request: "+field+" field is missing");
						done();
					});
				});
			}
		});

		/*
		describe("Empty String in Required Field", function() {
			for (var i=0; i<reqFields.length; i++)
			{
				var field = reqFields[i];
				it("should return an error when "+field+" is missing", function(done) {
					bob = newTestUser();
					bob[field] = "";
					user.register(bob, function(resp) {
						resp.error.should.equal("Bad request: "+field+" field is missing");
						done();
					});
				});
			}
		});
		*/

		describe("Optional Fields", function() {
			for (var i=0; i<optFields.length; i++)
			{
				var field = optFields[i];
				it("should save "+field, function(done) {
					bob[field] = "TestValue";
					user.register(bob, function(resp) {
						should.not.exist(resp.error);
						var obj = {};
						obj[field] = "TestValue"
						user.model.count(obj, function(err, count) {
							count.should.equal(1);
							done();
						});
					});
				});
			}
		});

		describe("Missing Optional Field", function() {
			for (var i=0; i<reqFields.length; i++)
			{
				var field = reqFields[i];
				it("should still save successfully when "+field+" is missing", function(done) {
					delete bob[field];
					user.register(bob, function(resp) {
						resp.error.should.equal("Bad request: "+field+" field is missing");
						done();
					});
				});
			}
		});

		describe("Invalid Password", function() {
			it("should return an error when confirmation field is missing", function(done) {
				delete bob.cpassword;
				user.register(bob, function(resp) {
					resp.error.should.equal("Password must be confirmed");
					done();
				});
			});
			it("should return an error on mismatch", function(done) {
				bob.cpassword = "mismatch";
				user.register(bob, function(resp) {
					resp.error.should.equal("Passwords do not match");
					done();
				});
			});
			it("should return an error when blank", function(done) {
				bob.password = "";
				bob.cpassword = "";
				user.register(bob, function(resp) {
					resp.error.should.equal("Password cannot be blank");
					done();
				});
			});
		});

		describe("No Callback", function() {
			it("should not throw any errors", function() {
				(user.register(bob) || true).should.be.ok;
			});
		});

	});

	describe("Find", function() {
		var james = newTestUser();
		james.username = "James";

		before(emptyUsers);

		beforeEach(function(done) {
			bob.cpassword = bob.password;
			james.cpassword = james.password;
			user.register(bob, function(resp) {
				user.register(james);
				delete bob.cpassword;
				delete james.cpassword;
				done();
			});
		});

		afterEach(emptyUsers);

		describe("No Criteria", function() {

			it("should not throw any errors when no parameters are passed", function() {
				should(function() { user.find(bob); }).not.throw();
			});

			it("should return all users when empty object is passed", function(done) {
				user.find({}, function(resp) {
					should.not.exist(resp.error);
					resp.data.users.length.should.equal(2);
					done();
				});
			});
		});

		describe("Single Criterion", function() {

			it("should return one user when sent one criterion matching one record", function(done) {
				user.find({ username: bob.username}, function(resp) {
					should.not.exist(resp.error);
					resp.data.users.length.should.equal(1);
					resp.data.users[0].username.should.equal(bob.username);
					done();
				});
			});
			
		});

		describe("Multiple Criteria", function() {

			it("should return one user when sent criteria matching one record", function(done) {
				user.find({ username: bob.username, email: bob.email}, function(resp) {
					should.not.exist(resp.error);
					resp.data.users.length.should.equal(1);
					resp.data.users[0].username.should.equal(bob.username);
					resp.data.users[0].email.should.equal(bob.email);
					done();
				});
			});

			it("should return one user with a user passed as the criteria", function(done) {
				user.find(bob, function(resp) {
					should.not.exist(resp.error);
					resp.data.users.length.should.equal(1);
					resp.data.users[0].username.should.equal(bob.username);
					done();
				});
			});
		});

	});

	describe("Update", function() {

		var john = newTestUser();

		before(emptyUsers);

		beforeEach(function(done) {
			john = newTestUser();
			john.username = "notasifrc";
			john.email = "apthunt-test@asifchoudhury.com";
			john.cpassword = john.password;
			user.register(bob, function(resp) {
				user.register(john, function(resp2) {
					delete john.cpassword;
					done();
				});
			});
		});

		//afterEach(emptyUsers);

		it("should return an error if userID property is missing", function(done) {
			user.update({}, function(resp) {
				resp.error.should.equal("Invalid format - userID is invalid");
				done();
			});
		});

		it("should return an error if userID is invalid", function(done) {
			user.update({ _id: "1234" }, function(resp) {
				resp.error.name.should.equal("CastError");
				done();
			});
		});

		it("should return an error if userID not found", function(done) {
			user.update({ _id: "52d47b2c41534264425c6e16" }, function(resp) {
				resp.error.should.equal("The user id return an invalid number of users(0)");
				done();
			});
		});

		it("should update the database with the user data passed", function(done) {
			user.find(john, function(findResp) {
				john._id = findResp.data.users[0].id;
				john.username = "updatedname";
				john.email = "updatedemail@asifchoudhury.com";

				user.update(john, function(updateResp) {
					should.not.exist(updateResp.error);

					var match = true;
					for (var field in john)
					{
						match = match && (updateResp.data.users[0][field]==john[field]);
					}
					match.should.be.ok;

					user.find({_id: john._id}, function(resp) {
						resp.data.users.length.should.equal(1);
						match = true;
						for (var field in john)
						{
							match = match && (resp.data.users[0][field]==john[field]);
						}
						match.should.be.ok;
						done();
					});
				});
			});
		});

	});

	describe("Remove", function() {

		var john = newTestUser();

		before(function(done) { emptyUsers(done); });

		beforeEach(function(done) {
			john = newTestUser();
			john.username = "notasifrc";
			john.email = "apthunt-test@asifchoudhury.com";
			john.cpassword = john.password;
			user.register(bob, function(resp) {
				user.register(john, function(resp2) {
					delete john.cpassword;
					done();
				});
			});
		});

		it("should return an error if userID property is missing", function(done) {
			user.remove({}, function(resp) {
				resp.error.should.equal("Invalid format - userID is invalid");
				done();
			});
		});

		it("should return an error if userID is invalid", function(done) {
			user.remove({ _id: "1234" }, function(resp) {
				resp.error.name.should.equal("CastError");
				done();
			});
		});

		it("should return an error if userID not found", function(done) {
			user.remove({ _id: "52d47b2c41534264425c6e16" }, function(resp) {
				resp.error.should.equal("The user id return an invalid number of users(0)");
				done();
			});
		});

		it("should remove the user when valid userID is provided", function(done) {
			user.find(john, function(findResp) {
				john._id = findResp.data.users[0].id;

				user.remove({_id: john._id}, function(resp) {
					should.not.exist(resp.error);
					user.model.count({}, function(err, count) {
						count.should.equal(0);
						done();
					});
				});
			});
		});

		it("should remove the user when a user is provided", function(done) {
			user.find(john, function(findResp) {
				john._id = findResp.data.users[0].id;

				user.remove(john, function(resp) {
					should.not.exist(resp.error);
					user.model.count({}, function(err, count) {
						count.should.equal(0);
						done();
					});
				});
			});
		});

	});

});