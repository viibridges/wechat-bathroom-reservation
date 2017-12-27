import datetime, time

def secsfrom1970() {
  return time.mktime(datetime.datetime.now().timetuple())
}
