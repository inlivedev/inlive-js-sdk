# InLive JavaScript SDK
InLive JavaScript SDK is the official JavaScript SDK client for developing a live streaming platform with [inLive](https://inlive.app) infrastructure. It provides functionalities to interact with InLive live streaming API.

## Installation
You have two installation options in order to use the InLive JavaScript SDK. You can either use a package manager to install the SDK or use the CDN links available.

### Option 1: Install with package managers (recommended)
You can install the InLive JavaScript SDK as a package using package managers such as [npm](https://www.npmjs.com/package/@inlivedev/inlive-js-sdk), [yarn](https://yarnpkg.com/package/@inlivedev/inlive-js-sdk), or [pnpm](https://pnpm.io). For most users, this is the recommended choice.

**Install with npm**

```bash
$ npm install @inlivedev/inlive-js-sdk
```

The SDK package will be downloaded and installed. Then, you're ready to import it into your code.

### Option 2: Use CDN links available
The InLive JavaScript SDK is also available via CDN links.

**Access via jsdelivr**

Access the latest version.

```bash
https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk/dist/inlive-js-sdk.js
```

Access the specific version. You may change the version based on the release version number on GitHub.

```bash
https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk@0.3.0/dist/inlive-js-sdk.js
```

The above links use [jsdelivr](https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk@latest/). But you can also use any CDN that serves npm packages. Other alternatives are [unpkg](https://unpkg.com/browse/@inlivedev/inlive-js-sdk@latest/), and [jspm](https://jspm.dev/@inlivedev/inlive-js-sdk). You can also download the file and serve it yourself.

Because the InLive JavaScript SDK relies on [ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) syntax, it can only be used inside the JavaScript module. For example, you can import the SDK from CDN like this

```html
<script type="module">
  import { InliveStream } from 'https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk/dist/inlive-js-sdk.js'
</script>
```

## Usage

### Initialize the SDK
To get started, the first thing you need to do is to initialize the SDK on your project. If you do not have an API Key, you can read [how to get an API Key](https://inlive.app/docs/getting-started/#get-an-application-key). Some modules are required to pass the returned object from the SDK initialization.

```js
import { InliveApp } from '@inlivedev/inlive-js-sdk';

const inliveApp = InliveApp.init({
  apiKey: 'apiKey', // input your API Key here (required)
});
```

### Live Stream Module
The live stream module can be imported into your project like this

```js
import { InliveStream } from '@inlivedev/inlive-js-sdk';
```

using the live stream module is very simple. You just need to get the stream instance by creating a stream or getting an existing stream. Once you have the stream instance, you can just call the methods to go live or end the live stream. Let us show you below.

#### Create or get a stream instance
You can create a new live stream by calling `createStream` module. You're required to pass the `inLiveApp` variable which is a returned value from the [SDK initialization step above](#get-started).

```js
const stream = InliveStream.createStream(inliveApp, {
 name: 'a new stream', //required
 description: '', //optional
 slug: 'new-stream' //optional
});

console.log(stream.ID) // printed 1 as stream.ID generated in the API server when the stream succesfully created

```

The stream variable that you receive from `createStream` method is the stream instance. You only need to use this to go live. To get the stream instance from the stream that you created before you can do this with this code:

```js
const stream = InliveStream.getStream(inliveApp, streamID);
```

Once you have the stream instance you can continue to this next step.

#### Set the local media stream
A media stream is a medium that contains the audio and video tracks captured from your webcam and microphone and will be streamed into your live stream in HLS or Dash format.

=======
```

The stream variable that you receive from `createStream` method is the stream instance. You only need to use this to go live. To get the stream instance from the stream that you created before you can do this with this code:

```js
const stream = InliveStream.getStream(inliveApp, streamID);
```

Once you have the stream instance you can continue to this next step.

#### Set the local media stream
A media stream is a medium that contains the audio and video tracks captured from your webcam and microphone and will be streamed into your live stream in HLS or Dash format.

To set the media the user wants to use, you can use our `media` module. To use  you only need to do these two steps:
- `getUserMedia`To gets the local user media which will prompt the user to get user permission for camera and audio. This method is similar to [MediaDevices.](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). It will return a Promise that will resolve to Media instance.
- `media.attachTo(videoElement)`: This will attach the video element required to display the camera from the user's device to the browser. 

```js
import { InliveStream } from '@inlivedev/inlive-js-sdk';

const videoElement = document.getElementById('#video');

// Add your camera & audio constraints
const mediaConstraints = {
  video: true,
  audio: true
};

const media = await InliveStream.media.getUserMedia(
  mediaConstraints
);

media.attachTo(videoElement);
```

#### Prepare a live-stream session
A live stream session is needed to prepare first before you can start doing live streaming. You can use your previous stream instance to prepare by calling the `stream.prepare()` method.

```js
await stream.prepare()
```

You just need to wait for the promise to be resolved before continuing to the next step.

#### Initialize a live-stream session
After the live stream session has been prepared, the live stream session needs to be initialized. This process initiates the WebRTC connection using the previous media stream that was requested.

```js
// passing the media.stream that we captured before
await stream.init(media.stream)
```

The init method will be resolved once the WebRTC connection is connected. Once connected, we're ready to go live.

#### Start a live-stream session
You can start a live stream by using `stream.start()` method to start a live streaming session. This method will start the video encoding process and start uploading the Dash and HLS video segments to our CDN origin server.

```js
  const manifests = await stream.start()

  console.log(manifests) // ['dash' => 'https://.../manifest.mpd', 'hls' => 'https://.../master.m3u8']
```

The start method will return a Dash manifest and HLS master playlist that you can use for any video player that supports those formats.

#### End a live-stream session
You can use `stream.end()` method to end the stream session. This returns a promise.

```js
await stream.end()
```


#### Get a list of streams
You can get to see the list of the streams that you've created by using the `getStreams` module.

```js
const streamList = InliveStream.getStreams(inliveApp)
```

### Events
To listen to any event triggered by the SDK, you can listen to those events after you have the stream instance. Use the `stream.on(eventType, callbackFunction)` to add event listener. For example, to listen to WebRTC-connected events, you can do this.

```js
import { InliveStream,Stream } from '@inlivedev/inlive-js-sdk';

// create stream instance
const stream = InliveStream.createStream(inliveApp, {
 name: 'a new stream', //required
 description: '', //optional
 slug: 'new-stream' //optional
});


stream.on(Stream.STATE_CONNECTED,() => console.log('Connected'))
```

Other available stream events are:
* `Stream.READY` can be used for listening if we already able to call `stream.init()`
* `Stream.STARTED` can be used on viewer page to replace bumper image with played video
* `Stream.ENDED` can be used to stop the video player and tell the viewer that the stream is ended
* `Stream.ERROR` can be used to inform viewer if there is an issue with the streaming
* `Stream.STATECHANGED` can be used to know the WebRTC connection state, it also provide the connection state through `event.state` property. So you can use it like this:
  ```js
  stream.on(Stream.STATECHANGED,e => console.log(e.state))
  ```


## Contributing
Please read our [contributing guide](CONTRIBUTING.md) for more information.

## Help
If you're looking for help, you can [contact us](mailto:hello@inlive.app) or use our [Github discussion](https://github.com/orgs/inlivedev/discussions)
