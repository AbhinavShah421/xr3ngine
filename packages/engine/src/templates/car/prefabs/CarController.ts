import { Prefab } from "@xr3ngine/engine/src/common/interfaces/Prefab";
import { Input } from "@xr3ngine/engine/src/input/components/Input";
import { addCarPhysics } from "@xr3ngine/engine/src/physics/behaviors/addCarPhysics";
import { VehicleInputSchema } from "@xr3ngine/engine/src/templates/car/VehicleInputSchema";
import { TransformComponent } from "@xr3ngine/engine/src/transform/components/TransformComponent";
import { Color } from "three";
import { AssetLoader } from "../../../assets/components/AssetLoader";
import { addComponentFromSchema } from "../../../common/behaviors/addComponentFromSchema";
import { Entity } from "../../../ecs/classes/Entity";
import { getMutableComponent } from "../../../ecs/functions/EntityFunctions";
import { Interactable } from "../../../interaction/components/Interactable";
import { onInteractionHover } from "../../interactive/functions/commonInteractive";
import { changeColor } from "../behaviors/changeColor";
import { getInCar } from "../behaviors/getInCarBehavior";
import { getInCarPossible } from "../behaviors/getInCarPossible";



export const CarController: Prefab = {
    localClientComponents: [
      { type: TransformComponent, data: { position: [-3,6,3]} },
      // Local player input mapped to behaviors in the input map
       { type: Input, data: { schema: VehicleInputSchema } },
      // { type: SoundEffect, data: { src: 'audio/honk.mp3', volume: 0.6 } },
      // Current state (isJumping, isidle, etc)
    //   { type: State, data: { schema: VehicleStateSchema } },
      // Similar to Unity's Update(), LateUpdate(), and Start()
  //    { type: Subscription, data: { schema: DefaultSubscriptionSchema } }
        { type: Interactable, data: {
            interactionParts: ['door_front_left', 'door_front_right'],
            onInteraction: getInCar,
            onInteractionCheck: getInCarPossible,
            onInteractionFocused: onInteractionHover,
            data:{
              interactionText: 'get in car'
            },
          }
        }
    ],
    onAfterCreate: [
        // add a 3d object
        {
            behavior: addComponentFromSchema,
            args: {
                // addObject3DComponent is going to call new obj(objArgs)
                // so this will be new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2))
                component: AssetLoader,
                componentArgs: {
                    url: "models/vehicles/Sportscar.glb", //  "models/car.glb"
                    receiveShadow: true,
                    castShadow: true
                }
            }
        },
        {
          behavior: (entity) => {
              const loader = getMutableComponent(entity, AssetLoader)
              loader.onLoaded.push((entityIn: Entity, args: unknown, delta: number, entityOut: Entity): void => {
                addCarPhysics(entityIn, args, delta, entityOut);
                changeColor(entityIn, {
                  materialName: "Main",
                  color: new Color(1,1,1)
                });
              })
          }
      }]
};
