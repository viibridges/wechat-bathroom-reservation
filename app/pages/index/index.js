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
      bg_color: settings.colors.bg.available,
      clock: "",
      main_img: assets.bathroom.available,
      button_img: assets.buttons.green,
      user_list: [],
    },
  },

  // times
  clock_interv: null,
  flasher_interv: null,
  token_timer: null,
  reserve_timer: null,

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
        'status.reserve_time': status['reserve_time'],
      })

      // process user list
      that.setData({
        'gui.user_list': that.process_userList(status['userList'])
      })

      // when bathroom is in use
      if (that.data.status.token_userId) {
        that.setData({
          'gui.bg_color': settings.colors.bg.inuse,
          'gui.main_img': assets.bathroom.inuse,
          'gui.button_img': assets.buttons.green,
        })

        if (!that.data.status.reserve_userId) { that.setData({ 'gui.button_img': assets.buttons.blue, }) }
        else { that.setData({ 'gui.button_img': assets.buttons.gray, }) }

      }
      // when bathroom is available
      else {
        that.setData({
          'gui.bg_color': settings.colors.bg.available,
          'gui.main_img': assets.bathroom.available,
          'gui.button_img': assets.buttons.green,
          'gui.clock': "AVAILABLE",
        })
        // if reserved, change the text
        if (that.data.status.reserve_userId) { that.setData({ 'gui.clock': "RESERVED", }) }
      }

      //
      // clock, token timer and flasher logic
      // Note: all the timers are coded in the way (in start_xxx) so that there can be only one instance exist at a time
      //       the function end_xxx can handle the nonexist timer case, so you can call them anytime without causing trouble
      //
      // if the bathroom is in use then launch those times
      if (that.data.status.token_userId) { // if the bathroom is in use
        that.start_clock()
        that.start_flasher()
        that.start_token_timer()
      }
      else {
        that.end_token_timer()
        that.end_flasher()
        that.end_clock()
      }

      //
      // reserve timer logic
      //
      // if the bathroom is avalaible and someone reserves it, launch a reserve timer and the flasher
      if (!that.data.status.token_userId && that.data.status.reserve_userId) {
        that.start_reserve_timer()
        // set schedule user mark flashable
        for (var idx in that.data.gui.user_list) {
          if (that.data.gui.user_list[idx].reserving) { that.data.gui.user_list[idx].flash = true }
        }
        that.start_flasher()
      }
      // if the bathroom is avalaible and nobody reserves it, close the reserve timer and the flasher
      if (!that.data.status.token_userId && !that.data.status.reserve_userId) {
        that.end_reserve_timer()
        that.end_flasher()
        // set schedule user marker back to false
        for (var idx in that.data.gui.user_list) {
          if (that.data.gui.user_list[idx].reserving) { that.data.gui.user_list[idx].flash = false }
        }
      }

    })
  },

  //
  // User Methods
  //
  sendRequest: function (req) {
    const message = {
      'request': settings.request_types[req],
      'uniqueId': this.data.userId + req,
      'userInfo': this.data.userInfo,
      'timestamp': utils.newDate(),
    };
    this.data.socket.send(message)
  },

  // parse the userList received from server, return a user list for gui display
  process_userList: function (userList) {
    var user_list = []
    for (var key in userList) {
      const value = userList[key]
      var user = {
        avatar: value.avatarUrl, flash: false, display: true,
        acquiring: value.acquiring, reserving: value.reserving, returns: value.returns,
      }
      if (false) { }
      else if (value.acquiring) { user.mark = assets.marks.using; user.flash = true }
      else if (value.reserving) { user.mark = assets.marks.reserve }
      else if (value.returns) { user.mark = assets.marks.check }
      else { user.mark = assets.marks.empty }
      user_list.push(user)
    }

    // DEBUG ONLY >>>>>
    // const value = userList[key]
    // user_list.push({ avatar: value.avatarUrl, mark: assets.marks.reserve, flash: true, display: true })
    // user_list.push({ avatar: value.avatarUrl, mark: assets.marks.check, flash: false, display: true })
    // DEBUG ONLY <<<<<

    return user_list
  },

  // start counter
  start_clock: function () {
    if (this.clock_interv) return // can launch only one timer
    var that = this
    // this.setData({ 'gui.clock': utils.formatTime(0) }) // set to 00:00:00
    this.clock_interv = setInterval(function () {
      const currTime = utils.newDate()
      that.setData({ 'gui.clock': utils.formatTime(currTime - that.data.status.token_time) })
    }, settings.time.clock_interval)
  },
  end_clock: function () {
    clearInterval(this.clock_interv)
    this.clock_interv = null
  },

  // start flasher
  start_flasher: function () {
    if (this.flash_interval) return // can launch only one timer
    var that = this
    var display = false
    this.flasher_interv = setInterval(function () {
      for (var idx in that.data.gui.user_list) {
        const flash = that.data.gui.user_list[idx].flash
        // 蛋疼的数组设置
        const key = "gui.user_list[" + idx + "].display"
        if (flash) { that.setData({ [key]: display }) }
      }
      display = !display
    }, settings.time.flash_interval)
  },
  end_flasher: function () {
    clearInterval(this.flasher_interv)
    this.flasher_interv = null
    // set all display in gui_userlist back to true
    for (var idx in this.data.gui.user_list) {
      const key = "gui.user_list[" + idx + "].display"
      this.setData({ [key]: true })
    }
  },

  // start timer for bathroom user
  start_token_timer: function () {
    if (this.token_timer) return // can launch only one timer
    var that = this
    this.token_timer = setInterval(function () {
      const currTime = utils.newDate()
      if (currTime - that.data.status.token_time > settings.time.token_interval) {
        // if token being kept more than an interval, all online users send force-return command
        that.sendRequest('force-return')
      }
    }, settings.time.clock_interval)
  },
  end_token_timer: function () {
    clearInterval(this.token_timer)
    this.token_timer = null
  },

  // start timer for reserver
  start_reserve_timer: function () {
    if (this.reserve_timer) return // can launch only one timer
    var that = this
    this.reserve_timer = setInterval(function () {
      const currTime = utils.newDate()
      if (currTime - that.data.status.reserve_time > settings.time.reserve_interval) {
        // if reservation last more than an interval after the bathroom is available, all online users send force-cancel command
        that.sendRequest('force-cancel')
      }
    }, settings.time.clock_interval)
  },
  end_reserve_timer: function () {
    clearInterval(this.reserve_timer)
    this.reserve_timer = null
  },
})