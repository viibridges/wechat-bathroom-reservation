//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/socket.js');
const utils = require('../../utils/util.js');


Page({
  data: {
    userInfo: {},
    socket: null,

    // system status
    status: {
      last_reserve_time: null, // null indicates the bathroom is available
      otherUsers: []
    },

    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    this.setData({ 'status.last_reserve_time': new Date() })
  },

  onLoad: function () {
    // initialize data
    this.setData({
      'socket': new WxSocket(app.globalData.serverUrl),
      'userInfo': app.globalData.userInfo,
      'status.last_reserve_time': new Date()
    })

    // setup a websocket connection
    //   this.data.socket.connect()
  },

  // onReady: function () {
  //   var that = this
  //   this.interval = setInterval(function () {
  //     const currTime = new Date()
  //     that.setData({ 'debug_str': utils.formatTimeDiff(currTime, that.data.status.last_reserve_time) })
  //   }, 1000)
  // },
  // onUnload: function () {
  //   clearInterval(this.interval)
  // }
})
