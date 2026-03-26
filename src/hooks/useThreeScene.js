import { useRef, useEffect } from 'react';
import { initThreeScene, setupAnimation, disposeThreeScene } from '../services/threeRenderer';

export const useThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);

  const initScene = () => {
    const sceneData = initThreeScene(mountRef.current);
    if (!sceneData) return null;

    sceneRef.current = sceneData.scene;
    cameraRef.current = sceneData.camera;
    rendererRef.current = sceneData.renderer;

    const cleanup = setupAnimation(
      sceneData.renderer,
      sceneData.scene,
      sceneData.camera,
      sceneData.controls
    );

    animationIdRef.current = cleanup;
    return sceneData;
  };

  const cleanup = () => {
    if (animationIdRef.current) {
      animationIdRef.current();
    }
    if (rendererRef.current && mountRef.current) {
      disposeThreeScene(rendererRef.current, mountRef.current);
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    mountRef,
    sceneRef,
    cameraRef,
    rendererRef,
    modelRef,
    animationIdRef,
    initScene,
    cleanup,
  };
};
