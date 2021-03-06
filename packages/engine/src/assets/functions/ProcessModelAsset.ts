import { LOD, MeshPhysicalMaterial, Object3D } from "three";
import { addObject3DComponent } from "../../common/behaviors/Object3DBehaviors";
import { Object3DComponent } from "../../common/components/Object3DComponent";
import { Entity } from "../../ecs/classes/Entity";
import {
  createEntity,
  getComponent,
  getMutableComponent,
  hasComponent
} from "../../ecs/functions/EntityFunctions";
import { AssetLoader } from "../components/AssetLoader";

const LODS_DISTANCES = {
  "0": 5,
  "1": 15,
  "2": 30
};
const LODS_REGEXP = new RegExp(/^(.*)_LOD(\d+)$/);

/**
 * Process Asset model and map it with given entity.
 * @param entity Entity to which asset will be added.
 * @param component An Asset loader Component holds specifications for the asset.
 * @param asset Loaded asset.
 */
export function ProcessModelAsset(entity: Entity, component: AssetLoader, asset: any): void {
  let object = asset.scene ?? asset;

  ReplaceMaterials(object, component);
  object = HandleLODs(entity,object);
  
  if (asset.children.length) {
    asset.children.forEach(child => HandleLODs(entity, child));
    }

  if (component.parent) {
    component.parent.add(object);
  } else {
    if (hasComponent(entity, Object3DComponent)) {
      if (getComponent<Object3DComponent>(entity, Object3DComponent).value !== undefined)
        getMutableComponent<Object3DComponent>(entity, Object3DComponent).value.add(object);
      else getMutableComponent<Object3DComponent>(entity, Object3DComponent).value = object;
    } else {
      addObject3DComponent(entity, {obj3d: object});
    }

    //const transformParent = addComponent<TransformParentComponent>(entity, TransformParentComponent) as TransformParentComponent

    object.children.forEach(obj => {
      const e = createEntity();
      addObject3DComponent(e, { obj3d: obj, parentEntity: entity });
      // const transformChild = addComponent<TransformChildComponent>(e, TransformChildComponent) as TransformChildComponent
      // transformChild.parent = entity
      //transformParent.children.push(e)
      
    });
  }
}

/**
 * Handles Level of Detail for asset.
 * @param asset Asset on which LOD will apply.
 * @returns LOD handled asset.
 */
function HandleLODs(entity: Entity, asset: Object3D): Object3D {
  const haveAnyLODs = !!asset.children?.find(c => String(c.name).match(LODS_REGEXP));
  if (!haveAnyLODs) {
    return asset;
  }

  const LODs = new Map<string,{object: Object3D; level: string}[]>();
  asset.children.forEach(child => {
    const childMatch = child.name.match(LODS_REGEXP);
    if (!childMatch){
      return;
    }
    const [ _, name, level ]: string[] = childMatch;
    if (!name || !level) {
      return;
    }

    if (!LODs.has(name)) {
      LODs.set(name, []);
    }

    LODs.get(name).push({ object: child, level });
  });

  LODs.forEach((value, key) => {
    const lod = new LOD();
    lod.name = key;
    value[0].object.parent.add(lod);

    value.forEach(({ level, object}) => {
      lod.addLevel(object, LODS_DISTANCES[level]);
    });
  });

  return asset;
}

/**
 * Replace material on asset based on Asset loader specifications.
 * @param object Object on which replacement will apply.
 * @param component Asset loader component holding material specification.
 */
function ReplaceMaterials(object, component: AssetLoader) {
  const replacedMaterials = new Map();
  object.traverse((child) => {
    if (child.isMesh) {
      child.receiveShadow = component.receiveShadow;
      child.castShadow = component.castShadow;

      if (component.envMapOverride) {
        child.material.envMap = component.envMapOverride;
      }

      if (replacedMaterials.has(child.material)) {
        child.material = replacedMaterials.get(child.material);
      } else {
        if (child?.material?.userData?.gltfExtensions?.KHR_materials_clearcoat) {
          const newMaterial = new MeshPhysicalMaterial({});
          newMaterial.setValues(child.material); // to copy properties of original material
          newMaterial.clearcoat = child.material.userData.gltfExtensions.KHR_materials_clearcoat.clearcoatFactor;
          newMaterial.clearcoatRoughness = child.material.userData.gltfExtensions.KHR_materials_clearcoat.clearcoatRoughnessFactor;
          newMaterial.defines = { STANDARD: '', PHYSICAL: '' }; // override if it's replaced by non PHYSICAL defines of child.material

          replacedMaterials.set(child.material, newMaterial);
          child.material = newMaterial;
        }
      }
    }
  });
  replacedMaterials.clear();
}