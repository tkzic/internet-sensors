const SoundCloud = require('..');

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const soundcloud = new SoundCloud({ client_id });

const params = {
    "duration[from]": 120000,
    "duration[to]": 180000,
    limit: 1,
    streamable: true,
};

soundcloud.get('/tracks', params).then(([ track ]) => {
    const { id, user, title, permalink, stream_url } = track;

    const filename = `${permalink}.mp3`;
    const { username } = user;

    console.log(`Downloading track ${username} – ${title} (#${id}) to "${filename}"...`);

    soundcloud.download(stream_url, filename)
        .then(() => console.log('Done!'))
        .catch(({ message }) => console.error('Saving failed: ', message));
}).catch(({ message }) => console.error('An error occurred:', message));
