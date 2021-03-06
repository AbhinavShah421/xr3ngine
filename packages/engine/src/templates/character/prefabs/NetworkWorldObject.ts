import { addObject3DComponent } from "@xr3ngine/engine/src/common/behaviors/Object3DBehaviors";
import { BoxBufferGeometry, Color, Mesh, MeshPhongMaterial } from "three";
import { isClient } from "../../../common/functions/isClient";
import { NetworkPrefab } from '../../../networking/interfaces/NetworkPrefab';
import { ColliderComponent } from '../../../physics/components/ColliderComponent';
import { RigidBody } from '../../../physics/components/RigidBody';
import { TransformComponent } from '../../../transform/components/TransformComponent';


// Prefab is a pattern for creating an entity and component collection as a prototype
export const NetworkWorldObject: NetworkPrefab = {
  // These will be created for all players on the network
  networkComponents: [
    // Transform system applies values from transform component to three.js object (position, rotation, etc)
    { type: TransformComponent },
    { type: ColliderComponent, data: { type: 'box', scale: { x: 0.3, y: 0.3, z: 0.3 }, mass: 1}},
    { type: RigidBody }
    // Local player input mapped to behaviors in the input map
  ],
  // These are only created for the local player who owns this prefab
  localClientComponents: [],
  serverComponents: [],
  onAfterCreate: [
    {
      behavior: addObject3DComponent,
      networked: isClient,
      args: {
        obj3d: Mesh,
        objArgs: {
          geometry: new BoxBufferGeometry(0.3, 0.3, 0.3),
          material:new MeshPhongMaterial({
            color: new Color(0.313410553336143494, 0.31341053336143494, 0.30206481294706464)
          })
        }
      }
    }
],
  onBeforeDestroy: []
};
