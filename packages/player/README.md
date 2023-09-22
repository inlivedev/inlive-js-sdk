# Player Package

This package is a video player component used to watch and play the media streaming formats such as DASH and HLS. It is called Inlive Player and available to use as a [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components). Inlive Player was built on top of [Shaka Player](https://github.com/shaka-project/shaka-player) library.

## Usage

On the client side, you can import the player from the `@inlivedev/inlive-js-sdk` NPM package or import it directly through CDN links available.

**Option 1: Import from Inlive JavaSscript SDK NPM package**

```js
import '@inlivedev/inlive-js-sdk/dist/player.js'
```

**Option 2: Import from CDN links available**

```js
import 'https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk/dist/player.js'
```

Alternatively using the script tag.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk/dist/player.js"></script>
```

The player will be imported to the browser as a [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components). After you have imported the player. You can use it in your HTML view or client-side component of your choice like this.

```html
<inlive-player src="/manifest.mpd" autoplay muted playsinline></inlive-player>
```

**Example**

```html
<inlive-player src="/manifest.mpd" autoplay muted playsinline></inlive-player>

<script type="module" src="https://cdn.jsdelivr.net/npm/@inlivedev/inlive-js-sdk/dist/player.js"></script>
```

## Live Streaming Analytics

When you play the stream using the Inlive Player, the user streaming experience will be monitored and the player will capture important video metrics data which will be useful for analytics metrics for your live streaming. The analytics result will be displayed at live stream page of [Inlive Studio](https://studio.inlive.app) website.

## Can I use another player?

Yes, in order to play and watch the DASH and HLS streaming formats, you need a player that supports playing the DASH and HLS media formats. If you have another player in mind you can use it to play and watch the live streaming. However, unlike Inlive Player, other players don't monitor the user streaming experience. So, you will have missing analytics data on your live stream page in the Inlive Studio.
