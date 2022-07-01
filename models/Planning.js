const _ = require('lodash');
const { DataTypes } = require('sequelize');
const utils = require('../lib/utils');
const api = require('../api');
const Presence = require('./Presence')

let Planning = null;

const init = async (sequelize) => {

    Planning = sequelize.define('planning', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        id_employee: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_presence: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    }, 
    {
        timestamps: true
    });

    // await Planning.sync({ force: true, match: /_test$/ });
    await Planning.sync();

};

/**
 * 
 */
const get = async (payload) => {

    const presence = await Presence.get();
    const employees = await api.getEmployees({ token: payload.token });

    const response = payload.where === null || payload.where === undefined ?
                     await Planning.findAll() :
                     await Planning.findAll({
                        where: {
                            id_employee: _.find(employees.data, item => { 
                                return item.username.toUpperCase() === payload.where.toUpperCase() 
                            }).id
                        }
                     });
    
    const response_mapped = _.map(response, item => {
        return {
            id: item.id,
            date: item.date,
            id_employee: item.id_employee,
            id_presence: item.id_presence,
            employee: _.find(employees.data, o => { return parseInt(o.id) === parseInt(item["id_employee"])}).username,
            presence: _.find(presence.data, o => { return parseInt(o.id) === parseInt(item["id_presence"]) }).presence
        }
    });

    return where !== null && where !== undefined ?
           { data: response_mapped } :
           { data: utils.pagination(response_mapped, payload.page, payload.rows) }
};

/**
 * 
 * @param {*} token 
 * @param {*} payload 
 * @returns 
 */
const _get_payload = async (payload) => {

    const presence = await Presence.get(payload.presence);
    const employee = await api.getEmployees({ toekn: payload.token, where: payload.username});

    return {
        id_employee: employee.data[0].id,
        id_presence: presence.id,
        date: payload.date
    }

}

/**
 * 
 */
const post = async (payload) => {
    const p = await _get_payload(payload);
    const [warehouse, created] = await Planning.findOrCreate({
        where: p
    });
    return created ? JSON.stringify(warehouse) : null;
}

/**
 * 
 */
const put = async (payload) => {
    const p = _get_payload(payload);
    
    let warehouse = await Planning.update({
        id_employee: p.id_employee,
        id_presence: p.id_presence,
        date: payload.date
    }, {
        where: {
            id: payload.id
        }
    });
    return parseInt(warehouse[0]) == 1 ? 'Ok' : '';
}

/**
 * 
 */
const del = async (payload) => {

    let warehouse = await Planning.destroy({
        where: {
            id: payload.id
        }
    });

    return parseInt(warehouse) == 1 ? 'Ok' : '';
};

const get_gRPC = (call, callback) => {

    get({ 
        toke: call.request["token"], 
        where: call.request["where"], 
        page: call.request["page"], 
        rows: call.request["rows"]
    }).then(response => {
        callback(null,response);
    }).catch(err => {
        callback(err, null);
    });
  
};

/**
 * 
 */
const post_gRPC = (call, callback) => {
    
    post(call.request).then(result => {
        callback(null, { result: result , error: result === null ? 'record già inserito' : null });
    }).catch(err => {
        callback(err, { result: null , error: err });
    })
}

/**
 * 
 */
const put_gRPC = (call, callback) => {
    
    put(call.request).then(result => {
        callback(null, { result: result , error: null });
    }).catch(err => {
        callback(err, { result: null , error: err });
    })
}

/**
 * 
 */
const del_gRPC = (call, callback) => {
    
    del(call.request).then(result => {
        callback(null, { result: result , error: null });
    }).catch(err => {
        callback(err, { result: null , error: err });
    })
}

module.exports = {
    Planning,
    init,
    get_gRPC,
    get,
    post,
    post_gRPC,
    put,
    put_gRPC,
    del,
    del_gRPC
}