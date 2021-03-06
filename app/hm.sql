CREATE TABLE IF NOT EXISTS groups
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	name VARCHAR(16) UNIQUE NOT NULL
);

INSERT INTO groups(name) VALUES('A');
INSERT INTO groups(name) VALUES('B');
INSERT INTO groups(name) VALUES('C');
INSERT INTO groups(name) VALUES('D');
INSERT INTO groups(name) VALUES('E');
INSERT INTO groups(name) VALUES('F');
INSERT INTO groups(name) VALUES('G');
INSERT INTO groups(name) VALUES('H');

CREATE TABLE IF NOT EXISTS countries
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	name VARCHAR(32) UNIQUE NOT NULL,
	group_id MEDIUMINT UNSIGNED NOT NULL REFERENCES groups(id)
);

INSERT INTO countries(name, group_id) VALUES('Croatia', 1);
INSERT INTO countries(name, group_id) VALUES('Brazil', 1);
INSERT INTO countries(name, group_id) VALUES('Cameroon', 1);
INSERT INTO countries(name, group_id) VALUES('Mexico', 1);
INSERT INTO countries(name, group_id) VALUES('Netherlands', 2);
INSERT INTO countries(name, group_id) VALUES('Spain', 2);
INSERT INTO countries(name, group_id) VALUES('Australia', 2);
INSERT INTO countries(name, group_id) VALUES('Chile', 2);
INSERT INTO countries(name, group_id) VALUES('Greece', 3);
INSERT INTO countries(name, group_id) VALUES('Colombia', 3);
INSERT INTO countries(name, group_id) VALUES('Japan', 3);
INSERT INTO countries(name, group_id) VALUES('Ivory Coast', 3);
INSERT INTO countries(name, group_id) VALUES('Costa Rica', 4);
INSERT INTO countries(name, group_id) VALUES('Uruguay', 4);
INSERT INTO countries(name, group_id) VALUES('Italy', 4);
INSERT INTO countries(name, group_id) VALUES('England', 4);
INSERT INTO countries(name, group_id) VALUES('Ecuador', 5);
INSERT INTO countries(name, group_id) VALUES('Switzerland', 5);
INSERT INTO countries(name, group_id) VALUES('Honduras', 5);
INSERT INTO countries(name, group_id) VALUES('France', 5);
INSERT INTO countries(name, group_id) VALUES('Bosnia and Herzegovina', 6);
INSERT INTO countries(name, group_id) VALUES('Argentina', 6);
INSERT INTO countries(name, group_id) VALUES('Nigeria', 6);
INSERT INTO countries(name, group_id) VALUES('Iran', 6);
INSERT INTO countries(name, group_id) VALUES('Portugal', 7);
INSERT INTO countries(name, group_id) VALUES('Germany', 7);
INSERT INTO countries(name, group_id) VALUES('United States', 7);
INSERT INTO countries(name, group_id) VALUES('Ghana', 7);
INSERT INTO countries(name, group_id) VALUES('Algeria', 8);
INSERT INTO countries(name, group_id) VALUES('Belgium', 8);
INSERT INTO countries(name, group_id) VALUES('South Korea', 8);
INSERT INTO countries(name, group_id) VALUES('Russia', 8);

CREATE TABLE IF NOT EXISTS players
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	name VARCHAR(128) UNIQUE NOT NULL,
	country_id MEDIUMINT UNSIGNED NOT NULL REFERENCES countries(id)
);

/* Run the populatePlayers function in node to populate the players */

CREATE TABLE IF NOT EXISTS matchups
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	home_team_id MEDIUMINT UNSIGNED NOT NULL REFERENCES countries(id),
	away_team_id MEDIUMINT UNSIGNED NOT NULL REFERENCES countries(id),
	CONSTRAINT uc_matchup UNIQUE (home_team_id, away_team_id)
);

/* Run the populateMatchups function in node to populate the matchups */

CREATE TABLE IF NOT EXISTS guesses
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) NOT NULL,
	matchup_id MEDIUMINT UNSIGNED NOT NULL REFERENCES matchups(id),
	scorer_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id),
	home_goals INT NOT NULL DEFAULT 0,
	away_goals INT NOT NULL DEFAULT 0,
	CONSTRAINT uc_user_matchup UNIQUE (user_id, matchup_id),
	CONSTRAINT uc_user_scorer UNIQUE (user_id, scorer_id)
);

CREATE TABLE IF NOT EXISTS scores
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) UNIQUE NOT NULL,
	score INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leagues
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	code VARCHAR(64) UNIQUE NOT NULL,
	name VARCHAR(128) UNIQUE NOT NULL,
	owner_id VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS league_participation
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) NOT NULL,
	league_id MEDIUMINT UNSIGNED NOT NULL REFERENCES leagues(id),
	CONSTRAINT uc_user_league UNIQUE (user_id, league_id)
);

CREATE TABLE IF NOT EXISTS group_top_scorers_guesses
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) NOT NULL,
	group_id MEDIUMINT UNSIGNED NOT NULL REFERENCES groups(id),
	scorer_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id),
	CONSTRAINT uc_user_group UNIQUE (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS tournament_top_scorers_guesses
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) UNIQUE NOT NULL,
	scorer_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id),
	CONSTRAINT uc_user_scorer UNIQUE (user_id, scorer_id)
);

CREATE TABLE IF NOT EXISTS tournament_worst_records_guesses
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) UNIQUE NOT NULL,
	country_id MEDIUMINT UNSIGNED NOT NULL REFERENCES countries(id),
	CONSTRAINT uc_user_country UNIQUE (user_id, country_id)
);

CREATE TABLE IF NOT EXISTS tournament_top_teams_guesses
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) NOT NULL,
	place INT NOT NULL,
	country_id MEDIUMINT UNSIGNED NOT NULL REFERENCES countries(id),
	CONSTRAINT uc_user_country UNIQUE (user_id, country_id),
	CONSTRAINT uc_user_place UNIQUE (user_id, place)
);

CREATE TABLE IF NOT EXISTS tournament_top_assists
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) UNIQUE NOT NULL,
	player_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS results_fetches
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS group_top_scorers
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	group_id MEDIUMINT UNSIGNED NOT NULL REFERENCES groups(id),
	player_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id),
	CONSTRAINT uc_group_player UNIQUE (group_id, player_id)
);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(1, 153);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(2, 626);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(2, 640);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(3, 231);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(4, 697);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(5, 384);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(6, 77);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(7, 321);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(8, 352);

CREATE TABLE IF NOT EXISTS tournament_top_teams
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	place INT UNIQUE NOT NULL,
	country_id MEDIUMINT UNSIGNED UNIQUE NOT NULL REFERENCES countries(id)
);

INSERT INTO tournament_top_teams(place, country_id) VALUES(1, 26);
INSERT INTO tournament_top_teams(place, country_id) VALUES(2, 22);
INSERT INTO tournament_top_teams(place, country_id) VALUES(3, 5);



/*
Neymar
Robben og Robin van Persie
James Rodriguez
Suarez
Enner Valencia
Messi
Müller
Slimani

Neymar 152
Robben og Robin van Persie 715 721
James Rodriguez 255
Suarez 838
Enner Valencia 380
Messi 74
Müller 320
Slimani 354


CREATE TABLE IF NOT EXISTS group_top_scorers
(
	id BIGINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	group_id MEDIUMINT UNSIGNED NOT NULL REFERENCES groups(id),
	player_id MEDIUMINT UNSIGNED NOT NULL REFERENCES players(id),
	CONSTRAINT uc_group_player UNIQUE (group_id, player_id)
);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(1, 152);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(2, 715);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(2, 721);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(3, 255);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(4, 838);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(5, 380);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(6, 74);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(7, 320);
INSERT INTO group_top_scorers(group_id, player_id) VALUES(8, 354);
*/