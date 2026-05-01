import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVesselUpdates } from '../hooks/useVesselUpdates';
import { createVesselLayers, createVesselPopupHtml, vesselArrayToGeoJson } from '../lib/mapUtils';
import './VesselMap.css';

/**
 * Production-ready MapLibre GL vessel tracking component
 * 
 * Features:
 * - Real-time vessel updates via WebSocket or polling
 * - GPU-accelerated symbol rendering (1000+ vessels)
 * - Smart clustering at zoom levels < 10
 * - Interactive popups with vessel details
 * - Icon rotation based on heading
 * - Performance optimized (refs, no re-renders on map updates)
 */
const VesselMap = React.forwardRef(
  (
    {
      token,
      options = {},
      onVesselClick,
      onError,
      restrictedAreas = [],
      isDrawing = false,
      onDrawPoint,
      drawPoints = [],
      showRestrictedAreas = false,
    },
    ref
  ) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const sourceReadyRef = useRef(false);
    const currentGeoJsonRef = useRef(null);
    const pendingVesselsRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      totalVessels: 0,
      movingVessels: 0,
      anchoredVessels: 0,
      lastUpdate: null,
    });
    const [error, setError] = useState(null);

    const {
      vessels,
      isUpdating,
      error: updateError,
    } = useVesselUpdates(token, options.pollInterval || 5000);

    // Default options
    const mapOptions = {
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [0, 20],
      zoom: 3,
      clusterZoom: 10,
      ...options,
    };

    // Initialize map
    useEffect(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapOptions.style,
        center: mapOptions.center,
        zoom: mapOptions.zoom,
        pitch: 0,
        bearing: 0,
        attributionControl: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        console.log('[VesselMap] Map loaded, adding icon...');
        
        // 1. Create Arrowhead icon (for lower zoom)
        const arrowSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <polygon points="32,10 52,54 32,44 12,54" fill="#3b82f6" stroke="#fff" stroke-width="2.5"/>
          </svg>
        `;
        
        // 2. Create Ship Silhouette icon (for higher zoom)
        const shipSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 160">
            <path d="M32 4 L56 38 V148 Q56 156 46 158 L32 160 L18 158 Q8 156 8 148 V38 Z" fill="#3b82f6" stroke="#fff" stroke-width="2.5"/>
          </svg>
        `;
        
        const loadIcons = async () => {
          const icons = [
            { id: 'vessel-arrow', svg: arrowSvg },
            { id: 'vessel-ship', svg: shipSvg }
          ];

          for (const icon of icons) {
            const svgBlob = new Blob([icon.svg], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = new Image();
            
            await new Promise((resolve) => {
              img.onload = () => {
                map.addImage(icon.id, img, { sdf: false });
                URL.revokeObjectURL(svgUrl);
                resolve();
              };
              img.src = svgUrl;
            });
          }
          
          console.log('[VesselMap] All icons loaded, now adding layers...');
          setupVesselLayers();
        };

        loadIcons().catch(e => console.error('[VesselMap] Icon loading failed:', e));

        // Setup vessel layers (called after icon is loaded)
        const setupVesselLayers = () => {
          // Create GeoJSON source with clustering
          const emptyCollection = {
            type: 'FeatureCollection',
            features: [],
          };

          map.addSource('vessels', {
            type: 'geojson',
            data: emptyCollection,
          });
          sourceReadyRef.current = true;
          currentGeoJsonRef.current = emptyCollection;

          // If vessel data arrived before the source was ready, apply it now
          if (pendingVesselsRef.current) {
            const pending = pendingVesselsRef.current;
            pendingVesselsRef.current = null;
            const src = map.getSource('vessels');
            if (src) {
              src.setData(pending);
              currentGeoJsonRef.current = pending;
              console.log('[VesselMap] Applied pending vessel data:', pending.features.length, 'features');
            }
          }

          // Add vessel layers
          const layers = createVesselLayers(mapOptions.clusterZoom);
          console.log('[VesselMap] Adding', layers.length, 'layers');
          layers.forEach((layer) => {
            console.log('[VesselMap] Adding layer:', layer.id);
            map.addLayer(layer);
          });

          // Click to show popup
          map.on('click', 'vessel-symbol', (e) => {
            const feature = e.features[0];
            if (!feature.properties.cluster) {
              const coordinates = feature.geometry.coordinates.slice();
              const popup = new maplibregl.Popup({ offset: 25 })
                .setLngLat(coordinates)
                .setHTML(createVesselPopupHtml(feature))
                .addTo(map);

              onVesselClick?.(feature);
            }
          });

          // Hover effects
          map.on('mouseenter', 'vessel-symbol', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'vessel-symbol', () => {
            map.getCanvas().style.cursor = '';
          });

          setLoading(false);
          console.log('[VesselMap] Layers and source ready');
        };

        // Global click handler for drawing
        map.on('click', (e) => {
          // We use a ref to check isDrawing to avoid re-binding this listener
          // But since isDrawing is a prop, we might need a better way if we want to avoid re-renders
          // For now, let's just check if the mode is active
        });
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setError('Map initialization error');
        onError?.(e);
      });

      return () => {
        map.remove();
        mapRef.current = null;
        sourceReadyRef.current = false;
        pendingVesselsRef.current = null;
      };
    }, []);

    // Update vessel data
    useEffect(() => {
      if (!mapRef.current || !vessels || vessels.length === 0) {
        return;
      }

      const newGeoJson = vesselArrayToGeoJson(vessels);
      console.log('[VesselMap] Updating with', vessels.length, 'vessels,', newGeoJson.features.length, 'features');

      // If the source isn't ready yet, stash the data for later
      if (!sourceReadyRef.current) {
        console.log('[VesselMap] Source not ready yet, queuing data for when layers initialize');
        pendingVesselsRef.current = newGeoJson;
        return;
      }

      // Update source data
      const source = mapRef.current.getSource('vessels');
      if (source) {
        source.setData(newGeoJson);
        console.log('[VesselMap] Source data updated');
      } else {
        console.warn('[VesselMap] Source not found on map, queuing data');
        pendingVesselsRef.current = newGeoJson;
      }

      // Update current reference
      currentGeoJsonRef.current = newGeoJson;

      // Calculate statistics
      const moving = vessels.filter((v) => parseFloat(v.sog) > 0.5).length;
      const anchored = vessels.filter((v) => v.nav_status === 1 || parseFloat(v.sog) <= 0.5).length;

      setStats({
        totalVessels: vessels.length,
        movingVessels: moving,
        anchoredVessels: anchored,
        lastUpdate: new Date(),
      });

      setError(null);
    }, [vessels]);

    // Update restricted areas
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !sourceReadyRef.current) return;

      const updateMapData = () => {
        const geoJson = {
          type: 'FeatureCollection',
          features: (restrictedAreas || []).map(area => ({
            type: 'Feature',
            geometry: area.geometry,
            properties: { id: area.id, name: area.name, type: area.type },
          })),
        };

        if (!map.getSource('restricted-areas')) {
          map.addSource('restricted-areas', {
            type: 'geojson',
            data: geoJson,
          });

          map.addLayer({
            id: 'restricted-areas-fill',
            type: 'fill',
            source: 'restricted-areas',
            paint: {
              'fill-color': [
                'match',
                ['get', 'type'],
                'restricted', '#ef4444',
                'coral', '#f59e0b',
                '#ef4444'
              ],
              'fill-opacity': showRestrictedAreas ? 0.2 : 0,
            },
          });

          map.addLayer({
            id: 'restricted-areas-outline',
            type: 'line',
            source: 'restricted-areas',
            paint: {
              'line-color': '#ef4444',
              'line-width': 2,
              'line-dasharray': [2, 1],
              'line-opacity': showRestrictedAreas ? 0.8 : 0,
            },
          });

          map.addLayer({
            id: 'restricted-areas-labels',
            type: 'symbol',
            source: 'restricted-areas',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'visibility': showRestrictedAreas ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });
        } else {
          map.getSource('restricted-areas').setData(geoJson);
          map.setPaintProperty('restricted-areas-fill', 'fill-opacity', showRestrictedAreas ? 0.2 : 0);
          map.setPaintProperty('restricted-areas-outline', 'line-opacity', showRestrictedAreas ? 0.8 : 0);
          map.setLayoutProperty('restricted-areas-labels', 'visibility', showRestrictedAreas ? 'visible' : 'none');
        }
      };

      if (map.isStyleLoaded()) {
        updateMapData();
      } else {
        map.once('style.load', updateMapData);
      }
    }, [restrictedAreas, showRestrictedAreas, loading]);

    // Update drawing layer
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !sourceReadyRef.current) return;

      const updateDrawing = () => {
        const features = [];
        
        // Points
        drawPoints.forEach(p => {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
          });
        });

        // Line/Polygon
        if (drawPoints.length >= 2) {
          const coords = drawPoints.map(p => [p.lon, p.lat]);
          
          // Add line
          features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords }
          });

          // Add polygon if >= 3
          if (drawPoints.length >= 3) {
            features.push({
              type: 'Feature',
              geometry: { 
                type: 'Polygon', 
                coordinates: [[...coords, coords[0]]] 
              }
            });
          }
        }

        const drawingGeoJson = {
          type: 'FeatureCollection',
          features
        };

        if (!map.getSource('drawing-active')) {
          map.addSource('drawing-active', {
            type: 'geojson',
            data: drawingGeoJson
          });

          map.addLayer({
            id: 'drawing-fill',
            type: 'fill',
            source: 'drawing-active',
            paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }
          });

          map.addLayer({
            id: 'drawing-points',
            type: 'circle',
            source: 'drawing-active',
            paint: { 
              'circle-radius': 5, 
              'circle-color': '#3b82f6',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }
          });
        } else {
          map.getSource('drawing-active').setData(drawingGeoJson);
        }
        
        const visibility = isDrawing ? 'visible' : 'none';
        if (map.getLayer('drawing-fill')) map.setLayoutProperty('drawing-fill', 'visibility', visibility);
        if (map.getLayer('drawing-points')) map.setLayoutProperty('drawing-points', 'visibility', visibility);
      };

      if (map.isStyleLoaded()) {
        updateDrawing();
      } else {
        map.once('style.load', updateDrawing);
      }
    }, [drawPoints, isDrawing]);

    // Click handler for drawing
    useEffect(() => {
      if (!mapRef.current) return;

      const onClick = (e) => {
        if (isDrawing) {
          onDrawPoint?.({ lat: e.lngLat.lat, lon: e.lngLat.lng });
        }
      };

      mapRef.current.on('click', onClick);
      return () => mapRef.current?.off('click', onClick);
    }, [isDrawing, onDrawPoint]);

    // Update cursor when drawing
    useEffect(() => {
      if (!mapRef.current) return;
      mapRef.current.getCanvas().style.cursor = isDrawing ? 'crosshair' : '';
    }, [isDrawing]);

    // Handle update errors
    useEffect(() => {
      if (updateError) {
        setError(updateError);
        onError?.(updateError);
      }
    }, [updateError, onError]);

    // Expose map and methods via ref
    useEffect(() => {
      if (ref) {
        ref.current = {
          getMap: () => mapRef.current,
          fitBounds: (bounds, options) => mapRef.current?.fitBounds(bounds, options),
          flyTo: (options) => mapRef.current?.flyTo(options),
          getStats: () => stats,
          getVessels: () => currentGeoJsonRef.current,
        };
      }
    }, [stats]);

    return (
      <div className="relative w-full h-full">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-gray-500 font-medium">Loading map...</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-5 left-5 right-5 bg-red-100 border-l-4 border-red-500 px-4 py-3 rounded-md z-10 text-sm shadow-md flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span className="text-red-900 leading-relaxed break-words">{error}</span>
          </div>
        )}

        {/* Statistics overlay - Bottom Left & Compact */}
        {!loading && (
          <div className="absolute bottom-5 left-5 bg-black/70 backdrop-blur-sm rounded-md p-2.5 shadow-lg min-w-[160px] z-[5] animate-[slideIn_0.3s_ease-out] border border-white/10">
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">total vessels</span>
                <span className="text-sm font-black text-white tabular-nums">{stats.totalVessels}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">moving</span>
                <span className="text-sm font-black text-emerald-400 tabular-nums">{stats.movingVessels}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">anchored</span>
                <span className="text-sm font-black text-blue-400 tabular-nums">{stats.anchoredVessels}</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-white/10 text-[9px] text-gray-500 flex justify-between items-center">
                <span>Refreshed: {stats.lastUpdate ? stats.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                {isUpdating && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VesselMap.displayName = 'VesselMap';

export default VesselMap;
