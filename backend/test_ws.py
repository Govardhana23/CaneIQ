import asyncio
import websockets
import json

async def test_stream():
    uri = "ws://localhost:8000/ws/conveyor"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected. Waiting for first payload...")
            message = await websocket.recv()
            data = json.loads(message)
            print("Received JSON Keys:", data.keys())
            print("Confidence type:", type(data['confidence']))
            print("Pol type:", type(data['pol_prediction']))
            print("Data packet example:", {k: v for k, v in data.items() if k != 'raw_spectrum'})
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_stream())
