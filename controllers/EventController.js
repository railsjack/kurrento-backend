import fs from "fs";
import path from "path";
import base64Img from 'base64-img';
import rimraf from "rimraf";
import {ImageUtils} from '../utils';
import { OsvEvents} from "../database/model";
const config = require('../config/config.' + process.env.MODE.toLowerCase());

class EventController {

    constructor(){
        this.imageUtils = new ImageUtils();
    }

    getEventsFieldsByParams(filters, fields={}){
        return new Promise((resolve, reject) => {
            OsvEvents.find(filters,fields, (err, events) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
                } else {
                    resolve({
                        status: 200,
                        msg: 'Successfully listed.',
                        result: 'success',
                        data: events
                    });
                }
            });
        })
    }
    async getDataByUserId(params) {
        return await this.getEventsFieldsByParams({user_id:params.user_id},{_id:0});
    }

    async getDataByEventId(params){
        return await this.getEventsFieldsByParams({event_id:params.id},{_id:0});
        
    }

    saveEventInfoIntoDB(params){
	 	return new Promise((resolve, reject) => {
            let {event_id,user_id, org_id, name, bg_image, default_video_watermark, watermark_position} = params;
            OsvEvents.find({
	            event_id
	        }, (err, osvEvents) => {
	            let event;
	            if (err) {
	                reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
	            } else {
	                if (osvEvents.length > 0) {
	                    event = osvEvents[0];
	                } else {
	                    event = new OsvEvents();
	                    event.event_id = event_id;
	                    event.created_at = new Date();
	                }
                    event.user_id = user_id;
                    event.org_id = org_id;
	                event.name = name;
	                event.default_video_watermark = default_video_watermark;
                    event.watermark_position = watermark_position;
	                event.bg_image = bg_image;
	                event.save();
	                resolve({data:config.exceptionHandlers.EVENT_INFO_SAVED})
	            }
	        });
	        resolve({data: config.exceptionHandlers.EVENT_INFO_SAVED})
        })
    }
    saveData(params) {
    	return new Promise(async (resolve, reject)=>{
	        let {event_id,user_id, org_id, name, bg_image, default_video_watermark, attendance_type,
	            attendance_password, start_time, watermark_position, event_layout} = params;
	        let isNew = false;
	        if (!event_id) isNew = true;
	        if (isNew) event_id = String(Date.now()).substr(1, String(Date.now()).length)
	        const bgImagesPath = this.imageUtils.getEventBgImagesPath(event_id);
	        const waterMarkPath = this.imageUtils.getEventVideoWaterMarkPath(event_id);
	        let watermarkImage = this.imageUtils.getValidBase64Image(default_video_watermark);
	        const waterMarkResponse = this.imageUtils.getImgRelativePath(base64Img.imgSync(watermarkImage, waterMarkPath, Date.now()));

	       	const img = this.imageUtils.getValidBase64Image(bg_image);
	        bg_image = this.imageUtils.getImgRelativePath(base64Img.imgSync(img, bgImagesPath, Date.now()));
	        const dbResponse = await this.saveEventInfoIntoDB({
	            event_id,user_id, org_id, name, bg_image, default_video_watermark:waterMarkResponse, watermark_position
	        });
	        resolve(dbResponse);
    	})
    }
    deleteData(params) {
    	const event_id = params['event_id'];
        return new Promise((resolve, reject) => {
            OsvEvents.find({event_id}, async (err, events) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
                } else {
                    const event = events[0];
                    if (event.bg_image) {
                        const bgImgDir = path.join(__dirname, '../' + path.dirname(event.bg_image));
                        if (fs.existsSync(bgImgDir)) {
                            rimraf(bgImgDir,()=>{console.log('bgImgDir done')});
                        }
                    }
                    if (event.default_video_watermark) {
                        const waterMarkDir = path.join(__dirname, '../' + path.dirname(event.default_video_watermark));
                        if (fs.existsSync(waterMarkDir)){
                            rimraf(waterMarkDir,()=>{console.log('waterMarkDir done')});
                        }
                    }
                    await OsvEvents.deleteMany({event_id});
                    resolve(config.exceptionHandlers.EVENT_INFO_DELETED)
                }
            })
        });
    }

    getAllData(){
    	console.log('hello world');
    	return new Promise((resolve, reject) => {
            OsvEvents.find({},
	            {
	            	_id:0,
	            	bg_image:1,
					default_video_watermark:1,
					event_id:1,
					name:1
	            },
	            async (err, events) => {
	                if (err) {
	                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
	                } else {

	                    resolve({
	                        status: 200,
	                        msg: 'Successfully listed.',
	                        result: 'success',
	                        data: events
	                    });
	                }
	            }
            )
        });
    }
    checkPresenter(user_id, event_id){
        return new Promise((resolve, reject) => {
            OsvEvents.find({user_id, event_id}, (err, events) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR})
                } else {
                    if (events.length > 0) {
                        resolve({result:'success',status:200, msg:'Success.'})
                    } else {
                        reject({result:'error',status:400, msg:'Event doesn\'t exist.'})
                    }
                }
            });
        })
    }
}

export default EventController;
