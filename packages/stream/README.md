# Live Stream Package

This package is used to work with [inLive live stream API](https://api.inlive.app/apidocs/index.html).

## Usage

We have provided an example that is available on [Codepen](https://codepen.io/inlive/pen/BaPExzJ).

### Initialization

To get started, you need to import `InliveApp` and `InliveStream` modules in your project. `InliveApp` is used to store the API key and configurations. If you do not have an API Key, you can read [how to get an API Key](https://inlive.app/docs/getting-started//using-live-stream-api/#get-an-application-key). Some functionalities requires to pass the returned value from `InliveApp` module.

```js
import { InliveApp, InliveStream } from '@inlivedev/inlive-js-sdk';

const inliveApp = InliveApp.init({
  apiKey: 'apiKey', // input your API Key here (required)
});
```

### Create and get a new live stream data

You can create a new live stream by calling `createStream` method. This requires you to pass the returned value from `InliveApp` module as parameter.

```js
const stream = await InliveStream.createStream(inliveApp, {
 name: 'a new stream', //required
 description: '', //optional
 slug: 'new-stream' //optional
});

console.log(stream.ID) // printed 1 as stream.ID generated in the API server when the stream succesfully created
```

The stream variable that you receive from `createStream` method is the stream instance. You only need to use this to go live. To get the stream instance from the stream that you have created before you can do this with this code:

```js
const stream = await InliveStream.getStream(inliveApp, streamID);
```

Once you have the stream instance you can continue to this next step.

### Set the local media stream

A media stream is a medium that contains the audio and video tracks captured from your webcam and microphone and will be streamed into your live stream in HLS or Dash format.

To set the media the user wants to use, you can use our `media` module. To use  you only need to do these two steps:
- `getUserMedia`: To gets the local user media which will prompt the user to get user permission for camera and audio. This method is similar to [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). It will return a Promise that will resolve to Media instance.
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

### Prepare a live-stream session

A live stream session is needed to prepare first before you can start doing live streaming. You can use your previous stream instance to prepare by calling the `stream.prepare()` method.

```js
await stream.prepare()
```

You just need to wait for the promise to be resolved before continuing to the next step.

### Initialize a live-stream session

After the live stream session has been prepared, the live stream session needs to be initialized. This process initiates the WebRTC connection using the previous media stream that was requested.

```js
// passing the media.stream that we captured before
await stream.init(media.stream)
```

The init method will be resolved once the WebRTC connection is connected. Once connected, we're ready to go live.

### Start a live-stream session

You can start a live stream by using `stream.live()` method to start a live streaming session. This method will start the video encoding process and start uploading the Dash and HLS video segments to our CDN origin server.

```js
await stream.live()

console.log(stream.manifests) // manifests.dash => 'https://.../manifest.mpd', manifests.hls => 'https://.../master.m3u8'
```

Once the request is resolved, the `stream.manifests` property will contain the Dash and HLS manifest URLs. You can use these URLs to play the live stream.

### End a live-stream session

You can use `stream.end()` method to end the stream session. This returns a promise.

```js
await stream.end()
```

### Get a list of streams

You can get to see the list of the streams that you have created by using the `getStreams` module. The result wil be paginated and return the latest 10 streams data already created by you. You can change the pagination options by setting the `page` and `pageSize` fields.

```js
const streamList = await InliveStream.getStreams(inliveApp, {
  page: 1, // set which page number will be displayed (optional)
  pageSize: 10 // set the total number of streams displayed on one page (optional)
})
```

### Events

To listen any event triggered, you can listen to those events after you have the stream instance. Use the `stream.on(eventType, callbackFunction)` to add event listener. For example, to listen to WebRTC-connected events, you can do this.

```js
import { InliveStream,Stream } from '@inlivedev/inlive-js-sdk';

// create stream instance
const stream = await InliveStream.createStream(inliveApp, {
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
