# inlive-js-sdk
Inlive JavaScript SDK for developing with inLive platform so our user can use it easily on building their own live streaming website or application that use web based technology.

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

For a small example, in the component file where you want to use the live stream SDK for get a list of streams data, you can call the module name and must pass your `inliveApp` return value from [initialization](#initialization) step.
```js
import { InLiveStream } from '@inlivedev/inlive-js-sdk/stream';

const getStreams = InLiveStream.getStreams(inliveApp);
```

For the full list of features inside our live stream modules, as well as additional guides, see our [inLive Javascript SDK Live Stream Modules docs](#http:/link-to-sdk-website-documentation-part-live-stream-modules).

## Help
For more information regarding inLive Javascript SDK, you can read our [inLive Javascript SDK documentation](#http://link-to-sdk-website-documentation).

If you're looking for help, kindly [contact us](mailto:hello@inlive.app).


***this is just notes only (please erase this after reviewing) : I follow as this zoom SDK reference : https://github.com/zoom/meetingsdk-web/blob/master/README.md. Actually confused how to differentiate between the SDK documentation for the website and with this Readme. However, if I scanning through on exploring, most of the complete SDK documentation on the website, and this read me relatively refers to the website SDK documentation link so the user just read how to use it from the website. Readme mostly for informing the user about the versioning & upgrade if any. However, if would like the read me is so complete about how to use the modules, then it's okay for me though becase some of SDK also complete information on the readme.. ^^" This is a way just not double writing only.. ^^"**