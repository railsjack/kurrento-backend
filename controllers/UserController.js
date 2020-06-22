import { OsvUser} from "../database/model";
class UserController {

    constructor(){
     
    }
    getUsersFieldsByParams(filters, fields={}){
        return new Promise((resolve, reject) => {
            OsvUser.find(filters,fields, (err, events) => {
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
}



export default UserController;
