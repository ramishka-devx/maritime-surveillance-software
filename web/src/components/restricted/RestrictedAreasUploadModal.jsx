import React, { useState, useRef } from 'react';
import { parseGeoJsonFile, normalizeZoneType } from '../../lib/geoJsonParser.js';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../auth/AuthContext.jsx';

const ZONE_TYPE_OPTIONS = [
  { value: 'military', label: 'Military Exclusion' },
  { value: 'sanctuary', label: 'Marine Sanctuary' },
  { value: 'port', label: 'Port Security' },
  { value: 'cable', label: 'Cable Corridor' },
  { value: 'restricted', label: 'Custom Exclusion' },
  { value: 'anchorage', label: 'Port Anchorage' },
];

export default function RestrictedAreasUploadModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsedZones, setParsedZones] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, zoneName }
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file) => {
    if (!file) return;
    setErrorMessage(null);
    setWarnings([]);
    setIsProcessing(true);

    try {
      const { zones, errors } = await parseGeoJsonFile(file);
      if (zones.length === 0) {
        throw new Error('No valid polygon boundaries were detected in this file.');
      }
      setParsedZones(zones);
      setWarnings(errors || []);
    } catch (err) {
      console.error('GeoJSON parsing failed:', err);
      setErrorMessage(err.message || 'Failed to read GeoJSON file.');
      setParsedZones([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileProcess(files[0]);
    }
  };

  const handleInputChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileProcess(files[0]);
    }
  };

  const handleUpdateZone = (tempId, field, value) => {
    setParsedZones((prev) =>
      prev.map((z) => (z.tempId === tempId ? { ...z, [field]: value } : z))
    );
  };

  const handleRemoveZone = (tempId) => {
    setParsedZones((prev) => prev.filter((z) => z.tempId !== tempId));
  };

  const handleReset = () => {
    setParsedZones([]);
    setWarnings([]);
    setErrorMessage(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedZones.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const total = parsedZones.length;
    let successCount = 0;
    const failedNames = [];

    for (let i = 0; i < total; i++) {
      const zone = parsedZones[i];
      setUploadProgress({ current: i + 1, total, zoneName: zone.name });

      try {
        const payload = {
          name: zone.name.trim(),
          type: normalizeZoneType(zone.type),
          coordinates: zone.coordinates,
        };

        await apiRequest('/api/restricted-areas', {
          token,
          method: 'POST',
          body: payload,
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to upload zone "${zone.name}":`, err);
        failedNames.push(`${zone.name} (${err.message})`);
      }
    }

    setIsProcessing(false);
    setUploadProgress(null);

    if (successCount > 0) {
      if (onSuccess) onSuccess(successCount);
      if (failedNames.length === 0) {
        onClose();
        handleReset();
      } else {
        setErrorMessage(
          `Uploaded ${successCount} zones successfully, but ${failedNames.length} failed:\n${failedNames.join(', ')}`
        );
        // Keep failed zones in view if needed
      }
    } else {
      setErrorMessage(`Failed to upload zones: ${failedNames.join(', ')}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans select-none">
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface m-0 font-mono">
                Import Restricted Areas GeoJSON
              </h2>
              <p className="text-[11px] font-mono text-outline m-0">
                Upload .geojson or .json boundary definitions into PostGIS database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-red-400 text-base shrink-0 mt-0.5">
                error
              </span>
              <span className="whitespace-pre-line">{errorMessage}</span>
            </div>
          )}

          {/* Warnings Banner */}
          {warnings.length > 0 && (
            <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-400 text-base shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">File Parser Notices:</span>
                <ul className="list-disc list-inside text-[11px] text-amber-200/80 m-0">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 1: Upload / Dropzone (Shown when no zones parsed yet) */}
          {parsedZones.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'border-outline-variant/60 hover:border-cyan-400/70 hover:bg-surface-container/50 bg-surface-container/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  {isProcessing ? 'progress_activity' : 'upload_file'}
                </span>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-on-surface uppercase font-mono m-0">
                  {isProcessing
                    ? 'Parsing GeoJSON Structure...'
                    : 'Drag & Drop GeoJSON file here, or browse'}
                </p>
                <p className="text-[11px] font-mono text-outline mt-1 m-0">
                  Supports FeatureCollection, Polygon &amp; MultiPolygon geometries (.geojson, .json)
                </p>
              </div>

              <span className="px-3 py-1 rounded bg-surface-container-highest border border-outline-variant/50 text-cyan-400 font-mono text-[11px] font-semibold uppercase">
                Choose File
              </span>
            </div>
          ) : (
            /* Step 2: Parsed Zones Review & Configuration */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-on-surface uppercase">
                    Detected Zones:
                  </span>
                  <span className="px-2 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono text-xs font-bold border border-cyan-400/40">
                    {parsedZones.length} Polygons
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-mono text-outline hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Choose Another File</span>
                </button>
              </div>

              <p className="text-xs font-mono text-on-surface-variant m-0">
                Review and configure zone attributes before committing to PostGIS. Coordinates have been normalized to [lat, lon].
              </p>

              {/* Zones Scrollable Table */}
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {parsedZones.map((z, idx) => (
                  <div
                    key={z.tempId}
                    className="p-3 rounded bg-surface-container border border-outline-variant/40 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
                  >
                    {/* Zone Name Input */}
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-outline uppercase font-semibold">
                        Zone Name #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={z.name}
                        onChange={(e) => handleUpdateZone(z.tempId, 'name', e.target.value)}
                        className="px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/60 focus:border-cyan-400 text-on-surface text-xs outline-none"
                        required
                      />
                    </div>

                    {/* Zone Type Select */}
                    <div className="w-full md:w-48 flex flex-col gap-1">
                      <label className="text-[10px] text-outline uppercase font-semibold">
                        Classification
                      </label>
                      <select
                        value={z.type}
                        onChange={(e) => handleUpdateZone(z.tempId, 'type', e.target.value)}
                        className="px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant/60 focus:border-cyan-400 text-on-surface text-xs outline-none cursor-pointer"
                      >
                        {ZONE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Metadata & Remove Button */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-1 md:pt-4">
                      <div className="flex flex-col text-right">
                        <span className="text-cyan-400 text-[11px] font-bold">
                          {z.verticesCount} vertices
                        </span>
                        {z.bounds ? (
                          <span
                            className="text-[10px] text-outline font-mono"
                            title={`SW: [${z.bounds[0][0]}, ${z.bounds[0][1]}] | NE: [${z.bounds[1][0]}, ${z.bounds[1][1]}]`}
                          >
                            BBox: [{z.bounds[0][0].toFixed(2)}, {z.bounds[0][1].toFixed(2)}] → [{z.bounds[1][0].toFixed(2)}, {z.bounds[1][1].toFixed(2)}]
                          </span>
                        ) : z.centroid ? (
                          <span className="text-[10px] text-outline">
                            {z.centroid.lat}°, {z.centroid.lon}°
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveZone(z.tempId)}
                        className="p-1 rounded text-outline hover:text-red-400 hover:bg-surface-container-high transition-colors cursor-pointer"
                        title="Remove zone from import list"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {uploadProgress && (
            <div className="p-3 rounded bg-surface-container border border-cyan-400/40 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  Uploading {uploadProgress.current} of {uploadProgress.total}... ({uploadProgress.zoneName})
                </span>
                <span className="text-outline">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-1.5 transition-all duration-200"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container border-t border-outline-variant/40 flex items-center justify-between font-mono text-xs">
          <span className="text-outline text-[11px]">
            {parsedZones.length > 0
              ? `${parsedZones.length} zone(s) staged for commit`
              : 'Accepts standard WGS84 GeoJSON coordinate rings'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface font-semibold uppercase text-xs cursor-pointer"
            >
              Cancel
            </button>

            {parsedZones.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || parsedZones.length === 0}
                className="px-4 py-1.5 rounded bg-cyan-400 text-black hover:bg-cyan-300 font-bold uppercase text-xs tracking-wider shadow-[0_0_14px_rgba(34,211,238,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      progress_activity
                    </span>
                    <span>Commiting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>Commit {parsedZones.length} Zones</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
