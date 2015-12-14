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
	'prefix': 'cs',
	'fixCacheExpire': false
};

let FileCacheService = function(options) {
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
	this._fs = jetpack.cwd(this._options.cacheDir);
};

FileCacheService.prototype.set = function(key, value, fixCacheExpire) {
	let cacheFile = util.format('%s.%s.json', this._options.prefix, key);
	let cacheObj = {
		'cachedOn': (new Date()).toISOString(),
		'content': value
	};
	if(this._options.fixCacheExpire || fixCacheExpire)
		cacheObj.cacheExpire = (fixCacheExpire) ? fixCacheExpire : this._options.cacheExpire;
	this._fs.writeAsync(cacheFile, cacheObj);
};

FileCacheService.prototype.get = function(key) {
	let self = this;
	return new Promise(function(resolve, reject) {
		let cacheFile = util.format('%s.%s.json', self._options.prefix, key);
		self._fs.readAsync(cacheFile, 'jsonWithDates')
			.then(function(cache) {
				if(!cache || cache === null) {
					return resolve(null);
				}

				let currentTime = (new Date()).getTime();
				let cacheExpire = (cache.cacheExpire) ? cache.cacheExpire : self._options.cacheExpire;
				if(currentTime - cache.cachedOn >= cacheExpire) {
					return resolve(null);
				}
				return resolve(cache.content);
			})
			.catch(function(error) {
				debug('fail read from cache %s', cacheFile);
				return reject(error);
			});
	});
};

exports = module.exports = FileCacheService;
