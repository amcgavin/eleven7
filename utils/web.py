import functools

from flask import jsonify, session as _session
from flask_static_digest import FlaskStaticDigest
from flask_wtf import CSRFProtect
from werkzeug.local import LocalProxy


def json_response(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        return jsonify(f(*args, **kwargs))

    return wrapper


def _get_session():
    # todo: encrypt session cookies, not just sign
    return _session


session = LocalProxy(_get_session)

csrf = CSRFProtect()


static_digest = FlaskStaticDigest()
