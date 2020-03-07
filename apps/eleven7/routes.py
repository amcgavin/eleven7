from utils.web import ValidatingForm, json_response
from wtforms import StringField, validators

from . import blueprint as app


class LoginForm(ValidatingForm):
    email = StringField("email", validators=[validators.input_required()])
    password = StringField("password", validators=[validators.input_required()])


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
