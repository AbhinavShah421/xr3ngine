import {
  NearestFilter,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RGBFormat,
  sRGBEncoding,
  LinearEncoding,
  WebGLRenderer,
  WebGL1Renderer,
  WebGLRenderTarget
} from 'three';
import { Behavior } from '../../common/interfaces/Behavior';
import { Engine } from '../../ecs/classes/Engine';
import { Entity } from '../../ecs/classes/Entity';
import { System, SystemAttributes } from '../../ecs/classes/System';
import {
  addComponent,
  createEntity,
  getComponent,
  getMutableComponent,
  hasComponent
} from '../../ecs/functions/EntityFunctions';
import { RendererComponent } from '../components/RendererComponent';
import { EffectComposer } from '../../postprocessing/core/EffectComposer';
import { RenderPass } from '../../postprocessing/passes/RenderPass';
import { CameraComponent } from '../../camera/components/CameraComponent';
import { SSAOEffect } from '../../postprocessing/effects/SSAOEffect';
import { DepthOfFieldEffect } from '../../postprocessing/effects/DepthOfFieldEffect';
import { EffectPass } from '../../postprocessing/passes/EffectPass';
import { DepthDownsamplingPass } from '../../postprocessing/passes/DepthDownsamplingPass';
import { NormalPass } from '../../postprocessing/passes/NormalPass';
import { BlendFunction } from '../../postprocessing/effects/blending/BlendFunction';
import { TextureEffect } from '../../postprocessing/effects/TextureEffect';
import { OutlineEffect } from '../../postprocessing/effects/OutlineEffect';
import { CSM } from '../../assets/csm/CSM.js';

import { now } from '../../common/functions/now';

/** Handles rendering and post processing to WebGL canvas. */
export class WebGLRendererSystem extends System {
  /** Is system Initialized. */
  isInitialized: boolean

  /** Resoulion scale. **Default** value is 1. */
  scaleFactor = 1
  downGradeTimer = 0
  upGradeTimer = 0
  /** Maximum Quality level of the rendered. **Default** value is 4. */
  maxQualityLevel = 4
  /** Current quality level. */
  qualityLevel: number = this.maxQualityLevel
  /** Previous Quality leve. */
  prevQualityLevel: number = this.qualityLevel

  /** Constructs WebGL Renderer System. */
  constructor(attributes?: SystemAttributes) {
    super(attributes);

    this.onResize = this.onResize.bind(this);


    // Create the Renderer singleton
    addComponent(createEntity(), RendererComponent);

    let context;
    const canvas = document.createElement("canvas");

    try {
      context = canvas.getContext("webgl2", { antialias: true });
    } catch (error) {
      context = canvas.getContext("webgl", { antialias: true });
    }
    const options = {
      canvas,
      context,
      antialias: true,
      preserveDrawingBuffer: true
    };
    
    const { safariWebBrowser } = window as any;
    
    const renderer = safariWebBrowser ? new WebGL1Renderer(options) : new WebGLRenderer(options);
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.outputEncoding = sRGBEncoding; // need this if postprocessing is not used

    Engine.renderer = renderer;

    // Cascaded shadow maps
    const csm = new CSM({
        cascades: 4,
        lightIntensity: 1,
        shadowMapSize: 2048,
		    maxFar: 100,
        // maxFar: Engine.camera.far,
        camera: Engine.camera,
        parent: Engine.scene
    });
    csm.fade = true;

    Engine.csm = csm;

    // Add the renderer to the body of the HTML document
    document.body.appendChild(canvas);
    window.addEventListener('resize', this.onResize, false);
    this.onResize();
    this.isInitialized = true;
  }

  /** Called on resize, sets resize flag. */
  onResize(): void {
    RendererComponent.instance.needsResize = true;
  }

  /** Removes resize listener. */
  dispose(): void {
    super.dispose();

    const rendererComponent = RendererComponent.instance;
    rendererComponent?.composer?.dispose();

    window.removeEventListener('resize', this.onResize);
    document.body.removeChild(Engine.renderer.domElement);
    this.isInitialized = false;
  }

  /**
    * Configure post processing.
    * Note: Post processing effects are set in the PostProcessingSchema provided to the system.
    * @param entity The Entity holding renderer component.
    */
  private configurePostProcessing(entity: Entity): void {
    const rendererComponent = getMutableComponent<RendererComponent>(entity, RendererComponent);
    const composer = new EffectComposer(Engine.renderer);
    rendererComponent.composer = composer;
    const renderPass = new RenderPass(Engine.scene, Engine.camera);
    renderPass.scene = Engine.scene;
    renderPass.camera = Engine.camera;
    composer.addPass(renderPass);
    // This sets up the render
    const passes: any[] = [];
    const normalPass = new NormalPass(renderPass.scene, renderPass.camera, { renderTarget: new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBFormat,
      stencilBuffer: false
    }) });
    const depthDownsamplingPass = new DepthDownsamplingPass({
      normalBuffer: normalPass.texture,
      resolutionScale: 0.5
    });
    const normalDepthBuffer =	depthDownsamplingPass.texture;

    RendererComponent.instance.postProcessingSchema.effects.forEach((pass: any) => {
      if ( pass.effect === SSAOEffect){
        passes.push(new pass.effect(Engine.camera, normalPass.texture, {...pass.options, normalDepthBuffer }));
      }
      else if ( pass.effect === DepthOfFieldEffect)
        passes.push(new pass.effect(Engine.camera, pass.options))
      else if ( pass.effect === OutlineEffect){
        const effect = new pass.effect(Engine.scene, Engine.camera, pass.options)
        passes.push(effect)
        composer.outlineEffect = effect
      }
      else passes.push(new pass.effect(pass.options))
    })
    const textureEffect = new TextureEffect({
			blendFunction: BlendFunction.SKIP,
			texture: depthDownsamplingPass.texture
		});
    if (passes.length) {
      composer.addPass(depthDownsamplingPass);
      composer.addPass(new EffectPass(Engine.camera, ...passes, textureEffect));
    }
  }

  /**
   * Executes the system. Called each frame by default from the Engine.
   * @param delta Time since last frame.
   */
  execute(delta: number): void {
    const startTime = now();

    this.queryResults.renderers.added?.forEach((entity: Entity) => {
      RendererComponent.instance.needsResize = true;
      this.configurePostProcessing(entity);
    });
    
    Engine.csm.update();
    
    if(this.isInitialized)
    this.queryResults.renderers.all.forEach((entity: Entity) => {
      resize(entity);
      
      if (this.qualityLevel >= 2) {
        getComponent<RendererComponent>(entity, RendererComponent).composer.render(delta);
        if (Engine.renderer) Engine.renderer.outputEncoding = LinearEncoding; // need this if postprocessing is used
      }
      else {
        if (Engine.renderer) {
          Engine.renderer?.render(Engine.scene, Engine.camera);
          Engine.renderer.outputEncoding = sRGBEncoding; // need this if postprocessing is not used
        }
      }
    });
    
    this.queryResults.renderers.removed.forEach((entity: Entity) => {
      // cleanup
    });
    
    const lastTime = now();
    const deltaRender = (lastTime - startTime);

    this.changeQualityLevel(deltaRender);
  }

  /**
   * Change the quality of the renderer.
   * @param delta Time since last frame.
   */
  changeQualityLevel(delta: number): void {
    if (delta >= 55) {
      this.downGradeTimer += delta;
      this.upGradeTimer = 0;
    }
    else if (delta <= 10) {
      this.upGradeTimer += delta;
      this.downGradeTimer = 0;
    }
    else {
      this.upGradeTimer = 0;
      this.downGradeTimer = 0;
    }

    // change quality level
    if (this.downGradeTimer > 3000) {
      this.qualityLevel--;
      this.downGradeTimer = 0;
    }
    else if (this.upGradeTimer > 500) {
      this.qualityLevel++;
      this.upGradeTimer = 0;
    }
    this.qualityLevel = Math.max(0, Math.min(this.maxQualityLevel, this.qualityLevel));

    // set resolution scale
    if (this.prevQualityLevel !== this.qualityLevel) {
      console.log('Changing quality level to', this.qualityLevel)

      if (Engine.renderer) {
        switch (this.qualityLevel) {
          case 0:
            Engine.csm.shadowMapSize = 512;
            Engine.csm.cascades = 2;
            Engine.csm.maxFar = 50;
            this.scaleFactor = 0.4;
            break;
          case 1:
            Engine.csm.shadowMapSize = 1024;
            Engine.csm.cascades = 3;
            Engine.csm.maxFar = 100;
            this.scaleFactor = 0.55;
            break;
          case 2:
            Engine.csm.shadowMapSize = 1024;
            Engine.csm.cascades = 4;
            Engine.csm.maxFar = 100;
            this.scaleFactor = 0.7;
            break;
          case 3:
            Engine.csm.shadowMapSize = 2048;
            Engine.csm.cascades = 4;
            Engine.csm.maxFar = 100;
            this.scaleFactor = 0.85;
            break;
          case 4: default:
            Engine.csm.shadowMapSize = 4096;
            Engine.csm.cascades = 5;
            Engine.csm.maxFar = 200;
            this.scaleFactor = 1;
            break;
        }
        
        Engine.csm.updateFrustums();
        Engine.renderer.setPixelRatio(window.devicePixelRatio * this.scaleFactor);
        this.prevQualityLevel = this.qualityLevel;
      }
    }
  }
}

/** Resize the canvas. */
export const resize: Behavior = entity => {
  const rendererComponent = getComponent<RendererComponent>(entity, RendererComponent);

  if (rendererComponent.needsResize) {
    const canvas = Engine.renderer.domElement;
    const curPixelRatio = Engine.renderer.getPixelRatio();

    if (curPixelRatio !== window.devicePixelRatio) Engine.renderer.setPixelRatio(window.devicePixelRatio);

    const width = window.innerWidth;
    const height = window.innerHeight;

    if ((Engine.camera as PerspectiveCamera).isPerspectiveCamera) {
      const cam = Engine.camera as PerspectiveCamera;
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
    }

    Engine.csm.updateFrustums();

    canvas.width = width;
    canvas.height = height;

    Engine.renderer.setSize(width, height);
    rendererComponent.composer ? rendererComponent.composer.setSize(width, height):'';

    RendererComponent.instance.needsResize = false;
  }
};

WebGLRendererSystem.queries = {
  renderers: {
    components: [RendererComponent],
    listen: {
      added: true,
      removed: true
    }
  }
};
