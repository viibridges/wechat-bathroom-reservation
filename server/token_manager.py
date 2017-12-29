#!/usr/bin/env python

import json, hashlib
import utils
from ipdb import set_trace as st

class TokenManager():
  """ 
  Class to apply logics to make decisions 
  when receiving request from the clients
  """
  def __init__(self):
    self._requestTypes = {
      'return': 0, 'acquire': 1, 'reserve': 2, 'cancel': 3,
      'update': 4, 'force-return': 5, 'force-cancel': 6}

    self.initialize_states()


  def initialize_states(self):
    self.request_userId = None
    self.request_type = None
    self.userList = {}

    self.token_time = -1    # timestamp when token is assign
    self.reserve_time = -1  # timestamp when reservation is made

    self.token_userId = False
    self.reserve_userId = False


  def reset(self):
    self.initialize_states()


  def parse_request(self, message_raw):
    request = json.loads(message_raw)  # de-stringify raw massege
    request_type = request['request']
    userId = request['uniqueId']
    userInfo = request['userInfo']
    timestamp = request['timestamp']
    return request_type, userId, userInfo, timestamp


  def find_user(self, condition):
    # return userId from self.userList if meet condition(userInfo)
    for userId, userInfo in self.userList.items():
      if condition(userInfo): return userId
    return None


  def isclearstates(self, timestamp):
    """
    Define rules here to clear the server states
    """
    hour_to_clear = 3  # clear states after this hour in the day

    hour, minute, second = utils.parse_timestamp(timestamp)
    try:
      dH, dM, dS = utils.parse_timestamp(timestamp-self.hour_to_clear)
    except:
      # if this is the first start the server, hour_to_clear won't exist
      # then return True to tell the class to clear the states

      # set hour_to_clear to last hour_to_clear
      offset_to_htc = (hour-hour_to_clear) * 60*60
      self.hour_to_clear = timestamp - offset_to_htc
      return True

    # more than one day from last purge, return True
    if dH > 24:
      self.hour_to_clear = timestamp
      return True
    else:
      return False


  def process_request(self, request_message):
    request_type, userId, userInfo, timestamp = self.parse_request(request_message)
    self.request_type = request_type
    self.request_userId = userId

    # reset the server states (renew user list and everything) at some point in a day
    if self.isclearstates(timestamp):
      hour, minute, second = utils.parse_timestamp(timestamp)
      print("Clear server states at {}:{}:{}".format(hour, minute, second))
      self.reset()

    # add to user list if the request came from new user
    broadcast_decision = False
    if userId not in self.userList:
      userInfo['reserving'] = False
      userInfo['acquiring'] = False
      userInfo['returns'] = 0
      self.userList.update({userId: userInfo})
      broadcast_decision = True

    # if new connection/user call for a status update, broadcast the system status
    if request_type is self._requestTypes['update']: return True

    #
    # NOTE: the request could be sent from other people, so the userId and the userInfo
    #       may not be the user of interest, we need to change them for further editing
    if None: pass
    elif request_type == self._requestTypes['force-return']:
      userId = self.find_user(lambda x: x['acquiring'])
      request_type = self._requestTypes['return']  # pretend this is a normal request
    elif request_type == self._requestTypes['force-cancel']:
      userId = self.find_user(lambda x: x['reserving'])
      request_type = self._requestTypes['cancel']  # pretend this is a normal request

    if not userId: 
      print("can't find user of interest. request:({})".format(request_type))
      return broadcast_decision

    userInfo = self.userList[userId]


    #
    # stop log ill logics
    # 
    if self.token_userId and request_type == self._requestTypes['acquire']:
      print("can't acquire when somebody is keeping it.")
      return broadcast_decision
    if self.reserve_userId and userId != self.reserve_userId and request_type == self._requestTypes['acquire']:
      print("can't acquire when other has reserved it.")
      return broadcast_decision
    if self.reserve_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve when somebody has already reserved.")
      return broadcast_decision
    if userId == self.token_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve when keeping the token.")
      return broadcast_decision
    if not self.token_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve when the token is free (why not acquiring it).")
      return broadcast_decision
    if userId != self.token_userId and request_type is self._requestTypes['return']:
      print("can't return the token without keeping it.")
      return broadcast_decision
    if userId == self.reserve_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve twice.")
      return broadcast_decision
    if userId != self.reserve_userId and request_type == self._requestTypes['cancel']:
      print("can't cancel without reserving.")
      return broadcast_decision


    #
    # process legitimate logics
    #
    if False: pass
    elif request_type is self._requestTypes['return']:
      userInfo['returns'] += 1   # record a completed acquiring
      userInfo['acquiring'] = False
      self.token_userId = False
      self.token_time = -1
      broadcast_decision = True
      # if someone reserved the token, start the reservation timer (initialize the timestamp)
      if self.find_user(lambda x: x['reserving']):
        self.reserve_time = timestamp

    elif request_type is self._requestTypes['acquire']:
      self.token_userId = userId
      self.token_time = timestamp
      userInfo['acquiring'] = True  # record keeping the token
      # if acquire request from reserve user, then reset reserve time and reserve_user
      if userId == self.reserve_userId: 
        self.reserve_userId = False # release reservation
        self.reserve_time = -1
        userInfo['reserving'] = False
      broadcast_decision = True

    elif request_type is self._requestTypes['reserve']:
      userInfo['reserving'] = True  # record reserving the token
      self.reserve_userId = userId
      broadcast_decision = True

    elif request_type is self._requestTypes['cancel']:
      # cancel reservation
      userInfo['reserving'] = False
      self.reserve_userId = False
      self.reserve_time = -1
      broadcast_decision = True
      

    else:
      print("Unkown request_type {}".format(request_type))

    return broadcast_decision


  def envelop_message(self):
    """ envelop the class information to send """
    data = {
      'request_userId': self.request_userId,
      'request_type': self.request_type,
      'token_time': self.token_time,
      'reserve_time': self.reserve_time,
      'userList': self.userList,
      'token_userId': self.token_userId,
      'reserve_userId': self.reserve_userId
    }
    message = json.dumps(data)

    return message


if __name__ == '__main__':
  manager = TokenManager()
  dec = manager.process_request(json.dumps({'request': 1, 'userInfo': 'user1'}))
  print("Broadcast: {}".format(dec))
  dec = manager.process_request(json.dumps({'request': 1, 'userInfo': 'user2'}))
  print("Broadcast: {}".format(dec))

  dec = manager.process_request(json.dumps({'request': 2, 'userInfo': 'user1'}))
  dec = manager.process_request(json.dumps({'request': 0, 'userInfo': 'user2'}))

  dec = manager.process_request(json.dumps({'request': 0, 'userInfo': 'user1'}))
  dec = manager.process_request(json.dumps({'request': 1, 'userInfo': 'user2'}))
  print("Broadcast: {}".format(dec))

  print(manager.envelop_message())
