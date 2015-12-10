"use strict";

const debug = require('debug')('FileCacheService');

const jetpack = require('fs-jetpack');
const extend = require('extend');

const path = require('path');
const util = require('util');

//
const DEFAULT_OPTIONS = {
	'cacheDir': process.cwd() + '/cache',
	'cacheExpire': 3600 * 1000, // 1hr
	'prefix': 'cs'
};

let FileCacheService = function(options) {
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
	this._fs = jetpack.cwd(this._options.cacheDir);
};

FileCacheService.prototype.set = function(key, value) {
	let cacheFile = util.format('%s.%s.json', this._options.prefix, key);
	let cacheObj = {
		'cachedOn': (new Date()).toISOString(),
		'content': value
	};
	let self = this;
	this._fs.writeAsync(cacheFile, cacheObj)
		.catch(function(error) {
			debug('fail cache write to %s', path.join(self._fs.cwd(), cacheFile));
		});
};

FileCacheService.prototype.get = function(key) {
	debug('start get()');
	let self = this;
	return new Promise(function(resolve, reject) {
		debug('promise get() - %s', util.format('%s.%s.json', self._options.prefix, key));
		let cacheFile = util.format('%s/%s.%s.json', self._fs.cwd(), self._options.prefix, key);
		debug(cacheFile);
		self._fs.readAsync(cacheFile, 'jsonWithDates')
			.then(function(cache) {
				debug('readAsync complete');
				if(!cache || cache === null) {
					debug('get resolve to null');
					return resolve(null);
				}

				debug('check cache expiry');
				let currentTime = (new Date()).getTime();
				if(currentTime - cache.cachedOn >= self._options.cacheExpire)
					return resolve(null);
				return resolve(cache.content);
			})
			.catch(function(error) {
				debug('fail read from cache %s', cacheFile);
				return reject(error);
			});
	});
};

FileCacheService.prototype.getRepository = function(name) {
	let self = this;
	return new Promise(function(resolve, reject) {
		self.get('repos.all')
			.then(function(repos) {
				debug('FOR: got %d repos', repos.length);
				// See if it's there
				for(let repo of repos) {
					if(repo.name === name) return resolve(repo);
				}
				debug('repo name \'%s\' not found');
				return reject(new Error('repo name not found'));
			})
			.catch(reject);
	});
};

exports = module.exports = FileCacheService;
