#!/usr/bin/env python

import asyncio
import datetime
import random
import websockets
import json

async def time(websocket, path):
  while True:
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    await websocket.send(json.dumps({"now": now}))
    await asyncio.sleep(random.random())

    datastr = await websocket.recv()
    data = json.loads(datastr)
    print(data)

start_server = websockets.serve(time, '127.0.0.1', 5678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
