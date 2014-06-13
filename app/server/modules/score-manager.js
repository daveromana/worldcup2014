var mysql = require('mysql');
var fs = require('fs');
var serverFunctions = require('./server-functions');
var dbpopulation = require('./db-population');
var leaguemanager = require('./league-manager');

var dbConfig =
{
	host: serverFunctions.getInternalIp(),
	user: 'root',
	password: '',
	database: 'hm',
	port: 3306
};

var pool = mysql.createPool(dbConfig);

var updateUserScores = function()
{
	getUserMatchupGuesses(function(userMatchupGuesses)
	{
		for(user in userMatchupGuesses)
		{
			var userId = userMatchupGuesses[user].user_id;
			var score = userMatchupGuesses[user].score;
			insertGuess(userId, score);
		}
	});
}

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
						var homescorers = [];
						for(var homescorer in data.results[group][game].homescorers)
              			{
              				if(data.results[group][game].homescorers[homescorer].text == undefined)
							{
								homescorers.push(data.results[group][game].homescorers.text);
							}
							else
							{
              					homescorers.push(data.results[group][game].homescorers[homescorer].text);
              				}
              			}
              			var awayscorers = []
						for(var awayscorer in data.results[group][game].awayscorers)
              			{
              				if(data.results[group][game].awayscorers[awayscorer].text == undefined)
              				{
              					awayscorers.push(data.results[group][game].awayscorers.text);
              				}
              				else
              				{
              					awayscorers.push(data.results[group][game].awayscorers[awayscorer].text);
              				}
              			}

						dbpopulation.getCountryMatchup(data.results[group][game].hometeam.text, data.results[group][game].awayteam.text, data.results[group][game].scoreline, homescorers, awayscorers, function(a, b, scoreline, homescorers, awayscorers)
						{
							getMatchupId(a, b, function(matchupId)
							{
								matchups.push({matchup_id: matchupId, scoreline: scoreline, homescorers: homescorers, awayscorers: awayscorers});
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
		var selectQuery = "SELECT CONCAT(g.home_goals, '–', g.away_goals) AS 'scoreline', g.user_id, g.matchup_id, g.scorer_id, (SELECT name FROM players p WHERE p.id = g.scorer_id) AS 'scorer_name', g.home_goals, g.away_goals FROM guesses g";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getUserMatchupGuesses = function(callback)
{
	var userMatchupScores = [];
	/* Get the real results */
	getActualMatchups(function(actualMatchups) /* matchups */
	{
		/* Get all users who have made a guess */
		leaguemanager.getAllActiveGuessUser(function(activeUsers)
		{
			/* Get all matchup guesses that users have submitted */
			getUserMatchups(function(userMatchups)
			{
				for(user in activeUsers)
				{
					var userId = activeUsers[user].user_id;
					var scores = {user_id: userId, score: 0};
					for(actualMatchup in actualMatchups)
					{
						var actualMatchupId = actualMatchups[actualMatchup].matchup_id;
						var actualMatchupScoreline = actualMatchups[actualMatchup].scoreline;
						var actualHomeScorers = actualMatchups[actualMatchup].homescorers;
						var actualAwayScorers = actualMatchups[actualMatchup].awayscorers;
						for(userMatchup in userMatchups)
						{
							var userMatchupId = userMatchups[userMatchup].matchup_id;
							var userMatchupUserId = userMatchups[userMatchup].user_id;
							var userMatchupScoreline = userMatchups[userMatchup].scoreline;
							var userMatchupScorerName = userMatchups[userMatchup].scorer_name;
							if(userId == userMatchupUserId)
							{
								if(userMatchupId == actualMatchupId)
								{
									var correctScoreline = userMatchupScoreline == actualMatchupScoreline;
									scores.score = correctScoreline ? scores.score += 3 : scores.score;
									var correctHomeGoals = parseInt(actualMatchupScoreline.split('–')[0]) || null;
									var correctAwayGoals = parseInt(actualMatchupScoreline.split('–')[1]) || null;
									var userMatchupHomeGoals = parseInt(userMatchupScoreline.split('–')[0]) || null;
									var userMatchupAwayGoals = parseInt(userMatchupScoreline.split('–')[1]) || null;
									var noNullGoals = correctHomeGoals != null && correctAwayGoals != null && userMatchupHomeGoals != null && userMatchupAwayGoals != null;
									var correct1times2 = noNullGoals && (( userMatchupHomeGoals > userMatchupAwayGoals && correctHomeGoals > correctAwayGoals ) || ( userMatchupHomeGoals < userMatchupAwayGoals && correctHomeGoals < correctAwayGoals ) || ( userMatchupHomeGoals == userMatchupAwayGoals && correctHomeGoals == correctAwayGoals ));
									scores.score = correct1times2 = correct1times2 ? scores.score += 2 : scores.score;
									var correctHomeScorerGuess = actualHomeScorers.indexOf(userMatchupScorerName) != -1;
									var correctAwayScorerGuess = actualAwayScorers.indexOf(userMatchupScorerName) != -1;
									if(correctHomeScorerGuess || correctAwayScorerGuess)
									{
										scores.score += 2;
									}
								}
							}
						}
					}
					userMatchupScores.push(scores);
				}
				setTimeout(function(){callback(userMatchupScores)}, 1000);
			});
		});
	});
}

var insertGuess = function(userId, score)
{
	pool.getConnection(function(connError, con)
	{
		var scores = {user_id: userId, score: score};
		var insertQuery = "INSERT INTO scores SET ?";
		var query = con.query(insertQuery, scores, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var scoresUpdate = {user_id: userId, score: score};
					var updateQuery = "UPDATE scores SET ? WHERE user_id = ?";
					var query2 = con2.query(updateQuery, [scoresUpdate, userId], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("Failed to create or update score for user " + userId + ". " + err2);
						}
						else
						{
							if(result2.affectedRows == 0)
							{
								console.log("Failed to update score for user " + userId);
							}
							else
							{
								//console.log("Updated score successful.");
							}
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted score successful.");
			}
		});
		con.release();
	});
}


module.exports.updateUserScores = updateUserScores;