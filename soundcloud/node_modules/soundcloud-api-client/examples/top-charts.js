const SoundCloud = require('..');

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const hostname = 'api-v2.soundcloud.com';
const soundcloud = new SoundCloud({ client_id, hostname });

const genre = 'techno';
const limit = 25;

const params = {
    limit,
    kind: 'top',
    genre: `soundcloud:genres:${genre}`
};

soundcloud.get('/charts', params).then(({ collection }) => {
    console.log(`${limit} most played tracks on SoundCloud this week:\n`);

    collection.forEach(({ score, track }, i) => {
        const playCount = parseFloat(score / 1000).toFixed(2);

        console.log(`${i + 1}. ${track.title} (${playCount}K plays)`);
    });
}).catch(({ message }) => console.error('An error occurred:', message));
