const response = {
    response: {
        200: {
            title: "TimeReport Response JSON object",
            description: "Schema for TimeReport Response JSON object",
            type: "object",
            properties: {
                data: { 
                    type: 'object'
                },
                _links: {
                    type: 'object'
                }
            },
            required: ["data", "_links"]
        }
    }
};

const headers = {
    type: 'object',
    properties: {
        'Authentication': { type: 'string' }
    },
    required: ['Authentication']
};

const bodyPresence = {
    $id: 'timereportSchemaPresence',
    type: 'object',
    title: 'TimeReport Schema Presence',
    properties: {
        presence: { 
            type: 'string'
        }
    },
    required: ['presence']
}

const bodyPlanning = {
    $id: 'timereportSchemaPlanning',
    type: 'object',
    title: 'TimeReport Schema Planning',
    properties: {
        username: { 
            type: 'string'
        },
        presence: {
            type: 'string'
        },
        date: {
            type: 'string'
        }
    },
    required: ['username', 'presence', 'date']
}

module.exports = {
    response,
    headers,
    bodyPresence,
    bodyPlanning
}