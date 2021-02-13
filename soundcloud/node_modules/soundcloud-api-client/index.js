'use strict';

const fs = require('fs');
const rp = require('request-promise');
const { URL } = require('url');

/**
 * SoundCloud API client
 */
class SoundCloud {

    /**
     * @param {Object} config
     */
    constructor ({ client_id, hostname }) {
        this.clientId = client_id;
        this.hostname = hostname || 'api.soundcloud.com';
    }

    /**
     * @api public
     * @param {String} pathname
     * @param {Object} params
     * @returns {Promise}
     */
    get (pathname, params) {
        const options = { json: true, ...params };
        const response = this.request(pathname, options);

        return response;
    }

    /**
     * @api public
     * @param {String} pathname
     * @param {String} filename
     * @returns {undefined}
     */
    async download (pathname, filename) {
        const options = { encoding: null };
        const stream = await this.request(pathname, options);
        const buffer = Buffer.from(stream, 'utf8');

        fs.writeFileSync(filename, buffer);
    }

    /**
     * @api private
     * @param {String} pathname
     * @param {Object} options
     * @returns {Promise}
     */
    request (pathname, { json, encoding, ...params }) {
        const uri = new URL(pathname, `https://${this.hostname}`);
        const qs = { client_id: this.clientId, ...params };

        const options = {
            uri,
            qs,
            json,
            encoding,
        };

        return rp(options);
    }
}

module.exports = SoundCloud;
