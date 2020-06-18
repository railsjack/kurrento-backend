import * as express from 'express';
import OsvUser from "../database/model/osv_user.model";
import OsvOauthLink from "../database/model/osv_user_oauth_link.model";
import fs from 'fs';
import {OrganizationController} from '../controllers';

const config = require('../config/config.' + process.env.MODE.toLowerCase());
const router = express.Router();
const rp = require('request-promise');
const orgCtrl = new OrganizationController();
router.post('/save', async function (req, res) {
    const data = orgCtrl.saveData(req.body);
    res.json(data);
});
router.post('/list', async function (req, res) {
    const data = await orgCtrl.getDataByUserId(req.body);
    res.json(data);
});
router.post('/deleteOrg', async function (req, res) {
    const data = await orgCtrl.deleteOrg(req.body);
    res.json(data);
});
router.post('/getOrgById', async function (req, res) {
    const data = await orgCtrl.getOrgById(req.body);
    res.json(data);
});

module.exports = router;
