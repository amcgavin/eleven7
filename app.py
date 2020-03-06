import importlib
import os

from flask import Flask
from utils.web import csrf, static_digest


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
    app = Flask(
        __name__,
        static_folder="static/dist",
        static_url_path="/static",
        template_folder="templates",
    )
    # todo: secret key from something else
    app.secret_key = b"@\x84\xae\x87\x0e\xd7\xdc\x0e4&\xee\xde\x18\xa9^\xe2"
    static_digest.init_app(app)
    csrf.init_app(app)
    auto_configure_routes(app)
    return app


def run_development_server():
    app = create_app()
    app.run("0.0.0.0", port=8000, debug=True)


if __name__ == "__main__":
    run_development_server()
