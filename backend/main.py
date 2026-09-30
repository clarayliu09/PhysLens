import time
from fastapi import FastAPI, UploadFile, File
from PIL import Image
from io import BytesIO
from detection.object_detector import detect_objects
from scene.scene_analyzer import analyze_scene
from physics.physics_engine import analyze_physics

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

    #start = time.perf_counter()
    #run scene analyzer
    scene = analyze_scene(image_bytes, detections)

    #end = time.perf_counter()

    #print("\nSCENE ANALYSIS TIME:")
    #print(f"{end - start:.2f} seconds") 

    for object in scene.objects:
        i = object.detection_index

        if 0<=i<len(detections):
            # change the label of objects in YOLO's output to the more accurate one provided by Qwen model
            detections[i]["label"] = object.name

    physics_results = analyze_physics(scene)

    #return results to the app as JSON
    return {
        "objects": detections,
        "scene": scene.model_dump(), #converts SceneAnalysis object to dictionary
        "physics": physics_results
    }