from datetime import datetime, timedelta

from dateutil.rrule import rrulestr


def compute_next_occurrence(rule_str: str, after: datetime) -> datetime | None:
    """Return the first occurrence strictly after `after`, or None if none within 2 years.

    Returns None for invalid RRULE strings (no crash).
    """
    try:
        rule = rrulestr(rule_str, dtstart=after)
        nxt = rule.after(after, inc=False)
        horizon = after + timedelta(days=730)
        return nxt if nxt and nxt <= horizon else None
    except Exception:
        return None
