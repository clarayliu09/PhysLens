from ultralytics import YOLO
from PIL import Image #import it from python imaging library

# load pretrained YOLO model
model = YOLO("yolo11n.pt")

def box_iou(box_a, box_b):
    """Calculate intersection over union of two bounding boxes."""

    x1 = max(box_a["xmin"], box_b["xmin"])
    y1 = max(box_a["ymin"], box_b["ymin"])
    x2 = min(box_a["xmax"], box_b["xmax"])
    y2 = min(box_a["ymax"], box_b["ymax"])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)

    area_a = (
        (box_a["xmax"] - box_a["xmin"])
        * (box_a["ymax"] - box_a["ymin"])
    )
    area_b = (
        (box_b["xmax"] - box_b["xmin"])
        * (box_b["ymax"] - box_b["ymin"])
    )

    union = area_a + area_b - intersection

    return intersection / union if union > 0 else 0


def remove_duplicate_detections(detections, iou_threshold=0.5):
    """Keep the highest-confidence detection among overlapping boxes of the same class."""

    sorted_detections = sorted(
        detections,
        key=lambda detection: detection["confidence"],
        reverse=True,
    )

    filtered = []

    for detection in sorted_detections:
        duplicate = any(
            detection["label"] == kept["label"]
            and box_iou(detection["box"], kept["box"]) > iou_threshold
            for kept in filtered
        )

        if not duplicate:
            filtered.append(detection)

    return filtered


def detect_objects(image = Image):
  """
  Runs YOLO model on selected image and returns a list of dictionaries. 
  Each dictionary contains information on one object
  """
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

