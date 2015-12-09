"use strict";

const debug = require('debug')('GithubApiService');
const extend = require('extend');

const GithubApi = require('github-api-simple');

const DEFAULT_OPTIONS = {
	'baseUrl': 'https://api.github.com',
	'headers': {
		'User-Agent': 'GithubApiService v0.0.1 <michiel@artofcoding.nl>'
	}
};

let GithubApiService = function(options) {
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
	this._api = new GithubApi(this._options.api || {});
};

GithubApiService.prototype.fetchRepositories = function(username) {
	debug('fetchRepositories() start');
	if(!username && !this._options.username) throw new Error('no user name given');
	username = (username) ? username : this._options.username;
	let options = extend(this._options, {
		'qs': {
			'sort': 'pushed',
			'direction': 'desc'
		}
	});
	debug('fetchRepositories() checks ok for %s', username);
	return this._api.Repositories.getReposForUser(username, options);
};

exports = module.exports = GithubApiService;
