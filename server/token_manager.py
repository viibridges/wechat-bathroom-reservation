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
    self._requestTypes = {'return': 0, 'aquire': 1, 'reserve': 2, 'update': 3}
    self.userList = {}

    self.token_time = -1    # timestamp when token is assign
    self.reserve_time = -1  # timestamp when reservation is made

    self.token_userId = False
    self.reserve_userId = False


  def parse_request(self, message_raw):
    request = json.loads(message_raw)  # de-stringify raw massege
    request_type = request['request']
    userId = request['uniqueId']
    userInfo = request['userInfo']
    return request_type, userId, userInfo


  def process_request(self, request_message):
    request_type, userId, userInfo = self.parse_request(request_message)

    # add to user list if the request came from new user
    broadcast_decision = False
    if userId not in self.userList:
      self.userList.update({userId: userInfo})
      broadcast_decision = True

    # if new connection/user call for a status update, broadcast the system status
    if request_type is self._requestTypes['update']:
      return True


    #
    # stop log ill logics
    # 
    if self.token_userId and request_type == self._requestTypes['aquire']:
      print("can't aquire when somebody is keeping it.")
      return broadcast_decision
    if self.reserve_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve when somebody has already reserved.")
      return broadcast_decision
    if userId == self.token_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve when keeping the token.")
      return broadcast_decision
    if userId != self.token_userId and request_type is self._requestTypes['return']:
      print("can't return the token without keeping it.")
      return broadcast_decision
    if userId == self.reserve_userId and request_type == self._requestTypes['reserve']:
      print("can't reserve twice.")
      return broadcast_decision


    #
    # process legitimate logics
    #
    if False: pass
    elif request_type is self._requestTypes['return']:
      self.token_userId = False
      self.token_time = -1
      broadcast_decision = True

    elif request_type is self._requestTypes['aquire']:
      # if token is available, then assign token to user
      self.token_userId = userId
      self.token_time = utils.secsfrom1970()
      # if aquire request from reserve user, then reset reserve time and reserve_user
      if userId == self.reserve_userId: 
        self.reserve_userId = False # release reservation
        self.reserve_time = -1
      broadcast_decision = True

    elif request_type is self._requestTypes['reserve']:
      # if token was assign but reservation is open then reserve token
      self.reserve_userId = userId
      self.reserve_time = utils.secsfrom1970()
      broadcast_decision = True
    else:
      print("Unkown request_type {}".format(request_type))

    return broadcast_decision


  def envelop_message(self):
    """ envelop the class information to send """
    data = {
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
