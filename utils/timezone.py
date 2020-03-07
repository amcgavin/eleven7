from datetime import datetime

import pytz

melbourne = pytz.timezone("Australia/Melbourne")


def now():
    return datetime.utcnow().replace(tzinfo=pytz.utc)


def safe_aware(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=pytz.utc)
    return dt


def localise(dt: datetime) -> datetime:
    return safe_aware(dt).astimezone(melbourne)
