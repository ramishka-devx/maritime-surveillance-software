"""Loitering detection (SRS §2.2 behavioural anomalies), rule-based.

A vessel is loitering when, over at least loitering.min_minutes, every position stays within
loitering.radius_m of the track's centre and its average SOG is below loitering.max_sog_kn.
Vessels reporting "at anchor" (1) or "moored" (5) are stationary for a declared reason and
are skipped. A gap longer than MAX_GAP restarts the track, so a vessel that went silent and
reappeared nearby isn't mistaken for one that sat still. One detection per vessel per
loitering.cooldown_minutes.
"""

from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

EXEMPT_NAV_STATUS = {1, 5}  # at anchor, moored
MAX_GAP = timedelta(minutes=20)
MIN_POINTS = 5
EARTH_RADIUS_M = 6_371_000.0


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


@dataclass
class Point:
    t: datetime
    lat: float
    lon: float
    sog: float | None


@dataclass
class LoiteringDetector:
    tracks: dict[int, deque[Point]] = field(default_factory=dict)
    last_flagged: dict[int, datetime] = field(default_factory=dict)

    def update(
        self,
        mmsi: int,
        t: datetime,
        lat: float,
        lon: float,
        sog: float | None,
        nav_status: int | None,
        settings: Any,
    ) -> dict[str, Any] | None:
        """Add a position; return the loitering details when this position completes one."""
        track = self.tracks.setdefault(mmsi, deque())
        if nav_status in EXEMPT_NAV_STATUS:
            track.clear()
            return None
        if track and t <= track[-1].t:
            return None  # duplicate or out of order
        if track and t - track[-1].t > MAX_GAP:
            track.clear()
        track.append(Point(t, lat, lon, sog))

        window = timedelta(minutes=float(settings.get("loitering.min_minutes")))
        # Keep the newest point that is at least `window` old, plus everything after it.
        while len(track) > 1 and t - track[1].t >= window:
            track.popleft()
        if len(track) < MIN_POINTS or t - track[0].t < window:
            return None

        cooldown = timedelta(minutes=float(settings.get("loitering.cooldown_minutes")))
        last = self.last_flagged.get(mmsi)
        if last is not None and t - last < cooldown:
            return None

        c_lat = sum(p.lat for p in track) / len(track)
        c_lon = sum(p.lon for p in track) / len(track)
        radius = max(haversine_m(c_lat, c_lon, p.lat, p.lon) for p in track)
        speeds = [p.sog for p in track if p.sog is not None]
        mean_sog = sum(speeds) / len(speeds) if speeds else 0.0

        if radius > float(settings.get("loitering.radius_m")) or mean_sog >= float(settings.get("loitering.max_sog_kn")):
            return None

        self.last_flagged[mmsi] = t
        return {
            "lat": c_lat,
            "lon": c_lon,
            "radius_m": round(radius, 1),
            "mean_sog": round(mean_sog, 2),
            "duration_min": round((t - track[0].t).total_seconds() / 60, 1),
            "points": len(track),
            "since": track[0].t.isoformat(),
        }

    def prune(self, now: datetime, max_idle: timedelta = timedelta(hours=6)) -> None:
        """Forget vessels not heard from in max_idle (keeps memory bounded)."""
        for mmsi in [m for m, tr in self.tracks.items() if not tr or now - tr[-1].t > max_idle]:
            del self.tracks[mmsi]
        for mmsi in [m for m, t in self.last_flagged.items() if now - t > max_idle * 4]:
            del self.last_flagged[mmsi]
