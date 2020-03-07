from datetime import timedelta

from google.cloud.firestore_v1 import Client
from utils import timezone


def create_client():
    return Client()


DEFAULT_TIMEOUT = 60 * 60  # 1 hour


class db_cached_result(object):
    """
    Cache the result of a method in the db
    """

    def __call__(self, getter, **kwargs):
        self.__doc__ = getter.__doc__
        self.__name__ = getter.__name__
        self.__module__ = getter.__module__
        self.name = getter.__name__
        self.getter = getter
        self.propname = "__cache__" + getter.__name__
        return self

    def __init__(self, getter=None, timeout=None, key=None):
        if getter is not None:
            self.__doc__ = getter.__doc__
            self.__name__ = getter.__name__
            self.__module__ = getter.__module__
            self.getter = getter
            self.propname = "__cache__" + getter.__name__
        if timeout is None:
            self.timeout = DEFAULT_TIMEOUT
        elif timeout is False:
            self.timeout = None
        else:
            self.timeout = timeout
        self.key = key

    def _make_key(self, instance):
        """Build the cache key to use"""
        if self.key is not None:
            return self.key

        parts = [instance.__class__.__module__, instance.__class__.__name__, self.__name__]
        return ":".join(parts)

    def __get__(self, instance, owner):
        """
            Get the value, or generate if needed
            """
        if instance is None:
            return self
        try:
            return getattr(instance, self.propname)
        except AttributeError:
            pass

        key = self._make_key(instance)

        client = create_client()
        document = client.collection("cache").document(key).get()
        if not document.exists:
            value = None
        else:
            data = document.to_dict()
            if data["expires"] <= timezone.now():
                value = None
            else:
                value = data["value"]

        if value is None:
            value = self.getter(instance)
            self.validate_and_set(document.reference, value)
        self.set_value(instance, value)
        return value

    def __set__(self, instance, value):
        self.set_value(instance, value)
        key = self._make_key(instance)
        self.validate_and_set(create_client().collection("cache").document(key), value)

    def __delete__(self, instance):
        """
            Delete this value.
            Will not raise an exception.
            """
        key = self._make_key(instance)
        client = create_client()
        client.collection("cache").document(key).delete()
        try:
            delattr(instance, self.propname)
        except AttributeError:
            pass

    def validate_and_set(self, document, value):
        document.set(dict(value=value, expires=timezone.now() + timedelta(seconds=self.timeout)))

    def set_value(self, instance, value):
        setattr(instance, self.propname, value)
