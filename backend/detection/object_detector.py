from ultralytics import YOLO
from PIL import Image #import it from python imaging library

# load pretrained YOLO model
model = YOLO("yolo11n.pt")

def detect_objects(image = Image):
  # do obj detection on image using model
  results = model(image) #returns a list of Results objects, one Results object per image
  result = results[0]

  detected_objs = []

  # looping through all the objects YOLO detected
  for box in result.boxes:
    class_id = int(box.cls[0]) #class ID
    label = result.names[class_id] #converting class ID to understandable label

    coords = box.xyxy[0].tolist() #coords of boundaries - type: list
    xmin = float(coords[0])
    ymin = float(coords[1])
    xmax = float(coords[2])
    ymax = float(coords[3])

    conf = float(box.conf[0]) #confidence score

    # create python dictionary for each object
    object = {
      "label": label,
      "confidence": conf,
      "box": {
        "xmin": xmin,
        "ymin": ymin,
        "xmax": xmax,
        "ymax": ymax,
      },
    }

    detected_objs.append(object)

  return detected_objs

