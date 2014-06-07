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

var getCountryId = function(playersCountry, actualCountry, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.id FROM countries c WHERE c.name LIKE ?";
		var query = con.query(selectQuery, [actualCountry], function(err, result, fields)
		{
			con.release();
			callback(playersCountry, actualCountry, result[0] == null ? null : result[0].id);
		});
	});
}

var getCountryIdSingleArg = function(countryName, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.id FROM countries c WHERE c.name LIKE ?";
		var query = con.query(selectQuery, [countryName], function(err, result, fields)
		{
			con.release();
			callback(result[0] == null ? null : result[0].id);
		});
	});
}

var getCountryMatchup = function(awayTeam, homeTeam, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.id FROM countries c WHERE c.name LIKE ?";
		var query = con.query(selectQuery, [awayTeam], function(err, result, fields)
		{
			var query = con.query(selectQuery, [homeTeam], function(err, result2, fields)
			{
				con.release();
				callback(result[0] == null ? null : result[0].id, result2[0] == null ? null : result2[0].id);
			});
		});
	});
}

var createPlayer = function(player, countryId)
{
	pool.getConnection(function(connError, con)
	{
		var playerObject = {name: player, country_id: countryId};
		var insertQuery = "INSERT INTO players SET ?";
		var query = con.query(insertQuery, playerObject, function(err, result, fields)
		{
			if(err)
			{
				console.log("Failed to create a player for " + player + ". " + err);
			}
			else
			{
				console.log("Insert player successful.");
			}
		});
		con.release();
	});
}

var createMatchup = function(homeTeam, awayTeam)
{
	pool.getConnection(function(connError, con)
	{
		var matchupObject = {home_team_id: homeTeam, away_team_id: awayTeam};
		var insertQuery = "INSERT INTO matchups SET ?";
		var query = con.query(insertQuery, matchupObject, function(err, result, fields)
		{
			if(err)
			{
				console.log("Failed to create a matchup for " + homeTeam + " - " + awayTeam + "; " + err);
			}
			else
			{
				console.log("Insert matchup successful.");
			}
		});
		con.release();
	});
}

var populatePlayers = function()
{
	pool.getConnection(function(connError, con)
	{
		var file = __dirname + '/../files/players2014.json';
		fs.readFile(file, 'utf8', function (err, data)
		{
			if (err) throw err
			data = JSON.parse(data);

			var teamName;
			var actualTeam;
			for(var team in data)
			{
				// The players list isn't 100% consistant with our information provider.
				actualTeam = team;
				actualTeam = team === 'Bosnia-Herzegovina' ? 'Bosnia and Herzegovina' : actualTeam;
				actualTeam = team === 'Deutschland' ? 'Germany' : actualTeam;
				actualTeam = team === 'USA' ? 'United States' : actualTeam;

			    getCountryId(team, actualTeam, function(originalTeam, fixedTeam, countryId)
			    {
					for(var player in data[originalTeam])
					{
						if(data[originalTeam][player] !== '')
						{
							createPlayer(data[originalTeam][player], countryId);
						}
					}
			    });
			}
		});
	});
}

var populateMatchups = function()
{
	pool.getConnection(function(connError, con)
	{
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
							getCountryMatchup(data.results[group][game].hometeam.text, data.results[group][game].awayteam.text, function(a, b)
							{
								console.log(a + " vs " + b);
								createMatchup(a, b);
							});
						}
					}
				}
			}
		});
	});
}

module.exports.populatePlayers = populatePlayers;
module.exports.populateMatchups = populateMatchups;