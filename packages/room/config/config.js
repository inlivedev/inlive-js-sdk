export const api = {
  baseUrl: 'https://hub.inlive.app',
  version: 'v1',
  apiKey: '',
}

export const webrtc = {
  iceServers: [
    {
      urls: 'turn:turn.inlive.app:3478',
      username: 'inlive',
      credential: 'inlivesdkturn',
    },
  ],
}

export const media = {
  video: {
    width: 1280,
    height: 720,
    frameRate: 24,
    facingMode: 'user',
    aspectRatio: 1.777_777_777_8,
    maxBitrate: 1_200_000,
    codec: 'VP9',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    red: true,
  },
}
