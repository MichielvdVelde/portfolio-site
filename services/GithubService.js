"use strict";

const debug = require('debug')('GithubService');
const extend = require('extend');

const DEFAULT_OPTIONS = {
	// TODO
};

let GithubService = function(github, cache, options) {
	if(!github || !cache) throw new Error('github and cache required');

	this._github = github;
	this._cache = cache;
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
};


GithubService.prototype.getRepositories = function(max) {
	debug('start getRepositories()');
	if(!isNaN(max) && max < 0) max = 0;
	let self = this;
	return new Promise(function(resolve, reject) {
		debug('start getRepositories() promise');
		self._cache.get('repos.all')
			.then(function(repos) {
				debug('getRepositories() cache get');
				if(repos) {
					if(max > 0)
						repos = repos.splice(0, max);
					return resolve(repos);
				}

				// No fresh cache available
				debug('get from remote');
				self._github.fetchRepositories()
					.then(function(repos) {
						debug('got from remote: %s', repos.length);
						self._cache.set('repos.all', repos);
						if(!isNaN(max) && repos.length > max)
						 	repos = repos.splice(0, max);
						return resolve(repos);
					})
					.catch(function(error) {
						console.log(error);
						debug('github fetch error: %s', error.message);
						return reject(error);
					});
			});
	});
};

GithubService.prototype.getRepository = function(name) {
	if(!name || name === null) throw new Error('repository name required');
	return this._cache.getRepository(name);
};

let instance = null;
exports.createService = module.exports.createService = function(github, cache, options) {
	if(instance || instance !== null) throw new Error('service already created');
	instance = new GithubService(github, cache, options);
	return instance;
};

exports.get = function() {
	if(!instance || instance === null) throw new Error('service not created yet');
	return instance;
};
