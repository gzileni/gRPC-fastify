const _ = require('lodash');
const axios = require('axios');
const utils = require('../lib/utils');

/**
 * 
 * @param {*} token 
 * @returns 
 */
const getEmployees = async (payload) => {

    /**
     * TODO: connect to another gRPC Server
     */


    /**
     * connect to externale Server REST API 
     */
    var config = {
        method: 'GET',
        url: process.env.API,
        headers: { 
            'X-AuthToken': payload.token, 
            'Content-Type': 'application/json'
        }
    };

    const response = await axios(config);
    /** TODO: apply where condition if exists */

    /** return data with pagination */
    return { data: utils.pagination(response.data, payload.page, payload.rows) }

};

/**
 * gRPC services
 * @param {*} call 
 * @param {*} callback 
 */
const getEmployees_gRPC = (call, callback) => {

    getEmployees({
        token: call.request["token"],
        where: call.request["where"],
        page: call.request["page"],
        rows: call.request["rows"]
    }).then(response => {
        callback(null, response);
    }).catch(err => {
        callback(err, null);
    })

}

module.exports = {
    getEmployees,
    getEmployees_gRPC
}