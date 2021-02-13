const SoundCloud = require('..');

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const soundcloud = new SoundCloud({ client_id });

const username = 'jodywisternoff';
const limit = 10;
const offset = 0;

soundcloud.get(`/users/${username}/comments`, { limit, offset }).then(comments => {
    console.log(`${comments.length} ${username}'s recent comments:\n`);

    comments.forEach(({ body }) => console.log(`* ${body}`));
}).catch(({ message }) => console.error('An error occurred:', message));
