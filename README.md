# inlive-js-sdk
Inlive JavaScript SDK for developing with inLive platform so our user can use it easily on building their own live streaming website or application that use web based technology without worrying about the manual process of integrating our inLive APIs into their platform.

## Prerequisites

Before you run your project, please make sure that you have a package manager. We recommend you to use [NPM](https://www.npmjs.com/) which should already be installed alongside [Node.js](https://nodejs.org/en/). With NPM, you can download and install the InLive Javascript SDK into your project.

You can verify if you have installed Node.js by running this command in your terminal:
```bash
$ node -v
```

You can verify if you have installed NPM by running this command in your terminal:
```bash
$ npm -v
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
Before starting to use those modules, you need to initialize it first with your API Key & Widget Key on your project. If you do not have any API Key or Widget Key, kindly read [this documentation for the API Key](https://inlive.app/docs/getting-started/#get-an-application-key) and [this documentation for the widget key](https://inlive.app/docs/tutorial/tutorial-creating-and-managing-widget/#generating-the-widget-key) on how to get them.

```js
import { InLiveApp } from '@inlivedev/inlive-js-sdk/app';

const inliveApp = InLiveApp.init({
  api_key: 'apiKey', // input your API Key here (required)
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
2. Set local media, and manage channel connection & webRTC connection.
3. Prepare the stream pod.
4. Initiate webRTC connection.
5. Start a live stream after the stream preparation is finished and the stream is ready to start.
6. End a live stream after the stream is started.
7. Get a specific stream’s data based on the ID (so you will get HLS or MPEG-DASH manifest url for your video player)
8. Get a list of streams data

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
After stream created, you can prepare the live stream pod and initiate webRTC connection with `prepareStream` module. The `streamId` can be got from `createdStream` return value.

```js
const prepareStream = InLiveStream.prepareStream(inliveApp, { 
  streamId: 1 //input streamId
});
```

#### Init live stream
After the pod is ready, then you can initiate webRTC connection with our `init` module. The `streamId` can be got from `createdStream` return value and the `sessionDescription` can be get from checking peer connection.

```js
const initializeStream = InLiveStream.initStream(inliveApp, { 
  streamId: 1, //input streamId
  // you can get this session description values by checking peer connection
  sessionDescription: {
    type: '..',
    sdp: '..'
  }
});
```

#### Set media & managing connection
To set media tools, you can use our `media` module which consists of this 2 methods :
- `getUserMedia` to get the local user media which is method is same with [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- `attachMediaElement` to attach the video element and the media stream returned by `getUserMedia` method

```js
import { InliveStream } from '@inlivedev/inlive-js-sdk/stream';

const videoElement = document.getElementById('#video');

const mediaConstraints = {
  // you can add your video & audio requirements in here
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

You can manage channel & webRTC connection by using our `connection` module :
- First, you need to access the connection with our `open` method that will open the webrtc and channel connections. You can get the value of `mediaStream` and `mediaElement` by using our `media` module.

```js
const connection = await InliveStream.connection.open({
  streamId,
  mediaStream,
  mediaElement
});
```

After you open the connections, the you can access another method such as :
- `getPeerConnection` method to check the current status of the peer connection between local and remote peer.
- `close` method to close the webrtc and channel connections.
- `connect` method to connect and established the connection after receiving the remote session description from the `/init` endpoint.
- `on` method to listen to the event (however, you can also use our [event module](#event-module-using-pubsub)).

```js
const peerConnection = connection.getPeerConnection();

connection.on('stream:ready-to-start-event', () => {
  //handle when the stream is ready to start
});

connection.connect(remoteSessionDescription);

connection.close();
```

#### Start live stream
Finally you can start a live stream by using `startStream` module to start running the stream pod in the server.

```js
const startStream = InLiveStream.startStream(inliveApp, { streamId: 1//input streamId });
```

#### End live stream
After the streaming started for a while, you can use `endStream` module to end the stream because it will stop the running stream pod in the server.

```js
const endStream = InLiveStream.endStream(inliveApp, { streamId: 1//input streamId });
```

#### Get specific live stream
For you to get a HLS or MPEG-DASH manifest URL to run the playing stream on your video player, you can use `getStream` module. On this module, we don't need to pass `inLiveApp` because no need of API Key.

```js
const getStream = InLiveStream.getStream(streamId);
```

#### Get list of streams
In case you would like to see your list streams that you've created, you can use `getStreams` module.

```js
const getStreams = InLiveStream.getStreams(inliveApp);
```

#### Event module using Pub/Sub
For the need for real-time communication for each part of your components, you can use our publisher/subscriber (pub/sub) communication pattern module.

```js
// publish an event
  event.publish('stream:ice-connection-state-change-event', {
    type: 'stream:ice-connection-state-change-event',
    detail: {
      iceConnectionState: 'connected',
    },
  })
   
// subscribe to an event
  const subscriber = event.subscribe(
    'stream:ice-connection-state-change-event',
    (data) => {
      // handle the event
    }
  )
  
//unsubscribe from the event
  subscriber.unsubscribe()
```

## Help
If you're looking for help, kindly [contact us](mailto:hello@inlive.app).