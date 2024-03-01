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
    maxFramerate: 30,
    videoCodecs: ['video/VP9', 'video/H264', 'video/VP8'],
    simulcast: false,
    svc: true,
    scalabilityMode: 'L3T1',
  },
  screen: {
    maxFramerate: 30,
    videoCodecs: ['video/VP8', 'video/H264', 'video/VP9'],
    simulcast: false,
    svc: true,
    scalabilityMode: 'L1T2',
  },
  microphone: {
    audioCodecs: ['audio/red', 'audio/opus'],
  },
}
