//index.js
//获取应用实例

var app = getApp();
const WxSocket = require('../../utils/socket.js');
const utils = require('../../utils/util.js');
const assets = require('assets.js')
const settings = require('settings.js')


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

      // process user list
      that.setData({
        'gui.user_list': that.process_userList(status['userList'])
      })

      // when bathroom is in use
      if (that.data.status.token_userId) {
        that.setData({
          'gui.bg_color': settings.colors.bg.inuse,
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
          'gui.bg_color': settings.colors.bg.available,
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
    const message = { 'request': settings.request_types[req], 'uniqueId': this.data.userId, 'userInfo': this.data.userInfo };
    this.data.socket.send(message)
  },

  // parse the userList received from server, return a user list for gui display
  process_userList: function (userList) {
    var user_list = []
    for (var key in userList) {
      const value = userList[key]
      var user = { avatar: value.avatarUrl}
      if (false) {}
      else if (value.acquiring) { user.mark = assets.marks.using }
      else if (value.reserving) { user.mark = assets.marks.reserve }
      else if (value.returns)   { user.mark = assets.marks.check }
      else { user.mark = assets.marks.empty}
      user_list.push(user)
    }
    return user_list
  },

  // start counter
  start_clock: function () {
    var that = this
    this.setData({ 'gui.clock': utils.formatTime(0) }) // set to 00:00:00
    this.clock_interv = setInterval(function () {
      const currTime = utils.newDate()
      that.setData({ 'gui.clock': utils.formatTime(currTime - that.data.status.token_time) })
    }, settings.time.clock_interval)
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
    }, settings.time.flash_interval)
  },
  end_flasher: function () {
    clearInterval(this.flasher_interv)
    this.setData({ 'gui.shower_mrk': assets.marks.using })
  },
})