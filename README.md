# inlive-js-sdk
Inlive JavaScript SDK for developing with inLive platform so our user can use it easily on building their own live streaming website or application that use web based technology without worrying about the manual process of integrating our inLive APIs into their platform.

## Prerequisites

Before you run your project, please make sure that you have a package manager. We recommend you to use [NPM](https://www.npmjs.com/) which should already be installed alongside [Node.js](https://nodejs.org/en/). With NPM, you can download and install the InLive Javascript SDK into your project.

You can verify if you have installed Node.js by running this command in your terminal:
```bash
$ node -v
```

## Installation inLive JS SDK
In your frontend project, install the inLive Javascript SDK by running this command:
```bash
$ npm install @inlivedev/inlive-js-sdk
```

## Usage
InLive Javascript SDK consists of 2 main modules : 
- Live streaming module
- Widget module (coming soon)

### Initialization
Before starting to use those modules, you need to initialize it first with your API Key & Widget Key on your project. If you do not have any API Key or Widget Key, kindly read [this documentation](#http://link-to-sdk-website-documentation-part-initialize) on how to get it.

```js
import { InLiveApp } from '@inlivedev/inlive-js-sdk/app';

const inliveApp = InLiveApp.init({
  apiKey: 'apiKey',
  widgetKey: '', // optional: define this when using the widget module
});
```

### Live stream module
For using live stream module, you can import in on your project file as :
```js
import { InLiveStream } from '@inlivedev/inlive-js-sdk/stream';
```

You will need to use this module if you want to develop a live streaming application. Our live stream module will help you to be able to :
1. Create a new live streaming.
2. Prepare the stream pod and initiate webRTC connection after stream created.
3. Start a live stream after the stream preparation is finished and the stream is ready to start.
4. End a live stream after the stream is started.
5. Get a specific stream’s data based on the ID (so you will get HLS or MPEG-DASH manifest url for your video player)
6. Get a list of streams data

For the full list of features inside our live stream modules, as well as additional guides, see our [inLive Javascript SDK Live Stream Modules docs](#http:/link-to-sdk-website-documentation-part-live-stream-modules).

#### Create a new stream
You can create a new stream by calling `createStream` module. You're required to pass `inLiveApp` return value from [initialization step above](#initialization).

```js
const stream = InLiveStream.createStream(inliveApp, {
 name: 'a new stream', //required
 description: '', //optional
 slug: 'new-stream'//optional
});
```

#### Prepare live stream
After stream created, you can prepare the live stream pod and initiate webRTC connection with `prepareStream` module. The `stream_id` can be got from `createdStream` return value.

```js
const prepareStream = InLiveStream.prepareStream(inliveApp, { stream_id: 1 });
```

#### Start live stream
Finally you can start a live stream by using `startStream` module to start running the stream pod in the server.

```js
const startStream = InLiveStream.startStream(inliveApp, { stream_id: 1 });
```

#### End live stream
After the streaming started for a while, you can use `endStream` module to end the stream because it will stop the running stream pod in the server.

```js
const endStream = InLiveStream.endStream(inliveApp, { stream_id: 1 });
```

#### Get specific live stream
For you to get a HLS or MPEG-DASH manifest URL to run the playing stream on your video player, you can use `getStream` module. On this module, we don't need to pass `inLiveApp` because no need of API Key.

```js
const getStream = InLiveStream.getStream(stream_id);
```

#### Get list of streams
In case you would like to see your list streams that you've created, you can use `getStreams` module.

```js
const getStreams = InLiveStream.getStreams(inliveApp);
```

## Help
For more information regarding inLive Javascript SDK, you can read our [inLive Javascript SDK documentation](#http://link-to-sdk-website-documentation).

If you're looking for help, kindly [contact us](mailto:hello@inlive.app).