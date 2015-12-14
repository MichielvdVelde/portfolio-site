"use strict";

const debug = require('debug')('NpmDownloadsService');
const extend = require('extend');

const util = require('util');

const DEFAULT_OPTIONS = {
	//
};

let NpmDownloadsService = function(npm, cache, options) {
	if(!npm || !cache) throw new Error('npm and cache required');

	this._api = npm;
	this._cache = cache;
	this._options = extend(true, DEFAULT_OPTIONS, options);
};

NpmDownloadsService.prototype.getPoint = function(name, period) {
	if(!period) period = 'last-day';
	let self = this;
	return new Promise(function(resolve, reject) {
		let cachePath = util.format('%s/npm/downloads/%s', name, period);
		debug('getPoint cache path is %s', cachePath);
		self._cache.get(cachePath)
			.then(function(point) {
				if(point && point.error) {
					point = {
						'downloads': 0,
						'unavailable': true
					};
					return resolve(point);
				}

				// No cache
				self._api.getPoint(name, period)
					.then(function(point) {
						self._cache.set(cachePath, point, 43200 * 1000); // 12h
						if(point && point.error) {
							point = {
								'downloads': 0,
								'unavailable': true
							};
						}
						return resolve(point);
					})
					.catch(function(error) {
						debug('getPoint API error: %s', error.message);
						console.error(error);
						return reject(error);
					});
			})
			.catch(function(error) {
				debug('getPoint error: %s', error.message);
				console.error(error);
				return reject(error);
			});
	});
};

let instance = null;
exports.createService = module.exports.createService = function(npm, cache, options) {
	if(instance || instance !== null) throw new Error('service already created');
	instance = new NpmDownloadsService(npm, cache, options);
	return instance;
};

exports.get = function() {
	if(!instance || instance === null) throw new Error('service not created yet');
	return instance;
};
