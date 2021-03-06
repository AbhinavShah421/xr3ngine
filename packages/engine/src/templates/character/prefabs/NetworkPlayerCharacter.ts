import { PositionalAudioComponent } from '../../../audio/components/PositionalAudioComponent';
import { FollowCameraComponent } from '../../../camera/components/FollowCameraComponent';
import { Input } from '../../../input/components/Input';
import { LocalInputReceiver } from '../../../input/components/LocalInputReceiver';
import { Interactor } from '../../../interaction/components/Interactor';
import { NetworkPrefab } from '../../../networking/interfaces/NetworkPrefab';
import TeleportToSpawnPoint from '../../../scene/components/TeleportToSpawnPoint';
import { State } from '../../../state/components/State';
import { TransformComponent } from '../../../transform/components/TransformComponent';
import { initializeCharacter } from '../behaviors/initializeCharacter';
import { loadActorAvatar } from '../behaviors/loadActorAvatar';
import { CharacterInputSchema } from '../CharacterInputSchema';
import { CharacterStateSchema } from '../CharacterStateSchema';
import { CharacterAvatarComponent } from '../components/CharacterAvatarComponent';
import { CharacterComponent } from '../components/CharacterComponent';
import { NamePlateComponent } from '../components/NamePlateComponent';


// Prefab is a pattern for creating an entity and component collection as a prototype
export const NetworkPlayerCharacter: NetworkPrefab = {
  // These will be created for all players on the network
  networkComponents: [
    // ActorComponent has values like movement speed, deceleration, jump height, etc
    { type: CharacterComponent },
    // Handle character's body
    { type: CharacterAvatarComponent, data: { avatarId: 'Rose' }},
    // Transform system applies values from transform component to three.js object (position, rotation, etc)
    { type: TransformComponent },
    // Local player input mapped to behaviors in the input map
    { type: Input, data: { schema: CharacterInputSchema } },
    // Current state (isJumping, isidle, etc)
    { type: State, data: { schema: CharacterStateSchema } },
    { type: NamePlateComponent },
    { type: PositionalAudioComponent }
  ],
  // These are only created for the local player who owns this prefab
  localClientComponents: [
    { type: LocalInputReceiver },
    { type: FollowCameraComponent, data: { distance: 3, mode: "thirdPersonLocked" } },
    { type: Interactor }
  
  ],
  serverComponents: [
    { type: TeleportToSpawnPoint },
  ],
  onAfterCreate: [
    {
      behavior: initializeCharacter,
      networked: true
    },
    {
      behavior: loadActorAvatar,
      networked: true
    }

  ],
  onBeforeDestroy: [

  ]
};
