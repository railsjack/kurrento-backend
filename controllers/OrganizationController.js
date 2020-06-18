import fs from "fs";
import path from "path";

const config = require('../config/config.' + process.env.MODE.toLowerCase());
import base64Img from 'base64-img';
import rimraf from "rimraf";
import {OsvOrgs, OsvOrgStaff} from "../database/model";

class OrganizationController {

    getBgImagesPath(org_id) {

        const bgImagesPath = config.filePath.org.bgImages + '/' + org_id;
        if (!fs.existsSync(bgImagesPath)) fs.mkdirSync(bgImagesPath, {recursive: true});
        return bgImagesPath;
    }

    getLogoUrlPath(org_id) {
        const logoPath = config.filePath.org.logoURL + '/' + org_id;
        if (!fs.existsSync(logoPath)) fs.mkdirSync(logoPath, {recursive: true});
        return logoPath;
    }

    getValidBase64Image(image) {
        return image.replace(/name\=.*?;/, '');
    }

    saveStaffInfoIntoDB(params) {
        let {user_id, org_id, role} = params;
        OsvOrgStaff.find({
            org_id,
            user_id
        }, (err, osvStaff) => {
            let staff;
            if (err) {
                return {data: config.exceptionHandlers.DB_CONNECTION_ERROR};
            } else {
                if (osvStaff.length > 0) {
                    staff = osvStaff[0];
                } else {
                    staff = new OsvOrgStaff();
                    staff.user_id = user_id;
                    staff.org_id = org_id;
                }
                staff.role = role;
                staff.last_login_time = new Date();
                staff.save();
            }
        });
        return {data: config.exceptionHandlers.STAFF_INFO_SAVED}
    }

    saveOrgInfoIntoDB(params) {

        let {org_id, owner_user_id, name, logo_url, bg_images} = params;
        OsvOrgs.find({
            org_id
        }, (err, osvOrg) => {
            let org;
            if (err) {
                return {data: config.exceptionHandlers.DB_CONNECTION_ERROR};
            } else {
                if (osvOrg.length > 0) {
                    org = osvOrg[0];
                } else {
                    org = new OsvOrgs();
                    org.org_id = org_id;
                    org.owner_user_id = owner_user_id;
                    org.created_at = new Date();
                }
                org.name = name;
                org.logo_url = logo_url;
                org.bg_images = bg_images;
                org.save();
                return {data: config.exceptionHandlers.ORG_INFO_SAVED}
            }
        });
        return {data: config.exceptionHandlers.ORG_INFO_SAVED}
    }

    saveData(params) {
        let {name, org_id, owner_user_id, bg_images, logo_url} = params;
        let isNew = false;
        if (!org_id) isNew = true;
        if (isNew) org_id = String(Date.now()).substr(1, String(Date.now()).length)
        const bgImagesPath = this.getBgImagesPath(org_id);
        const logoPath = this.getLogoUrlPath(org_id);
        let logoImage = this.getValidBase64Image(logo_url);
        const logoResponse = config.getImgRelativePath(base64Img.imgSync(logoImage, logoPath, Date.now()));
        let backgroundImageArray = [];

        bg_images.forEach((img) => {
            img = this.getValidBase64Image(img);
            backgroundImageArray.push(config.getImgRelativePath(base64Img.imgSync(img, bgImagesPath, Date.now())));
        });

        const dbResponse = this.saveOrgInfoIntoDB({
            org_id,
            owner_user_id,
            name,
            logo_url: logoResponse,
            bg_images: backgroundImageArray
        });

        if (isNew && dbResponse.data.result === 'success') {
            const staffResponse = this.saveStaffInfoIntoDB({user_id: owner_user_id, org_id, role: 'owner'});
            return {data: config.exceptionHandlers.ORG_INFO_SAVED};

            if (staffResponse.data.result == 'success') {
                return {data: config.exceptionHandlers.ORG_INFO_SAVED};
            } else {
                return {data: config.exceptionHandlers.DB_CONNECTION_ERROR};
            }
        } else {
            return dbResponse;
        }

    }

    getDataByUserId(params) {
        let user_id = params.user_id;
        return new Promise((resolve, reject) => {
            OsvOrgs.find({owner_user_id: user_id}, (err, orgs) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
                } else {
                    resolve({
                        status: 200,
                        msg: 'Successfully listed.',
                        result: 'success',
                        data: orgs
                    });
                }
            });
        })
    }
    getOrgById(params){
        const org_id = params.id;
        return new Promise((resolve, reject) => {
            OsvOrgs.find({org_id}, (err, orgs) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
                } else {
                    resolve({
                        status: 200,
                        msg: 'Successfully fetched.',
                        result: 'success',
                        data: orgs
                    });
                }
            });
        })
    }
    deleteOrgStaffByOrgId(org_id) {
        return new Promise(async (resolve, reject) => {
            try {
                OsvOrgStaff.deleteMany({org_id},(err,staff)=>{
                    if(err){
                        reject(config.exceptionHandlers.DB_CONNECTION_ERROR)
                    }else{
                        resolve(config.exceptionHandlers.STAFF_INFO_DELETED);
                    }
                });
            } catch (e) {
                console.log(e);
                reject(config.exceptionHandlers.DB_CONNECTION_ERROR)
            }
        })
    }

    deleteOrg(params) {
        const org_id = params['org_id'];
        return new Promise((resolve, reject) => {
            OsvOrgs.find({org_id}, async (err, orgs) => {
                if (err) {
                    reject({data: config.exceptionHandlers.DB_CONNECTION_ERROR});
                } else {
                    const org = orgs[0];
                    if (org.bg_images) {
                        const bgImgDir = path.join(__dirname, '../' + path.dirname(org.bg_images[0]));
                        if (fs.existsSync(bgImgDir)) {
                            rimraf(bgImgDir,()=>{console.log('bgImgDir done')});
                        }
                    }
                    if (org.logo_url) {
                        const logoImgDir = path.join(__dirname, '../' + path.dirname(org.logo_url));
                        if (fs.existsSync(logoImgDir)){
                            rimraf(logoImgDir,()=>{console.log('logoImgDir done')});
                        }
                    }
                    await this.deleteOrgStaffByOrgId(org_id);
                    await OsvOrgs.deleteMany({org_id});
                    resolve(config.exceptionHandlers.ORG_INFO_DELETED)
                }
            })
        });
    }
}

export default OrganizationController;
