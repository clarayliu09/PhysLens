import json
import urllib.request
import urllib.error

MODEL = "qwen3-vl:4b-instruct"

def generate_explanations(scene, physics_data):

  # Convert Pydantic objects into JSON-compatible dictionaries
  scene_dict = scene.model_dump()

  physics_dict = [
    {
      **obj,
      "forces": [
          force.model_dump()
          for force in obj["forces"]
      ]
    }
    for obj in physics_data
  ]

  prompt = f"""
  You are a physics educator explaining an analyzed scene.

  SCENE RELATIONSHIPS:
  {json.dumps(scene_dict)}

  PHYSICS RESULTS:
  {json.dumps(physics_dict)}

  TASK:
  Write a short, clear explanation for each object.

  RULES:
  - Use only the provided scene relationships and physics results.
  - Explain each force and which object exerts it.
  - Connect forces to relevant high-school physics principles.
  - Do not invent forces, directions, magnitudes, or motion.
  - Do not assume equilibrium unless established.
  - If a supporting surface is unknown, say so.
  - Keep each explanation to 2-4 sentences.
  - Include one explanation for every physics result.
  - Preserve each object's index.

  Return ONLY valid JSON:
  {{
    "explanations": [
      {{
        "index": 0,
        "summary": "Gravity pulls the person downward, while a supporting surface exerts an upward normal force."
      }}
    ]
  }}
  """

  request_data = {
    "model": MODEL,
    "messages": [
        {
            "role": "user",
            "content": prompt
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

  try:
    explanations = json.loads(model_output)

  except json.JSONDecodeError as e:
    print("\n=== QWEN JSON PARSING FAILED ===")
    print("Error:", e)
    print("Raw output:", repr(model_output))

    explanations = {"explanations": []}

  return explanations