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

var CreateLeague = function (name, user, callback)
{
	if(name == '')
	{
		console.log('League name must not be empty for creation.')
		callback(null);
	}
	else
	{
		var userId = user._id;
		pool.getConnection(function(connError, con)
		{	
			Randomstring(function(code)
			{
				var league = {name: name, code: code, owner_id: userId};
				var insertQuery = "INSERT INTO leagues SET ?";
				var query = con.query(insertQuery, league, function(err, result, fields)
				{
					con.release();
					if(err)
					{
						console.log(err);
						callback(null); 
					}
					else
					{
						console.log("inserted league successfully");
						callback(code);
					}
				});	
			});
		});
	}
}

var ParticipateInLeague = function(user,code,callback)
{
	var userId = user._id
	var messages = {success: true, message: ''}
	FetchLeagueId(code,function(id)
	{
		console.log("leagueid is " + id);
		pool.getConnection(function(connError, con)
		{	
			var participation = {league_id: id, user_id: userId};
			var insertQuery = "INSERT INTO league_participation SET ?";
			var query = con.query(insertQuery, participation, function(err, result, fields)
			{
				con.release();
				if(err)
				{
					console.log(err);
					messages.success = false;
					messages.message = 'Failed to join a league. Make sure the league-code is valid.';
					callback(messages); 
				}
				else
				{
					console.log("participation success");
					messages.message = 'Successfully joined a league!';
					callback(messages);
				}
			});	
		});
	});
}

var Randomstring = function(callback)
{
	var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 24; i++ )
        code += possible.charAt(Math.floor(Math.random() * possible.length));
	callback(code);
}

var FetchLeagueId = function(code, callback)
{
	var selectQuery = "SELECT id FROM leagues WHERE code = ?";
	pool.getConnection(function(connError, con)
	{
		var query = con.query(selectQuery, code, function(err, result, fields)
		{
			con.release();
			if(err)
			{
				console.log(err);
				callback(null); 
			}
			else
			{
				callback(result[0].id);
			}
		});
	});
}

var getLeaguesForUser = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT l.id, l.name, l.code FROM leagues l WHERE l.owner_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getUsersInLeague = function(leagueId, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT lp.user_id, (SELECT s.score FROM scores s WHERE s.user_id = lp.user_id) AS 'score' FROM league_participation lp WHERE lp.league_id = ?";
		var query = con.query(selectQuery, leagueId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getLeagueName = function(leagueId, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT l.league.name FROM leagues l WHERE l.id = ?";
		var query = con.query(selectQuery, leagueId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

module.exports.CreateLeague = CreateLeague;
module.exports.getLeaguesForUser = getLeaguesForUser;
module.exports.ParticipateInLeague = ParticipateInLeague;
module.exports.getLeagueName = getLeagueName;
module.exports.getUsersInLeague = getUsersInLeague;