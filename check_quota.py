import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env")
key = os.environ.get("GEMINI_API_KEY")

async def check(model_id):
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_id}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "hi"}]}]}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        return resp.status_code

async def main():
    models = ["models/gemini-2.0-flash", "models/gemini-2.5-flash", "models/gemini-2.0-flash-lite-001", "models/gemini-flash-latest", "models/gemini-flash-lite-latest", "models/gemini-2.5-flash-pro"]
    for m in models:
        try:
            s = await check(m)
            print(f"{m} -> {s}")
        except Exception as e:
            print(f"{m} -> {str(e)}")

asyncio.run(main())
