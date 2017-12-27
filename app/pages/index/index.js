//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/socket.js');
const utils = require('../../utils/util.js');


Page({
  data: {
    userInfo: {},
    userId: null,
    socket: null,

    // system status
    status: {
      start_time: false, // null indicates the bathroom is available
      clock: "",         // clock string
      userList: {},
      token_userId: false,
      reserve_userId: false,
    },

    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    var status = this.data.status
    if (!status.token_userId) {      // bathroom is available
      this.sendRequest('aquire')
      this.start_clock();
    }
    else {
      this.sendRequest('return')     // try return the key
      this.end_clock()
      if (!status.reserve_userId) {  // bathroom in used and no one reserve
        this.sendRequest('reserve')
      }
    }
  },

  onLoad: function () {
    // initialize data
    this.setData({
      'socket': new WxSocket(app.globalData.serverUrl),
      'userInfo': app.globalData.userInfo,
      'userId': utils.generateUserId(app.globalData.userInfo),
      'status.start_time': new Date()
    })

    // setup a websocket connection
    this.data.socket.connect()
  },

  onReady: function () {
    this.sendRequest('update')
  },

  onShow: function () {
    var that = this
    this.data.socket.recv(function (res) {
      const status = JSON.parse(res.data)
      that.setData({
        'status.userList': status['userList'],
        'status.token_userId': status['token_userId'],
        'status.reserve_userId': status['reserve_userId'],
      })
    })
  },

  //
  // User Methods
  //
  sendRequest: function (req) {
    const requestType = { 'return': 0, 'aquire': 1, 'reserve': 2, 'update': 3 }
    const message = { 'request': requestType[req], 'uniqueId': this.data.userId, 'userInfo': this.data.userInfo };
    this.data.socket.send(message)
  },

  // start counter
  start_clock: function () {
    const currTime = new Date()
    this.setData({'status.start_time': currTime})
    this.setData({ 'status.clock': utils.formatTimeDiff(currTime, currTime) }) // set to 00:00:00
    var that = this
    this.interval = setInterval(function () {
      const currTime = new Date()
      that.setData({ 'status.clock': utils.formatTimeDiff(currTime, that.data.status.start_time) })
    }, 1000)
  },

  end_clock: function() {
    clearInterval(this.interval)
  },
})