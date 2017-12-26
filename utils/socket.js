// websockets class

class WxSocket {
  constructor(url){
    this.url = url;
  }

  connect() {
    wx.connectSocket(this.url);
  }

  send(data) {
    data_str = JSON.stringify(data)
    wx.sendSocketMessage({data: data_str});
  }
};

module.exports = WxSocket;