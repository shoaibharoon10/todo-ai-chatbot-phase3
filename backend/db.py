import logging
import os
from collections.abc import Generator
from urllib.parse import parse_qs, urlparse, urlencode, urlunparse

from dotenv import load_dotenv
from sqlmodel import Session, create_engine

load_dotenv()

logger = logging.getLogger(__name__)

# SSL parameters that psycopg2 expects as connect_args, not URL query params.
# Passing them in the URL string can trigger deprecation warnings in newer
# versions of psycopg2.
_SSL_CONNECT_ARGS = {"sslmode", "sslcert", "sslkey", "sslrootcert", "channel_binding"}


def _parse_database_url(database_url: str) -> tuple[str, dict]:
    """Split DATABASE_URL into a clean URL + psycopg2 connect_args dict.

    SSL-related query parameters are extracted from the URL and returned
    separately so they can be passed via SQLAlchemy's connect_args. This
    avoids psycopg2 SSL deprecation warnings that arise when those params
    appear in the connection string.
    """
    parsed = urlparse(database_url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    connect_args: dict[str, str] = {}

    for key in list(params.keys()):
        if key in _SSL_CONNECT_ARGS:
            # parse_qs returns lists; take first value
            connect_args[key] = params.pop(key)[0]

    # Default to 'require' if sslmode was not present at all
    if "sslmode" not in connect_args:
        connect_args["sslmode"] = "require"

    clean_query = urlencode(params, doseq=True)
    clean_url = urlunparse(parsed._replace(query=clean_query))

    logger.debug("DB connect_args: %s", {k: v for k, v in connect_args.items()})
    return clean_url, connect_args


_database_url = os.getenv("DATABASE_URL", "")
_clean_url, _connect_args = _parse_database_url(_database_url)

engine = create_engine(
    _clean_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
