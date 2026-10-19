import base64
import json
import urllib.request
import urllib.error

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
  You are analyzing an image for a physics education app.

  YOLO detected these objects (indices correspond to the detection list):
  {json.dumps(detections, separators=(",", ":"))}

  TASK:
  For EVERY detected object, identify:
  - detection_index: its original detection index
  - name: a specific everyday object name
  - relationships: visible physical relationships with other objects or surfaces

  ALLOWED RELATIONSHIPS:
  - supported_by: resting, sitting, standing, or being held up by a surface/object
  - hanging_from: suspended by a string, rope, hook, etc.
  - attached_to: physically connected but not suspended
  - touching: in contact without clear support

  SUPPORT DETECTION (IMPORTANT):

  For EVERY object, determine whether it is supported by
  another object or surface.

  Examples:
  - Vase resting on table -> supported_by table
  - Cup resting on desk -> supported_by desk
  - Person sitting -> supported_by chair
  - Person standing -> supported_by floor
  - Chair on floor -> supported_by floor

  A supporting surface may be partially hidden or outside
  the detected bounding boxes.

  If the object's position and surrounding scene strongly
  indicate that it is resting on a surface, report supported_by
  even when the exact contact point is obscured.

  If support is evident but the supporting surface cannot
  be identified, use "unknown surface".

  A person sitting in a chair while touching a table has
  BOTH supported_by chair AND touching table.

  Use supported_by rather than touching when a surface
  supports an object's weight.

  Do not assume support if the object appears suspended,
  falling, or its physical state is genuinely unclear.

  RULES:
  - Include all clearly identifiable relationships for each object.
  - Objects may have multiple relationships.
  - Report relationships in the observed direction only; do not
    automatically create reverse relationships.
  - Use the image, not just YOLO labels, to identify objects.
  - Do not invent unsupported relationships.
  - Use [] when no relationship can be determined.
  - Do NOT infer forces, motion, or other physics concepts.

  Return ONLY valid JSON in this exact format:
  {{
    "objects": [
      {{
        "detection_index": 0,
        "name": "person",
        "relationships": [
          {{"type": "supported_by", "object": "chair"}},
          {{"type": "touching", "object": "table"}}
        ]
      }}
    ]
  }}

  Include one entry for EVERY detected object, using its original index.
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
    "stream": False,
    "format": "json",
    "options": {
        "temperature": 0,
        "num_ctx": 8192, #increases available context window to 8192 tokens
        "num_predict": 2048
    }
  }

  request = urllib.request.Request(
    "http://localhost:11434/api/chat",
    data=json.dumps(request_data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
  )

  try:
    with urllib.request.urlopen(request) as response:
      result = json.loads(response.read())

  except urllib.error.HTTPError as e:
    error_body = e.read().decode("utf-8", errors="replace")

    print("\n=== OLLAMA ERROR ===")
    print("Status:", e.code)
    print("URL:", e.url)
    print("Message:", error_body)
    print("==================================\n")

    raise 

  model_output = result["message"]["content"]

  print("\n=== RAW QWEN OUTPUT ===")
  print(repr(model_output))
  print("\n=== OUTPUT LENGTH ===")
  print(len(model_output))

  try:
    scene_data = json.loads(model_output)

  except json.JSONDecodeError as e:
    print("\n=== QWEN JSON PARSING FAILED ===")
    print("Error:", e)
    print("Raw output:", repr(model_output))

    scene_data = {"objects": []}

  return SceneAnalysis.model_validate(scene_data) 
  # SceneAnalysis.model_validate(scene_data) creates a SceneAnalysis
  #  object that takes in scene_data (which is a dictionary containing results)
