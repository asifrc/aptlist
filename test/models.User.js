
/**
* Test for models/User
*/

var User = require('../models/User');

var should = require("should");
var assert = require("assert");
	
describe("User Model", function() {
	it("should exist", function() {
		User.should.exist;
	});
});