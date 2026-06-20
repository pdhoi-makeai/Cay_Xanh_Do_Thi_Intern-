import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import type { TreeRecord, TreeRouteRecord } from '../../api/urbanTreeApi';

interface TreeMap3DProps {
  trees: TreeRecord[];
  routes: TreeRouteRecord[];
  selectedTreeId?: string | null;
  onTreeClick?: (tree: TreeRecord) => void;
  currentBasemap?: string;
  isAdding?: boolean;
  addingMode?: 'single' | 'row' | null;
  drawingCoords?: [number, number][];
  onAddDrawingPoint?: (coord: [number, number]) => void;
  onUpdateSingleCoord?: (coord: [number, number]) => void;
  onResetRowCoords?: (coord: [number, number]) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  onCameraMove?: (center: [number, number], zoom: number) => void;
}

const DEFAULT_TREE_MODEL_URL = '/tree.glb';

export const TreeMap3D: React.FC<TreeMap3DProps> = ({
  trees,
  routes,
  selectedTreeId,
  onTreeClick,
  currentBasemap = 'OSM',
  isAdding = false,
  addingMode = null,
  drawingCoords = [],
  onAddDrawingPoint,
  onUpdateSingleCoord,
  onResetRowCoords,
  initialCenter,
  initialZoom,
  onCameraMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const treesRef = useRef<TreeRecord[]>(trees);
  const onTreeClickRef = useRef(onTreeClick);
  const isAddingRef = useRef(isAdding);
  const addingModeRef = useRef(addingMode);
  const onAddDrawingPointRef = useRef(onAddDrawingPoint);
  const onUpdateSingleCoordRef = useRef(onUpdateSingleCoord);
  const onResetRowCoordsRef = useRef(onResetRowCoords);
  const onCameraMoveRef = useRef(onCameraMove);

  const isDraggingTempRef = useRef(false);
  const isDrawingRowRef = useRef(false);
  const lastFlownTreeIdRef = useRef<string | null>(null);

  // Sync refs
  useEffect(() => {
    treesRef.current = trees;
  }, [trees]);

  useEffect(() => {
    onTreeClickRef.current = onTreeClick;
  }, [onTreeClick]);

  useEffect(() => {
    isAddingRef.current = isAdding;
  }, [isAdding]);

  useEffect(() => {
    addingModeRef.current = addingMode;
  }, [addingMode]);

  useEffect(() => {
    onAddDrawingPointRef.current = onAddDrawingPoint;
  }, [onAddDrawingPoint]);

  useEffect(() => {
    onUpdateSingleCoordRef.current = onUpdateSingleCoord;
  }, [onUpdateSingleCoord]);

  useEffect(() => {
    onResetRowCoordsRef.current = onResetRowCoords;
  }, [onResetRowCoords]);

  useEffect(() => {
    onCameraMoveRef.current = onCameraMove;
  }, [onCameraMove]);

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Cesium.Viewer | null = null;
    let handler: Cesium.ScreenSpaceEventHandler | null = null;
    let removeCameraListener: (() => void) | null = null;

    try {
      // Initialize Cesium Viewer
      viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: false as any
      });

      viewerRef.current = viewer;

      // Hide branding logo
      const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
      if (creditContainer) {
        creditContainer.style.display = 'none';
      }

      // Set Default Camera to initialCenter and initialZoom
      const initCenter = initialCenter || [16.0748, 108.1512];
      const initZoom = initialZoom || 15;
      const height = 10000000 / Math.pow(2, initZoom - 2);
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(initCenter[1], initCenter[0], height),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-25),
          roll: 0
        }
      });

      // Listen to camera movements to sync back to 2D view
      removeCameraListener = viewer.camera.moveEnd.addEventListener(() => {
        if (!viewer || viewer.isDestroyed()) return;
        
        const canvas = viewer.scene.canvas;
        const centerPosition = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
        const ray = viewer.camera.getPickRay(centerPosition);
        let centerCartesian = viewer.camera.pickEllipsoid(centerPosition, viewer.scene.globe.ellipsoid);
        if (ray) {
          const pickedPosition = viewer.scene.globe.pick(ray, viewer.scene);
          if (Cesium.defined(pickedPosition)) {
            centerCartesian = pickedPosition;
          }
        }
        
        if (Cesium.defined(centerCartesian)) {
          const cartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lng = Cesium.Math.toDegrees(cartographic.longitude);
          
          const cameraHeight = Cesium.Cartesian3.distance(viewer.camera.position, centerCartesian);
          let estimatedZoom = Math.log2(10000000 / cameraHeight) + 2;
          estimatedZoom = Math.max(3, Math.min(20, Math.round(estimatedZoom)));
          
          if (onCameraMoveRef.current) {
            onCameraMoveRef.current([lat, lng], estimatedZoom);
          }
        }
      });

      // Handle Dragging / Drawing / Interaction Click Events
      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      
      // LEFT_DOWN
      handler.setInputAction((click: any) => {
        if (!viewer || viewer.isDestroyed()) return;

        if (isAddingRef.current) {
          if (addingModeRef.current === 'single') {
            const pickedObject = viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.id === 'CX-TEMP-ENTITY') {
              isDraggingTempRef.current = true;
              viewer.scene.screenSpaceCameraController.enableInputs = false; // Lock camera controls
            }
          } else if (addingModeRef.current === 'row') {
            isDrawingRowRef.current = true;
            viewer.scene.screenSpaceCameraController.enableInputs = false; // Lock camera controls
            
            // Capture starting coordinate
            let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
            const ray = viewer.camera.getPickRay(click.position);
            if (ray) {
              const pickedPosition = viewer.scene.globe.pick(ray, viewer.scene);
              if (Cesium.defined(pickedPosition)) {
                cartesian = pickedPosition;
              }
            }
            if (Cesium.defined(cartesian)) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lng = Cesium.Math.toDegrees(cartographic.longitude);
              if (onResetRowCoordsRef.current) {
                onResetRowCoordsRef.current([lat, lng]);
              }
            }
          }
          return;
        }

        // Selection pick click
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
          // If picking an entity (e.g. temporary drawing object or routes)
          if (pickedObject.id) {
            const treeCode = pickedObject.id._treeCode;
            if (treeCode) {
              const foundTree = treesRef.current.find(t => t.ma_tai_san === treeCode);
              if (foundTree && onTreeClickRef.current) {
                onTreeClickRef.current(foundTree);
              }
            }
          } 
          // If picking a 3D Tile Feature
          else if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
            const treeId = pickedObject.getProperty('id');
            if (treeId) {
              const foundTree = treesRef.current.find(t => t.ma_tai_san === treeId);
              if (foundTree && onTreeClickRef.current) {
                onTreeClickRef.current(foundTree);
              }
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      // LEFT_CLICK - specifically for placing a single tree on the map
      handler.setInputAction((click: any) => {
        if (!viewer || viewer.isDestroyed()) return;

        if (isAddingRef.current && addingModeRef.current === 'single') {
          const pickedObject = viewer.scene.pick(click.position);
          // Only place tree if we didn't click on the temporary entity itself
          if (!Cesium.defined(pickedObject) || !pickedObject.id || pickedObject.id.id !== 'CX-TEMP-ENTITY') {
            let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
            const ray = viewer.camera.getPickRay(click.position);
            if (ray) {
              const pickedPosition = viewer.scene.globe.pick(ray, viewer.scene);
              if (Cesium.defined(pickedPosition)) {
                cartesian = pickedPosition;
              }
            }
            if (Cesium.defined(cartesian)) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lng = Cesium.Math.toDegrees(cartographic.longitude);
              if (onUpdateSingleCoordRef.current) {
                onUpdateSingleCoordRef.current([lat, lng]);
              }
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // MOUSE_MOVE
      handler.setInputAction((movement: any) => {
        if (!viewer || viewer.isDestroyed()) return;

        if (isAddingRef.current) {
          if (addingModeRef.current === 'single' && isDraggingTempRef.current) {
            let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            const ray = viewer.camera.getPickRay(movement.endPosition);
            if (ray) {
              const pickedPosition = viewer.scene.globe.pick(ray, viewer.scene);
              if (Cesium.defined(pickedPosition)) {
                cartesian = pickedPosition;
              }
            }
            if (Cesium.defined(cartesian)) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lng = Cesium.Math.toDegrees(cartographic.longitude);
              if (onUpdateSingleCoordRef.current) {
                onUpdateSingleCoordRef.current([lat, lng]);
              }
            }
          } else if (addingModeRef.current === 'row' && isDrawingRowRef.current) {
            let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            const ray = viewer.camera.getPickRay(movement.endPosition);
            if (ray) {
              const pickedPosition = viewer.scene.globe.pick(ray, viewer.scene);
              if (Cesium.defined(pickedPosition)) {
                cartesian = pickedPosition;
              }
            }
            if (Cesium.defined(cartesian)) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const lat = Cesium.Math.toDegrees(cartographic.latitude);
              const lng = Cesium.Math.toDegrees(cartographic.longitude);
              if (onAddDrawingPointRef.current) {
                onAddDrawingPointRef.current([lat, lng]);
              }
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // LEFT_UP
      handler.setInputAction(() => {
        if (isDraggingTempRef.current) {
          isDraggingTempRef.current = false;
          if (viewer && !viewer.isDestroyed()) {
            viewer.scene.screenSpaceCameraController.enableInputs = true; // Unlock camera controls
          }
        }
        if (isDrawingRowRef.current) {
          isDrawingRowRef.current = false;
          if (viewer && !viewer.isDestroyed()) {
            viewer.scene.screenSpaceCameraController.enableInputs = true; // Unlock camera controls
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

    } catch (error) {
      console.error('Error initializing Cesium Viewer:', error);
    }

    return () => {
      try {
        if (removeCameraListener) {
          removeCameraListener();
        }
        if (handler && !handler.isDestroyed()) {
          handler.destroy();
        }
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy();
        }
      } catch (e) {
        console.error('Error during Cesium cleanup:', e);
      }
      viewerRef.current = null;
    };
  }, []);

  // Update Basemap Imagery Layer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    try {
      viewer.imageryLayers.removeAll();

      let providerPromise;
      const getProvider = (url: string, options?: any) => {
        if (typeof (Cesium.UrlTemplateImageryProvider as any).fromUrl === 'function') {
          return (Cesium.UrlTemplateImageryProvider as any).fromUrl(url, options);
        } else {
          return Promise.resolve(new (Cesium.UrlTemplateImageryProvider as any)({ url, ...options }));
        }
      };

      if (currentBasemap === 'GOOGLE_SATELLITE') {
        providerPromise = getProvider('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}');
      } else if (currentBasemap === 'GOOGLE') {
        providerPromise = getProvider('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}');
      } else {
        providerPromise = getProvider('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          subdomains: ['a', 'b', 'c']
        });
      }

      providerPromise.then((provider: any) => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.imageryLayers.removeAll();
          viewer.imageryLayers.add(new Cesium.ImageryLayer(provider));
        }
      }).catch((err: any) => {
        console.error('Failed to load basemap provider:', err);
      });
    } catch (error) {
      console.error('Error setting basemap imagery:', error);
    }
  }, [currentBasemap]);

  // Update Entities (Trees & Routes)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.removeAll();

    // 1. Render Routes
    routes.forEach(route => {
      if (!route.polyline_json) return;
      try {
        const points = JSON.parse(route.polyline_json);
        if (!Array.isArray(points)) return;
        
        const flatPoints: number[] = [];
        points.forEach(p => {
          if (Array.isArray(p) && p.length >= 2) {
            const lat = parseFloat(p[0]);
            const lng = parseFloat(p[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              flatPoints.push(lng, lat);
            }
          }
        });

        if (flatPoints.length < 4) return;

        const cartesianPositions = Cesium.Cartesian3.fromDegreesArray(flatPoints);

        viewer.entities.add({
          name: route.ten_tuyen,
          polyline: {
            positions: cartesianPositions,
            width: 4,
            material: Cesium.Color.fromCssColorString('#14b8a6'),
            clampToGround: true
          }
        });
      } catch (e) {
        console.error('Failed to parse route polyline JSON', e);
      }
    });

    // 2. Render Trees (3D Tiles)
    try {
      const cacheBuster = Date.now();
      Cesium.Cesium3DTileset.fromUrl(`/files/3dtiles/trees/tileset.json?v=${cacheBuster}`).then((tileset: any) => {
        if (!viewer || viewer.isDestroyed()) return;
        viewer.scene.primitives.add(tileset);
        
        // Setup styling based on tree status in batch table
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${status} === 'Sâu bệnh'", "color('#ef4444')"], // Red tint for diseased
              ["${status} === 'Đã đốn hạ'", "color('#6b7280')"], // Gray tint for fallen
              ["true", "color('white')"] // White preserves the original glTF materials
            ]
          }
        });
      }).catch((e: any) => {
        console.warn('Failed to load 3D Tileset (it may not be generated yet):', e);
      });
    } catch (e) {
      console.warn('Tileset init error:', e);
    }

    // 3. Render Drawing Coords (if adding mode is active)
    if (isAdding && drawingCoords && drawingCoords.length > 0) {
      if (addingMode === 'single' && drawingCoords.length === 1) {
        // Render a temporary tree model that is draggable
        const [lat, lng] = drawingCoords[0];
        viewer.entities.add({
          id: 'CX-TEMP-ENTITY',
          position: Cesium.Cartesian3.fromDegrees(lng, lat),
          name: 'Vị trí cây mới (Nhấn giữ kéo để di chuyển)',
          model: {
            uri: DEFAULT_TREE_MODEL_URL,
            scale: 2.0 // Highlighted slightly larger but in proportion
          }
        });
      } else if (addingMode === 'row') {
        // Draw points
        drawingCoords.forEach(([lat, lng], idx) => {
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            name: `Điểm vẽ ${idx + 1}`,
            point: {
              pixelSize: 12,
              color: Cesium.Color.fromCssColorString('#f59e0b'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        });

        // Draw polyline if row mode and has >= 2 points
        if (drawingCoords.length >= 2) {
          const flatPoints: number[] = [];
          drawingCoords.forEach(([lat, lng]) => {
            flatPoints.push(lng, lat);
          });
          viewer.entities.add({
            name: 'Đường vẽ hàng loạt',
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(flatPoints),
              width: 5,
              material: Cesium.Color.fromCssColorString('#f59e0b'),
              clampToGround: true
            }
          });
        }
      }
    }

    // If a tree is selected, fly to it (ONLY if it changes to prevent auto-zooming loop during drawing)
    // FlyTo logic for selection removed since we removed individual entities
    // However, if we know the selectedTree location from the props, we could just fly to its Cartesian3
    if (!isAdding && selectedTreeId && selectedTreeId !== lastFlownTreeIdRef.current) {
      lastFlownTreeIdRef.current = selectedTreeId;
      const selTree = trees.find(t => t.ma_tai_san === selectedTreeId);
      if (selTree && typeof selTree.latitude === 'number') {
        const position = Cesium.Cartesian3.fromDegrees(selTree.longitude, selTree.latitude, 50);
        viewer.camera.flyTo({
          destination: position,
          duration: 1.5
        });
      }
    } else if (!selectedTreeId) {
      lastFlownTreeIdRef.current = null;
    }

    return () => {
      // No camera listeners to remove (removed zoom-based visibility)
    };
  }, [trees, routes, selectedTreeId, drawingCoords, isAdding, addingMode]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%' }}
      className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200"
    />
  );
};
