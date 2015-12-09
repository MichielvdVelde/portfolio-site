"use strict";

let debug = require('debug')('handler:project');
let GithubService = require('../services/GithubService');

exports = module.exports = function(request, reply) {

	GithubService.get().getRepositories()
		.then(function(repos) {
			return reply.view('projects', { repositories: repos });
		})
		.catch(function(error) {
			debug('get repos error');
			return reply.view('error', { error: error });
		});

};
