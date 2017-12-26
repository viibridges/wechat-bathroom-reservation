//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/sockets.js');
const utils = require('../../utils/util.js')

Page({
  data: {
    userInfo: {},
    debug_str: ""
  },

  //事件处理函数
  bindViewTap: function () {
    console.log('tap avatar')
  },

  onLoad: function () {
    wx.getUserInfo({
      success: res => {
        this.setData({
          userInfo: res.userInfo
        })
      }
    })
    // setup a websocket connection
    try {
      socket = new WxSocket();
      socket.connect(app.globalData.serverUrl);
    } catch(connectError) {
      this.setData({ debug_str: "connection failed" })
    }
  },

  onReady: function() {
    var that = this
    this.interval = setInterval(function(){
      const currTime = utils.formatTime(new Date())
      that.setData({ debug_str: currTime })
    }, 1000)
  },

  onUnload: function() {
    clearInterval(this.interval)
  },

  getUserInfo: function (e) {
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo
    })
  }
})
