import random
from dataclasses import asdict, dataclass, field


def generate_device_id() -> str:
    return "".join(random.choice("0123456789abcdef") for i in range(15))


class AsDictMixin(object):
    def asdict(self):
        return asdict(self)


@dataclass(frozen=True)
class BaseUser(AsDictMixin):
    device_id: str = field(default_factory=generate_device_id)


@dataclass(frozen=True)
class _User:
    firstname: str
    account_id: str
    access_token: str
    device_secret: str
    balance: str


@dataclass(frozen=True)
class User(BaseUser, _User):
    pass


class AnonymousUser(BaseUser):
    def login(self, firstname, account_id, access_token, device_secret, balance) -> User:
        return User(
            firstname=firstname,
            device_id=self.device_id,
            account_id=account_id,
            access_token=access_token,
            device_secret=device_secret,
            balance=balance,
        )


fuel_types = {"E10": 57, "U91": 52, "U95": 55, "U98": 56, "Diesel": 53, "LPG": 54}


@dataclass(frozen=True)
class FuelOffer(AsDictMixin):
    name: str
    state: str
    suburb: str
    postcode: str
    lat: float
    lng: float
    type: str
    price: float


@dataclass(frozen=True)
class Location(AsDictMixin):
    lat: float
    lng: float

    @property
    def fuzzy_latitude(self) -> float:
        return self.lat + (random.uniform(0.01, 0.000001) * random.choice([-1, 1]))

    @property
    def fuzzy_longitude(self) -> float:
        return self.lng + (random.uniform(0.01, 0.000001) * random.choice([-1, 1]))
