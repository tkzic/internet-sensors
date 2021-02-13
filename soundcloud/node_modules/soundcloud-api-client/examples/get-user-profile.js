const SoundCloud = require('..');

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const soundcloud = new SoundCloud({ client_id });

const username = 'jwagener';

soundcloud.get(`/users/${username}`).then(user => {
    const stringifiedUser = JSON.stringify(user, null, 2);

    console.log(stringifiedUser);
}).catch(({ message }) => console.error('An error occurred:', message));
