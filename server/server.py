#!/usr/bin/env python

import asyncio, datetime, websockets
from token_manager import TokenManager

async def time(websocket, path):
  manager = TokenManager()
  while True:
    # now = datetime.datetime.utcnow().isoformat() + 'Z'
    # await websocket.send(json.dumps({"now": now}))

    request = await websocket.recv()
    broadcast = manager.process_request(request)
    if broadcast:
      message = manager.envelop_message(request)
      await websocket.send(message)


if __name__ == '__main__':
  start_server = websockets.serve(time, '128.163.154.220', 5678)

  asyncio.get_event_loop().run_until_complete(start_server)
  asyncio.get_event_loop().run_forever()
