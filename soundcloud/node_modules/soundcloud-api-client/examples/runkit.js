const { ValueViewerSymbol } = require("@runkit/value-viewer");
const SoundCloud = require('soundcloud-api-client');

class SoundCloudCharts {
    constructor () {
        const hostname = 'api-v2.soundcloud.com';
        const client_id = 'your-client-id';		 // paste your client id

        this.soundcloud = new SoundCloud({ client_id, hostname });
    }

    async show ({ genre, limit }) {
        const params = {
            limit,
            kind: 'top',
            genre: `soundcloud:genres:${genre}`
        };

        const { collection } = await this.soundcloud.get('/charts', params);

        const title = "Track viewer";
        const HTML = this.getHTML(collection);

        Object.assign(this, collection, { [ValueViewerSymbol]: { title, HTML } });

        return this;
    }

    getHTML (collection) {
        const images = collection.reduce((html, { track }, i) => {
            const { permalink_url, title, user } = track;
            const artwork_url = track.artwork_url || user.avatar_url;

            return `
                ${html}
                <a title="${title}" href="${permalink_url}" target="_blank">
                    <span class="rank">#${i + 1}</span>
                    <img src="${artwork_url}" />
                    <span class="title">${title}</span>
                </a>
            `;
        }, '');

        return `
            <link rel="stylesheet" href="https://guoyunhe.me/demo/flexbin/flexbin.css">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,900">

            <style>
                .flexbin span { color: white; font-family: 'Roboto', sans-serif; left: 10px; position: absolute; }
                .flexbin span.rank { font-size: 20px; font-weight: bold; top: 5px; }
                .flexbin span.title { bottom: 5px; font-size: 12px; }
            </style>

            <div class="flexbin flexbin-margin">
                ${images}
            </div>
        `;
    }
}

const charts = new SoundCloudCharts();

await charts.show({ genre: 'techno', limit: 50 });
