"use strict";

const debug = require('debug')('server.js');
const Hapi = require('hapi');
const handlers = require('./handlers');

let server = new Hapi.Server();
server.connection({ port: 3000 });

server.register([require('vision'), require('inert'), require('./plugins/GithubPlugin'), require('./plugins/NpmDownloadsPlugin')], function (err) {
    if(err) throw err;

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates',
		partialsPath: 'templates/partials',
        layout: 'base'
    });

    server.route([
        {
            method: 'GET',
            path: '/',
            handler: handlers.main
        },
        {
            method: 'GET',
            path: '/projects',
            handler: handlers.projects
        },
        {
            method: 'GET',
            path: '/projects/{project_name}',
            handler: handlers.project
        },
		{
			method: 'GET',
			path: '/assets/{param*}',
			handler: {
				directory: {
					path: './assets'
				}
			}
		}
    ]);

});

server.start(function () {
    debug('server running at %s', server.info.uri);
});
