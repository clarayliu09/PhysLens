import json
from fastapi import FastAPI, UploadFile, File
from PIL import Image
from io import BytesIO
from detection.object_detector import detect_objects, remove_duplicate_detections
from scene.scene_analyzer import analyze_scene
from physics.physics_engine import analyze_physics
from physics.explanation_generator import generate_explanations

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

    # Remove overlapping detections of the same object
    detections = remove_duplicate_detections(detections, iou_threshold=0.5)
    print("\n=== FILTERED YOLO DETECTIONS ===")
    print(detections)   

    #start = time.perf_counter()
    #run scene analyzer
    scene = analyze_scene(image_bytes, detections)

    print("\n=== YOLO DETECTIONS ===")
    print(detections)

    print("\n=== QWEN SCENE ANALYSIS ===")
    print(scene.model_dump())


    #end = time.perf_counter()

    #print("\nSCENE ANALYSIS TIME:")
    #print(f"{end - start:.2f} seconds") 

    for object in scene.objects:
        i = object.detection_index

        if 0<=i<len(detections):
            # change the label of objects in YOLO's output to the more accurate one provided by Qwen model
            detections[i]["label"] = object.name

    physics_results = analyze_physics(scene, detections)

    print("\n=== PHYSICS RESULTS ===")
    print(physics_results)

    explanations = generate_explanations(scene,physics_results)

    print("\n=== GENERATED EXPLANATIONS ===")
    print(json.dumps(explanations, indent=2, ensure_ascii=False))

    #return results to the app as JSON
    return {
        "objects": detections,
        "scene": scene.model_dump(), #converts SceneAnalysis object to dictionary
        "physics": physics_results,
        "explanations": explanations,
    }