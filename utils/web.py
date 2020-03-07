import functools

from flask import g, jsonify
from flask_static_digest import FlaskStaticDigest
from flask_wtf import CSRFProtect, FlaskForm
from utils.database import create_client
from utils.sessions import FirestoreSessionInterface
from werkzeug.local import LocalProxy


class ValidationError(Exception):
    def __init__(self, error_dict=None):
        self.error_dict = error_dict
        super(ValidationError, self).__init__()


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
        except ValidationError as e:
            return jsonify(errors=e.error_dict), 400

    return wrapper


def get_db():
    if not hasattr(g, "db_conn"):
        g.db_conn = create_client()
    return g.db_conn


db = LocalProxy(get_db)
csrf = CSRFProtect()
static_digest = FlaskStaticDigest()
session_interface = FirestoreSessionInterface(db)
