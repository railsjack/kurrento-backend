import * as express from 'express';
import OsvUser from "../database/model/osv_user.model";
import OsvOauthLink from "../database/model/osv_user_oauth_link.model";

const config = require('../config/config.' + process.env.MODE.toLowerCase());
const router = express.Router();
const rp = require('request-promise');

router.post('/facebook', async function (req, res) {
    const params = req.body.data;
    const options = {
        method: 'GET',
        url: `https://graph.facebook.com/me?access_token=${params.oauth_token}`,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };
    rp(options)
        .then((facebookResponse => {
            if (facebookResponse.name && facebookResponse.id) {
                let user;
                /*Saving user information info osv_user collection*/
                OsvUser.find({
                    user_id: facebookResponse.id,
                    name: facebookResponse.name
                }, (err, osvUser) => {
                    if (err) {
                        return res.json({data: config.exceptionHandlers.DB_CONNECTION_ERROR})
                    } else {
                        if (osvUser.length > 0) {
                            user = osvUser[0];
                        } else {
                            user = new OsvUser();
                            user.email = params.email;
                            user.user_id = params.user_id;
                            user.name = params.name;
                            user.is_email_validated = true;
                        }
                        user.last_logged_in_time = new Date();
                        user.email_validate_token = params.oauth_token;
                        user.save();
                        /*Saving user token info osv_user_oauth_link collection.*/
                        OsvOauthLink.find({
                            user_id: facebookResponse.id
                        }, (err, osvOauthLink) => {
                            let link;
                            if (err) {
                                return res.json({data: config.exceptionHandlers.DB_CONNECTION_ERROR})
                            } else {
                                if (osvOauthLink.length > 0) {
                                    link = osvOauthLink[0];
                                } else {
                                    link = new OsvOauthLink();
                                    link.user_id = facebookResponse.id
                                }
                                link.oauth_type = params.oauth_type;
                                link.oauth_token = params.oauth_token;
                                link.save();
                                return res.send(config.exceptionHandlers.USER_INFO_SAVED)
                            }
                        });
                    }
                })
            } else {
                res.send(config.exceptionHandlers.USER_OAUTHTOKEN_INVALID)
            }
        }))
        .catch((error) => {
            res.send(config.exceptionHandlers.NETWORK_NOT_FOUND);
        });
});

module.exports = router;
