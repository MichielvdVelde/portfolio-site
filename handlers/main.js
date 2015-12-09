"use strict";

let debug = require('debug')('handler:main');
let GithubService = require('../services/GithubService');

exports = module.exports = function(request, reply) {

	GithubService.get().getRepositories(5)
		.then(function(repos) {
			return reply.view('main', { repositories: repos });
		})
		.catch(function(error) {
			debug('get repos error');
			return reply.view('error', { error: error });
		});

};
