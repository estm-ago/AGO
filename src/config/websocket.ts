export const WEBSOCKET_CONFIG = {
  url: 'wss://huanyu.duacodie.com:25443/ws',
  options: {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
  },
}; 