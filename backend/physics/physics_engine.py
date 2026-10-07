from pydantic import BaseModel 

class Force(BaseModel):
  type: str # gravity, normal, tension, etc
  direction: str
  id: str # "obj1_on_obj2"
  #reaction: str # the id of the force that's the third law pair

def analyze_physics(scene):

  results = [] #list of data, each element represents an object

  # 1. create a physics entry for each object first
  for object in scene.objects:

    obj_physics = {
      "index": object.detection_index,
      "name": object.name,
      "forces": [ #list of external forces acting on this specific object
        Force(
          type="gravity", # gravity acts on every object with mass
          direction="down", 
          id=f"Earth_on_{object.name}"
        )
      ],
    }
    
    results.append(obj_physics)

  # 2. process relationships and update each physics entry 
  for object in scene.objects:

    for relationship in object.relationships:
      acting_obj = relationship.object

      label = ""
      if (acting_obj is not None):
        label = f"{acting_obj}_on_{object.name}"

      # finding this object's stored physics result
      obj_physics = next(
        r for r in results if r["index"] == object.detection_index
      )

      # B (acting obj) pushes upward on A (the object whose force[] we're adding to)
      if relationship.type == "supported_by":

        obj_physics["forces"].append(
          Force(
            type="normal",
            direction="up", #assuming object on flat surface for now
            id=label
          )
        ) 

        # find B if B is in the stored physics results
        supporting_obj_physics = next((r for r in results if r["name"] == acting_obj), None)

        # Add A pushing down on B to list of forces acting on B
        if supporting_obj_physics is not None:
          supporting_obj_physics["forces"].append(
            Force(
              type="normal",
              direction="down",
              id = f"{object.name}_on_{acting_obj}"
            )
          )

      elif relationship.type == "hanging_from":

        obj_physics["forces"].append(
          Force(
            type="tension", 
            direction="up", 
            id=f"{acting_obj}_on_{object.name}"
          )
        )
  

  return results
