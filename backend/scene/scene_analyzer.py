import base64
import json
import urllib.request

from pydantic import BaseModel, Field, AliasChoices
from typing import Literal
from PIL import Image
from io import BytesIO

MODEL = "qwen3-vl:4b-instruct"

# DEFINING OWN DATA TYPES
class Relationship(BaseModel):
  type: Literal[ # Literal restricts options to those listed
    "supported_by",
    "hanging_from",
    "attached_to",
    "touching"
  ]
  object: str #can be an unknown object


class SceneObject(BaseModel):
  detection_index: int = Field(
    validation_alias=AliasChoices(
        "detection_index",
        "index"
    )
  )
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
  You are analyzing a physical scene for a physics education app.

  An object detector found these objects:

  {json.dumps(detections, indent=2)}

  Use the full image to:
  1. Identify what each detected object actually is.
  2. Identify visible physical relationships between objects and their surroundings.

  You are performing SCENE UNDERSTANDING ONLY.
  Do NOT infer forces or physics concepts.

  For EVERY detected object, return:
  - detection_index: its index in the detection list
  - name: a clear, specific everyday name for the object
  - relationships: all clearly visible physical relationships involving that object

  For each detected object, carefully check:
  1. Is it resting on or sitting on another object or surface?
  2. Is it hanging from another object?
  3. Is it physically attached to another object?
  4. Is it touching another object?

  Pay special attention to relationships BETWEEN detected objects.
  Do not only check relationships between detected objects and the
  background or environment.

  Allowed relationship types:

  - supported_by:
    The object is visibly resting on, sitting on, or being held up by
    another object or surface beneath it.

    Examples:
    - book resting on table → book supported_by table
    - cat sitting on chair → cat supported_by chair
    - box resting on shelf → box supported_by shelf
    - chair standing on floor → chair supported_by floor

  - hanging_from:
    The object is visibly suspended from another object.

    Examples:
    - lamp hanging from cord → lamp hanging_from cord
    - mass hanging from string → mass hanging_from string

  - attached_to:
    The object is visibly physically connected to another object,
    but is not hanging from it.

  - touching:
    The object is visibly in physical contact with another object,
    but neither object is clearly resting on or supported by the other.

  SUPPORT DETECTION:

  For every detected object, examine whether it is visibly
  resting on a surface.

  If the object is resting on a surface:
  - Use the relationship type "supported_by".
  - If the supporting object is identifiable, name it.
  - If the supporting object cannot be identified, use
    "unknown surface" as the supporting object.

  Examples:

  A bottle resting on a floor:
  {{
      "type": "supported_by",
      "object": "floor"
  }}

  A box resting on an unidentified horizontal surface:
  {{
      "type": "supported_by",
      "object": "unknown surface"
  }}

  Do not require the supporting surface to be detected by YOLO.

  Do not assume every object is supported. Objects may be
  hanging, falling, or otherwise unsupported.  

  IMPORTANT RULES:

  - If object A is visibly resting on object B, report:
    A supported_by B

  - Do NOT create a reverse relationship just because A has a
    relationship with B. Report only the directly observed relationship.

  - If an object is resting on another object or surface, use
    "supported_by", NOT "touching".

  - An object may have more than one relationship if multiple
    relationships are clearly visible.

  - If no allowed relationship is clearly visible for an object,
    return an empty relationships list.

  - Use the detected objects as spatial hints, but use the full image
    to determine their actual identities and relationships.

  - Do not invent objects or relationships that are not visually
    supported by the image.

  - Do NOT infer or mention:
    gravity,
    normal forces,
    tension forces,
    friction,
    force direction,
    force magnitude,
    Newton's laws,
    equilibrium,
    velocity,
    acceleration,
    or any other physics conclusions.

  Return ONLY valid JSON.
  Do not include Markdown, explanations, or text outside the JSON.

  Use exactly this structure:

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

  return SceneAnalysis.model_validate(scene_data) 
  # SceneAnalysis.model_validate(scene_data) creates a SceneAnalysis
  #  object that takes in scene_data (which is a dictionary containing results)
