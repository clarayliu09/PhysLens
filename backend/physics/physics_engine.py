from pydantic import BaseModel 

class Force(BaseModel):
  type: str # gravity, normal, tension, etc
  direction: str
  label: str # "obj1_on_obj2"

def analyze_physics(scene):

  results = [] #list of data, each element represents an object

  for object in scene.objects:
    forces = [] #list of external forces acting on this specific object

    # gravity acts on every object
    forces.append(Force(type="gravity", direction="down", label=f"Earth_on_{object.name}"))

    for relationship in object.relationships:
      label = ""

      acting_obj = relationship.object

      if (acting_obj is not None):
        label = f"{acting_obj}_on_{object.name}"


      if relationship.type == "supported_by":
        forces.append(Force(type="normal",direction="up", label=label)) #assuming object on flat surface for now

      elif relationship.type == "hanging_from":
        forces.append(Force(type="tension", direction="up", label="tension"))
    
    obj_physics = {
      "index": object.detection_index,
      "forces": forces,
    }

    results.append(obj_physics)

  return results
