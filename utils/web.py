import functools
import typing as t
from datetime import timedelta

from flask import g, jsonify
from flask_static_digest import FlaskStaticDigest
from flask_wtf import CSRFProtect, FlaskForm
from utils import timezone
from utils.database import create_client
from utils.sessions import FirestoreSessionInterface
from werkzeug.local import LocalProxy


class ResponseError(Exception):
    status_code = 400

    def __init__(
        self, error_dict: t.Optional[t.Union[t.Mapping[str, t.Sequence[str]], str]] = None
    ):
        if error_dict is None:
            error_dict = {"__all__": ["Bad request"]}
        if isinstance(error_dict, str):
            error_dict = {"__all__": [error_dict]}
        self.error_dict = error_dict
        super(ResponseError, self).__init__()


class ValidationError(ResponseError):
    pass


class UnauthenticatedError(ResponseError):
    status_code = 401


class ValidatingForm(FlaskForm):
    def is_valid(self) -> bool:
        if not self.validate():
            raise ValidationError(error_dict=self.errors)
        return True


def json_response(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return jsonify(f(*args, **kwargs))
        except ResponseError as e:
            response = jsonify(errors=e.error_dict)
            response.status_code = e.status_code
            return response

    return wrapper


def cache_response(ttl: t.Union[int, t.Callable] = 3600):
    def make_decorator(_ttl):
        def decorator(f: t.Callable):
            @functools.wraps(f)
            def wrapper(*args, **kwargs):
                response = f(*args, **kwargs)
                response.cache_control.public = True
                response.cache_control.max_age = _ttl
                response.expires = timezone.now() + timedelta(seconds=_ttl)
                return response

            return wrapper

        return decorator

    if callable(ttl):
        return make_decorator(3600)(ttl)
    return make_decorator(ttl)


def get_db():
    if not hasattr(g, "db_conn"):
        g.db_conn = create_client()
    return g.db_conn


db = LocalProxy(get_db)
csrf = CSRFProtect()
static_digest = FlaskStaticDigest()
session_interface = FirestoreSessionInterface(db)
