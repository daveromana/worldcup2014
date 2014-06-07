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

var getMatchups = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT m.id, m.home_team_id, (SELECT c.name FROM countries c WHERE c.id = m.home_team_id) AS 'home_team', m.away_team_id, (SELECT c.name FROM countries c WHERE c.id = m.away_team_id) AS 'away_team', (SELECT g.name FROM groups g WHERE g.id = (SELECT c.group_id FROM countries c WHERE c.id = m.home_team_id)) AS 'group' FROM matchups m";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getPlayers = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT p.id, p.name, p.country_id FROM players p";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getGroups = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT g.id, g.name FROM groups g";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

module.exports.getMatchups = getMatchups;
module.exports.getPlayers = getPlayers;
module.exports.getGroups = getGroups;