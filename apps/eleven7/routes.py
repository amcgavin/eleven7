from utils.web import json_response

from . import blueprint as app


@app.route("/login/", methods=["POST"])
@json_response
def login():
    pass


@app.route("/details/", methods=["GET"])
@json_response
def account_details():
    pass


@app.route("/lockin/", methods=["POST"])
@json_response
def lockin():
    pass


@app.route("/update/", methods=["GET"])
@json_response
def update_stores():
    pass
