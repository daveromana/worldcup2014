
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var dbpopulation = require('./modules/db-population');
var dbSelect = require('./modules/db-select');
var fs = require('fs');
var guesses = require('./modules/guesses-manager');
var leaguemanager = require('./modules/league-manager');
var scoremanager = require('./modules/score-manager');

http = require('http');

module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
			    req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});

// Logged-in user homepage // 

	app.get('/home', function(req, res)
	{
	    if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			scoremanager.updateUserScores();
			//dbpopulation.populatePlayers();
			//dbpopulation.populateMatchups();
			res.render('home', {
				title : 'Guess game for the 2014 FIFA World Cup',
				udata : req.session.user
			});
	    }
	});

	app.post('/home', function(req, res)
	{
		if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});

// logged-in user homepage //
	
	app.get('/settings', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			res.render('settings', {
				title : 'Account Settings',
				countries : CT,
				udata : req.session.user
			});
	    }
	});
	
	app.post('/settings', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country')
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});

// View the results of 2014 //
	
	app.get('/results', function(req, res) {
	    if (req.session.user == null)
	    {
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }
	    else
	   	{
	   		var file = __dirname + '/files/results2014.json';
			fs.readFile(file, 'utf8', function (err, data)
			{
				if (err) throw err;
				try
				{
					var data = JSON.parse(data);
					res.render('results',
					{
						title : 'Results of 2014',
						resultsof2014 : data
					});
				}
				catch(exception)
				{
					console.log('Problem with reading file: ' + exception.message);
				}
			});
		}
	});
	
	app.post('/results', function(req, res){
		if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});

	app.get('/guesses', function(req, res) {
	    if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
	    	dbSelect.getMatchups(function(matchups)
	    	{
	    		dbSelect.getPlayers(function(players)
	    		{
	    			dbSelect.getGroups(function(groups)
	    			{
		    			dbSelect.getCountries(function(countries)
		    			{
			    			dbSelect.getGuesses(req.session.user, function(guesses)
			    			{
				    			dbSelect.getTopGroupScorers(req.session.user, function(topGroupScorers)
				    			{
				    				dbSelect.getTopTeamsGuesses(req.session.user, function(topTeamsGuesses)
				    				{
					    				dbSelect.getTournamentTopScorerGuess(req.session.user, function(topScorer)
					    				{
						    				dbSelect.getTournamentWorstRecordGuess(req.session.user, function(worstRecord)
						    				{
						    					dbSelect.getTournamentTopAssister(req.session.user, function(topAssister)
						    					{
							    					res.render('guesses',
							    					{
														title : 'Guesses',
														countries : CT,
														udata : req.session.user,
														matches : matchups,
														players : players,
														groups : groups,
														countries : countries,
														guesses : guesses,
														topGroupScorers : topGroupScorers,
														topTeams : topTeamsGuesses,
														topScorer : topScorer,
														worstRecord : worstRecord,
														topAssister: topAssister
													});
						    					});
											});
										});
				    				});
				    			});
			    			});
		    			});
	    			});
	    		});
	    	});
	    }
	});

	app.post('/guesses', function(req, res)
	{
 		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }
		else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
		else
		{
			guesses.handleGuesses(req.session.user, req.body, function(messages)
			{
				dbSelect.getMatchups(function(matchups)
	    		{
		    		dbSelect.getPlayers(function(players)
		    		{
		    			dbSelect.getGroups(function(groups)
		    			{
			    			dbSelect.getCountries(function(countries)
			    			{
				    			dbSelect.getGuesses(req.session.user, function(guesses)
				    			{
					    			dbSelect.getTopGroupScorers(req.session.user, function(topGroupScorers)
					    			{
					    				dbSelect.getTopTeamsGuesses(req.session.user, function(topTeamsGuesses)
					    				{
						    				dbSelect.getTournamentTopScorerGuess(req.session.user, function(topScorer)
						    				{
							    				dbSelect.getTournamentWorstRecordGuess(req.session.user, function(worstRecord)
							    				{
							    					dbSelect.getTournamentTopAssister(req.session.user, function(topAssister)
							    					{
								    					res.render('guesses',
								    					{
															title : 'Guesses',
															countries : CT,
															udata : req.session.user,
															matches : matchups,
															players : players,
															groups : groups,
															countries : countries,
															guesses : guesses,
															topGroupScorers : topGroupScorers,
															topTeams : topTeamsGuesses,
															topScorer : topScorer,
															worstRecord : worstRecord,
															topAssister: topAssister,
															messages : messages
														});
							    					});
												});
											});
					    				});
					    			});
				    			});
			    			});
		    			});
		    		});
		    	});
			});
		}
	});

	app.get('/leagues', function(req, res)
	{
	    if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			//dbpopulation.populatePlayers();
			//dbpopulation.populateMatchups();
			leaguemanager.getLeaguesForUser(req.session.user, function(leagues)
			{
				res.render('leagues',
				{
					title : 'Create or join a League',
					udata : req.session.user,
					currentUserLeagues : leagues
				});
			});
	    }
	});

	app.post('/leagues', function(req, res)
	{
 		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }
		else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
		else
		{
			if(req.param('league_name'))
			{
				var leagueName = req.param('league_name');
				leaguemanager.CreateLeague(leagueName, user, function(messages)
				{
					leaguemanager.getLeaguesForUser(user, function(leagues)
					{
						res.render('leagues',
						{
							title : 'Create or join a League',
							udata : req.session.user,
							currentUserLeagues : leagues,
							createLeagueMessages : messages
						});
					});
				});
			}
			else if(req.param('league_code'))
			{
				var code = req.param('league_code');
				leaguemanager.getLeaguesForUser(user, function(leagues)
				{
					leaguemanager.ParticipateInLeague(user, code, function(messages)
					{
						res.render('leagues',
						{
							title : 'Create or join a League',
							currentUserLeagues : leagues,
							udata : req.session.user,
							joinLeagueMessages : messages
						});
					});
				});
			}
		}
	});

	app.get('/scoreboard', function(req, res) {
	    if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			//dbpopulation.populatePlayers();
			//dbpopulation.populateMatchups();
			leaguemanager.getLeaguesWhichUserIsIn(req.session.user, function(usersInLeagues)
			{
				leaguemanager.getUsersLeagues(usersInLeagues, function(inLeagues)
				{
					leaguemanager.getUserNames(inLeagues, function(users)
					{
						leaguemanager.getAllActiveUsers(function(activeUsers)
						{
							res.render('scoreboard',
							{
								title : 'Scoreboard',
								udata : req.session.user,
								leagues : usersInLeagues,
								users: users,
								activeUsers: activeUsers
							});
						});
					});
				});
			});
	    }
	});
	
	app.post('/scorebaord', function(req, res) {
 		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }
		else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};