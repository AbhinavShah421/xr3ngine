import { transformBehavior } from '../behaviors/transformBehavior';
import { transformParentBehavior } from '../behaviors/transformParentBehavior';
import { TransformComponent } from '../components/TransformComponent';
import { TransformParentComponent } from '../components/TransformParentComponent';
import { System, SystemAttributes } from '../../ecs/classes/System';
import { hasComponent } from "../../ecs/functions/EntityFunctions";
import { SystemUpdateType } from '../../ecs/functions/SystemUpdateType';
import { DesiredTransformComponent } from "../components/DesiredTransformComponent";
import { setDesiredTransformBehavior } from "../behaviors/setDesiredTransformBehavior";
import { copyTransformBehavior } from "../behaviors/copyTransformBehavior";
import { CopyTransformComponent } from "../components/CopyTransformComponent";

export class TransformSystem extends System {
  updateType = SystemUpdateType.Fixed;

  execute (delta) {

    this.queryResults.copyTransform.all?.forEach(entity => {
      copyTransformBehavior(entity, {}, delta);
    });

    this.queryResults.desiredTransforms.all?.forEach(entity => {
      setDesiredTransformBehavior(entity, {}, delta);
    });

    this.queryResults.transforms.all?.forEach(entity => {
      transformBehavior(entity, {}, delta);
    });

    this.queryResults.parent.all?.forEach(entity => {
      if (!hasComponent(entity, TransformParentComponent)) {
        return;
      }
      transformParentBehavior(entity, {}, delta);
    });
  }
}

TransformSystem.queries = {
  parent: {
    components: [TransformParentComponent, TransformComponent],
    // listen: {
    //   added: true
    // }
  },
  transforms: {
    components: [TransformComponent],
    listen: {
      added: true,
      changed: true
    }
  },
  desiredTransforms: {
    components: [DesiredTransformComponent]
  },
  copyTransform: {
    components: [CopyTransformComponent]
  }
};
