# Room Package

This package is used to work with [inLive Hub and Room API services](https://hub.inlive.app/apidocs/index.html).

## Usage

To use this package, you need to import a `Room` module and initialize it in a global scope where you can export and import the room object returned everywhere in your application.

```js
import { Room, RoomEvent } from '@inlivedev/inlive-js-sdk';
// Or if you prefer to load only the room module
import { Room, RoomEvent } from '@inlivedev/inlive-js-sdk/dist/room.js';

const room = Room({
  api : {
    apiKey : 'YOUR_API_KEY'
  }
})
```

### Configurations
These are the available config options for initializing the `Room` module. See the [default configuration](./config/config.js).

> [!NOTE]
Some webcam and screenshare configurations might not be always working the way they configured on every browser because each browser has different support for simulcast, svc, and codec.

```js
{
  // API server configurations
  api: {
    // This is the only required part when you want to use functions that require authentication.
    apiKey: 'YOUR_API_KEY',

    // The API server base URL
    baseUrl: 'https://hub.inlive.app',

    // The API server version
    version: 'v1',
  },

  // WebRTC configurations
  webrtc: {
    // ICE servers used by the ICE agent
    iceServers: []
  },

  // Media input configurations such as webcam, mic, and screenshare
  media: {
    webcam: {
      // The maximum frame rate that can be used in frames per second
      maxFramerate: 30,

      // A list of preferred codecs for webcam in video MIME type format. Early codec in the list will be prioritized.
      videoCodecs: ['video/VP9', 'video/H264', 'video/VP8'],

      // Specify whether the simulcast is enabled for the webcam
      simulcast: false,

      // Specify whether the scalable video coding (svc) is enabled for the webcam
      svc: true,

      // Specify the scalability mode for the webcam
      scalabilityMode: 'L3T1',

      // Specify the bitrate for the webcam. Mid and low bitrates are available only when simulcast is enabled.
      bitrates: {
        high: 700000,
        mid: 300000,
        low: 100000,
      },
    },
    screen: {
      // The maximum frame rate that can be used in frames per second
      maxFramerate: 30,

      // A list of preferred codecs for screenshare in video MIME type format. Early codec in the list will be prioritized.
      videoCodecs: ['video/VP8', 'video/H264', 'video/VP9'],

      // Specify whether the simulcast is enabled for the screenshare
      simulcast: false,

      // Specify whether the scalable video coding (svc) is enabled for the screenshare
      svc: true,

      // Specify the scalability mode for the screenshare
      scalabilityMode: 'L1T2',

      // Specify the bitrate for the screenshare. Mid and low bitrates are available only when simulcast is enabled.
      bitrates: {
        high: 1200000,
        mid: 500000,
        low: 150000,
      },
    },
    microphone: {
      // A list of preferred codecs for microphone in audio MIME type format. Early codec in the list will be prioritized.
      audioCodecs: ['audio/red', 'audio/opus'],
    },
  }
}
```

#### Examples
1. Example of using VP9 codec for webcam video codec with H264 or VP8 codecs fallback, SVC is enabled, simulcast is disabled, using L3T1 scalability mode, and using custom bitrate.
```js
Room({
  // ...other options
  media: {
    webcam: {
      videoCodecs: ['video/VP9', 'video/H264', 'video/VP8'],
      simulcast: false,
      svc: true,
      scalabilityMode: 'L3T1',
      bitrates: {
        high: 600000,
      },
    }
  }
})
```

1. Example of using H264 codec for webcam video codec with VP8 or VP9 codecs fallback, SVC is disabled, simulcast is enabled, using L1T2 scalability mode and using custom bitrate.
```js
Room({
  // ...other options
  media: {
    webcam: {
      videoCodecs: ['video/H264', 'video/VP8', 'video/VP9'],
      simulcast: true,
      svc: false,
      scalabilityMode: 'L1T2',
      bitrates: {
        high: 600000,
      },
    }
  }
})
```

### Authentication
Some function in the Room Object require the apiKey parameter to be defined, since the SDK is designed to be used on Client and Server Side

If the Library is used on the client side you might not need to pass the `apiKey` parameter

The following function require apiKey to be defined :
* `Room.createRoom()`
* `Room.getRoom()`
* `Room.createClient()`

### Room object

The room object is the object created when the `Room` module is initialized. It consists methods that relates to the room scope. Some methods that directly interact to the room API can run on both client and server sides.

#### Sample Code

```js
// create a new room
const newRoom = await room.createRoom('a new room', 'custom-id');

// get a room data
const roomData = await room.getRoom(newRoom.data.roomId);

// create a new client
const client = await room.createClient(roomData.data.roomId);

// create a new peer and automatically open connection to the remote peer
const peer = await room.createPeer(roomData.data.roomId, client.data.clientId);

// create a new data channel server for broadcasting data to all connected clients
await room.createDataChannel(roomData.data.roomId, 'my-channel')

// listen for a specific room event
room.on(RoomEvent.STREAM_AVAILABLE, function () {
  // handle event
});

room.on(RoomEvent.STREAM_REMOVED, function () {
  // handle event
});

// leave from the room
await room.leaveRoom(roomData.data.roomId, client.data.clientId);

// To end the room for everyone
await room.endRoom(roomData.data.roomId);
```

#### Methods

- `room.createRoom(name?: string | undefined, id?: string | undefined, config?: object | undefined)`

  > 🔐 Require ApiKey

  A method to create a new room. If the optional `name` and `id` parameters are passed, the room will be created under those name and id. This method will return a promise.

  **Custom room configurations** \
  These are the available config options when creating a room with custom configurations.
  ```js
  {
    // Custom bitrates and bandwidth for a specific room
    bitrates?: {
      audioRed?: number | undefined,
      audio?: number | undefined,
      video?: number | undefined,
      videoHigh?: number | undefined,
      videoHighPixels?: number | undefined,
      videoMid?: number | undefined,
      videoMidPixels?: number | undefined,
      videoLow?: number | undefined,
      videoLowPixels?: number | undefined,
      initialBandwidth?: number | undefined,
    },

    // Custom codecs for a specific room
    codecs?: string[] | undefined,

    // Custom empty room timeout for a specific room in milliseconds
    emptyRoomTimeoutMS?: number | undefined,

    // Custom PLI interval for a specific room in milliseconds
    pliIntervalMS?: number | undefined,

    // Custom quality presets for a specific room
    qualityPresets?: {
      high?: {
        sid?: number | undefined,
        tid?: number | undefined,
      },
      low?: {
        sid?: number | undefined,
        tid?: number | undefined,
      },
      mid?: {
        sid?: number | undefined,
        tid?: number | undefined,
      }
    }
  }
  ```

  **Using custom room configurations**
  ```js
  const newRoom = await room.createRoom('a new room', 'custom-id', {
    codecs: ['video/H264', 'audio/opus'],
    emptyRoomTimeoutMS: 300000
  })
  ```

- `room.getRoom(roomId: string)`

  > 🔐 Require ApiKey

  A method to get the room data. It expects a `roomId` as a parameter. This method will return a promise.

- `room.createClient(roomId: string, config?: object | undefined)`

  > 🔐 Require ApiKey

  A method to create and register a new client to the room. It expects two parameters. The `roomId` is required. The second parameter is an optional config to set a custom client config. This method will return a promise.

  **Custom client configurations** \
  These are the available config options when creating a client with custom configurations.
  ```js
  {
    clientId?: string | undefined,
    clientName?: string | undefined,
    enableVAD?: boolean | undefined,
  }
  ```

    **Using custom client configurations**
  ```js
  const client = await room.createClient('room-id', {
    clientId: 'custom client id',
    clientName: 'client name',
    enableVAD: true,
  })
  ```

- `room.getClient(roomId: string, clientId: string)`

  A method to get the client data. It expects a `roomId` and `clientId` as parameters. This method will return a promise.

- `room.setClientName(roomId: string, clientId: string, clientName: string)`

  A method to set a client name based on `clientId`. This is useful for setting a friendly name or label on a specific client. It requires `roomId`, `clientId` and `clientName` parameters to be set. This method  will return a promise.

- `room.getMetadata(roomId: string, key: string)`

  A method to get a specific room metadata based on metadata `key` provided. It expects the `roomId` and `key` as parameters. This method will return a promise.

- `room.setMetadata(roomId: string, metadata: object)`

  A method to set metadata for a specific room. You can store multiple keys and data as an object. This method will return a promise.

- `room.deleteMetadata(roomId: string, key: string)`

  A method to delete a specific room metadata based on metadata `key` provided. It expects the `roomId` and `key` as parameters. This method will return a promise.

- `room.createPeer(roomId: string, clientId: string)`

  A method to create a peer that manages the WebRTC peer to peer connection. It requires `roomId` and `clientId` parameters to be set. This method will return a promise.

- `room.createDataChannel(roomId: string, name: string, ordered?: boolean)`

  A method to create a data channel server on a specific room. Data channel is useful for broadcasting data to all connected clients through WebRTC connection. It requires `roomId` and channel `name` parameters to be set. When not set, by default the `ordered` value will be true. This method will return a promise.

- `room.on(eventName: string, callback: Function)`

  A method to listen a specific room event. It requires `eventName` and `callback` function parameters to be set.

- `room.leaveRoom(roomId: string, clientId: string, useBeacon?: boolean)`

  A method to trigger a proper leave room functionality for a client. It requires `roomId` and `clientId` parameters to be set. When `useBeacon` option is set to true, this method will use [sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) method for leaving the room. When `useBeacon` option is set to false (default), this method will use the standard fetch API. This method will return a promise.

- `room.endRoom(roomId: string)`

  A method to end the room for everyone. When this method is called, everyone will be disconnected from the room and the room session will be ended. It requires a `roomId` parameter to be set. This method will return a promise.

### Peer object

The peer object is created when the client call the `room.createPeer()` method. Using this method simplifies the WebRTC peer-to-peer connection with remote peer for video and audio calls. Peer is mainly running on WebRTC technology and should be run on the client side.

#### Establish the peer connection

When `room.createPeer()` method is called, it will create a basic peer connection. To establish the peer connection to the remote peer, the client should add a user [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) data such as camera or microphone to start connecting and establishing peer connection between local peer and remote peer. The process will be automatically run on the background and the way you know when the connection has been established is by listening the [iceconnectionstatechange event](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceconnectionstatechange_event) from peer connection object and check for the value of [iceConnectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState).

#### Sample Code

```js
const peer = await room.createPeer(roomData.data.roomId, client.data.clientId);

const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// Add the user media input stream to the peer
peer.addStream(mediaStream.id, {
  clientId: client.data.clientId,
  name: 'Client A stream',
  origin: 'local', // local | remote
  source: 'media', // media | screen
  mediaStream: mediaStream,
});

const displayScreen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

// Add the display screen media input stream to the peer
peer.addStream(displayScreen.id, {
  clientId: client.data.clientId,
  name: 'Screen by Client A',
  origin: 'local', // local | remote
  source: 'screen', // media | screen
  mediaStream: displayScreen,
});

// Get a specific stream
const stream = peer.getStream(mediaStream.id);

// Get all stored stream
const streams = peer.getAllStreams();

// After user media input is added, you can call these methods to turn on/off camera and mic
peer.turnOffCamera();
await peer.turnOnCamera();
peer.turnOffMic();
await peer.turnOnMic();

const peerConnection = peer.getPeerConnection();

// when iceConnectionState is connected, it indicates the connection is established
peerConnection.addEventListener('iceconnectionstatechange', function () {
  console.log(peerConnection.iceConnectionState);
});

peer.disconnect();
```

#### Methods

- `peer.getClientId()`

  A method to get the client ID currently used by the peer

- `peer.getRoomId()`

  A method to get the room ID currently used by the peer

- `peer.getPeerConnection()`

  A method to get a [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) object. This object is useful to get current client connection state and listen for events related to the WebRTC connection.

- `peer.connect(roomId: string, clientId: string)`

  A method to open connection to the remote peer. By default this method is automatically called when the client call `room.createPeer()`. Therefore, you don't need to call this method. If you still need to use this method, this should only be called after `peer.disconnect()` method to reopen the closed connection. It requires `roomId` and `clientId` parameters to be set. This method will trigger `PEER_CONNECTED` room event. This method will return a promise.

- `peer.disconnect()`

  A method to disconnect and close the peer connection from the remote peer. The peer will stop sending tracks to the remote peer and all peer connection will be closed and removed. This method will trigger `PEER_DISCONNECTED` room event.

- `peer.addStream(key, data)`

  - Required data:
    - **clientId**: string,
    - **name**: string,
    - **origin**: 'local' | 'remote'
    - **source**: 'media' | 'screen'
    - **mediaStream**: MediaStream

  A method to add and store a MediaStream object to the peer which returns a stream object. The benefit of storing and adding a MediaStream object to the peer is to keep track for every MediaStream available both from the local and remote peers. When the data `origin` value is `local`, it will try to reconfiguring the connection and trigger peer [negotiationneeded event](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/negotiationneeded_event). It requires key which is an id or any key to help retrieving the data.

- `peer.removeStream(key)`

  A method to remove a stream object from the peer. It requires a key to find the data.

- `peer.getAllStreams()`

  A method to get and retrieve all stored streams object in the peer.

- `peer.getStream(key)`

  A method to get and retrieve a specific stream object based on key provided.

- `peer.getStreamByTrackId(trackId: string)`

  A method to get and retrieve a specific stream object based on track ID provided.

- `peer.getTotalStreams()`

  A method to get the total number of streams stored

- `peer.hasStream(key)`

  A method to check if a specified stream object available and stored in the peer. It requires a key to find the data.

- `peer.turnOnCamera(videoTrack?: MediaStreamTrack | undefined)`

  A method to start sending video capture using local camera to other connected peers. A local stream object needs to be added with `peer.addStream()` before calling this method. This method will return a promise.

  By default when the video track parameter is empty, the method will enable the local video track added with `peer.addStream()`. When the video track parameter is provided, this method will try to use it as sender video track which sends the track to other connected peers.

- `peer.turnOffCamera(stop?: boolean | undefined)`

  A method to stop sending local camera video capture to other connected peers. A local stream object needs to be added with `peer.addStream()` before calling this method.

  By default when the `stop` track parameter is empty, the method will only disable the local video track added with `peer.addStream()`. The peer still sends empty blank frame to other connected peers. The device camera indicator may stay turning on.

  When the `stop` track parameter is provided, the method will completely stop sending the video track. After the track is stopped, the track becomes unusable. To start sending the video track again, call the `peer.turnOnCamera(newTrack)` method. You can get a new track again with [getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

  When the `stop` track parameter is provided, the video camera will become freeze on remote peers side because the track's source is stopped and unable to provide data. Listen for [track mute event](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/mute_event) to listen when the video freezes because its track is stopped.

- `peer.turnOnMic(audioTrack?: MediaStreamTrack | undefined)`

  A method to start sending audio capture using local microphone to other connected peers. A local stream object needs to be added with `peer.addStream()` before calling this method. This method will return a promise.

  By default when the audio track parameter is empty, the method will enable the local audio track added with `peer.addStream()`. When the audio track parameter is provided, this method will try to use it as sender audio track which sends the track to other connected peers.

- `peer.turnOffMic(stop?: boolean | undefined)`

  A method to stop sending local mic audio capture to other connected peers. A local stream object needs to be added with `peer.addStream()` before calling this method.

  By default when the `stop` track parameter is empty, the method will only disable the local audio track added with `peer.addStream()`. The peer still sends silence frame to other connected peers.

  When the `stop` track parameter is provided, the method will completely stop sending the audio track. After the track is stopped, the track becomes unusable. To start sending the audio track again, call the `peer.turnOnMic(newTrack)` method. You can get a new track again with [getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

  When the `stop` track parameter is provided, the audio track's source is stopped. Listen for [track mute event](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/mute_event) to listen when the audio track is stopped.

- `peer.replaceTrack(track: MediaStreamTrack)`

  A method to replace the track currently being sent by sender with a new MediaStreamTrack.

- `peer.negotiate()`

  A method to trigger and start the manual negotiation process. This method will return a promise.


#### Events

- `peer.addEventListener('voiceactivity', callback:function(ev:CustomEvent))`

  A custom event to listen for voice activity level changes. The callback function will receive a CustomEvent object with `detail` property that contains the the `voiceActivity` object. The `voiceActivity` object type is described below.
  ```ts
  type AudioLevel = {
    sequenceNo: number
    timestamp: number
    audioLevel: number
  }

  type VoiceActivity = {
    type: string
    trackID: string
    streamID: string
    ssrc: number
    clockRate: number
    audioLevels?: AudioLevel[]
  }
  ```

### Stream object

The stream object is an object created and stored after the method `peer.addStream()` is called. This object is mainly used to store the data for a specific MediaStream added by `peer.addStream()` method. We can say a single stream object is the representative of a single participant or we can call it a **client**.

#### Properties

The stream object holds read-only properties based on the provided client's data when creating a new stream.
- **id**: The ID or key identifier of the stream
- **clientId**: The ID of the client that transceives this specific stream.
- **name**: The name or label for identification purposes.
- **audioLevel**: The audio level of the stream. The value is 0 to 127 refer to [this doc](https://datatracker.ietf.org/doc/rfc6464/). The audio level will only updated if the stream has audio track and it is a remote stream.
- **origin**: The origin of the stream. The value is between a `local` or `remote`
- **source**: The source of the stream. MediaStream from `getUserMedia()` should set a **media** source and the one from `getDisplayMedia()` should set a **screen** source.
- **mediaStream**: The MediaStream object

#### Methods

- `stream.replaceTrack(track: MediaStreamTrack)`

  A method to replace the track currently being used by MediaStream with a new MediaStreamTrack


#### Events

- `stream.addEventListener('voiceactivity', callback:function(ev:CustomEvent))`

  A custom event to listen for voice activity level changes. The callback function will receive a CustomEvent object with `detail` property that contains the the `audioLevel` value.
