# soundcloud-api-client

Node.js module for the [SoundCloud API](http://soundcloud.com). See full API documentation [here](https://developers.soundcloud.com/docs/api/reference).

## Table of Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API](#api)
- [Examples](#examples)
- [Further information](#further-information)
- [License](#license)

## Getting Started

In order to use the module, you need to acquire a `client_id` for your application, which can be obtained from [SoundCloud for Developers page](https://developers.soundcloud.com/).

### Installation

This library can be installed through npm:

```
$ npm install --save soundcloud-api-client
```

### Usage

The following example shows how to initialize the library and perform a search request with sample criteria.

```js
const SoundCloud = require('soundcloud-api-client');

const client_id = 'your-client-id';
const soundcloud = new SoundCloud({ client_id });

const q = 'live mix';
const genres = [ 'house', 'tech-house', 'techno' ].join(',');

soundcloud.get('/tracks', { q, genres })
    .then(tracks => /* process tracks */)
    .catch(e => /* handle error */);
```

The next example demonstrates how to fetch 10 most recent user comments.

```js
const user = 'user-name-or-id'; // user id is necessary to fetch user tracks
const offset = 0;
const limit = 10;

soundcloud.get(`/users/${user}/comments`, { offset, limit })
    .then(comments => /* process comments */)
    .catch(e => /* handle error */);
```

### API

The main export of this library is the SoundCloud class.

#### SoundCloud

The SoundCloud constructor accepts a `config` object which may contain one or more of the following options:

* `client_id` – Your client Id (required)
* `hostname` – Override the default host API calls are issued to

#### get

Performs a get request. The method takes two parameters:

* `pathname` – Request pathname or URL (required)
* `params` – Request parameters (see API documentation page for possible values)

#### download

Saves the specified resource to the local file system. The method takes two parameters:

* `pathname` – Remote pathname or URL (required)
* `filename` – Local pathname (required)

## Examples

Various examples can be found in the [examples directory on GitHub.com](https://github.com/iammordaty/soundcloud-api-client/tree/master/examples). Also have a look at the [RunKit](https://npm.runkit.com/soundcloud-api-client), where you can test this library.

## Further information

 - [SoundCloud HTTP API Reference](https://developers.soundcloud.com/docs/api/reference)

## License

soundcloud-api-client is licensed under the MIT License.
