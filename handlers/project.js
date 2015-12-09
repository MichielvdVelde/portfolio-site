"use strict";

const debug = require('debug')('handler:project');
const marked = require('marked');
const GithubService = require('../services/GithubService');

exports = module.exports = function(request, reply) {

	// GithubService.getReadmeForRepo('MichielvdVelde', request.params.project_name, function(error, readme) {
	// 	if(error) reply.view('error', { error: error });
	// 	readme.markdown = marked(readme.content);
	// 	reply.view('project', { repo: repo, readme: readme });
	// });


	GithubService.get().getRepository(request.params.project_name)
		.then(function(repo) {
			return reply.view('project', { repository: repo });
		})
		.catch(function(error) {
			debug('get repos error');
			return reply.view('error', { error: error });
		});
};
