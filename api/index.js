const _ = require('lodash');
const axios = require('axios');
const utils = require('../lib/utils');

/**
 * 
 * @param {*} response 
 * @param {*} item 
 * @returns 
 */
const _map_employees = (data) => {

    return _.sortBy(_.map(data, user => {
        return {
            id: user.id,
            name: user.displayText,
            username: user.username,
            role: user.livelloRecord.descrizione
        }
    }), 'id');

}

/**
 * 
 * @param {*} token 
 * @returns 
 */
const getEmployees = async (token, where, page, rows) => {

    let data = JSON.stringify({
        "data": {
            "entity": "utenti",
            "command": "List"
        }
    });

    var config = {
        method: 'post',
        url: process.env.API,
        headers: { 
            'X-AuthToken': token, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    const response = await axios(config);
    const response_mapped = _map_employees(response.data.utentiList);
    return { data: where !== null && where !== undefined ?
             [_.find(response_mapped, item => { return item.username === where })] :
             utils.pagination(response_mapped, page, rows) }

};

/**
 * 
 * @param {*} call 
 * @param {*} callback 
 */
const getEmployees_gRPC = (call, callback) => {

    getEmployees(call.request["token"], call.request["where"], call.request["page"], call.request["rows"]).then(response => {
        callback(null, response);
    }).catch(err => {
        callback(err, null);
    })

}

module.exports = {
    getEmployees,
    getEmployees_gRPC
}