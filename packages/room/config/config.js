export const api = {
  baseUrl: 'https://hub.inlive.app',
  version: 'v1',
  apiKey: '',
}

export const webrtc = {
  iceServers: [
    // Disable stun server because we deploy behind stunner gateway
    // https://github.com/l7mp/stunner
    // {
    //   urls: 'stun:stun.inlive.app:3478',
    // },
    {
      urls: 'turn:turn.inlive.app:3478',
      username: 'inlive',
      credential: 'inlivesdkturn',
    },
  ],
}

export const media = {
  webcam: {
    width: 1280,
    height: 720,
    frameRate: 24,
    maxFramerate: 30,
    facingMode: 'user',
    aspectRatio: 1.777_777_777_8,
    videoCodecs: ['video/VP9', 'video/VP8', 'video/H264'],
    simulcast: false,
    bitrate: {
      highBitrate: 1200 * 1000,
      midBitrate: 500 * 1000,
      lowBitrate: 150 * 1000,
    },
    scalabilityMode: 'L3T1',
  },
  screen: {
    width: 1280,
    height: 720,
    frameRate: 24,
    maxFramerate: 30,
    aspectRatio: 1.777_777_777_8,
    videoCodecs: ['video/VP9', 'video/VP8', 'video/H264'],
    simulcast: false,
    bitrate: {
      highBitrate: 1200 * 1000,
      midBitrate: 500 * 1000,
      lowBitrate: 150 * 1000,
    },
    scalabilityMode: 'L3T1',
  },
  microphone: {
    audioCodecs: ['audio/red', 'audio/opus'],
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    red: true,
  },
}
