const config = {
    as_uri: 'https://video.zuluvideo.com/',
    ws_uri:'ws://video.zuluvideo.com:8888/kurento',
    // ws_uri:'ws://192.168.0.3:8888/kurento',
    server_port: 3000,
    mode: 'server',
    env: {
        local: {
            ssl: {
                key: 'config/keys/localhost/server.key',
                cert: 'config/keys/localhost/server.crt'
            }
        },
        server: {
            ssl: {
                key: 'config/keys/server/server.key',
                cert: 'config/keys/server/server.crt'
            }
        },
    }
};
module.exports = config;
