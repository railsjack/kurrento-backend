const path = require('path');
const config = {
    as_uri: 'https://video.zuluvideo.com/',
    ws_uri: 'ws://video.zuluvideo.com:8888/kurento',
    server_port: 3000,
    
    facebook: {
        admin_token: 'ef7c036a5e99dfe9c0c6e3d6949d2b6',
    },

    filePath: {
        org: {
            bgImages: path.join(__dirname, '../public/assets/images/org/bgImages'),
            logoURL: path.join(__dirname, '../public/assets/images/org/logos')
        },
        event:{
            bgImages: path.join(__dirname, '../public/assets/images/event/bgImages'),
            waterMarks :path.join(__dirname, '../public/assets/images/event/waterMarks')
        }
    },
    exceptionHandlers: {
        DB_CONNECTION_ERROR: {
            result: 'error',
            status: 500,
            msg: 'An error occurred while connecting to database.'
        },
        USER_INFO_SAVED: {
            result: 'success',
            status: 200,
            msg: 'User info has been successfully saved.'
        },
        SAME_USER_EXISTS_ERROR: {
            result: 'error',
            status: 409,
            msg: 'Same user is already exist.'
        },
        USER_OAUTHTOKEN_INVALID: {
            result: 'error',
            status: 400,
            msg: 'Invalid OAuth access token.'
        },
        ORG_INFO_SAVED: {
            result: 'success',
            status: 200,
            msg: 'Organization info has been successfully saved.'
        },
        STAFF_INFO_SAVED: {
            result: 'success',
            status: 200,
            msg: 'Organization staff info has been successfully saved.'
        },
        STAFF_INFO_DELETED: {
            result: 'success',
            status: 200,
            msg: 'Organization staff info has been successfully deleted.'
        },
        ORG_INFO_DELETED: {
            result: 'success',
            status: 200,
            msg: 'Organization info has been successfully deleted.'
        },
        EVENT_INFO_DELETED: {
            result: 'success',
            status: 200,
            msg: 'Event info has been successfully deleted.'
        },
        EVENT_INFO_SAVED: {
            result: 'success',
            status: 200,
            msg: 'Event info has been successfully saved.'
        },
        NETWORK_NOT_FOUND: {
            result: 'error',
            status: 500,
            msg: 'A target link can\'t be reached.'
        },
    }
};
module.exports = config;
