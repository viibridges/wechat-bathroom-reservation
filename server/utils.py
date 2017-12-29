import datetime, time, math

def secsfrom1970(): 
  return time.mktime(datetime.datetime.now().timetuple())

def parse_timestamp(timestamp):
  """
  convert Seconds from 1970 Jan. 1 to Hour, Minite and Seconds.
  """
  second = math.floor(timestamp % 60)
  timestamp /= 60
  minute = math.floor(timestamp % 60)
  timestamp /= 60
  hour = math.floor(timestamp % 24)

  return hour, minute, second
