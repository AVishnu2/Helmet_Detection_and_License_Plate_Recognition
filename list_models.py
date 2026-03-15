import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env")
key = os.environ.get("GEMINI_API_KEY")

async def main():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get("name") for m in data.get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
            for m in models:
                print(m)
        else:
            print("Error:", resp.status_code, resp.text)

asyncio.run(main())
