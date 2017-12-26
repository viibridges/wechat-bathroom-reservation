//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/sockets.js');
const utils = require('../../utils/util.js')

Page({
  data: {
    userInfo: {},
    is_reserved: false,
    last_reserv_time: null,
    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    this.setData({ last_reserve_time: new Date() })
  },

  onLoad: function () {
    // initialize data
    this.setData({
      userInfo: app.globalData.userInfo,
      last_reserve_time: new Date()})

    // setup a websocket connection
    try {
      socket = new WxSocket();
      socket.connect(app.globalData.serverUrl);
      this.setData({ debug_str: "connection success" })
    } catch(connectError) {
      this.setData({ debug_str: "connection failed" })
    }
  },

  // onReady: function() {
  //   var that = this
  //   this.interval = setInterval(function(){
  //     const currTime = new Date()
  //     that.setData({ debug_str: utils.formatTimeDiff(currTime, that.data.last_reserve_time) })
  //   }, 1000)
  // },
  // onUnload: function() {
  //   clearInterval(this.interval)
  // }
})
