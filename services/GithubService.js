"use strict";

const util = require('util');

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
		self._cache.get('repos.all')
			.then(function(repos) {
				if(repos) {
					if(max > 0)
						repos = repos.splice(0, max);
					return resolve(repos);
				}

				// No fresh cache available
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

GithubService.prototype.getRepositoryReadme = function(name) {
	return this.getRepositoryFile(name, 'README.md');
};

GithubService.prototype.getRepositoryFile = function(name, filename) {
	let self = this;
	let cachePath = util.format('contents.%s.%s', name, filename);
	return new Promise(function(resolve, reject) {
		self._cache.get(cachePath)
			.then(function(content) {
				if(content) {
					// Convert content from base64
					content.content = (new Buffer(content.content, 'base64')).toString();
					// If JSON, convert that too
					try {
						content.content = JSON.parse(content.content);
					}
					catch(e) {
						// It's not JSON
					}
					return resolve(content);
				}

				// No cache found
				self._github.fetchRepositoryFile(name, filename)
					.then(function(content) {
						debug('got file from remote: %s', content.name);
						self._cache.set(cachePath, content);
						// Convert content from base64
						content.content = (new Buffer(content.content, 'base64')).toString();
						// If JSON, convert that too
						try {
							content.content = JSON.parse(content.content);
						}
						catch(e) {
							// It's not JSON
						}
						return resolve(content);
					})
					.catch(function(error) {
						debug('github fetch error: %s', error.message);
						return reject(error);
					});
			});
	});
};

GithubService.prototype.getRepositoryCommits = function(name) {
	let self = this;
	let cachePath = util.format('%s.commits', name);
	return new Promise(function(resolve, reject) {
		self._cache.get(cachePath)
			.then(function(commits) {
				if(commits) {
					return resolve(commits);
				}

				// No cache
				self._github.fetchRepositoryCommits(name)
					.then(function(commits) {
						self._cache.set(cachePath, commits);
						return resolve(commits);
					})
					.catch(function(error) {
						debug('repo commit api error: %s', error.message);
						return reject(error);
					});
			})
			.catch(function(error) {
				debug('repo commit cache error: %s', error.message);
				return reject(error);
			});
	});
};

GithubService.prototype.getRepositoryContributors = function(name) {
	let self = this;
	let cachePath = util.format('%s.contributors', name);
	return new Promise(function(resolve, reject) {
		self._cache.get(cachePath)
			.then(function(contributors) {
				if(contributors) return resolve(contributors);

				// No cache
				self._github.fetchRepositoryContributors(name)
					.then(function(contributors) {
						self._cache.set(cachePath, contributors);
						return resolve(contributors);
					})
					.catch(function(error) {
						debug('get contributors remote error: %s', error.message);
						console.error(error);
						return reject(error);
					});
			})
			.catch(function(error) {
				debug('get repo contributors error: %s', error.message);
				console.error(error);
				return reject(error);
			});
	});
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
