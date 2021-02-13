const SoundCloud = require('..');

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const soundcloud = new SoundCloud({ client_id });

const username = 'jodywisternoff';
const url = `http://soundcloud.com/${username}`;
const limit = 10;

soundcloud.get('/resolve', { url })
    .then(({ id, track_count }) => {
        console.log(`Username ${username} resolved as id #${id}. User has ${track_count} tracks.`);

        return soundcloud.get(`/users/${id}/tracks`, { limit });
    })
    .then(tracks => {
        console.log(`${tracks.length} recent tracks:\n`);

        tracks.forEach(({ title }) => console.log(`* ${title}`));
    })
    .catch(({ message }) => console.error('An error occurred:', message));
