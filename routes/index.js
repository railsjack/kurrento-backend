const path = require('path');
const express = require('express');
const socket_api = require('./socket_api');
const auth = require('./auth');
const org = require('./org');
const event = require('./event');
module.exports = function (app, SocketEvent) {
    /*Requests handling from frontend*/
    app.use('/api/socket_api', (req, res, next) => {
        req.SocketEvent = SocketEvent;
        console.log(SocketEvent);
        next();
    }, socket_api);
    app.use('/api/auth', auth);
    app.use('/api/org', org);
    app.use('/api/event', event);

    /*Serving static files.*/
    app.use('/', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/events/new', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/events/list', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/events/:id/edit', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/organization/new', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/organization/list', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/organization/:id/edit', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/events/:id/:name/live', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/event/:id', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/home', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/signin', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/default/presenters/', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/default', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/signup', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/presenters/all', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/presenters/:id/:username/:audience_room/live', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/_PRESENT_/:id', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/presenters/:id', express.static(path.join(__dirname, '../../frontend/build')));
    app.use('/static', express.static(path.join(__dirname, '../../frontend/build/static')));
    app.use('/assets', express.static(path.join(__dirname, '../../frontend/build/assets')));
    app.use('/public', express.static(path.join(__dirname, '../public')));
};
