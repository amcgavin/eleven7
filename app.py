import importlib
import os
from logging import getLogger

from flask import Flask
from utils.web import csrf, session_interface, static_digest

log = getLogger(__name__)


def load_from_env():
    from utils.sm_helper import access_secrets

    secrets = access_secrets(["SECRET_KEY"])
    os.environ.update(secrets)


def auto_configure_routes(app):
    apps_dir = os.path.join(os.path.dirname(__file__), "apps")
    for path in os.listdir(apps_dir):
        if os.path.isdir(os.path.join(apps_dir, path)):
            try:
                module = importlib.import_module(f"apps.{path}")
                module.register_routes(app)
            except (ImportError, AttributeError):
                pass


def create_app():
    load_from_env()
    app = Flask(
        __name__,
        static_folder="static/dist",
        static_url_path="/static",
        template_folder="templates",
    )
    app.secret_key = os.environ.get("SECRET_KEY", "DEFAULT").encode("utf-8")
    if app.secret_key == b"DEFAULT":
        log.warning("secret key not set!")
    app.session_interface = session_interface
    static_digest.init_app(app)
    csrf.init_app(app)
    auto_configure_routes(app)
    return app


def run_development_server():
    app = create_app()
    app.run("0.0.0.0", port=8000, debug=True)


if __name__ == "__main__":
    run_development_server()
