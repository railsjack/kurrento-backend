import fs from "fs";
import path from "path";
const config = require('../config/config.' + process.env.MODE.toLowerCase());

class ImageUtils {

    getImgRelativePath(absolutePath) {
        if (path.isAbsolute(absolutePath)) {
            return '\\' + absolutePath.substr(absolutePath.indexOf('public'), absolutePath.length);
        }
        return;
    }

    getOrgBgImagesPath(org_id) {

        const bgImagesPath = config.filePath.org.bgImages + '/' + org_id;
        if (!fs.existsSync(bgImagesPath)) fs.mkdirSync(bgImagesPath, {recursive: true});
        return bgImagesPath;
    }

    getOrgLogoUrlPath(org_id) {
        const logoPath = config.filePath.org.logoURL + '/' + org_id;
        if (!fs.existsSync(logoPath)) fs.mkdirSync(logoPath, {recursive: true});
        return logoPath;
    }

    getValidBase64Image(image) {
        return image.replace(/name\=.*?;/, '');
    }

    getEventBgImagesPath(event_id){
    	const bgImagesPath = config.filePath.event.bgImages + '/' + event_id;
        if (!fs.existsSync(bgImagesPath)) fs.mkdirSync(bgImagesPath, {recursive: true});
        return bgImagesPath;
    }
    getEventVideoWaterMarkPath(event_id){
        const waterMarkPath = config.filePath.event.waterMarks + '/' + event_id;
        if (!fs.existsSync(waterMarkPath)) fs.mkdirSync(waterMarkPath, {recursive: true});
        return waterMarkPath;
    }

}
export default ImageUtils;