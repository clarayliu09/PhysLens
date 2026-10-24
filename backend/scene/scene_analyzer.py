import base64
import json
import urllib.request
import urllib.error
import time

from pydantic import BaseModel, Field, AliasChoices
from typing import Literal
from PIL import Image
from io import BytesIO

MODEL = "qwen3-vl:4b-instruct"
def log_ollama_performance(result, label):
    print(f"\n=== OLLAMA PERFORMANCE: {label} ===")

    for key in [
        "total_duration",
        "load_duration",
        "prompt_eval_duration",
        "eval_duration",
    ]:
        value = result.get(key)

        if value is not None:
            print(f"{key}: {value / 1e9:.2f}s")

    print("Prompt tokens:", result.get("prompt_eval_count"))
    print("Generated tokens:", result.get("eval_count"))

class Relationship(BaseModel):
  type: Literal[ # Literal restricts options to those listed
    "supported_by",
    "hanging_from",
    "attached_to",
    "touching"
  ]
  object: str #can be an unknown object
  confidence: Literal["high", "medium", "low"] = "medium"


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

  original_image = Image.open(BytesIO(image_bytes))
  resized_pil = Image.open(BytesIO(resized_image))

  original_width, original_height = original_image.size
  resized_width, resized_height = resized_pil.size

  scale_x = resized_width / original_width
  scale_y = resized_height / original_height

  scaled_detections = []

  for detection in detections:
      box = detection["box"]

      scaled_detections.append({
          "label": detection["label"],
          "confidence": round(detection["confidence"], 3),
          "box": {
              "xmin": round(box["xmin"] * scale_x),
              "ymin": round(box["ymin"] * scale_y),
              "xmax": round(box["xmax"] * scale_x),
              "ymax": round(box["ymax"] * scale_y),
          }
      })

  image_base64 = base64.b64encode(resized_image).decode("utf-8")

  prompt = f"""
  You are analyzing an image for a physics education app.

  YOLO detected these objects (indices correspond to the detection list):
  Image dimensions: {resized_width} x {resized_height} pixels.
  Bounding boxes use these resized-image coordinates.
  {json.dumps(scaled_detections, separators=(",", ":"))}

  TASK:
  For EVERY detected object, identify:
  - detection_index: its original detection index
  - name: a specific everyday object name for the actual object in the image (could be independent from its YOLO label - YOLO labels are suggestions, NOT confirmed object identities)
  - relationships: visible physical relationships with other objects or surfaces

  OBJECT IDENTIFICATION:
  - YOLO labels are approximate suggestions, not ground truth.
  - Independently identify each object using its visual appearance.
  - Distinguish visually similar objects by their shape and function.
    Examples: water bottle vs vase, plate vs dining table,
    flower arrangement vs potted plant.
  - A detection box may contain multiple overlapping objects.
    Name the object that best matches the intended detection.
  - Do not retain an incorrect YOLO label merely because it was
    provided in the detection list.

  For each detected object, independently inspect its
  physical relationships before moving to the next object.

  Do not focus only on the most visually prominent object.

  Check every detection index, including objects partially
  obscured by other objects.

  For each object, specifically consider:
  1. What, if anything, supports this object?
  2. Is this object touching another object?
  3. Is it suspended or attached to something?
  4. Is the evidence sufficient to identify the relationship?

  Return one result for every detection index, even when
  no relationship can be determined.

  ALLOWED RELATIONSHIPS:
  - supported_by: resting, sitting, standing, or being held up by a surface/object
  - hanging_from: suspended by a string, rope, hook, etc.
  - attached_to: physically connected but not suspended
  - touching: in contact without clear support

  SUPPORT AND CONTACT DETECTION:

  For each detected object, inspect its position, orientation,
  and physical contact with surrounding objects.

  Classify relationships using these rules:

  1. supported_by:
    Use when an object is resting on, sitting on, standing on,
    or otherwise mechanically supported by another object.

    Examples:
    - Bowl resting on a table -> supported_by table
    - Vase resting on a shelf -> supported_by shelf
    - Person sitting on a chair -> supported_by chair
    - Chair resting on the floor -> supported_by floor

  2. touching:
    Use when two objects visibly contact each other but
    there is insufficient evidence that one supports the other.

  3. hanging_from:
    Use when an object is visibly suspended by a rope,
    string, hook, or another attachment.

  4. attached_to:
    Use when objects are physically connected without
    a clear hanging relationship.

  IMPORTANT:
  - A support can exist even if YOLO did not detect it.
  - A support can be partly obscured by the object it supports.
  - If the supporting surface is clear, name it specifically.
  - If support is clear but the surface cannot be identified,
    use "unknown surface".
  - The absence of a detected supporting object does NOT
    mean the detected object is unsupported.
  - Pay special attention to the bottom of each object.
  - If the bottom visibly rests on a horizontal surface,
    report supported_by that surface.
  - Do not leave relationships empty solely because
    YOLO detected only one object.
  - Do not assume that overlapping bounding boxes mean
    the objects are touching.
  - Do not invent a support merely because an object
    would normally require one.
  - Do not infer equilibrium or motion from a single image.
  - When a relationship is genuinely uncertain, omit it.
  

  RULES:
  - Include all clearly identifiable relationships for each object.
  - Objects may have multiple relationships.
  - Report relationships in the observed direction only; do not
    automatically create reverse relationships.
  - Use the image, not just YOLO labels, to identify objects.
  - Do not invent unsupported relationships.
  - Use [] when no relationship can be determined.
  - Do NOT infer forces, motion, or other physics concepts.
  - Assign confidence to each relationship:
    high: physical contact or support is clearly visible
    medium: strong visual evidence, but contact is partly obscured
    low: plausible relationship with insufficient visual evidence
  - Include plausible support relationships when there is
    visual evidence, even if confidence is low.
  - Use low confidence when contact is partly obscured or
    the supporting surface is uncertain.
  - Do not invent relationships without visual evidence.

  Return ONLY valid JSON in this exact format:
  {{
    "objects": [
      {{
        "detection_index": 0,
        "name": "person",
        "relationships": [
          {{"type": "supported_by", "object": "chair", "confidence": "high"}},
          {{"type": "touching", "object": "table", "confidence": "high"}}
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

  with urllib.request.urlopen(request) as response:
    result = json.loads(response.read())

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

  scene = SceneAnalysis.model_validate(scene_data) 

  # Second check for accuracy
  for obj in scene.objects:
      # Already has a confirmed support or suspension
      if any(
          rel.type in ("supported_by", "hanging_from")
          for rel in obj.relationships
      ):
          continue

      touching_objects = [
          rel.object
          for rel in obj.relationships
          if rel.type == "touching"
      ]

      if touching_objects:
          support_prompt = f"""
          Analyze the image, focusing on object {obj.detection_index}
          identified as "{obj.name}".

          Its bounding box:
          {json.dumps(scaled_detections[obj.detection_index]["box"])}

          The initial scene analysis identified these contacts:
          {json.dumps(touching_objects)}

          TASK:
          Determine whether one of these contacting objects DIRECTLY
          supports the target object's weight against gravity.

          IMPORTANT:
          - Evaluate the existing contacts before considering any other surface.
          - A cat sitting on a chair is supported by the chair, not the floor.
          - A bowl resting on a table is supported by the table, not the floor.
          - Do not select the floor simply because it supports the furniture.
          - A support must directly contact the target object.
          - Do not infer support from bounding-box overlap alone.
          - If none of the listed contacts clearly supports the object,
            return supported=false.

          Return ONLY JSON:
          {{
              "supported": true,
              "supporting_object": "chair"
          }}
          """
      else:
          support_prompt = f"""
          Look at the image and focus on detected object {obj.detection_index},
          identified as "{obj.name}".

          Its bounding box:
          {json.dumps(scaled_detections[obj.detection_index]["box"])}

          Determine whether this object is directly resting on
          another object or surface.

          IMPORTANT:
          - The supporting surface does not need to be detected by YOLO.
          - Examine the bottom of the object and its surroundings.
          - An upright bottle resting on the floor is supported by the floor.
          - Do not assume support merely because an object is upright.
          - If evidence is insufficient, return supported=false.

          Return ONLY JSON:
          {{
              "supported": true,
              "supporting_object": "floor"
          }}
          """

      followup_request_data = {
          "model": MODEL,
          "messages": [
              {
                  "role": "user",
                  "content": support_prompt,
                  "images": [image_base64]
              }
          ],
          "stream": False,
          "format": "json",
          "options": {
              "temperature": 0,
              "num_ctx": 8192,
              "num_predict": 256
          }
      }

      followup_req = urllib.request.Request(
          "http://localhost:11434/api/chat",
          data=json.dumps(followup_request_data).encode("utf-8"),
          headers={"Content-Type": "application/json"},
          method="POST"
      )

      try:
          start = time.perf_counter()

          with urllib.request.urlopen(followup_req) as response:
              followup_result = json.loads(response.read())

          print(
              f"[TIMING] Support check for {obj.name} "
              f"(index {obj.detection_index}): "
              f"{time.perf_counter() - start:.2f}s"
          )

          log_ollama_performance(
              followup_result,
              f"Support check: {obj.name}"
          )

          support_data = json.loads(
              followup_result["message"]["content"]
          )

          if support_data.get("supported") is True:
              supporting_object = support_data.get("supporting_object")

              if isinstance(supporting_object, str) and supporting_object.strip():
                supporting_object = supporting_object.strip()

                # When evaluating known contacts, only accept one of those contacts.
                if touching_objects and supporting_object.lower() not in {
                    name.lower() for name in touching_objects
                }:
                    print(
                        f"Rejected support '{supporting_object}' for "
                        f"{obj.name}: not among known contacts {touching_objects}"
                    )
                    continue

                # Remove redundant touching relationship for the same support.
                obj.relationships = [
                    rel for rel in obj.relationships
                    if not (
                        rel.type == "touching"
                        and rel.object.strip().lower() == supporting_object.lower()
                    )
                ]

                obj.relationships.append(
                    Relationship(
                        type="supported_by",
                        object=supporting_object,
                        confidence="medium"
                    )
                )

      except (urllib.error.URLError, ValueError, KeyError) as e:
          print(f"Support follow-up failed for object {obj.detection_index}: {e}")

  print("\n=== SCENE RELATIONSHIP DEBUG ===")

  for obj in scene.objects:
      print(f"[{obj.detection_index}] {obj.name}")

      if not obj.relationships:
          print("  No relationships identified")

      for relationship in obj.relationships:
          print(
              f"  {relationship.type} -> {relationship.object}"
              f" ({relationship.confidence})"
          )


  return scene