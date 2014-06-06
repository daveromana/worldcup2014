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
	CONSTRAINT uc_user_matchup UNIQUE (user_id, matchup_id)
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
	name VARCHAR(128) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS league_participation
(
	id MEDIUMINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
	user_id VARCHAR(64) NOT NULL,
	league_id  MEDIUMINT UNSIGNED NOT NULL REFERENCES leagues(id)
);