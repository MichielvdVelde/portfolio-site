"use strict";

const debug = require('debug')('GithubApiService');
const extend = require('extend');

const GithubApi = require('github-api-simple');

const DEFAULT_OPTIONS = {
	'baseUrl': 'https://api.github.com',
	'headers': {
		'User-Agent': 'GithubApiService v0.0.1 <michiel@artofcoding.nl>'
	},
	'simple': false
};

let GithubApiService = function(options) {
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
	this._api = new GithubApi(this._options.api || {});
};

GithubApiService.prototype.fetchRepositories = function(username) {
	if(!username && !this._options.username) throw new Error('no user name given');
	username = (username) ? username : this._options.username;
	let options = extend(this._options, {
		'qs': {
			'sort': 'pushed',
			'direction': 'desc'
		}
	});
	return this._api.Repositories.getReposForUser(username, options);
};

GithubApiService.prototype.fetchRepositoryFile = function(username, name, filename) {
	if(!username && !this._options.username && arguments.length == 2) throw new Error('no user name given');
	if(arguments.length == 2) {
		let tmp = name;
		name = username;
		filename = tmp;
		username = false;
	}
	username = (username) ? username : this._options.username;
	debug('fetchRepositoryFile() checks ok for %s %s %s', username, name, filename);
	return this._api.Repositories.getRepoFile(username, name, filename, this._options);
};

GithubApiService.prototype.fetchRepositoryCommits = function(username, name) {
	debug('fetchRepositoryCommits() start');
	if(!name) {
		name = username;
		username = null;
	}
	if(!username && !this._options.username) throw new Error('no user name given');
	username = (username) ? username : this._options.username;
	return this._api.Repositories.getRepoCommits(username, name);
};

GithubApiService.prototype.fetchRepositoryContributors = function(username, name) {
	debug('fetchRepositoryContributors() start');
	if(!name) {
		name = username;
		username = null;
	}
	if(!username && !this._options.username) throw new Error('no user name given');
	username = (username) ? username : this._options.username;
	return this._api.Repositories.getRepoContributors(username, name);
};

exports = module.exports = GithubApiService;
