var Mongo, TestCollection;

Mongo = require("meteor/mongo").Mongo;

TestCollection = new Mongo.Collection('test.collection');

module.exports = TestCollection;

// ---
// generated by coffee-script 1.9.2