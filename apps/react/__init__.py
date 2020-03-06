from flask import Blueprint

blueprint = Blueprint("react", __name__)


def register_routes(app):
    from .routes import react_handler  # noqa

    app.register_blueprint(blueprint)
