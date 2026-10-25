import json
import urllib.request
import urllib.error

MODEL = "qwen3-vl:4b-instruct"

def format(force, physics_data):
  force_dict = force.model_dump(exclude={"id"})

  if "_on_" not in force.id:
    return force_dict

  source, target = force.id.split("_on_", 1)

  def resolve_name(identifier):
    parts = identifier.rsplit("_", 1)

    if len(parts) == 2 and parts[1].isdigit():
      index = int(parts[1])

      obj = next(
        (r for r in physics_data if r["index"] == index),
        None
      )

      if obj is not None:
        # number objects only when multiple objects share the same name
        matching_objects = [
          r for r in physics_data
          if r["name"] == obj["name"]
        ]

        if len(matching_objects) == 1: return obj["name"]
        matching_indices = sorted(r["index"] for r in matching_objects)

        number = matching_indices.index(index) + 1

        return f"{obj['name']} {number}"

    return identifier.replace("_", " ")
  

  force_dict["source"] = resolve_name(source)
  force_dict["target"] = resolve_name(target)

  return force_dict

def generate_explanations(scene, physics_data):

  # Convert Pydantic objects into JSON-compatible dictionaries
  scene_dict = scene.model_dump()

  physics_dict = [
    {
      **obj,
      "forces": [
          format(force, physics_data)
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
  Write a short, clear explanation for EVERY object in the input.

  RULES:
  - Use only the provided scene relationships and physics results.
  - Explain each force and which object exerts it.
  - Connect forces to relevant high-school physics principles.
  - If a supporting surface is unknown, say so.
  - Include one explanation for every physics result.
  - Preserve each object's index.
  - Objects with identical names must still receive separate explanations.
  - Use the "source" and "target" fields to identify objects.
    Do not interpret the raw force "id" when writing explanations.
  - When multiple objects share the same name, ALWAYS use their
    exact numbered names (e.g., "apple 1", "apple 2", "apple 3").
    Never replace these names with phrases like "another apple",
    "the other apple", or "the first apple".
  - Every force listed under an object acts ON that object.
    Describe the force as being exerted BY its "source" ON its "target".
    Never reverse this relationship.

  EXPLANATION STYLE:
  - Write 3-4 concise, educational sentences per object.
  - First explain the source and direction of each force.
  - Explain the condition for equilibrium when relevant
    - For two opposing forces, explain that their magnitudes
      are equal if the object is in equilibrium.
    - For multiple forces, explain that their vector sum
      must be zero for equilibrium.
    - Do not assume equilibrium or known force magnitudes.
  - Avoid repeating force directions in the second sentence.
  - Do not add generic statements about related physics laws
    or the limitations of analyzing photographs.
  - Every sentence should introduce useful physics information.
  - Do not invent forces, magnitudes, or motion.

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