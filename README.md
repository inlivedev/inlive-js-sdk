# InLive JavaScript SDK
Inlive JavaScript SDK is the official JavaScript SDK client for developing a live streaming platform with [inLive](https://inlive.app) infrastructure.

## Prerequisites

Before you run your project, please make sure that you have a package manager. We recommend you to use [NPM](https://www.npmjs.com/) which should already be installed alongside [Node.js](https://nodejs.org/en/).

You can verify if you have installed NPM by running this command in your terminal:
```bash
$ npm -v
```

## How to Install
You can install the InLive JavaScript SDK by running this command
```bash
$ npm install @inlivedev/inlive-js-sdk
```

## Usage
InLive Javascript SDK consists of 2 main modules :
- Live streaming module
- Widget module (coming soon)

### Get Started
To get started, the first thing you need to do is to initialize the SDK on your project. If you do not have any API Key, you can read [how to get an API Key](https://inlive.app/docs/getting-started/#get-an-application-key). Some modules required to pass the returned object from the SDK initialization.

```js
import { InliveApp } from '@inlivedev/inlive-js-sdk/app';

const inliveApp = InliveApp.init({
  apiKey: 'apiKey', // input your API Key here (required)
});
```

### Live stream module
The live stream module can be imported in your project like this

```js
import { InliveStream } from '@inlivedev/inlive-js-sdk/stream';
```

You will need to use the live stream module if you want to develop a live stream platform. The live stream module will help you to:
1. Create a new live stream.
2. Set local stream media and manage the client connection.
3. Prepare a stream session.
4. Initialize a stream session.
5. Start a live stream session.
6. Stop and end a live stream session.
7. Get a specific live stream’s data based on the ID of the stream
8. Get a list of live streams you have created

#### Create a new live stream
You can create a new live stream by calling `createStream` module. You're required to pass the `inLiveApp` variable which is a returned value from the [SDK initialization step above](#get-started).

```js
const stream = InliveStream.createStream(inliveApp, {
 name: 'a new stream', //required
 description: '', //optional
 slug: 'new-stream' //optional
});
```

When the live stream has already created and you want to do a live streaming session, you need to do these steps

#### Set the local stream media
To set media the user want to use, you can use our `media` module. Currently it consists of 2 methods:
- `getUserMedia`: To get the local user media which will prompt the user to get a user permission for camera and audio. This method is similar with [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- `attachMediaElement`: This will attach the media element required to display the camera from the user device to the browser. We recommend to use a HTML video element for the media element.

```js
import { InliveStream } from '@inlivedev/inlive-js-sdk/stream';

const videoElement = document.getElementById('#video');

// Add your camera & audio constraints
const mediaConstraints = {
  video: true,
  audio: true
};

const mediaStream = await InliveStream.media.getUserMedia(
  mediaConstraints
);

const mediaElement = InliveStream.media.attachMediaElement(
  videoElement,
  mediaStream
);
```

#### Manage the client connection

You can manage the client connection by using our `connection` module.
- First, you need to open the connection with our `open` method that will open all connections. Under the hood it will open webrtc connection and connection to the channel server. You can get the value of `mediaStream` and `mediaElement` by using our `media` module.

```js
// open all client connections
const connection = await InliveStream.connection.open({
  streamId,
  mediaStream,
  mediaElement
});
```

After you open the connection, it will expose other methods such as :
- `getPeerConnection` method to check the current status of the peer connection between local and remote peer.
- `close` method to close the all connections.
- `connect` method to connect and established the connection after the live stream session is initialized and remote session description is received.
- `on` method to listen to the event (however, you can also use our [event module](#event-module-using-pubsub)).

```js
const peerConnection = connection.getPeerConnection();

connection.on('stream:ready-to-start-event', () => {
  // handle when the stream is ready to start
});

// remote session description is received when a live stream session is initialized
connection.connect(remoteSessionDescription);

// close all connections
connection.close();
```

After the client connection is opened, you need to prepare a live stream session and initialize a live stream session.

#### Prepare a live stream session
A live stream session is needed to prepare first before you can start doing live streaming. You can get the `streamId` when you are creating a new live stream. This returns a promise.

```js
await InliveStream.prepareStream(inliveApp, {
  streamId: 1 //input streamId
});
```

To listen when a live stream session has finished the preparation and the session is ready to be initialized, you can use the event module we have provided

```js
import { InliveEvent } from '@inlivedev/inlive-js-sdk/event';

InliveEvent.on('stream:ready-to-initialize-event', () => {
  // handle when the live stream has finished the preparation
})
```

#### Initialize a live stream session
After the live stream session has prepared, the live stream session needs to be initialized. The `streamId` and `sessionDescription` are needed for inputs. You can get the `sessionDescription` by accessing the `localDescription` when you call the `getPeerConnection` method. This returns a promise.

```js
await InliveStream.initStream(inliveApp, {
  streamId: 1,
  // the local session description received from the getPeerConnection()
  sessionDescription: peerConnection.localDescription
});
```


#### Start live stream
Yu can start a live stream by using `startStream` module to start a live streaming session. This returns a promise.

```js
await InliveStream.startStream(inliveApp, {
  streamId: 1
});
```

#### End live stream
You can use `endStream` module to end the stream session. This returns a promise.

```js
await InliveStream.endStream(inliveApp, {
  streamId: 1
});
```

#### Get specific live stream
To get a spesific a live stream data, you can use `getStream` module. This will return a live stream data and consists of the live stream HLS or MPEG-DASH manifest URLs you can play using JavaScript player library such as [shaka player](https://github.com/shaka-project/shaka-player). This module doesn't require `inLiveApp` value from the SDK initialization step.

```js
const getStream = InliveStream.getStream(streamId);
```

#### Get list of streams
You can get to see the list of the streams that you've created by using the `getStreams` module.

```js
const getStreams = InliveStream.getStreams(inliveApp);
```

### Event Module
To listen any event triggered by the SDK, you can listen those events by using the SDK event module.

```js
import { InliveEvent } from '@inlivedev/inlive-js-sdk/event';

const readyToInitializeEvent = InliveEvent.on('stream:ready-to-initialize-event', () => {
  // handle established connection after calling the connection.connect method
});

const readyToStartEvent = InliveEvent.on('stream:ready-to-start-event', () => {
  // handle established connection after calling the connection.connect method
});

const iceConnectionStateChange = InliveEvent.on('stream:ice-connection-state-change-event', (data) => {
  // handle ice connection state change event
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState
});

InliveEvent.on('stream:start-event', () => {
  // handle live stream start event
});

InliveEvent.on('stream:end-event', () => {
  // handle live stream end event
});

// you can unsubscribe from those events
readyToStartEvent.unsubscribe();
iceConnectionStateChange.unsubscribe();
```

## Contributing
Please read our [contributing guide](CONTRIBUTING.md) for more information.

## Help
If you're looking for help, you can [contact us](mailto:hello@inlive.app).
