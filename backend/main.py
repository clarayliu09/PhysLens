from fastapi import FastAPI, UploadFile, File
from PIL import Image
from io import BytesIO
from detection.object_detector import detect_objects
from scene.scene_analyzer import analyze_scene

#create FastAPI app
app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "PhysLens backend is running"
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    #read uploaded image as bytes
    image_bytes = await file.read()

    #convert bytes into an image YOLO can understand
    image = Image.open(
        BytesIO(image_bytes)
    ).convert("RGB")

    #run object detector
    detections = detect_objects(image)

    #run scene analyzer
    scene = analyze_scene(image_bytes, detections)

    for object in scene.objects:
        ind = object.detection_index

        if 0<=ind<len(detections):
            # change the label of objects in YOLO's output to the more accurate provided by Qwen model
            detections[ind]["label"] = object.name

    #return results to the app as JSON
    return {
        "objects": detections,
        "scene": scene.model_dump() #converts SceneAnalysis object to dictionary
    }