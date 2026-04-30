import os
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg import Connection


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required")
    return database_url


@contextmanager
def get_connection() -> Iterator[Connection]:
    connection = psycopg.connect(get_database_url())
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
