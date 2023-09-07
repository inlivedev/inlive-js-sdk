# Room Package

This package is used to work with [inLive Hub and Room API services](https://hub.inlive.app/apidocs/index.html).

## Usage

To use this package, you need to import a `Room` module and initialize it in a global scope where you can export and import the room object returned everywhere in your application.

```js
import { Room } from '@inlivedev/inlive-js-sdk';
// Or if you prefer to load only the room module
import { Room } from '@inlivedev/inlive-js-sdk/dist/room.js';

const room = Room()
```

### Room object

The room object is the object created when the `Room` module is initialized. It consists methods that relates to the room scope. Some methods that directly interact to the room API can run on both client and server sides.

#### Sample Code

```js
// create a new room
const newRoom = await room.createRoom('a new room');

// get a room data
const roomData = await room.getRoom(newRoom.data.roomId);

// create a new client
const client = await room.createClient(roomData.data.roomId);

// create a new peer and automatically connect to the peer
const peer = room.createPeer(roomData.data.roomId, client.data.clientId);

// listen for a specific room event
room.on(room.event.STREAM_ADDED, function () {
  // handle event
});

room.on(room.event.STREAM_REMOVED, function () {
  // handle event
});

// leave from the room
await room.leaveRoom(roomData.data.roomId, client.data.clientId);

// To end the room for everyone
await room.endRoom(roomData.data.roomId);
```

### Peer object

The peer object is created when the client call the `room.createPeer()` method. Using this method simplifies the WebRTC peer-to-peer connection with remote peer for video and audio calls. Peer is mainly running on WebRTC technology and should be run on the client side.

#### Establish the peer connection

When `room.createPeer()` method is called, it will create a basic peer connection. To establish the peer connection to the remote peer, the client should add a user [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) data such as camera or microphone to start connecting and establishing peer connection between local peer and remote peer. The process will be automatically run on the background and the way you know when the connection has been established is by listening the [iceconnectionstatechange event](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceconnectionstatechange_event) from peer connection object and check for the value of [iceConnectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState).

#### Sample Code

```js
const peer = room.createPeer(roomData.data.roomId, client.data.clientId);

const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// Add the user media input stream to the peer
peer.addStream(mediaStream.id, {
  origin: 'local', // local | remote
  source: 'media', // media | screen
  mediaStream: mediaStream,
});

const displayScreen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

// Add the display screen media input stream to the peer
peer.addStream(displayScreen.id, {
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
peer.turnOnCamera();
peer.turnOffMic();
peer.turnOnMic();

const peerConnection = peer.getPeerConnection();

// when iceConnectionState is connected, it indicates the connection is established
peerConnection.addEventListener('iceconnectionstatechange', function () {
  console.log(peerConnection.iceConnectionState);
});
```

### Stream object

The stream object is an object created and stored after the method `peer.addStream()` is called. This object is mainly used to store the data for a specific MediaStream added by `peer.addStream()` method. We can say that a single stream is the representative of a single participant. Because of that, it's important to call the addStream method in order to create a local participant and establish a peer connection with remote peer.

#### Properties

The stream object holds read-only properties based on the data client provided when creating a new stream.
- **id**: The ID  of the stream
- **origin**: The origin of the stream. The value is between a `local` or `remote`
- **source**: The source of the stream. MediaStream from `getUserMedia()` should set a **media** source and the one from `getDisplayMedia()` should set a **screen** source.
- **mediaStream**: The MediaStream object
