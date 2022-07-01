const _ = require('lodash');
const { DataTypes } = require('sequelize');
const utils = require('../lib/utils');

let Presence = null;

const init = async (sequelize) => {

    Presence = sequelize.define('presence', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        presence: {
            type: DataTypes.STRING,
            allowNull: false,
            set(value) {
                this.setDataValue('presence', value.toLowerCase());
            }
        }
    }, 
    {
        timestamps: true,
        schema: 'administration'
    });

    // await Presence.sync({ force: true, match: /_test$/ });
    await Presence.sync();

    const status_values = ['Ferie', 'Permesso', 'Smart Working', 'Mattina', 'Pomeriggio', 'Notte'];

    _.forEach(status_values, async item => {
        const s = await Presence.findAll({
            where: {
                presence: item.toLowerCase()
            }
        });

        if (_.size(s) == 0) {
            Presence.create({ presence: item });
        }
    });

};

/**
 * 
 */
const get = async (payload) => {
    
    const response = payload.where === null || payload.where === undefined ?
        await Presence.findAll() :
        await Presence.findAll({
            where: {
                presence: payload.where
            }
        });
    
    return payload.where !== null && payload.where !== undefined ?
           { data: response } :
           { data: utils.pagination(response, payload.page, payload.rows) }
    
};

const get_gRPC = (call, callback) => {

    get({
        where: call.request["where"], 
        page: call.request["page"], 
        rows: call.request["rows"]
    }).then(response => {
        callback(null, response);
    }).catch(err => {
        callback(err, null);
    });
  
};

/**
 * 
 */
const post = async (payload) => {

    console.log(JSON.stringify(payload))
    const [presence, created] = await Presence.findOrCreate({
        where: {
            presence: payload.presence
        }
    });

    return created ? JSON.stringify(presence) : null;
}

/**
 * 
 */
const put = async (payload) => {

    let presence = await Presence.update(payload, {
        where: {
            id: payload.id
        }
    });

    return parseInt(presence[0]) == 1 ? 'Ok' : '';
}

/**
 * 
 */
const del = async (payload) => {

    let presence = await Presence.destroy({
        where: {
            id: payload.id
        }
    });

    return parseInt(presence) == 1 ? 'Ok' : '';
}

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
    Presence,
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