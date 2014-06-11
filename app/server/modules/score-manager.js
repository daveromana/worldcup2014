var mysql = require('mysql');
var fs = require('fs');
var serverFunctions = require('./server-functions');
var dbpopulation = require('./db-population');

var dbConfig =
{
	host: serverFunctions.getInternalIp(),
	user: 'root',
	password: '',
	database: 'hm',
	port: 3306
};

var pool = mysql.createPool(dbConfig);

var score;

var getActualMatchups = function(callback)
{
	var matchups = [];
	var file = __dirname + '/../files/results2014.json';
	fs.readFile(file, 'utf8', function (err, data)
	{
		if (err) throw err
		data = JSON.parse(data);

		for (var group in data.results)
		{
			for (var game in data.results[group])
			{
				if(parseInt(data.results[group][game].hometeam.length) != 0)
				{
					if((parseInt(data.results[group][game].awayteam.length) != 0))
					{
						dbpopulation.getCountryMatchup(data.results[group][game].hometeam.text, data.results[group][game].awayteam.text, function(a, b)
						{
							getMatchupId(a, b, function(matchupId)
							{
								matchups.push({matchupId: matchupId, scoreline: data.results[group][game].scoreline});
							});
						});
					}
				}
			}
		}
		setTimeout(function(){callback(matchups);}, 1000);
	});
}

var getMatchupId = function(home_team, away_team, callback)
{
	home_team = parseInt(home_team) || -1;
	away_team = parseInt(away_team) || -1;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = 'SELECT m.id FROM matchups m WHERE m.home_team_id = ? AND m.away_team_id = ?';
		var query = con.query(selectQuery, [home_team, away_team], function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result[0] == null ? null : result[0].id);
		});
	});
}

var getUserMatchups = function(callback)
{
	var matchups = [];
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT CONCAT(g.home_goals, '–', g.away_goals) AS 'scoreline', g.user_id, g.matchup_id, g.scorer_id, g.home_goals, g.away_goals FROM guesses g";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var updateUserScores = function()
{
	getActualMatchups(function(matchups)
	{
		//console.log(matchups);
	});
	getUserMatchups(function(userMatchups)
	{
		console.log(userMatchups);
	});
}

module.exports.updateUserScores = updateUserScores;