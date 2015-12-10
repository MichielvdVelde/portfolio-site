"use strict";

const debug = require('debug')('NpmDownloadsService');
const extend = require('extend');
const requestP = require('request-promise');

const util = require('util');

const DEFAULT_OPTIONS = {
	'baseUrl': 'https://api.npmjs.org/downloads',
	'headers': {
		'User-Agent': 'NpmDownloadsApiService v0.0.1 <michiel@artofcoding.nl>'
	},
	'json': true
};

let NpmDownloadsApiService = function(options) {
	this._options = (options) ? extend(true, DEFAULT_OPTIONS, options) : DEFAULT_OPTIONS;
};

NpmDownloadsApiService.prototype.getPoint = function(name, period) {
	let self = this;
	return new Promise(function(resolve, reject) {
		let options = extend(self._options, {
			'uri': util.format('/point/%s/%s', period, name)
		});
		requestP(options)
			.then(function(point) {
				return resolve(point);
			})
			.catch(function(error) {
				debug('getPoint error: %s', error.message);
				console.error(error);
				return reject(error);
			});
	});
};

exports = module.exports = NpmDownloadsApiService;
