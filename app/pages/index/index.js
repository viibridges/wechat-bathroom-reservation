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
      start_time: null, // null indicates the bathroom is available
      other_users: [],
      token_user: null,
      reserve_user: null,
    },

    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    var status = this.data.status;
    if (!status.start_time) {      // bathroom is available  
      const request = { request: 1, userInfo:this.data.userInfo };
      this.data.socket.send(request)
    }
    else{
      if (!status.reserve_user) {  // bathroom in used and no one reserve
        const request = { request: 2, userInfo: this.data.userInfo };
        this.data.socket.send(request)
      }
    }
  },

  onLoad: function () {
    // initialize data
    this.setData({
      'socket': new WxSocket(app.globalData.serverUrl),
      'userInfo': app.globalData.userInfo,
      'status.start_time': new Date()
    })

    // setup a websocket connection
    this.data.socket.connect()
  },

  // onReady: function () {
  //   var that = this
  //   this.interval = setInterval(function () {
  //     const currTime = new Date()
  //     that.setData({ 'debug_str': utils.formatTimeDiff(currTime, that.data.status.start_time) })
  //   }, 1000)
  // },
  // onUnload: function () {
  //   clearInterval(this.interval)
  // }
})
