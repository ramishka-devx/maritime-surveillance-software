"""Vessel-type groups for per-type speed thresholds (SRS REQ-F-040).

AIS ship type codes: the mixed 30-39 and 50-59 ranges keep their exact code (a fishing boat
and a sailing yacht move very differently), the other ranges group by tens, and anything
unknown maps to 0. Matches the rows meta-service's DetectionPipeline migration seeds in
speed_thresholds.
"""

from __future__ import annotations

from typing import Any

LABELS: dict[int, str] = {
    0: "Unknown / unclassified",
    20: "Wing in ground",
    30: "Fishing",
    31: "Towing",
    32: "Towing (large)",
    33: "Dredging / underwater ops",
    34: "Diving ops",
    35: "Military ops",
    36: "Sailing",
    37: "Pleasure craft",
    40: "High-speed craft",
    50: "Pilot vessel",
    51: "Search and rescue",
    52: "Tug",
    53: "Port tender",
    54: "Anti-pollution",
    55: "Law enforcement",
    58: "Medical transport",
    60: "Passenger",
    70: "Cargo",
    80: "Tanker",
    90: "Other",
}


def type_group(ship_type: Any) -> int:
    try:
        code = int(ship_type)
    except (TypeError, ValueError):
        return 0
    if 30 <= code <= 39 or 50 <= code <= 59:
        return code if code in LABELS else 0
    group = (code // 10) * 10
    return group if group in LABELS else 0
