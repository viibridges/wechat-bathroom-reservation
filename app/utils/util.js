const formatTime = function (date) {
  const second = Math.floor(date % 60)
  date = date / 60
  const minute = Math.floor(date % 60)
  date = date / 60
  const hour = Math.floor(date % 24)

  return [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = function (n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const newDate = function () {
  const localoffset = -(new Date().getTimezoneOffset() / 60);
  const date = new Date(new Date().getTime() + localoffset * 3600 * 1000)
  return date.getTime() / 1000
}

const hashCode = function (s) {
  return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
}

const generateUserId = function (userInfo) {
  // generate userId from user info, user openID in the future
  return hashCode(userInfo.avatarUrl)
}

const clone = function (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  formatTime: formatTime,
  generateUserId: generateUserId,
  newDate: newDate,
  clone: clone,
}
