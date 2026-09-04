let host = location.protocol + '//' + location.host;
let wsProto = location.protocol === 'https:' ? 'wss://' : 'ws://';
let stream = wsProto + location.host + '/api/websocket-2/';
try {
  var h = location.hostname;
  var localDev = h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  if (localDev) {
    stream = wsProto + location.host + '/api/websocket/normal/';
  } else {
    var id = localStorage.getItem('selectedVpnRegion') || '3';
    var custom = (localStorage.getItem('proxServer') || '').trim();
    if (id === '4') {
      stream = wsProto + location.host + '/api/websocket-3/';
    } else if (id === '3') {
      stream = wsProto + location.host + '/api/websocket-2/';
    } else if (id === 'custom') {
      var cu = new URL(custom);
      if ((cu.protocol === 'wss:' || cu.protocol === 'ws:') && custom.charAt(custom.length - 1) === '/') stream = custom;
    }
  }
} catch (e) {}

let _CONFIG = {
  streamurl: stream,
  bareurl: host + '/api/edge/'
};
