from flask import Blueprint

blueprint = Blueprint("eleven7", __name__)


def register_routes(app):
    from .routes import lockin, login, account_details  # noqa

    app.register_blueprint(blueprint, url_prefix="/api")
