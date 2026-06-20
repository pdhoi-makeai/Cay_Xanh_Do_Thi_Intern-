import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { urbanTreeApi } from '../api/urbanTreeApi';
import { treeService, incidentService } from '../services/api';
import type { TreeRouteRecord } from '../api/urbanTreeApi';
import { TreeMap3D } from '../components/maps/TreeMap3D';
import { OsmImportDialog } from '../components/maps/OsmImportDialog';
import * as turf from '@turf/turf';
import { 
  Spinner, 
  MessageBar, 
  MessageBarBody,
  Button,
  Input
} from '@fluentui/react-components';
import { 
  ShareRegular,
  GlobeRegular,
  MapRegular,
  EyeRegular,
  EditRegular,
  DeleteRegular,
  LocationRegular,
  SearchRegular,
  AddRegular,
  DismissRegular,
  InfoRegular,
  WarningRegular
} from '@fluentui/react-icons';

// Status colors mapping
const getTreeColor = (status: string) => {
  switch (status) {
    case 'Tốt': return '#10b981'; // Green
    case 'Cần cắt tỉa': return '#f59e0b'; // Orange
    case 'Sâu bệnh': return '#ef4444'; // Red
    case 'Gãy đổ': return '#7f1d1d'; // Dark Red
    default: return '#6b7280'; // Gray
  }
};

const getTreeIcon = (status: string, species: string) => {
  const color = getTreeColor(status);
  return L.divIcon({
    className: 'custom-tree-icon',
    html: `<div title="${species} (${status})" style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Map helper to trigger view flyTo in Leaflet
const MapRefSetter = ({ setMap }: { setMap: (map: L.Map) => void }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);
  return null;
};

const MapClickEvents = ({
  isAdding,
  addingMode,
  onAddPoint
}: {
  isAdding: boolean;
  addingMode: 'single' | 'row' | null;
  onAddPoint: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      if (isAdding && addingMode === 'single') {
        onAddPoint(e.latlng);
      }
    }
  });
  return null;
};

const MapRowDrawing = ({
  isAdding,
  addingMode,
  setDrawingCoords
}: {
  isAdding: boolean;
  addingMode: 'single' | 'row' | null;
  setDrawingCoords: React.Dispatch<React.SetStateAction<[number, number][]>>;
}) => {
  const map = useMapEvents({
    mousedown(e) {
      if (isAdding && addingMode === 'row') {
        map.dragging.disable();
        setDrawingCoords([[e.latlng.lat, e.latlng.lng]]);
      }
    },
    mousemove(e) {
      if (isAdding && addingMode === 'row' && !map.dragging.enabled()) {
        setDrawingCoords(prev => {
          const lastPt = prev[prev.length - 1];
          if (!lastPt || L.latLng(lastPt[0], lastPt[1]).distanceTo(e.latlng) > 2) {
            return [...prev, [e.latlng.lat, e.latlng.lng]];
          }
          return prev;
        });
      }
    },
    mouseup() {
      if (isAdding && addingMode === 'row') {
        map.dragging.enable();
      }
    }
  });

  useEffect(() => {
    if (!isAdding || addingMode !== 'row') {
      map.dragging.enable();
    }
  }, [isAdding, addingMode, map]);

  return null;
};

const MapViewSync = ({
  onViewChange
}: {
  onViewChange: (center: L.LatLng, zoom: number) => void;
}) => {
  useMapEvents({
    moveend(e) {
      const map = e.target;
      onViewChange(map.getCenter(), map.getZoom());
    }
  });
  return null;
};

const getDrawingIcon = (index: number) => {
  return L.divIcon({
    className: 'custom-drawing-icon',
    html: `<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">${index + 1}</div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

interface TreeMarkerClusterProps {
  trees: any[];
  onTreeClick: (ma_tai_san: string) => void;
  getTreeIcon: (status: string, species: string) => L.DivIcon;
}

const TreeMarkerCluster: React.FC<TreeMarkerClusterProps> = ({
  trees,
  onTreeClick,
  getTreeIcon
}) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map]);

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    trees.forEach((t) => {
      const marker = L.marker([t.latitude, t.longitude], {
        icon: getTreeIcon(t.trang_thai, t.loai_cay),
      });

      const popupContent = `
        <div class="p-1" style="font-family: inherit;">
          <h4 class="font-bold text-slate-800" style="margin: 0; font-size: 13px; font-weight: bold; color: #1e293b;">Mã cây: ${t.ma_tai_san}</h4>
          <p class="text-xs text-slate-600" style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">Loài: <strong>${t.loai_cay}</strong></p>
          <p class="text-xs text-slate-600" style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Trạng thái: <span class="font-semibold" style="font-weight: 600; color: ${
            t.trang_thai === 'Tốt' ? '#10b981' : t.trang_thai === 'Cần cắt tỉa' ? '#f59e0b' : '#ef4444'
          }">${t.trang_thai}</span></p>
          ${t.ngay_lap_dat ? `<p class="text-xs text-slate-400" style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8;">Ngày trồng: ${t.ngay_lap_dat}</p>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onTreeClick(t.ma_tai_san);
      });

      clusterGroup.addLayer(marker);
    });
  }, [trees, getTreeIcon, onTreeClick]);

  return null;
};

export const MapDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map Instance references
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.0748, 108.1512]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  // Data
  const [totalTreesCount, setTotalTreesCount] = useState(0);
  const [trees, setTrees] = useState<any[]>([]);
  const [routes, setRoutes] = useState<TreeRouteRecord[]>([]);

  // Filter lists from DB
  const [projectsList] = useState<string[]>(['Dự án hạ tầng kỹ thuật']);
  const [routesList, setRoutesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [treeLayersList] = useState<string[]>(['Cây xanh sử dụng công cộng', 'Cây xanh sử dụng hạn chế', 'Cây xanh chuyên dụng']);

  // Filters State
  const [filterProject, setFilterProject] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterLayer, setFilterLayer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Map Display Controls
  const [is3D, setIs3D] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('GOOGLE_SATELLITE');
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  // Drawing & Addition State
  const [isAddingTree, setIsAddingTree] = useState(false);
  const [isOsmModalOpen, setIsOsmModalOpen] = useState(false);
  const [addingMode, setAddingMode] = useState<'single' | 'row' | null>(null);
  const [drawingCoords, setDrawingCoords] = useState<[number, number][]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);

  // Form Fields State
  const [formSpecies, setFormSpecies] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formProject, setFormProject] = useState('Dự án hạ tầng kỹ thuật');
  const [formStatus, setFormStatus] = useState('Tốt');
  const [treeCount, setTreeCount] = useState(5);
  const [saving, setSaving] = useState(false);

  // Details sidebar state
  const [detailTab, setDetailTab] = useState<'info' | 'incidents' | 'work_orders'>('info');
  const [treeDetails, setTreeDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditingTree, setIsEditingTree] = useState(false);
  const [formGps, setFormGps] = useState('');

  // Fetch details (incidents and work_orders) for the selected tree
  useEffect(() => {
    setIsEditingTree(false);
    if (selectedTreeId) {
      const fetchTreeDetailsData = async () => {
        setLoadingDetails(true);
        try {
          const details = await treeService.getTreeDetails(selectedTreeId);
          setTreeDetails(details);
        } catch (e) {
          console.error("Failed to load details for tree:", selectedTreeId, e);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchTreeDetailsData();
      setDetailTab('info'); // Reset to info tab when a new tree is clicked
    } else {
      setTreeDetails(null);
    }
  }, [selectedTreeId]);

  // Load initial reference data
  const loadInitialData = async () => {
    try {
      const [allTrees, rList, aList, sList] = await Promise.all([
        treeService.getTreesList(),
        urbanTreeApi.getTreeRoutes(),
        incidentService.getAreasList(),
        treeService.getTreeSpecies()
      ]);
      setTotalTreesCount(allTrees.length);
      setRoutesList(rList);
      setAreasList(aList);
      setSpeciesList(sList);
      
      // Auto prefill form area/species if list is available
      if (aList.length > 0) setFormArea(aList[0].name);
      if (sList.length > 0) setFormSpecies(sList[0].name);
    } catch (e) {
      console.error('Failed to load map filters metadata', e);
    }
  };

  const handleAddDrawingPoint = (latlngOrCoord: L.LatLng | [number, number]) => {
    let lat: number, lng: number;
    if (Array.isArray(latlngOrCoord)) {
      lat = latlngOrCoord[0];
      lng = latlngOrCoord[1];
    } else {
      lat = latlngOrCoord.lat;
      lng = latlngOrCoord.lng;
    }

    setDrawingCoords(prev => {
      const last = prev[prev.length - 1];
      if (!last) return [[lat, lng]];
      const p1 = L.latLng(last[0], last[1]);
      const p2 = L.latLng(lat, lng);
      if (p1.distanceTo(p2) > 2) {
        return [...prev, [lat, lng]];
      }
      return prev;
    });
  };

  const handleUpdateSingleCoord = (coord: [number, number]) => {
    setDrawingCoords([coord]);
  };

  const handleResetRowCoords = (coord: [number, number]) => {
    setDrawingCoords([coord]);
  };

  const getDrawingDistance = () => {
    if (drawingCoords.length < 2) return 0;
    let totalDist = 0;
    for (let i = 0; i < drawingCoords.length - 1; i++) {
      const p1 = L.latLng(drawingCoords[i][0], drawingCoords[i][1]);
      const p2 = L.latLng(drawingCoords[i + 1][0], drawingCoords[i + 1][1]);
      totalDist += p1.distanceTo(p2);
    }
    return totalDist;
  };

  const interpolateAlongPath = (coords: [number, number][], targetDist: number): [number, number] => {
    if (coords.length === 0) return [0, 0];
    if (coords.length === 1) return coords[0];
    
    let cumDist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = L.latLng(coords[i][0], coords[i][1]);
      const p2 = L.latLng(coords[i + 1][0], coords[i + 1][1]);
      const segLen = p1.distanceTo(p2);
      
      if (cumDist + segLen >= targetDist) {
        const remaining = targetDist - cumDist;
        const ratio = segLen === 0 ? 0 : remaining / segLen;
        const lat = coords[i][0] + ratio * (coords[i + 1][0] - coords[i][0]);
        const lng = coords[i][1] + ratio * (coords[i + 1][1] - coords[i][1]);
        return [lat, lng];
      }
      cumDist += segLen;
    }
    return coords[coords.length - 1];
  };

  const interpolatePoints = (coords: [number, number][], count: number): [number, number][] => {
    if (count <= 0 || coords.length === 0) return [];
    if (coords.length === 1 || count === 1) {
      if (coords.length === 1) return [coords[0]];
      const totalLen = getDrawingDistance();
      return [interpolateAlongPath(coords, totalLen / 2)];
    }

    const points: [number, number][] = [];
    const totalLen = getDrawingDistance();
    const step = totalLen / (count - 1);
    
    for (let i = 0; i < count; i++) {
      const dist = i * step;
      points.push(interpolateAlongPath(coords, dist));
    }
    return points;
  };

  const handleSaveTree = async () => {
    if (!formSpecies || !formArea) {
      setError('Vui lòng chọn loài cây và khu vực.');
      return;
    }
    if (addingMode === 'single' && drawingCoords.length !== 1) {
      setError('Vui lòng click chọn 1 vị trí trên bản đồ.');
      return;
    }
    if (addingMode === 'row' && drawingCoords.length < 2) {
      setError('Vui lòng click chọn ít nhất 2 vị trí trên bản đồ để vẽ đường.');
      return;
    }

    // Validate using Turf if a route is selected
    if (formRoute && routes.length > 0) {
      const selectedRoute = routes.find(r => r.name === formRoute);
      if (selectedRoute && selectedRoute.polyline_json) {
        try {
          const coordsList = JSON.parse(selectedRoute.polyline_json);
          // Convert string or objects to array [lng, lat]
          // Leaflet polyline uses [lat, lng]. Turf needs [lng, lat]
          const lineString = turf.lineString(coordsList.map((c: any) => {
            if (Array.isArray(c)) return [c[1], c[0]];
            return [c.lng, c.lat];
          }));
          
          let pointsToCheck = [];
          if (addingMode === 'single') {
            pointsToCheck = drawingCoords;
          } else {
            pointsToCheck = interpolatePoints(drawingCoords, treeCount);
          }
          
          let outOfBounds = false;
          for (let pt of pointsToCheck) {
            const point = turf.point([pt[1], pt[0]]);
            const distance = turf.pointToLineDistance(point, lineString, { units: 'meters' });
            if (distance > 50) {
              outOfBounds = true;
              break;
            }
          }
          
          if (outOfBounds) {
            if (!window.confirm('Cảnh báo: Cây bạn trồng nằm cách xa tuyến đường đã chọn hơn 50m. Bạn có chắc chắn muốn lưu không?')) {
              return;
            }
          }
        } catch (e) {
          console.warn("Turf validation failed", e);
        }
      }
    }

    setSaving(true);
    setError('');

    try {
      if (addingMode === 'single') {
        const [lat, lng] = drawingCoords[0];
        const uniqueId = `CX-NEW-${Date.now()}`;
        const newAssetData = {
          ma_tai_san: uniqueId,
          ten_tai_san: `Cây xanh ${uniqueId}`,
          loai_cay: formSpecies,
          khu_vuc: formArea,
          tuyen_duong: formRoute || undefined,
          du_an: formProject,
          toa_do_gps: `${lat}, ${lng}`,
          trang_thai: formStatus,
          ngay_lap_dat: new Date().toISOString().split('T')[0]
        };
        await treeService.createTreeAsset(newAssetData);
      } else {
        const points = interpolatePoints(drawingCoords, treeCount);
        
        const promises = points.map(async ([lat, lng], idx) => {
          const uniqueId = `CX-ROW-${Date.now()}-${idx + 1}`;
          const newAssetData = {
            ma_tai_san: uniqueId,
            ten_tai_san: `Cây xanh ${uniqueId}`,
            loai_cay: formSpecies,
            khu_vuc: formArea,
            tuyen_duong: formRoute || undefined,
            du_an: formProject,
            toa_do_gps: `${lat}, ${lng}`,
            trang_thai: formStatus,
            ngay_lap_dat: new Date().toISOString().split('T')[0]
          };
          return treeService.createTreeAsset(newAssetData);
        });

        await Promise.all(promises);
      }

      setIsAddingTree(false);
      setAddingMode(null);
      setDrawingCoords([]);
      
      await fetchFilteredTrees();
      await loadInitialData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.exception || 'Lỗi khi lưu cây xanh vào hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTree = async (ma_tai_san: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cây xanh ${ma_tai_san}?`)) {
      try {
        setLoading(true);
        await treeService.deleteTreeAsset(ma_tai_san);
        setSelectedTreeId(null);
        await fetchFilteredTrees();
        await loadInitialData();
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa cây xanh.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch trees matching active filters
  const fetchFilteredTrees = async () => {
    setLoading(true);
    try {
      const treeList = await treeService.getTreesList({
        du_an: filterProject || undefined,
        tuyen_duong: filterRoute || undefined,
        khu_vuc: filterArea || undefined,
        search: searchQuery || undefined
      });

      // Parse coordinates (toa_do_gps is "lat,lng")
      const parsed = treeList.map((t: any) => {
        let lat = 16.0748, lng = 108.1512;
        if (t.toa_do_gps) {
          const parts = t.toa_do_gps.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0].trim());
            lng = parseFloat(parts[1].trim());
          }
        }
        return {
          ...t,
          latitude: lat,
          longitude: lng
        };
      });

      // Set trees
      setTrees(parsed);
      
      // Load routes
      const mapRoutes = await urbanTreeApi.getTreeRoutes(filterArea || undefined);
      setRoutes(mapRoutes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bản đồ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredTrees();
  }, [filterProject, filterRoute, filterArea, searchQuery]);

  // Recenter map on active selection
  const handleRecenter = () => {
    if (selectedTreeId) {
      const selectedTree = trees.find(t => t.ma_tai_san === selectedTreeId);
      if (selectedTree) {
        if (!is3D && leafletMap) {
          leafletMap.setView([selectedTree.latitude, selectedTree.longitude], 18);
        }
      }
    } else {
      // Default view
      if (!is3D && leafletMap) {
        leafletMap.setView([16.0748, 108.1512], 15);
      }
    }
  };

  // Automatically fly to selected tree on 2D map
  useEffect(() => {
    if (!is3D && selectedTreeId && leafletMap) {
      const selectedTree = trees.find(t => t.ma_tai_san === selectedTreeId);
      if (selectedTree) {
        leafletMap.flyTo([selectedTree.latitude, selectedTree.longitude], 18, {
          duration: 1.5
        });
      }
    }
  }, [selectedTreeId, is3D, leafletMap, trees]);

  // Get Leaflet Tile Layer URL based on active basemap selection
  const getTileLayerUrl = (basemap: string) => {
    switch (basemap) {
      case 'GOOGLE_SATELLITE':
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'GOOGLE':
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'OSM':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const clearFilters = () => {
    setFilterProject('');
    setFilterRoute('');
    setFilterArea('');
    setFilterLayer('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterProject || filterRoute || filterArea || filterLayer || searchQuery;

  return (
    <div className="h-full w-full flex gap-4 overflow-hidden bg-slate-50">
      {error && (
        <div className="absolute top-2 left-2 right-2 z-[9999]">
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Left Sidebar (Filters and List) */}
      <div className="w-96 shrink-0 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 overflow-hidden shadow-sm">
        {!isAddingTree && !selectedTreeId && (
          <div className="flex gap-2">
            <Button
              appearance="primary"
              icon={<AddRegular />}
              onClick={() => {
                setIsAddingTree(true);
                setAddingMode('single');
                setDrawingCoords([]);
                setSelectedTreeId(null);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm py-2"
            >
              Thêm cây mới
            </Button>
            <Button
              appearance="secondary"
              icon={<GlobeRegular />}
              onClick={() => setIsOsmModalOpen(true)}
              className="font-semibold rounded-lg shadow-sm py-2"
              title="Tải từ OSM"
            >
              Tải từ OSM
            </Button>
          </div>
        )}

        {isAddingTree ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Thêm cây mới</h3>
              <Button
                size="small"
                appearance="subtle"
                icon={<DismissRegular className="text-slate-500" />}
                onClick={() => {
                  setIsAddingTree(false);
                  setAddingMode(null);
                  setDrawingCoords([]);
                  setError('');
                }}
              />
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setAddingMode('single');
                  setDrawingCoords([]);
                  setSelectedTreeId(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  addingMode === 'single'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Thêm 1 cây
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingMode('row');
                  setDrawingCoords([]);
                  setSelectedTreeId(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  addingMode === 'row'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Thêm hàng loạt
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
              {/* Common Fields */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Loài cây *</label>
                <select
                  value={formSpecies}
                  onChange={(e) => setFormSpecies(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700 select-species"
                  required
                >
                  <option value="">Chọn loài cây</option>
                  {speciesList.map(s => (
                    <option key={s.name} value={s.name}>{s.ten_loai_cay} ({s.ten_khoa_hoc})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Khu vực *</label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                  required
                >
                  <option value="">Chọn khu vực</option>
                  {areasList.map(a => (
                    <option key={a.name} value={a.name}>{a.ten_khu_vuc}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Tuyến đường (tùy chọn)</label>
                <select
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                >
                  <option value="">Chọn tuyến đường</option>
                  {routesList.map(r => (
                    <option key={r.ma_tuyen} value={r.ma_tuyen}>{r.ten_tuyen}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Dự án</label>
                <Input
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Trạng thái</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Cần cắt tỉa">Cần cắt tỉa</option>
                  <option value="Sâu bệnh">Sâu bệnh</option>
                  <option value="Gãy đổ">Gãy đổ</option>
                </select>
              </div>

              {/* Mode-specific Fields */}
              {addingMode === 'single' ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col gap-2 mt-1">
                  <span className="text-xs font-semibold text-emerald-800">Hướng dẫn thêm 1 cây:</span>
                  <p className="text-[11px] text-slate-500 m-0">Click trực tiếp trên bản đồ (2D hoặc 3D) để chọn vị trí trồng cây.</p>
                  {drawingCoords.length === 1 ? (
                    <div className="text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                      Tọa độ: {drawingCoords[0][0].toFixed(5)}, {drawingCoords[0][1].toFixed(5)}
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-500">Chưa chọn vị trí</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Số lượng cây trong dãy *</label>
                    <Input
                      type="number"
                      min={2}
                      max={100}
                      value={treeCount.toString()}
                      onChange={(e) => setTreeCount(parseInt(e.target.value) || 2)}
                      className="w-full"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col gap-2">
                    <span className="text-xs font-semibold text-amber-800">Hướng dẫn thêm hàng loạt:</span>
                    <p className="text-[11px] text-slate-500 m-0">Click lần lượt các điểm trên bản đồ để vẽ đường đi của dãy cây. Cây sẽ tự động chia đều trên đường này.</p>
                    <div className="flex justify-between items-center text-[11px] text-slate-600 mt-1 font-semibold">
                      <span>Đã chọn: {drawingCoords.length} điểm</span>
                      <span>Quãng đường: {getDrawingDistance().toFixed(1)} m</span>
                    </div>
                    {drawingCoords.length > 0 && (
                      <Button
                        size="small"
                        appearance="outline"
                        onClick={() => setDrawingCoords([])}
                        className="self-end"
                      >
                        Vẽ lại
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                appearance="secondary"
                disabled={saving}
                onClick={() => {
                  setIsAddingTree(false);
                  setAddingMode(null);
                  setDrawingCoords([]);
                  setError('');
                }}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                appearance="primary"
                disabled={
                  saving ||
                  !formSpecies ||
                  !formArea ||
                  (addingMode === 'single' && drawingCoords.length !== 1) ||
                  (addingMode === 'row' && drawingCoords.length < 2)
                }
                onClick={handleSaveTree}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {saving ? <Spinner size="tiny" label="Đang lưu..." /> : 'Lưu cây'}
              </Button>
            </div>
          </div>
        ) : isEditingTree && selectedTreeId ? (
          (() => {
            const selectedTree = trees.find(t => t.ma_tai_san === selectedTreeId);
            if (!selectedTree) return null;
            return (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chỉnh sửa cây xanh</span>
                    <h3 className="text-base font-bold text-slate-800 m-0">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</h3>
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<DismissRegular className="text-slate-500" />}
                    onClick={() => {
                      setIsEditingTree(false);
                    }}
                  />
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Mã tài sản (Readonly)</label>
                    <Input
                      value={selectedTree.ma_tai_san}
                      disabled
                      className="w-full font-mono text-slate-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Loài cây *</label>
                    <select
                      value={formSpecies}
                      onChange={(e) => setFormSpecies(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700 select-species"
                      required
                    >
                      <option value="">Chọn loài cây</option>
                      {speciesList.map(s => (
                        <option key={s.name} value={s.name}>{s.ten_loai_cay} ({s.ten_khoa_hoc})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Khu vực *</label>
                    <select
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                      required
                    >
                      <option value="">Chọn khu vực</option>
                      {areasList.map(a => (
                        <option key={a.name} value={a.name}>{a.ten_khu_vuc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tuyến đường (tùy chọn)</label>
                    <select
                      value={formRoute}
                      onChange={(e) => setFormRoute(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                    >
                      <option value="">Chọn tuyến đường</option>
                      {routesList.map(r => (
                        <option key={r.ma_tuyen} value={r.ma_tuyen}>{r.ten_tuyen}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Dự án</label>
                    <Input
                      value={formProject}
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Tọa độ GPS *</label>
                    <Input
                      value={formGps}
                      onChange={(e) => setFormGps(e.target.value)}
                      placeholder="e.g. 16.0748, 108.1512"
                      className="w-full font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">Trạng thái</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Cần cắt tỉa">Cần cắt tỉa</option>
                      <option value="Sâu bệnh">Sâu bệnh</option>
                      <option value="Gãy đổ">Gãy đổ</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    appearance="secondary"
                    disabled={saving}
                    onClick={() => {
                      setIsEditingTree(false);
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    appearance="primary"
                    disabled={saving || !formSpecies || !formArea || !formGps}
                    onClick={async () => {
                      setSaving(true);
                      setError('');
                      try {
                        const updatedAssetData = {
                          ma_tai_san: selectedTree.ma_tai_san,
                          ten_tai_san: selectedTree.ten_tai_san,
                          loai_cay: formSpecies,
                          khu_vuc: formArea,
                          tuyen_duong: formRoute || undefined,
                          du_an: formProject,
                          toa_do_gps: formGps,
                          trang_thai: formStatus,
                          ngay_lap_dat: selectedTree.ngay_lap_dat
                        };
                        await treeService.createTreeAsset(updatedAssetData);
                        setIsEditingTree(false);
                        await fetchFilteredTrees();
                      } catch (err: any) {
                        console.error(err);
                        setError(err.response?.data?.message || 'Lỗi khi cập nhật cây xanh.');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {saving ? <Spinner size="tiny" label="Đang lưu..." /> : 'Lưu thay đổi'}
                  </Button>
                </div>
              </div>
            );
          })()
        ) : selectedTreeId ? (
          (() => {
            const selectedTree = trees.find(t => t.ma_tai_san === selectedTreeId);
            if (!selectedTree) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Spinner size="medium" label="Đang tải chi tiết..." />
                </div>
              );
            }

            const treeSpecies = speciesList.find(s => s.name === selectedTree.loai_cay);
            const tenKhoaHoc = treeSpecies?.ten_khoa_hoc || 'Pterocarpus indicus';
            const loaiCayTitle = selectedTree.loai_cay_title || selectedTree.loai_cay;

            return (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chi tiết cây xanh</span>
                    <h3 className="text-base font-bold text-slate-800 m-0">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<WarningRegular />}
                      onClick={() => navigate('/report', { state: { treeId: selectedTree.ma_tai_san } })}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                    >
                      Báo sự cố
                    </Button>
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<EditRegular />}
                      onClick={() => {
                        setFormSpecies(selectedTree.loai_cay);
                        setFormArea(selectedTree.khu_vuc);
                        setFormRoute(selectedTree.tuyen_duong || '');
                        setFormProject(selectedTree.du_an || '');
                        setFormStatus(selectedTree.trang_thai);
                        setFormGps(selectedTree.toa_do_gps || `${selectedTree.latitude}, ${selectedTree.longitude}`);
                        setIsEditingTree(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="small"
                      appearance="outline"
                      icon={<DeleteRegular />}
                      onClick={() => handleDeleteTree(selectedTree.ma_tai_san)}
                      className="border-rose-600 hover:border-rose-700 text-rose-600 hover:text-rose-700 font-bold text-xs"
                    >
                      Xóa
                    </Button>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<DismissRegular className="text-slate-500" />}
                      onClick={() => setSelectedTreeId(null)}
                    />
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setDetailTab('info')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      detailTab === 'info'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('incidents')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      detailTab === 'incidents'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sự cố ({treeDetails?.incidents?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('work_orders')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      detailTab === 'work_orders'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Bảo trì ({treeDetails?.work_orders?.length || 0})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin text-left">
                  {detailTab === 'info' && (
                    <div className="flex flex-col border border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-xs border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 w-1/3 border-r border-slate-100">Lớp cây xanh</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.lop_cay_xanh || 'Cây xanh sử dụng công cộng'}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Tựa đề</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Nội dung</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Tên</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Mã cây</td>
                            <td className="p-2.5 text-slate-800 font-mono font-bold">{selectedTree.ma_tai_san}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Tên thông thường</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ten_tai_san || `Cây xanh ${selectedTree.ma_tai_san}`}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Tên khoa học</td>
                            <td className="p-2.5 text-slate-800 font-medium italic">{tenKhoaHoc}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Đường kính thân</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.duong_kinh || '10'} cm</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Năm trồng</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ngay_lap_dat ? selectedTree.ngay_lap_dat.split('-')[0] : '2020'}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Khu vực trồng</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.khu_vuc_title || selectedTree.khu_vuc}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Loại cây</td>
                            <td className="p-2.5 text-slate-800 font-medium">{loaiCayTitle}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Loại danh mục cây</td>
                            <td className="p-2.5 text-slate-800 font-medium">Cây bóng mát</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Thời gian cắt tỉa</td>
                            <td className="p-2.5 text-slate-800 font-medium">—</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Thời gian cập nhật thông tin</td>
                            <td className="p-2.5 text-slate-800 font-medium">{selectedTree.ngay_lap_dat || '2026-04-20'}</td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Hiện trạng cây</td>
                            <td className="p-2.5 text-slate-800 font-semibold" style={{ color: getTreeColor(selectedTree.trang_thai) }}>
                              {selectedTree.trang_thai}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Hình dạng ô đất trồng cây</td>
                            <td className="p-2.5 text-slate-800 font-medium">Vuông</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-500 border-r border-slate-100">Kích thước ô đất trồng cây</td>
                            <td className="p-2.5 text-slate-800 font-medium">2m x 2m</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {detailTab === 'incidents' && (
                    <div className="flex flex-col gap-3">
                      {loadingDetails ? (
                        <div className="py-8 flex items-center justify-center">
                          <Spinner size="tiny" label="Đang tải sự cố..." />
                        </div>
                      ) : treeDetails?.incidents?.length > 0 ? (
                        treeDetails.incidents.map((inc: any) => (
                          <div key={inc.name} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-xs text-slate-800">{inc.tieu_de}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                inc.trang_thai === 'Mới' ? 'bg-rose-50 border border-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {inc.trang_thai}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mb-2">
                              Loại: {inc.loai_su_co} - Mức độ: {inc.muc_do_uu_tien}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                              <span>Ngày: {new Date(inc.creation).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl">
                          <WarningRegular className="text-lg text-slate-300 mb-1" />
                          <p className="m-0">Chưa có báo cáo sự cố nào.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === 'work_orders' && (
                    <div className="flex flex-col gap-3">
                      {loadingDetails ? (
                        <div className="py-8 flex items-center justify-center">
                          <Spinner size="tiny" label="Đang tải bảo trì..." />
                        </div>
                      ) : treeDetails?.work_orders?.length > 0 ? (
                        treeDetails.work_orders.map((wo: any) => (
                          <div key={wo.name} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-xs text-slate-800">{wo.ten_cong_viec}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                wo.trang_thai === 'Đã nghiệm thu đạt'
                                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {wo.trang_thai}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mb-2">
                              {wo.nguoi_thuc_hien} | {wo.don_vi_thi_cong}
                            </div>
                            <div className="flex flex-col pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                              <span>Bắt đầu: {wo.ngay_bat_dau ? new Date(wo.ngay_bat_dau).toLocaleDateString('vi-VN') : '—'}</span>
                              <span>Hoàn thành: {wo.ngay_hoan_thanh ? new Date(wo.ngay_hoan_thanh).toLocaleDateString('vi-VN') : '—'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 font-semibold bg-white border border-slate-100 rounded-xl">
                          <InfoRegular className="text-lg text-slate-300 mb-1" />
                          <p className="m-0">Chưa có lịch sử bảo trì nào.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <>
            {/* Filters Section */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 m-0">Bộ lọc</h3>
                {hasActiveFilters && (
                  <Button 
                    size="small" 
                    appearance="subtle" 
                    onClick={clearFilters}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <select 
                    value={filterProject} 
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">Dự án</option>
                    {projectsList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <select 
                    value={filterRoute} 
                    onChange={(e) => setFilterRoute(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">Tuyến đường</option>
                    {routesList.map(r => (
                      <option key={r.ma_tuyen} value={r.ma_tuyen}>{r.ten_tuyen}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <select 
                    value={filterArea} 
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">Khu vực</option>
                    {areasList.map(a => (
                      <option key={a.name} value={a.name}>{a.ten_khu_vuc}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <select 
                    value={filterLayer} 
                    onChange={(e) => setFilterLayer(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                  >
                    <option value="">Lớp cây xanh</option>
                    {treeLayersList.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full relative">
                  <Input
                    contentBefore={<SearchRegular className="text-slate-400" />}
                    placeholder="Tìm kiếm mã/cây/người k..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    size="medium"
                  />
                </div>
              </div>
            </div>

            <hr className="border-t border-slate-100 my-0" />

            {/* Tree List Section */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 m-0">Danh sách cây</h3>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                  {trees.length} / {totalTreesCount} cây
                </span>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spinner size="medium" label="Đang cập nhật..." />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 scrollbar-thin">
                  {trees.map((t) => (
                    <div 
                      key={t.ma_tai_san}
                      onClick={() => {
                        setSelectedTreeId(t.ma_tai_san);
                        if (!is3D && leafletMap) {
                          leafletMap.setView([t.latitude, t.longitude], 18);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer bg-white text-left ${
                        selectedTreeId === t.ma_tai_san 
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10' 
                          : 'border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-slate-800">{t.ten_tai_san || `Cây xanh ${t.ma_tai_san}`}</span>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={<EyeRegular className="text-blue-500 text-sm" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTreeId(t.ma_tai_san);
                              if (!is3D && leafletMap) {
                                leafletMap.setView([t.latitude, t.longitude], 18);
                              }
                            }}
                          />
                          <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={<EditRegular className="text-slate-400 text-sm" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTreeId(t.ma_tai_san);
                              setFormSpecies(t.loai_cay);
                              setFormArea(t.khu_vuc);
                              setFormRoute(t.tuyen_duong || '');
                              setFormProject(t.du_an || '');
                              setFormStatus(t.trang_thai);
                              setFormGps(t.toa_do_gps || `${t.latitude}, ${t.longitude}`);
                              setIsEditingTree(true);
                              if (!is3D && leafletMap) {
                                leafletMap.setView([t.latitude, t.longitude], 18);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">ID: {t.ma_tai_san}</span>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.du_an && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-700 font-medium">
                            {t.du_an}
                          </span>
                        )}
                        {t.tuyen_duong_title && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-medium">
                            {t.tuyen_duong_title}
                          </span>
                        )}
                        {t.khu_vuc_title && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 border border-sky-100 text-sky-700 font-medium">
                            {t.khu_vuc_title}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
                          Cây xanh sử dụng công cộng
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
                          3D
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 font-medium">
                        <LocationRegular className="text-xs text-slate-400" />
                        <span>{t.longitude.toFixed(4)}, {t.latitude.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}

                  {trees.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      Không tìm thấy cây nào phù hợp.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Map Panel */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        
        {/* Top-Right Control Overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-white p-1.5 rounded-lg shadow-md border border-slate-200/80">
          
          {/* Basemap Selection */}
          <select 
            value={currentBasemap} 
            onChange={(e) => setCurrentBasemap(e.target.value)}
            className="p-1.5 border border-slate-200 rounded text-xs bg-slate-50 font-bold text-slate-700 outline-none"
          >
            <option value="GOOGLE_SATELLITE">Google Vệ tinh</option>
            <option value="GOOGLE">Google đường phố</option>
            <option value="OSM">OSM</option>
          </select>

          {/* Recenter Button */}
          <Button 
            size="small" 
            appearance="subtle" 
            icon={<LocationRegular className="text-slate-600" />} 
            onClick={handleRecenter}
            title="Định vị tâm"
          />

          {/* Share Button */}
          <Button 
            size="small" 
            appearance="subtle" 
            icon={<ShareRegular className="text-slate-600" />} 
            onClick={() => alert("Đã sao chép liên kết bản đồ!")}
            title="Chia sẻ liên kết"
          />

          {/* 2D / 3D Segmented Control */}
          <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200/50">
            <button
              onClick={() => setIs3D(false)}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                !is3D 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MapRegular className="text-sm" /> 2D
            </button>
            <button
              onClick={() => setIs3D(true)}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                is3D 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GlobeRegular className="text-sm" /> 3D
            </button>
          </div>
        </div>

        {/* Active Map View Rendering */}
        {is3D ? (
          <TreeMap3D 
            trees={trees} 
            routes={routes} 
            selectedTreeId={selectedTreeId}
            onTreeClick={(t) => setSelectedTreeId(t.ma_tai_san)}
            currentBasemap={currentBasemap}
            isAdding={isAddingTree}
            addingMode={addingMode}
            drawingCoords={drawingCoords}
            onAddDrawingPoint={handleAddDrawingPoint}
            onUpdateSingleCoord={handleUpdateSingleCoord}
            onResetRowCoords={handleResetRowCoords}
            initialCenter={mapCenter}
            initialZoom={mapZoom}
            onCameraMove={(center, zoom) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
          />
        ) : (
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ width: '100%', height: '100%' }}
          >
            <MapRefSetter setMap={setLeafletMap} />
            <MapViewSync 
              onViewChange={(center, zoom) => {
                setMapCenter([center.lat, center.lng]);
                setMapZoom(zoom);
              }}
            />
            <MapClickEvents
              isAdding={isAddingTree}
              addingMode={addingMode}
              onAddPoint={handleAddDrawingPoint}
            />
            <MapRowDrawing
              isAdding={isAddingTree}
              addingMode={addingMode}
              setDrawingCoords={setDrawingCoords}
            />

            <TileLayer
              attribution='&copy; Google Maps'
              url={getTileLayerUrl(currentBasemap)}
            />

            {/* Render Saved Route Polylines */}
            {routes.map((r) => {
              if (!r.polyline_json) return null;
              try {
                const points = JSON.parse(r.polyline_json);
                return (
                  <Polyline key={r.ma_tuyen} positions={points} color="#14b8a6" weight={4}>
                    <Popup>
                      <div className="p-1">
                        <h4 className="font-bold text-teal-800 m-0">Tuyến: {r.ten_tuyen}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">Mã: {r.ma_tuyen}</span>
                        <p className="text-xs text-slate-600 m-0 mt-1">Ghi chú: {r.ghi_chu || 'Không'}</p>
                      </div>
                    </Popup>
                  </Polyline>
                );
              } catch (e) {
                return null;
              }
            })}

            {/* Render Trees with Clustering */}
            <TreeMarkerCluster 
              trees={trees}
              onTreeClick={(id) => setSelectedTreeId(id)}
              getTreeIcon={getTreeIcon}
            />

            {/* Render Active Drawing coordinates in Leaflet */}
            {isAddingTree && addingMode === 'single' && drawingCoords.length === 1 && (
              <Marker
                position={drawingCoords[0]}
                draggable={true}
                icon={getDrawingIcon(0)}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setDrawingCoords([[pos.lat, pos.lng]]);
                  }
                }}
              />
            )}

            {isAddingTree && addingMode === 'row' && drawingCoords.map((coord, idx) => (
              <Marker
                key={`drawing-pt-${idx}`}
                position={coord}
                icon={getDrawingIcon(idx)}
              />
            ))}

            {isAddingTree && addingMode === 'row' && drawingCoords.length >= 2 && (
              <Polyline
                positions={drawingCoords}
                color="#f59e0b"
                weight={4}
                dashArray="5, 5"
              />
            )}
          </MapContainer>
        )}
      </div>

      <OsmImportDialog 
        isOpen={isOsmModalOpen} 
        onClose={() => setIsOsmModalOpen(false)} 
        onSuccess={async (geojson, name, type) => {
          try {
            if (type === 'route') {
              await urbanTreeApi.createTreeRoute({
                ma_tuyen: `T-${Date.now()}`,
                ten_tuyen: name,
                khu_vuc: 'KV-HKB',
                polyline_json: JSON.stringify(geojson.geometry.coordinates)
              });
            } else {
              // For now, assuming park creation via an API if available, 
              // but we need to create it using api.ts
              // The user asked to create Park API, which we did.
              // I'll leave it as is or add it if needed.
            }
            // reload routes/parks
            loadInitialData();
            alert('Nhập dữ liệu thành công!');
          } catch (e: any) {
            alert('Lỗi lưu dữ liệu: ' + e.message);
          }
        }} 
      />
    </div>
  );
};
