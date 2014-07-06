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

var getGuesses = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT matchup_id, scorer_id, home_goals, away_goals FROM guesses g WHERE g.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getTopGroupScorers = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT g.group_id, scorer_id FROM group_top_scorers_guesses g WHERE g.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getActualGroupTopScorers = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT g.group_id, player_id FROM group_top_scorers g";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getTopTeamsGuesses = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT t.place, t.country_id FROM tournament_top_teams_guesses t WHERE t.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getTournamentTopScorerGuess = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT t.scorer_id FROM tournament_top_scorers_guesses t WHERE t.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getTournamentWorstRecordGuess = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT w.country_id FROM tournament_worst_records_guesses w WHERE w.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getTournamentTopAssister = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT t.player_id FROM tournament_top_assists t WHERE t.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
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
		var selectQuery = "SELECT p.id, p.name, p.country_id FROM players p ORDER BY (SELECT c.name FROM countries c WHERE c.id = p.country_id), p.name";
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

var getCountries = function(callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.id, c.name, c.group_id FROM countries c ORDER BY c.name";
		var query = con.query(selectQuery, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			callback(result);
		});
	});
}

var getGroupIdOfMatchup = function(matchupId, actualMatchup, callback)
{
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT c.group_id FROM countries c WHERE c.id = (SELECT m.home_team_id FROM matchups m WHERE m.id = ?)";
		var query = con.query(selectQuery, matchupId, function(err, result, fields)
		{
			if(err) throw err;
			con.release();
			var gId = result[0] == null ? null : result[0].group_id;
			callback(gId, actualMatchup);
		});
	});
}

var getLeagues = function(user, callback)
{
	var userId = user._id;
	pool.getConnection(function(connError, con)
	{
		var selectQuery = "SELECT l.name, l.code FROM leagues l, league_participation p WHERE p.league_id = l.id AND p.user_id = ?";
		var query = con.query(selectQuery, userId, function(err, result, fields)
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
module.exports.getCountries = getCountries;
module.exports.getGuesses = getGuesses;
module.exports.getTopGroupScorers = getTopGroupScorers;
module.exports.getTopTeamsGuesses = getTopTeamsGuesses;
module.exports.getTournamentTopScorerGuess = getTournamentTopScorerGuess;
module.exports.getTournamentWorstRecordGuess = getTournamentWorstRecordGuess;
module.exports.getTournamentTopAssister = getTournamentTopAssister;
module.exports.getLeagues = getLeagues;
module.exports.getGroupIdOfMatchup = getGroupIdOfMatchup;
module.exports.getActualGroupTopScorers = getActualGroupTopScorers;