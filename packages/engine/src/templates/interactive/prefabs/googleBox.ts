import { BoxBufferGeometry, Mesh, MeshPhongMaterial } from "three";
import { Prefab } from "@xr3ngine/engine/src/common/interfaces/Prefab";
import { addObject3DComponent } from "@xr3ngine/engine/src/common/behaviors/Object3DBehaviors";
import { TransformComponent } from "@xr3ngine/engine/src/transform/components/TransformComponent";
import { addMeshCollider } from "@xr3ngine/engine/src/physics/behaviors/addMeshCollider";
import { addMeshRigidBody } from "@xr3ngine/engine/src/physics/behaviors/addMeshRigidBody";
import { Interactable } from "../../../interaction/components/Interactable";
import { onInteraction, onInteractionHover } from "../functions/googleBox";

const boxGeometry = new BoxBufferGeometry(1, 1, 1);
const boxMaterial = [
  new MeshPhongMaterial({ color: 'blue' }),
  new MeshPhongMaterial({ color: 'yellow' }),
  new MeshPhongMaterial({ color: 'green' }),
  new MeshPhongMaterial({ color: 'red' }),
  new MeshPhongMaterial({ color: 'cyan' }),
  new MeshPhongMaterial({ color: 'magenta' })
];
const boxMesh = new Mesh(boxGeometry, boxMaterial);

export const googleBox: Prefab = {
    localClientComponents: [
        { type: TransformComponent, data: { position: [3, 1, 3] } },
        {
            type: Interactable,
            data: {
                interactiveDistance: 3,
                onInteractionFocused: onInteractionHover,
                onInteraction: onInteraction
            }
        }
    ],
    onAfterCreate: [
        {
            behavior: addObject3DComponent,
            args: {
                obj3d: boxMesh,
            }
        },
        {
            behavior: addMeshCollider,
            args: {
               type: 'box', scale: [1, 1, 1], mass: 4
            }
        },
        {
            behavior: addMeshRigidBody
        }
    ]
};
