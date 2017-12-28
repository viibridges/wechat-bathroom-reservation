// define basic setting like color and others
module.exports = {
  colors: {
    bg: {
      available: "dodgerblue",
      inuse: "blueviolet",
    },
  },
  request_types: { 'return': 0, 'acquire': 1, 'reserve': 2, 'update': 3 },
  time: { clock_interval: 1000, flash_interval: 450 }
}