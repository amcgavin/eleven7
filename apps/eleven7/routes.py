from flask import session
from utils.web import (
    UnauthenticatedError,
    ValidatingForm,
    ValidationError,
    cache_response,
    json_response,
)
from wtforms import FloatField, StringField, validators

from . import blueprint as app
from .client import Eleven7Client, ProjectZeroThreeClient
from .models import Location, User, fuel_types


class LoginForm(ValidatingForm):
    email = StringField("email", validators=[validators.input_required()])
    password = StringField("password", validators=[validators.input_required()])


class LockinForm(ValidatingForm):
    fuel_type = StringField(
        "fuel_type", validators=[validators.input_required(), validators.any_of(fuel_types.keys())]
    )
    expected_price = FloatField("expected_price", validators=[validators.input_required()])
    lat = FloatField("lat", validators=[validators.input_required()])
    lng = FloatField("lng", validators=[validators.input_required()])


@app.route("/login/", methods=["POST"])
@json_response
def login():
    form = LoginForm()
    form.is_valid()
    client = Eleven7Client()
    try:
        user = client.login(form.email.data, form.password.data)
    except Exception:
        raise ValidationError(dict(email=["Incorrect email or password"]))
    session["user"] = user.asdict()
    return dict(firstname=user.firstname, balance=user.balance)


@app.route("/details/", methods=["GET"])
@json_response
def account_details():
    user = session.get("user", None)
    if not user:
        raise UnauthenticatedError()
    user = User(**user)
    client = Eleven7Client()
    locked_offer = client.current_lock(user)
    return dict(
        firstname=user.firstname, balance=user.balance, locked_offer=locked_offer.serialise()
    )


@app.route("/prices/", methods=["GET"])
@cache_response(ttl=3600)
@json_response
def prices():
    client = ProjectZeroThreeClient()
    return dict(prices=[offer.asdict() for offer in client.get_best_prices()])


@app.route("/lockin/", methods=["POST"])
@json_response
def lockin():
    user = session.get("user", None)
    if not user:
        raise UnauthenticatedError()
    user = User(**user)
    form = LockinForm()
    form.is_valid()
    client = Eleven7Client()
    client.lockin(
        user,
        form.fuel_type.data,
        form.expected_price.data,
        Location(lat=form.lat.data, lng=form.lng.data),
    )


@app.route("/update/", methods=["GET"])
@json_response
def update_stores():
    pass
