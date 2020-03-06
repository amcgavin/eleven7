from flask import render_template
from utils.web import csrf

from . import blueprint


@blueprint.route("/", methods=["GET"])
@csrf.exempt
def react_handler(*args, **kwargs):
    return render_template("index.html")
