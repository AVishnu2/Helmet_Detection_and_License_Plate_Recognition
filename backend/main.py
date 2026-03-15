from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import io
import os
import base64
import random
import httpx
import json
import tempfile
from pathlib import Path

# Load .env file (works locally; on Vercel env vars are set via dashboard)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory (cross-platform)
UPLOADS_DIR = Path(tempfile.gettempdir()) / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_VISION_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


class HelmetDetector:
    """
    Helmet and License Plate Detection Engine.
    Helmet detection uses Google Gemini Vision API for accurate AI analysis.
    License plate detection generates a realistic mock plate (Tesseract OCR
    requires a local binary — not available in Vercel serverless).
    """

    # ------------------------------------------------------------------ #
    #  Helmet Detection  (Real AI — Gemini Vision API)                    #
    # ------------------------------------------------------------------ #

    async def detect_helmet(self, image_data: bytes, content_type: str = "image/jpeg"):
        """
        Send image to Gemini Vision and ask whether a helmet is visible.
        Returns:
            {
                "helmet_detected": bool,
                "confidence": float,   # 0.0 – 1.0
                "message": str,
                "raw_response": str    # for debugging
            }
        """
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail=(
                    "GEMINI_API_KEY environment variable is not set. "
                    "Get a free key at https://aistudio.google.com/app/apikey "
                    "and add it to your Vercel project environment variables."
                ),
            )

        # Encode image as base64
        image_b64 = base64.b64encode(image_data).decode("utf-8")

        prompt = (
            "You are a safety compliance AI. Look at this image carefully.\n"
            "Is the person (rider/driver/pedestrian) in the image wearing a "
            "safety helmet or motorcycle helmet?\n\n"
            "Rules:\n"
            "- If you can clearly see a helmet on the person's head, answer YES.\n"
            "- If the person's head is visible but NO helmet is present, answer NO.\n"
            "- If there is no person visible, answer NO.\n\n"
            "Respond ONLY with a JSON object in this exact format (no markdown):\n"
            '{"helmet": true, "confidence": 0.95, "reason": "short explanation"}\n'
            "confidence must be a float between 0.0 and 1.0."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": content_type,
                                "data": image_b64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,   # Low temp → deterministic, factual
                "maxOutputTokens": 150,
            },
        }

        headers = {"Content-Type": "application/json"}
        url_with_key = f"{GEMINI_VISION_URL}?key={GEMINI_API_KEY}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url_with_key, json=payload, headers=headers)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Gemini API error {response.status_code}: {response.text[:300]}",
                )

            resp_json = response.json()
            raw_text = (
                resp_json
                .get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )

            # Parse the JSON response from Gemini
            gemini_data = json.loads(raw_text)
            helmet_detected = bool(gemini_data.get("helmet", False))
            confidence = float(gemini_data.get("confidence", 0.5))
            reason = gemini_data.get("reason", "")

            # Clamp confidence to [0, 1]
            confidence = max(0.0, min(1.0, confidence))

            return {
                "helmet_detected": helmet_detected,
                "confidence": round(confidence, 2),
                "message": (
                    f"Helmet detected ✓ ({reason})"
                    if helmet_detected
                    else f"No helmet detected ✗ ({reason})"
                ),
                "raw_response": raw_text,
            }

        except json.JSONDecodeError:
            # Gemini returned something unparseable — try simple keyword check
            text_lower = raw_text.lower()
            helmet_detected = '"helmet": true' in text_lower or text_lower.startswith("yes")
            return {
                "helmet_detected": helmet_detected,
                "confidence": 0.70,
                "message": "Helmet detected ✓" if helmet_detected else "No helmet detected ✗",
                "raw_response": raw_text,
            }

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Gemini API request timed out.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")

    # ------------------------------------------------------------------ #
    #  License Plate Detection  (Mock — realistic Indian plates)          #
    # ------------------------------------------------------------------ #

    async def detect_license_plate(self, image_data: bytes, content_type: str = "image/jpeg"):
        """
        Use Gemini Vision to perform OCR on the license plate.
        """
        if not GEMINI_API_KEY:
            return {"plate_detected": False, "text": "", "confidence": 0.0}

        image_b64 = base64.b64encode(image_data).decode("utf-8")

        prompt = (
            "You are an Automatic License Plate Recognition (ALPR) system. "
            "Examine this image and read the exact text and numbers on the vehicle's license plate. "
            "Ignore any other text in the background. Return ONLY a valid JSON object. "
            "Format: {\"plate_detected\": boolean, \"text\": \"extracted plate text without spaces\", \"confidence\": number between 0 and 1}. "
            "If no plate is visible, set plate_detected to false and text to empty."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": content_type,
                                "data": image_b64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "response_mime_type": "application/json",
            },
        }

        headers = {"Content-Type": "application/json"}
        url_with_key = f"{GEMINI_VISION_URL}?key={GEMINI_API_KEY}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url_with_key, json=payload, headers=headers)

            if response.status_code != 200:
                print("Gemini plate error:", response.text)
                return {"plate_detected": False, "text": "", "confidence": 0.0}

            raw_text = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
            print("Gemini raw OCR output:", raw_text)
            
            try:
                data = json.loads(raw_text)
                text = str(data.get("text", "")).strip().replace(" ", "").upper()
                return {
                    "plate_detected": bool(data.get("plate_detected", False)) and len(text) > 0,
                    "text": text,
                    "confidence": float(data.get("confidence", 0.0))
                }
            except json.JSONDecodeError:
                return {"plate_detected": False, "text": "", "confidence": 0.0}

        except Exception as e:
            print("Plate detection exception:", e)
            return {"plate_detected": False, "text": "", "confidence": 0.0}

    def validate_license_plate(self, plate_text: str) -> str:
        """Validate and format license plate text."""
        if not plate_text:
            return "INVALID"
        if "-" in plate_text:
            return plate_text
        plate_text = plate_text.strip().upper().replace(" ", "")
        if len(plate_text) >= 10:
            try:
                return f"{plate_text[:2]}-{plate_text[2:4]}-{plate_text[4:6]}-{plate_text[6:10]}"
            except Exception:
                return plate_text
        return plate_text or "INVALID"


# Initialize detector
detector = HelmetDetector()


# ------------------------------------------------------------------ #
#  API Endpoints                                                      #
# ------------------------------------------------------------------ #

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
    }


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze image for helmet and license plate using Gemini Vision AI."""

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # Validate image format by magic bytes
        if contents[:3] == b'\xff\xd8\xff':
            content_type = "image/jpeg"
        elif contents[:8] == b'\x89PNG\r\n\x1a\n':
            content_type = "image/png"
        elif contents[:4] == b'RIFF' and contents[8:12] == b'WEBP':
            content_type = "image/webp"
        elif contents[:6] in [b'GIF87a', b'GIF89a']:
            content_type = "image/gif"
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Please upload a JPG, PNG, WebP, or GIF image.",
            )

        # Save uploaded image
        filename = f"upload_{os.urandom(8).hex()}.jpg"
        filepath = UPLOADS_DIR / filename
        with open(filepath, "wb") as f:
            f.write(contents)

        # --- Real helmet detection via Gemini Vision ---
        helmet_result = await detector.detect_helmet(contents, content_type)

        # --- License plate: only if no helmet detected ---
        plate_result = {"plate_detected": False, "text": "", "confidence": 0.0}
        if not helmet_result.get("helmet_detected", True):
            plate_result = await detector.detect_license_plate(contents, content_type)
            if plate_result.get("text"):
                plate_result["text"] = detector.validate_license_plate(plate_result["text"])

        return JSONResponse({
            "success": True,
            "helmet_detected": helmet_result.get("helmet_detected", False),
            "helmet_confidence": helmet_result.get("confidence", 0.0),
            "helmet_message": helmet_result.get("message", ""),
            "license_plate": plate_result.get("text", ""),
            "plate_detected": plate_result.get("plate_detected", False),
            "plate_confidence": plate_result.get("confidence", 0.0),
            "image_path": f"/uploads/{filename}",
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unhandled error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
