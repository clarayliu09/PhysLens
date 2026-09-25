import base64
import json
import urllib.request

from pydantic import BaseModel
from typing import Literal
from PIL import Image
from io import BytesIO

MODEL = "qwen3-vl:4b-instruct"

# DEFINING OUR OWN DATA TYPES
class Relationship(BaseModel):
  type: Literal[ # Literal restricts options to those listed
    "supported_by",
    "hanging_from",
    "attached_to",
    "touching"
  ]
  object: str


class SceneObject(BaseModel):
  detection_index: int
  name: str
  relationships: list[Relationship]


class SceneAnalysis(BaseModel):
  objects: list[SceneObject]


def resize_image(image_bytes, max_size = 640):
  """Function that compresses the image so scene analyzing model runs faster"""
  image = Image.open(BytesIO(image_bytes))

  #resize but keep original ratio
  image.thumbnail((max_size, max_size))

  output = BytesIO()

  #convert to JPEG to pass into Qwen
  image.convert("RGB").save(output, format="JPEG", quality=85)

  return output.getvalue()


def analyze_scene(image_bytes: bytes, detections: list) -> SceneAnalysis:
  """
  Analyze an image and return information about the objects and their relationships.
  Returns a dictionary containing a list of objects with their repspective info

  image_bytes: original uploaded image in RGB format
  detections: list of objects detected by YOLO model

  returns: structured description of scene
  """
  resized_image = resize_image(image_bytes)

  image_base64 = base64.b64encode(resized_image).decode("utf-8")

  prompt = f"""
  You are analyzing a physical scene for a physics education app.PermissionError

  An object detector found these objects:

  {json.dumps(detections,indent=2)}

  Use the full image to identify what the detected objects actually are 
  and how they physically interact with their surroundings.

  For each important detected object, return:
  - detection_index: its index in the detection list
  - name: a clear everyday name for the object
  - relationships: physical relationships visible in the image

  Allowed relationship types:

  - supported_by:
    The object is resting on a surface that supports its weight.
    Examples: a book on a table, a bottle on the floor,
    a box on a shelf.

  - hanging_from:
    The object is suspended from another object.
    Examples: a lamp hanging from a cord, a mass hanging from a string.

  - attached_to:
    The object is physically connected to another object,
    but is not hanging from it.

  - touching:
    The objects are in physical contact, but neither object
    is supporting the other.

  Important:
  If an object is resting on top of a surface, use "supported_by",
  NOT "touching".

  Do not infer forces or physics concepts.
  Only describe relationships visible in the image.

  Return ONLY valid JSON in this format: 

  {{
      "objects": [
          {{
              "detection_index": 0,
              "name": "book",
              "relationships": [
                  {{
                      "type": "supported_by",
                      "object": "wooden table"
                  }}
              ]
          }}
      ]
  }}
  """
  
  request_data = {
    "model": MODEL,
    "messages": [
      {
        "role": "user",
        "content": prompt,
        "images": [image_base64]
      }
    ],
    "stream": False
  }

  request = urllib.request.Request(
    "http://localhost:11434/api/chat",
    data=json.dumps(request_data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
  )

  with urllib.request.urlopen(request) as response:
    result = json.loads(response.read().decode("utf-8"))

  model_output = result["message"]["content"]

  scene_data = json.loads(model_output)
  print(scene_data)

  return SceneAnalysis.model_validate(scene_data) 
  # SceneAnalysis.model_validate(scene_data) creates a SceneAnalysis
  #  object that takes in scene_data (which is a dictionary containing results)
