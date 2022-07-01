const { Sequelize } = require('sequelize');
const _ = require('lodash');

const Presence = require('./Presence');
const Planning = require('./Planning');

let sequelize = null;

const connect = (url) => {
    sequelize = new Sequelize(url, { logging: false });
}

/**
 * initialize database
 * @param {*} environments 
 */
const init = async (environments) => {
    const url = `postgres://${environments.POSTGRES_USER}:${environments.POSTGRES_PASSWORD}@${environments.POSTGRES_URL}:${environments.POSTGRES_PORT}/${environments.POSTGRES_DATABASE_NAME}`;
    connect(url);
    
    /** create schema */
    const schemas = await sequelize.showAllSchemas({ logging: false });
    if (!schemas.includes('administration')) {
        await sequelize.createSchema('administration');
    };

    Presence.init(sequelize);
    Planning.init(sequelize);
    
}

module.exports = {
    init,
    Presence,
    Planning
}