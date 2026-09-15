from fastapi import FastAPI, UploadFile, File
from PIL import Image
from io import BytesIO
from detection.object_detector import detect_objects

# create FastAPI app
app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "PhysLens backend is running"
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    # Read uploaded image as bytes
    image_bytes = await file.read()

    # Convert bytes into an image YOLO can understand
    image = Image.open(
        BytesIO(image_bytes)
    ).convert("RGB")

    # Run our object detector
    detections = detect_objects(image)

    # Return results to the app as JSON
    return {
        "objects": detections
    }