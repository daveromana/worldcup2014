var mysql = require('mysql');
var fs = require('fs');
var serverFunctions = require('./server-functions');

var dbConfig =
{
	host: serverFunctions.getInternalIp(),
	user: 'root',
	password: '',
	database: 'hm',
	port: 3306
};

var pool = mysql.createPool(dbConfig);

var handleGuesses = function(user, guesses, callback)
{
	console.log("Heeeyyy");
	console.log(guesses);
	/*
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.id, c.name, c.group_id FROM countries c ORDER BY c.name";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});*/
}

module.exports.handleGuesses = handleGuesses;