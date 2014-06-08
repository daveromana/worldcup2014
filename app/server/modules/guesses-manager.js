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
				console.log("Failed to create a guess for " + user + ". " + err);
			}
			else
			{
				console.log("Inserted guess successful.");
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
				console.log("Failed to create a group top scorer guess for " + user + ". " + err);
			}
			else
			{
				console.log("Inserted group top scorer guess successful.");
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
				console.log("Failed to create a tournament top scorer guess for " + user + ". " + err);
			}
			else
			{
				console.log("Inserted tournament top scorer guess successful.");
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
				console.log("Failed to create a tournament worst record guess for " + user + ". " + err);
			}
			else
			{
				console.log("Inserted tournament worst record guess successful.");
			}
		});
		con.release();
	});
}

var createTournamentTopTeamsGuess = function(user, first, second, third)
{
	pool.getConnection(function(connError, con)
	{
		var guess = {user_id: user, first_country_id: first, second_country_id: second, third_country_id: third};
		var insertQuery = "INSERT INTO tournment_top_teams_guesses SET ?";
		var query = con.query(insertQuery, guess, function(err, result, fields)
		{
			if(err)
			{
				console.log("Failed to create a tournament top teams guess for " + user + ". " + err);
			}
			else
			{
				console.log("Inserted tournament worst record guess successful.");
			}
		});
		con.release();
	});
}

var handleGuesses = function(user, guesses, callback)
{
	console.log("Heeeyyy");
	console.log(guesses);
	/*for(guess in guesses)
	{
		console.log(guesses[guess]);
	}*/
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