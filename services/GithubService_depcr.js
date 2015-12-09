"use strict";

const fs = require('fs');
const util = require('util');
const path = require('path');

const debug = require('debug')('GithubService');
const request = require('request');

const GITHUB_API_BASE_URL = 'https://api.github.com';

const DEFAULT_CACHE_TIME = 1800 * 1000; // 30m
const DEFAULT_CACHE_DIR = path.join(process.cwd(), '/cached');

// ---
const DEFAULT_CACHE_REPOS_DIR = path.join(DEFAULT_CACHE_DIR, '/repositories');
const DEFAULT_CACHE_READMES_DIR = path.join(DEFAULT_CACHE_DIR, '/readmes');
// ---

const DEFAULT_CACHE_DIRS = {
	'REPOS': path.join(DEFAULT_CACHE_DIR, '/repositories'),
	'README': path.join(DEFAULT_CACHE_DIR, '/readmes')
};

/**
 *
*/
let cacheToFile = function(path, content) {
	debug('write to cache: %s', path);
	let cacheObject = {
		'cacheTime': (new Date()).getTime(),
		'content': content
	};
	fs.writeFile(path, JSON.stringify(cacheObject), function(error) {
		if(error) {
			debug('error writing to cache: %s', error.message);
		}
	});
};

/**
 *
let cacheUserRepos = function(username, body) {
	let cachePath = path.join(DEFAULT_CACHE_REPOS_DIR, util.format('/%s.json', username));
	debug('write to cache: %s', cachePath);
	let cacheObject = {
		'cacheTime': (new Date()).getTime(),
		'repositories': body
	};
	fs.writeFile(cachePath, JSON.stringify(cacheObject), function(error) {
		if(error) {
			debug('error writing to cache: %s', error.message);
		}
	});
};
*/

/**
 *
*/
let fetchReposForUser = function(username, max, callback) {
	if(!callback && typeof max == 'function') {
		callback = max;
		max = 0;
	}
	let requestOptions = {
		'url': GITHUB_API_BASE_URL + util.format('/users/%s/repos', username),
		'qs': {
			'sort': 'pushed',
			'direction': 'desc'
		},
		'headers': {
			'User-Agent': 'node.js test site dev'
		}
	};
	debug('fetching from github: %s', requestOptions.url);
	request(requestOptions, function(error, response, body) {
		if(error) {
			debug('error fetching from remote: %s', error.message || 'status code ' + response.statusCode);
			return callback(error);
		}
		body = JSON.parse(body);
		process.nextTick(function() {
			let cachePath = path.join(DEFAULT_CACHE_DIRS.REPOS, util.format('/%s.json', username));
			cacheToFile(cachePath, body);
		});
		debug('retrieved %d entries from Github API', body.length);
		let partial = null;
		if(!isNaN(max) && max > 0) partial = body.splice(0, max);
		return callback(null, (partial) ? partial : body);
	});
};

/**
 *
*/
exports.getReposForUser = function(username, max, callback) {
	if(!callback && typeof max == 'function') {
		callback = max;
		max = 0;
	}
	let cacheFile = path.join(DEFAULT_CACHE_DIRS.REPOS, util.format('/%s.json', username));
	fs.readFile(cacheFile, 'utf-8', function(error, result) {
		if(error) return fetchReposForUser(username, max, callback);
		result = JSON.parse(result);
		let currentDate = (new Date()).getTime();
		if(currentDate - result.cacheTime > DEFAULT_CACHE_TIME) return fetchReposForUser(username, max, callback);

		debug('retrieved %d entries from cache (%s)', result.content.length, (!isNaN(max) && max > 0) ? max : 'no');
		if(!isNaN(max) && max > 0) result.content = result.content.slice(0, max);
		return callback(null, result.content);
	});
};




/**
 *
let cacheRepoReadme = function(username, repo, body) {
	let cachePath = path.join(DEFAULT_CACHE_READMES_DIR, util.format('/%s-%s.json', username, repo));
	debug('write README to cache: %s', cachePath);
	let cacheObject = {
		'cacheTime': (new Date()).getTime(),
		'readme': body
	};
	fs.writeFile(cachePath, JSON.stringify(cacheObject), function(error) {
		if(error) {
			debug('error writing to cache: %s', error.message);
		}
	});
};
*/


let fetchReadmeForRepo = function(username, repo, callback) {
	let requestOptions = {
		'url': GITHUB_API_BASE_URL + util.format('/repos/%s/%s/readme', username, repo),
		'headers': {
			'User-Agent': 'node.js test site dev'
		}
	};
	debug('fetching README from github: %s', requestOptions.url);
	request(requestOptions, function(error, response, body) {
		if(error) {
			debug('error fetching README from remote: %s', error.message || 'status code ' + response.statusCode);
			return callback(error);
		}
		body = JSON.parse(body);
		process.nextTick(function() {
			let cachePath = path.join(DEFAULT_CACHE_DIRS.README, util.format('/%s-%s.json', username, repo));
			cacheToFile(cachePath, body);
		});
		body.content = (new Buffer(body.content, 'base64')).toString();
		debug('retrieved README for %s/%s from Github API', username, repo);
		return callback(null, body);
	});
};


exports.getReadmeForRepo = function(username, repo, callback) {

	let cacheFile = path.join(DEFAULT_CACHE_DIRS.README, util.format('/%s-%s.json', username, repo));
	fs.readFile(cacheFile, 'utf-8', function(error, result) {
		if(error) return fetchReadmeForRepo(username, repo, callback);
		result = JSON.parse(result);
		let currentDate = (new Date()).getTime();
		if(currentDate - result.cacheTime > DEFAULT_CACHE_TIME) return fetchReadmeForRepo(username, repo, callback);
		debug('retrieved readme from cache');
		result.content.content =  (new Buffer(result.content.content, 'base64')).toString();
		return callback(null, result.content);
	});

};
