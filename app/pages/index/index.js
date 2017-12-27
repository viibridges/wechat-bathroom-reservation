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
      userList: {},
      token_userId: false,
      reserve_userId: false,
      token_time: -1,
      reserve_time: -1,
      clock: ""         // clock string to display
    },

    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    var status = this.data.status
    if (!status.token_userId) {      // bathroom is available
      this.sendRequest('aquire')
    }
    else {
      this.sendRequest('return')     // try return the key
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
        'status.token_time': status['token_time'],
        'status.reserve_time': status['reserve_time']
      })

      if (that.data.token_time != -1) {
        that.start_clock()
      }
      else {
        that.end_clock()
      }
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
    var that = this
    this.setData({ 'status.clock': utils.formatTime(0) }) // set to 00:00:00
    this.interval = setInterval(function () {
      const currTime = utils.newDate()
      that.setData({ 'status.clock': utils.formatTime(currTime - that.data.status.token_time) })
    }, 1000)
  },

  end_clock: function () {
    if (typeof this.interval !== 'undefined') {
      clearInterval(this.interval)
    }
  },
})