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

var errors = {guessError: '', topScorerGroupError: '', topScorerTournamentError:'', topTournamentError: '', worstTournamentError:''}

var createGuess = function(user, matchup, scorer, homeGoals, awayGoals)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, matchup_id: matchup, scorer_id: scorer, home_goals: homeGoals, away_goals: awayGoals};
		var insertQuery = "INSERT INTO guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var guess2 = {matchup_id: matchup, scorer_id: scorer, home_goals: homeGoals, away_goals: awayGoals};
					var updateQuery = "UPDATE guesses SET ? WHERE user_id = ? AND matchup_id = ?";
					var query2 = con2.query(updateQuery, [guess2, user, matchup], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("Failed to create or update a guess for " + user + ". " + err2);
							errors.guessError = "Failed to guess for a match! It's very likely that you chose a game-scorer who you had already chosen in another match. ";
						}
						else
						{
							if(result2.affectedRows == 0)
							{
								console.log("Failed to create or update a guess for " + user + ". " + result2.affectedRows + " rows affected.");
								errors.guessError = "Failed to update a guess for a match! It's very likely that you chose a game-scorer who you had already chosen in another match. ";
							}
							else
							{
								//console.log("Updated guess successful.");
							}
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted guess successful.");
			}
		});
		con.release();
	});
}

var createGroupTopScorerGuess = function(user, group, scorer)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, group_id: group, scorer_id: scorer};
		var insertQuery = "INSERT INTO group_top_scorers_guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var guess2 = {user_id: user, group_id: group, scorer_id: scorer};
					var updateQuery = "UPDATE group_top_scorers_guesses SET ? WHERE user_id = ? AND group_id = ?";
					var query2 = con2.query(updateQuery, [guess2, user, group], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("UNEXPECTED Failed to create or update a group top scorer guess for " + user + ". " + err2);
							errors.topScorerGroupError = "Unexpected error occurred while guessing for a group top scorer :( ";
						}
						else
						{
							//console.log("Updated group top scorer guess successful.");
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted group top scorer guess successful.");
			}
		});
		con.release();
	});
}

var createTournamentTopScorerGuess = function(user, scorer)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, scorer_id: scorer};
		var insertQuery = "INSERT INTO tournament_top_scorers_guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var guess2 = {user_id: user, scorer_id: scorer};
					var updateQuery = "UPDATE tournament_top_scorers_guesses SET ? WHERE user_id = ?";
					var query2 = con2.query(updateQuery, [guess2, user], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("UNEXPECTED Failed to create or update a tournament top scorer guess for " + user + ". " + err2);
							errors.topScorerTournamentError = "Unexpected error occurred while guessing a tournament top scorer guess. ";
						}
						else
						{
							if(result2.affectedRows == 0)
							{
								console.log("UNEXPECTED Failed to create or update a tournament top scorer guess for " + user + ". " + result2.affectedRows + " rows affected.");
								errors.topScorerTournamentError = "Unexpected error occurred while guessing a tournament top scorer guess. ";
							}
							else
							{
								//console.log("Updated a tournament top scorer guess successful.");
							}
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted tournament top scorer guess successful.");
			}
		});
		con.release();
	});
}

var createTournamentWorstRecordGuess = function(user, country)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, country_id: country};
		var insertQuery = "INSERT INTO tournament_worst_records_guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var guess2 = {user_id: user, country_id: country};
					var updateQuery = "UPDATE tournament_worst_records_guesses SET ? WHERE user_id = ?";
					var query2 = con2.query(updateQuery, [guess2, user], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("UNEXPECTED Failed to create or update a worst record guess for " + user + ". " + err2);
							errors.worstTournamentError = "Unexpected error occurred while guessing a worst record team. ";
						}
						else
						{
							if(result2.affectedRows == 0)
							{
								console.log("UNEXPECTED Failed to create or update a worst record guess for " + user + ". " + result2.affectedRows + " rows affected.");
								errors.worstTournamentError = "Unexpected error occurred while guessing a worst record team. ";
							}
							else
							{
								//console.log("Updated a top worst record guess successful.");
							}
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted tournament worst record guess successful.");
			}
		});
		con.release();
	});
}

var createTournamentTopTeamsGuess = function(user, place, country)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, place: place, country_id: country};
		var insertQuery = "INSERT INTO tournament_top_teams_guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				pool.getConnection(function(connError2, con2)
				{
					var guess2 = {user_id: user, place: place, country_id: country};
					var updateQuery = "UPDATE tournament_top_teams_guesses SET ? WHERE user_id = ? AND place = ?";
					var query2 = con2.query(updateQuery, [guess2, user, place], function(err2, result2, fields2)
					{
						if(err2)
						{
							console.log("Failed to create or update a top tournament team guess for " + user + ". " + err2);
							errors.topTournamentError = "Failed to guess a tournament top team, make sure you're not guessing with the same team for two different places(e.g. 1.st and 2.nd place). ";
						}
						else
						{
							if(result2.affectedRows == 0)
							{
								console.log("Failed to create or update a top tournament team guess for " + user + ". " + result2.affectedRows + " rows affected.");
								errors.topTournamentError = "Failed to guess a tournament top team, make sure you're not guessing with the same team for two different places(e.g. 1.st and 2.nd place). ";
							}
							else
							{
								//console.log("Updated a top tournament team guess successful.");
							}
						}
					});
					con2.release();
				});
			}
			else
			{
				//console.log("Inserted tournament top team guess successful.");
			}
		});
		con.release();
	});
}

var handleGuesses = function(user, guesses, callback)
{
	errors = {guessError: '', topScorerGroupError: '', topScorerTournamentError:'', topTournamentError: '', worstTournamentError:''}
	var userId = user._id;
	/* Populate the group top scorers */
	for(var i = 0 ; i < guesses.group_order.length ; i++)
	{
		createGroupTopScorerGuess(userId, guesses.group_order[i], guesses.group_top_scorer[i]);
	}
	createTournamentTopScorerGuess(userId, guesses.tournament_top_scorer);
	createTournamentWorstRecordGuess(userId, guesses.tournament_worst_record);
	/* Populate the top teams gueses */
	for(var i = 0 ; i < guesses.tournament_place.length ; i++)
	{
		var place = i + 1;
		createTournamentTopTeamsGuess(userId, place, guesses.tournament_place[i]);
	}
	/* Populate the matches guesses */
	for(var i = 0 ; i < guesses.match_order.length ; i++)
	{
		createGuess(userId, guesses.match_order[i], guesses.match_scorer[i], guesses.home_goals[i], guesses.away_goals[i]);
	}
	setTimeout(function(){callback(errors);}, 2500);
}

module.exports.handleGuesses = handleGuesses;