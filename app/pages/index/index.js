//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/socket.js');
const utils = require('../../utils/util.js');
const assets = require('assets.js')


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
    },

    // GUI elements
    gui: {
      bg_color: "",
      clock: "",
      main_img: "",
      button_img: "",
      shower_mrk: "",
      user_list: [],
    },

    debug_str: ""
  },

  //事件处理函数
  reserveTap: function () {
    var status = this.data.status
    if (!status.token_userId) {      // bathroom is available
      this.sendRequest('acquire')
    }
    else {
      if (this.data.userId == this.data.status.token_userId) {
        this.sendRequest('return')     // try return the key if have it
      }
      else {
        if (!status.reserve_userId) {  // bathroom in used and no one reserve
          this.sendRequest('reserve')
        }
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

      // when bathroom is in use
      if (that.data.status.token_userId) {
        that.setData({
          'gui.bg_color': "blueviolet",
          'gui.main_img': assets.bathroom.available,
          'gui.button_img': assets.buttons.green,
          'gui.shower_mrk': assets.marks.empty
        })
        that.start_clock()
        that.start_flasher()

        // if reservation available, change button color
        if (!that.data.status.reserve_userId) {
          that.setData({
            'gui.button_img': assets.buttons.orange,
          })
        }
      }
      // when bathroom is available
      else {
        that.setData({
          'gui.bg_color': "dodgerblue",
          'gui.main_img': assets.bathroom.available,
          'gui.button_img': assets.buttons.green,
          'gui.clock': "",
        })
        that.end_flasher()
        that.end_clock()
      }
    })
  },

  //
  // User Methods
  //
  sendRequest: function (req) {
    const requestType = { 'return': 0, 'acquire': 1, 'reserve': 2, 'update': 3 }
    const message = { 'request': requestType[req], 'uniqueId': this.data.userId, 'userInfo': this.data.userInfo };
    this.data.socket.send(message)
  },

  // parse the userList received from server, return a user list for gui display
  process_userList: function (userList) {
    for (var key in userList) {
      const value = userList.key
      var user = { avatar: value.avatarUrl}
      if (value.acquiring) {user.mark = this.imgs.bathing_mrk}
      //TOBEFINISH
    }
  },

  // start counter
  start_clock: function () {
    var that = this
    this.setData({ 'gui.clock': utils.formatTime(0) }) // set to 00:00:00
    this.clock_interv = setInterval(function () {
      const currTime = utils.newDate()
      that.setData({ 'gui.clock': utils.formatTime(currTime - that.data.status.token_time) })
    }, 1000)
  },
  end_clock: function () {
    clearInterval(this.clock_interv)
  },

  // start flasher
  start_flasher: function () {
    var that = this
    var flash = false
    this.flasher_interv = setInterval(function () {
      if (flash) {
        that.setData({ 'gui.shower_mrk': assets.marks.using })
      }
      else {
        that.setData({ 'gui.shower_mrk': assets.marks.empty })
      }
      flash = !flash
    }, 500)
  },
  end_flasher: function () {
    clearInterval(this.flasher_interv)
    this.setData({ 'gui.shower_mrk': assets.marks.using })
  },
})