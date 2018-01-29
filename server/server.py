#!/usr/bin/env python

import asyncio, datetime, websockets, ssl
from token_manager import TokenManager

manager = TokenManager()
async def time(websocket, path):
  global manager
  while True:
    # now = datetime.datetime.utcnow().isoformat() + 'Z'
    # await websocket.send(json.dumps({"now": now}))

    request = await websocket.recv()
    broadcast = manager.process_request(request)
    if broadcast:
      message = manager.envelop_message()
      await websocket.send(message)


if __name__ == '__main__':
  enable_ssl = False
  url = 'www.letsbaths.com'
  url = '128.163.154.220'
  url = 'letsbaths.com'

  if enable_ssl:
    sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
    sslcontext.load_cert_chain("ssl/server.crt", "ssl/server.key")
    start_server = websockets.serve(time, url, 80, create_protocol=sslcontext)
  else:
    start_server = websockets.serve(time, url, 80)

  asyncio.get_event_loop().run_until_complete(start_server)
  asyncio.get_event_loop().run_forever()
