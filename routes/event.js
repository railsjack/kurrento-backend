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
router.get('/:id/get', async function (req, res) {
    const data = await eventCtrl.getDataByEventId(req.params);
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
router.post('/checkPresenter', async function (req, res){
    const {user_id, event_id} = req.body;
    const data = await eventCtrl.checkPresenter(user_id, event_id);
    res.json(data);
})
module.exports = router;
