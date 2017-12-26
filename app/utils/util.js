const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatTimeDiff = (date1, date2) => {
  // date1 - date2
  const ms1 = date1.getTime()
  const ms2 = date2.getTime()
  var interval = (ms1 - ms2) / 1000

  const second = Math.floor(interval % 60)
  interval = interval / 60
  const minute = Math.floor(interval % 60)
  interval = interval / 60
  const hour = Math.floor(interval % 24)
  
  return [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime,
  formatTimeDiff: formatTimeDiff
}
