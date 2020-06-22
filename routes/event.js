import * as express from 'express';
import fs from 'fs';
import {EventController} from '../controllers';

const config = require('../config/config.' + process.env.MODE.toLowerCase());
const router = express.Router();
const rp = require('request-promise');
const eventCtrl = new EventController();

router.post('/list', async function (req, res) {
    const data = await eventCtrl.getDataByUserId(req.body);
    res.json(data);
});
router.post('/save', async function (req, res) {
    const data = await eventCtrl.saveData(req.body);
    res.json(data);
});
router.post('/delete', async function (req, res) {
    const data = await eventCtrl.deleteData(req.body);
    res.json(data);
});
router.get('/all', async function (req, res){
	const data = await eventCtrl.getAllData();
	res.json(data);
})
module.exports = router;
