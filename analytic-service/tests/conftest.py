from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import pytest

from app.modules.detection.settings import DEFAULTS


class FakeSettings:
    """Stands in for SettingsStore: get() plus admin p99 overrides."""

    def __init__(self, overrides: dict[int, float] | None = None, **values: Any) -> None:
        self.values = dict(DEFAULTS)
        for key, value in values.items():
            self.values[key.replace("__", ".")] = value
        self.overrides = overrides or {}

    def get(self, key: str) -> Any:
        return self.values[key]


@pytest.fixture
def settings() -> FakeSettings:
    return FakeSettings()


@pytest.fixture(scope="session")
def fleet() -> pd.DataFrame:
    """Synthetic positions: cargo around 12 kn, fishing around 6 kn, a few tugs."""
    rng = np.random.default_rng(7)

    def vessels(n: int, ship_type: int, sog_mean: float, sog_sd: float, width: float, length: float) -> pd.DataFrame:
        return pd.DataFrame(
            {
                "mmsi": rng.integers(200_000_000, 799_999_999, n),
                "sog": np.clip(rng.normal(sog_mean, sog_sd, n), 0, None),
                "width": rng.normal(width, width * 0.1, n),
                "length": rng.normal(length, length * 0.1, n),
                "ship_type": ship_type,
            }
        )

    return pd.concat(
        [
            vessels(3000, 70, 12, 2, 30, 200),
            vessels(1500, 30, 6, 1.5, 6, 25),
            vessels(50, 52, 8, 2, 10, 30),
        ],
        ignore_index=True,
    )
