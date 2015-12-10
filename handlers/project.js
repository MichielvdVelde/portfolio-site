"use strict";

const debug = require('debug')('handler:project');
const marked = require('marked');
const GithubService = require('../services/GithubService');
const NpmDownloadsService = require('../services/NpmDownloadsService');

exports = module.exports = function(request, reply) {


	GithubService.get().getRepositories()
		.then(function(repos) {
			debug('repos loaded');
			let repo = null;
			if(!repos || repos === null) repos = [];
			for(let singleRepo of repos) {
				if(singleRepo.name === request.params.project_name) {
					repo = singleRepo;
					break;
				}
			}
			if(!repo || repo === null) {
				debug('REPO NAME %s not found', request.params.project_name);
				throw new Error('repo ' + request.params.project_name + ' not found');
			}
			GithubService.get().getRepositoryFile(request.params.project_name, 'README.md')
				.then(function(readme) {
					if(readme) readme.markdown = marked(readme.content);
					GithubService.get().getRepositoryFile(request.params.project_name, 'package.json')
						.then(function(pkg) {
							// TODO: use async to make the code cleaner
							GithubService.get().getRepositoryCommits(request.params.project_name)
								.then(function(commits) {
									GithubService.get().getRepositoryContributors(request.params.project_name)
										.then(function(contributors) {
											NpmDownloadsService.get().getPoint(request.params.project_name, 'last-day')
												.then(function(downloadsLastDay) {
													NpmDownloadsService.get().getPoint(request.params.project_name, 'last-week')
														.then(function(downloadsLastWeek) {
															NpmDownloadsService.get().getPoint(request.params.project_name, 'last-month')
																.then(function(downloadsLastMonth) {
																	let scope = {
																		'github': {
																			'repository': repo,
																			'contributors': contributors,
																			'commits': commits,
																			'files': { }
																		}
																	};
																	if(readme) {
																		scope.github.files.readme = readme;
																	}
																	if(pkg) {
																		scope.github.files.package = pkg;
																		scope.npm = {
																			'package': pkg.content
																		};
																	}
																	if(downloadsLastDay || downloadsLastWeek || downloadsLastMonth) {
																		if(!scope.npm) scope.npm = {};
																		scope.npm.downloads = {};
																		if(downloadsLastDay) scope.npm.downloads.lastDay = downloadsLastDay.downloads;
																		if(downloadsLastWeek) scope.npm.downloads.lastWeek = downloadsLastWeek.downloads;
																		if(downloadsLastMonth) scope.npm.downloads.lastMonth = downloadsLastMonth.downloads;
																	}
																	return reply.view('project', scope);
																});
														});
											})
											.catch(function(error) {
												debug('get npm downloads error: %s', error.message);
												return reply.view('error', { error: error });
											});
										})
										.catch(function(error) {
											debug('get contributors eror: %s', error.message);
											return reply.view('error', { error: error });
										});
								})
								.catch(function(error) {
									debug('get commits error');
									return reply.view('error', { error: error });
								});
						})
						.catch(function(error) {
							debug('get package.json error');
							return reply.view('error', { error: error });
						});
				})
				.catch(function(error) {
					debug('get readme error');
					return reply.view('error', { error: error });
				});
		})
		.catch(function(error) {
			debug('get repos error');
			return reply.view('error', { error: error });
		});
};
