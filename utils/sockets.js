// websockets class

class WxSocketIO {
  connect(url) {
    wx.connectSocket({url: url});
  }
  send(data) {
    data_str = JSON.stringify(data)
    wx.sendSocketMessage({data: data_str});
  }
};

module.exports = WxSocketIO;