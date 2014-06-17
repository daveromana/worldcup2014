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
	updateNewestResults(function(updatesAvailable)
	{
		if(updatesAvailable)
		{
			getUserMatchupGuesses(function(userMatchupGuesses)
			{
				for(user in userMatchupGuesses)
				{
					var userId = userMatchupGuesses[user].user_id;
					var score = userMatchupGuesses[user].score;
					grantScore(userId, score);
				}
			});
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

var updateNewestResults = function(callback)
{
	canFetchNewestResults(function(canFetch)
	{
		if(canFetch)
		{
	   		var options =
			{
				host: 'www.kimonolabs.com',
				path: 'http://www.kimonolabs.com/api/6o1ie372?apikey=b5e0dc064de0b4591f16d850ae429fca',
				method: 'GET'
			};

			var apiRequest = http.request(options, function(apiResponse)
			{
				var requestBody = "";
				apiResponse.on('data', function(data)
				{
					requestBody += data;
				});
				apiResponse.on('end', function()
				{
					try
					{
						var file = __dirname + '/../files/results2014.json';
						var jsonRequestResults = JSON.stringify(JSON.parse(requestBody));
						var jsonRequestResultsBody = JSON.parse(requestBody);
						fs.readFile(file, 'utf8', function (err, readData) 
						{
							if (err)
							{
							    console.log('Error: ' + err);
								fs.writeFile(file, jsonRequestResults, 'utf8', function()
								{
									notifyFetch();
									console.log('Failed to read results, updated anyway.');
									callback(true);
								});
							}
							else
							{
								var currentData = JSON.parse(readData);
								var hasNotChanged = JSON.stringify(jsonRequestResultsBody) === JSON.stringify(currentData);

								if(hasNotChanged)
								{
									callback(false);
									console.log("Nothing has changed.");
								}
								else
								{
									// Update the file and indicate that user scores can be updated.
									fs.writeFile(file, jsonRequestResults, 'utf8', function(){
										notifyFetch();
										console.log('Updated newest results.');
										callback(true);
									});
								}
							}
						});
					}
					catch(err2)
					{
						console.log('Problem with request: ' + err2.message);
						callback(false);
					}
				});
			});
			apiRequest.on('error', function(e)
			{
				console.log('Error: ' + e.message);
			});
			apiRequest.end();
		}
		else
		{
			callback(false);
		}
	});
}

var canFetchNewestResults = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = 'SELECT r.id, r.fetched FROM results_fetches r ORDER BY r.id DESC LIMIT 1';
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			var newBase = result[0] == null;
			if(newBase)
			{
				callback(true);
			}
			else
			{
				var newDateObjTime = (new Date(result[0].fetched.getTime())).getTime() + 15*60000;
				var now = (new Date).getTime();
				var timeHasPassed = now > newDateObjTime;
				callback(timeHasPassed);
			}
		});
	});
}

var notifyFetch = function()
{
	pool.getConnection(function(connError, con)
	{
		var insertQuery = 'INSERT INTO results_fetches (fetched) VALUES(CURRENT_TIMESTAMP)';
		var query = con.query(insertQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
		});
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
					//console.log(actualMatchups);
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
									// Exact correct result.
									var correctHomeGoals = parseInt(actualMatchupScoreline.split('–')[0]);
									var correctAwayGoals = parseInt(actualMatchupScoreline.split('–')[1]);
									var userMatchupHomeGoals = parseInt(userMatchupScoreline.split('–')[0]);
									var userMatchupAwayGoals = parseInt(userMatchupScoreline.split('–')[1]);
									if(correctScoreline)
									{
										scores.score += 3;
										//console.log(scores.user_id + " granted 3 points for exact correct score (" + actualMatchupScoreline + ") in " + actualMatchupId);
									}
									legitGoals(correctHomeGoals, correctAwayGoals, userMatchupHomeGoals, userMatchupAwayGoals, function(legit, chg, cag, uhg, uag)
									{
										if(legit)
										{
											// Correct 1X2
											var userHomeTeamWins = uhg > uag;
											var correctHomeTeamWins = chg > cag;
											var userAwayTeamWins = uhg < uag;
											var correctAwayTeamWins = chg < cag;
											var userTie = uhg == uag;
											var correctTie = chg == cag;
											var userGuessedCorrectHome = userHomeTeamWins && correctHomeTeamWins;
											var userGuessedCorrectAway = userAwayTeamWins && correctAwayTeamWins;
											var userGuessedCorrectTie = userTie && correctTie;
											var correctGuess = userGuessedCorrectHome || userGuessedCorrectAway || userGuessedCorrectTie;
											if(correctGuess)
											{
												scores.score += 2;
												//console.log(scores.user_id + " granted 2 points for correct 1 times 2 in matchup " + actualMatchupId);
											}
										}
									});
									var scorerSplit = userMatchupScorerName.split(" ");
									var fixedUserMatchupScorerName = '';
									if(scorerSplit[1] != null)
									{
										for(var i = 0; i < scorerSplit.length ; i++)
										{
											if(fixedUserMatchupScorerName == '')
											{
												fixedUserMatchupScorerName = scorerSplit[1];
											}
											else
											{
												if(scorerSplit[i+1] != null)
												{
													fixedUserMatchupScorerName = fixedUserMatchupScorerName + " " + scorerSplit[i+1];
												}
											}
										}
									}
									else
									{
										fixedUserMatchupScorerName = userMatchupScorerName;
									}
									
									var correctHomeScorerGuess = actualHomeScorers.indexOf(fixedUserMatchupScorerName) != -1;
									var correctAwayScorerGuess = actualAwayScorers.indexOf(fixedUserMatchupScorerName) != -1;
									var correctScorer = correctHomeScorerGuess || correctAwayScorerGuess;
									// Correct scorer.
									if(correctScorer)
									{
										scores.score += 2;
										//console.log(scores.user_id + " granted 2 points for correct scorer; " + fixedUserMatchupScorerName + " instead of " + userMatchupScorerName);
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

var legitGoals = function(correctHomeGoals, correctAwayGoals, userHomeGoals, userAwayGoals, callback)
{
	var legit = legitGoal(correctHomeGoals) && legitGoal(correctAwayGoals) && legitGoal(userHomeGoals) && legitGoal(userAwayGoals);
	callback(legit, correctHomeGoals, correctAwayGoals, userHomeGoals, userAwayGoals);
}

var legitGoal = function(goal)
{
	return !isNaN(parseFloat(goal));
}

var grantScore = function(userId, score)
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