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
const newRoom = await room.createRoom('a new room', 'custom-id');

// get a room data
const roomData = await room.getRoom(newRoom.data.roomId);

// create a new client
const client = await room.createClient(roomData.data.roomId);

// create a new peer and automatically open connection to the remote peer
const peer = await room.createPeer(roomData.data.roomId, client.data.clientId);

// listen for a specific room event
room.on(room.event.STREAM_AVAILABLE, function () {
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

#### Properties

- `event` : **object**

  A collection of room events available to listen by accessing `room.event.<EVENT_NAME>`.

#### Methods

- `room.createRoom(name?: string | undefined, id?: string | undefined)`

  A method to create a new room. If the optional `name` and `id` parameters are passed, the room will be created under those name and id. This method will return a promise.

- `room.getRoom(roomId: string)`

  A method to get the room data. It expects a `roomId` as a parameter. This method will return a promise.

- `room.createClient(roomId: string, clientId?: string | undefined)`

  A method to create and register a new client to the room. It expects two parameters. The `roomId` is required. If the client prefers to set their own client ID, the second client ID parameter can be set. This method will return a promise.

- `room.setClientName(roomId: string, clientId: string, clientName: string)`

  A method to set a client name based on `clientId`. This is useful for setting a friendly name or label on a specific client. It requires `roomId`, `clientId` and `clientName` parameters to be set. This method  will return a promise.

- `room.createPeer(roomId: string, clientId: string)`

  A method to create a peer that manages the WebRTC peer to peer connection. It requires `roomId` and `clientId` parameters to be set. This method will return a promise.

- `room.createDataChannel(roomId: string, name: string, ordered?: boolean)`

  A method to create a data channel server on a specific room. Data channel is useful for broadcasting data to all connected clients through WebRTC connection. It requires `roomId` and channel `name` parameters to be set. When not set, by default the `ordered` value will be true. This method will return a promise.

- `room.on(eventName: string, callback: Function)`

  A method to listen a specific room event. It requires `eventName` and `callback` function parameters to be set.

- `room.leaveRoom(roomId: string, clientId: string)`

  A method to trigger a proper leave room functionality for client. It requires `roomId` and `clientId` parameters to be set. This method will return a promise.

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

peer.disconnect();
```

#### Methods

- `peer.getPeerConnection()`

  A method to get a [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) object. This object is useful to get current client connection state and listen for events related to the WebRTC connection.

- `peer.connect(roomId: string, clientId: string)`

  A method to open connection to the remote peer. By default this method is automatically called when the client call `room.createPeer()`. Therefore, you don't need to call this method. If you still need to use this method, this should only be called after `peer.disconnect()` method to reopen the closed connection. It requires `roomId` and `clientId` parameters to be set. This method will trigger `PEER_CONNECTED` room event. This method will return a promise.

- `peer.disconnect()`

  A method to disconnect and close the peer connection from the remote peer. The peer will stop sending tracks to the remote peer and all peer connection will be closed and removed. This method will trigger `PEER_DISCONNECTED` room event.

- `peer.addStream(key, data)`

  - Required data:
    - **origin**: 'local' | 'remote'
    - **source**: 'media' | 'screen'
    - **mediaStream**: MediaStream

  A method to add and store a MediaStream object to the peer which returns a stream object. The benefit of storing and adding a MediaStream object to the peer is to keep track for every MediaStream available both from the local and remote peers. When the data `origin` value is `local`, it will try to reconfiguring the connection and trigger peer [negotiationneeded event](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/negotiationneeded_event). It requires key which is an id or any key to help retrieving the data.

- `peer.removeStream(key)`

  A method to remove a stream object from the peer. It requires a key to find the data.

- `peer.getAllStreams()`

  A method to get and retrieve all stored streams object in the peer.

- `peer.getStream(key)`

  A method to get and retrieve a specific stream object. It requires a key to find the data.

- `peer.getTotalStreams()`

  A method to get the total number of streams stored

- `peer.hasStream(key)`

  A method to check if a specified stream object available and stored in the peer. It requires a key to find the data.

- `peer.turnOnCamera()`

  A method to turn on the current local camera (video) track.

- `peer.turnOffCamera()`

  A method to turn off the current local camera (video) track.

- `peer.turnOnMic()`

  A method to turn on the current local microphone (audio) track.

- `peer.turnOffMic()`

  A method to turn off the current local microphone (audio) track.

- `peer.replaceTrack(track: MediaStreamTrack)`

  A method to replace the track currently being sent by sender with a new MediaStreamTrack

### Stream object

The stream object is an object created and stored after the method `peer.addStream()` is called. This object is mainly used to store the data for a specific MediaStream added by `peer.addStream()` method. We can say that a single stream is the representative of a single participant. Because of that, it's important to call the addStream method in order to create a local participant and establish a peer connection with remote peer.

#### Properties

The stream object holds read-only properties based on the data client provided when creating a new stream.
- **id**: The ID  of the stream
- **origin**: The origin of the stream. The value is between a `local` or `remote`
- **source**: The source of the stream. MediaStream from `getUserMedia()` should set a **media** source and the one from `getDisplayMedia()` should set a **screen** source.
- **mediaStream**: The MediaStream object

#### Methods

- `stream.replaceTrack(track: MediaStreamTrack)`

  A method to replace the track currently being used by MediaStream with a new MediaStreamTrack
