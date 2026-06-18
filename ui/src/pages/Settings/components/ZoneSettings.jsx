import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Map, Plus, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext.jsx';

export function ZoneSettings() {
  const { token } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('military');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/restricted-areas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch restricted zones');
      const data = await res.json();
      setZones(data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load restricted zones.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const extractAllGeometriesAsCoordinates = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    let geojson = null;

    if (ext === 'geojson' || ext === 'json') {
      const text = await file.text();
      geojson = JSON.parse(text);
    } else if (ext === 'kml') {
      const text = await file.text();
      const dom = new DOMParser().parseFromString(text, 'text/xml');
      const toGeoJSON = await import('@tmcw/togeojson');
      geojson = toGeoJSON.kml(dom);
    } else if (ext === 'zip') {
      const buffer = await file.arrayBuffer();
      const shpModule = await import('shpjs');
      const parseShp = shpModule.default || shpModule;
      geojson = await parseShp(buffer);
    } else {
      throw new Error('Unsupported file format. Please upload .geojson, .kml, or .zip');
    }

    // Usually files contain a FeatureCollection
    const features = geojson.features || (geojson.type === 'Feature' ? [geojson] : []);
    if (!features.length) {
      throw new Error('No valid features found in the file.');
    }

    const polygons = [];
    
    for (const feature of features) {
      if (!feature.geometry) continue;
      
      if (feature.geometry.type === 'Polygon') {
        const coordsArray = feature.geometry.coordinates[0];
        polygons.push(coordsArray.map(coord => ({ lon: coord[0], lat: coord[1] })));
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const poly of feature.geometry.coordinates) {
          const coordsArray = poly[0];
          polygons.push(coordsArray.map(coord => ({ lon: coord[0], lat: coord[1] })));
        }
      }
    }

    if (polygons.length === 0) {
      throw new Error('No Polygon geometries found in the file.');
    }

    return polygons;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedFile) {
      setError('Name and File are required.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const allPolygons = await extractAllGeometriesAsCoordinates(selectedFile);
      
      let count = 1;
      for (const coordinates of allPolygons) {
        const zoneName = allPolygons.length > 1 ? `${name} ${count++}` : name;
        
        const res = await fetch('http://localhost:5000/api/restricted-areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: zoneName, type, coordinates })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to save zone: ${zoneName}`);
        }
      }

      // Reset form
      setName('');
      setType('military');
      setSelectedFile(null);
      if (document.getElementById('zone-file-upload')) {
        document.getElementById('zone-file-upload').value = '';
      }

      await fetchZones(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while parsing or uploading the file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column: Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Add New Zone
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Zone Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Northern Military Exclusion"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Zone Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="military">Military</option>
                  <option value="environmental">Environmental (MPA)</option>
                  <option value="eez">Exclusive Economic Zone (EEZ)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">GIS File (.geojson, .kml, .zip)</label>
                <div className="relative mt-1">
                  <input
                    type="file"
                    id="zone-file-upload"
                    accept=".geojson,.json,.kml,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="zone-file-upload"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-slate-50 p-6 text-sm font-medium text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    {selectedFile ? (
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    ) : (
                      <span>Select or drop file</span>
                    )}
                  </label>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Upload a GeoJSON, KML, or a Shapefile (zipped). Must contain a Polygon geometry.
                </p>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full rounded-lg bg-blue-600 p-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isUploading ? 'Parsing & Saving...' : 'Save Restricted Zone'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="w-full lg:w-2/3">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="border-b border-gray-200 bg-slate-50 p-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Active Restricted Zones
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading zones...</div>
              ) : zones.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <Map className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No restricted zones defined yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Upload a GIS file to get started.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-slate-50 p-3 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{zone.name}</h4>
                          <span className="inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                            {zone.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Currently we don't have a DELETE endpoint in the backend. This is just for UI readiness */}
                        <button disabled className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete Zone (Not Implemented)">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
