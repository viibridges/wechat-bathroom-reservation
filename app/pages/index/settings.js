// define basic setting like color and others
module.exports = {
  colors: {
    bg: {
      available: "dodgerblue",
      inuse: "blueviolet",
    },
  },
  request_types: {
    'return': 0, 'acquire': 1, 'reserve': 2, 
    'cancel': 3,  // cancel reservation
    'update': 4,  // update infomation, do nothing
    'force-return': 5,  // force other/owner return the key, nonnegotiatable
    'force-cancel': 6,  // force other/reserver cancel the reservation, nonnegotiatable
  },

  time: {
    clock_interval: 1000,  // in milliseconds
    flash_interval: 450,   // in milliseconds
    token_interval: 40*60,     // maximun time that the token can be kept
    reserve_interval: 3,   // maximun time a reservation is in effect after bathroom is available
  },
}