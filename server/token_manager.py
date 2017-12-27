#!/usr/bin/env python

import json, hashlib
from ipdb import set_trace as st

class TokenManager():
  """ 
  Class to apply logics to make decisions 
  when receiving request from the clients
  """
  def __init__(self):
    self._requestTypes = {'return': 0, 'aquire': 1, 'reserve': 2}
    self.userList = {}

    self.token_userId = False
    self.reserve_userId = False


  def parse_request(self, message_raw):
    request = json.loads(message_raw)  # de-stringify raw massege
    request_type = request['request']
    userInfo = request['userInfo']
    return request_type, userInfo


  def encode_userInfo(self, userInfo):
    infoStr = json.dumps(userInfo)
    hashcode =  hashlib.sha224(infoStr.encode('utf-8')).hexdigest()
    return hashcode
    

  def process_request(self, request_message):
    request_type, userInfo = self.parse_request(request_message)
    userId = self.encode_userInfo(userInfo)

    # add to user list if the request came from new user
    broadcast_decision = False
    if userId not in self.userList:
      self.userList.update({userId: userInfo})
      broadcast_decision = True


    # log ill logics
    if userId == self.token_userId and request_type in (self._requestTypes['aquire'], self._requestTypes['reserve']):
      print("can't aquire or reserve when keeping the token.")
      return broadcast_decision
    if userId != self.token_userId and request_type is self._requestTypes['return']:
      print("can't return the token without keeping it.")
      return broadcast_decision


    if False: pass
    elif request_type is self._requestTypes['return']:
      if userId == self.token_userId:
        self.token_userId = False
        broadcast_decision = True

    elif request_type is self._requestTypes['aquire']:
      # if token is available, then assign token to user
      if not self.token_userId and userId != self.token_userId:
        self.token_userId = userId
        self.reserve_userId = False # release reservation
        broadcast_decision = True

    elif request_type is self._requestTypes['reserve']:
      # if token was assign but reservation is open then reserve token
      if not self.reserve_userId and userId != self.reserve_userId:
        self.reserve_userId = userId
        broadcast_decision = True
    else:
      print("Unkown request_type {}".format(request_type))

    return broadcast_decision


  def key2id(self, userId):
    idx = 0
    for key in self.userList.keys():
      if userId == key:
        return idx
      else:
        idx += 1
    return -1


  def envelope_message(self):
    """ Envelope the class information to send """
    data = {
      'userList': list(self.userList.values()),
      'token_userId': self.key2id(self.token_userId),
      'reserve_userId': self.key2id(self.reserve_userId)
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

  print(manager.envelope_message())
