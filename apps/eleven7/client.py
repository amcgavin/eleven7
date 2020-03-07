import base64
import hashlib
import hmac
import json
import time
import typing as t
import uuid
from urllib.parse import urljoin

import requests
from Cryptodome.Cipher import DES
from Cryptodome.Util.Padding import pad
from utils.database import db_cached_result

from .models import AnonymousUser, BaseUser, FuelOffer, Location, User, fuel_types

AccountContactDetails = t.TypedDict("AccountContactDetails", {"Mobile": str})
AccountPersonalDetailsName = t.TypedDict(
    "AccountPersonalDetailsName", {"Surname": str, "Firstname": str}
)
AccountPersonalDetails = t.TypedDict(
    "AccountPersonalDetails", {"Name": AccountPersonalDetailsName, "Dob": int}
)
AccountDetails = t.TypedDict(
    "AccountDetails",
    {
        "ContactDetails": AccountContactDetails,
        "PersonalDetails": AccountPersonalDetails,
        "CreatedAt": str,
        "Email": str,
        "OptInForPromotions": bool,
        "OptInForSms": bool,
        "MobileVerified": bool,
    },
)


def get_key():
    a = [103, 180, 267, 204, 390, 504, 497, 784, 1035, 520, 1155, 648, 988, 1456, 1785]
    b = [50, 114, 327, 276, 525, 522, 371, 904, 1017, 810, 858, 852, 1274, 1148, 915]
    c = [74, 220, 249, 416, 430, 726, 840, 568, 1017, 700, 1155, 912, 1118, 1372]

    length = len(a) + len(b) + len(c)
    key = ""

    for i in range(length):
        if i % 3 == 0:
            key += chr(int((a[int(i / 3)] / ((i / 3) + 1))))
        if i % 3 == 1:
            key += chr(int((b[int((i - 1) / 3)] / (((i - 1) / 3) + 1))))
        if i % 3 == 2:
            key += chr(int((c[int((i - 1) / 3)] / (((i - 2) / 3) + 1))))
    return key


# Encryption key used for the TSSA
encryption_key = bytes(base64.b64decode(get_key()))


class Eleven7Client(object):

    BASE_URL = "https://711-goodcall.api.tigerspike.com/api/v1/"
    DEVICE_NAME = "SM-G973FZKAXSA"
    OS_VERSION = "Android 9.0.0"
    APP_VERSION = "1.8.0.2027"

    @classmethod
    def des_encrypt_string(cls, device_id):
        key = "co.vmob.sdk.android.encrypt.key".encode()[:8]
        encryption_prefix = "co.vmob.android.sdk."
        cipher = DES.new(key, DES.MODE_ECB)
        encrypted_message = cipher.encrypt(
            pad(f"{encryption_prefix}{device_id}".encode("utf-8"), block_size=DES.block_size)
        )

        return base64.b64encode(encrypted_message).replace(b"/", b"_").decode() + "_"

    @classmethod
    def get_headers(cls, tssa: str, user: BaseUser) -> t.Dict[str, str]:
        headers = {
            "User-Agent": "Apache-HttpClient/UNAVAILABLE (java 1.4)",
            "Authorization": tssa,
            "X-OsVersion": cls.OS_VERSION,
            "X-OsName": "Android",
            "X-DeviceID": user.device_id,
            "X-VmobID": cls.des_encrypt_string(user.device_id),
            "X-AppVersion": cls.APP_VERSION,
            "Content-Type": "application/json; charset=utf-8",
        }
        if isinstance(user, User):
            headers["X-DeviceSecret"] = user.device_secret
        return headers

    def make_request(
        self,
        url: str,
        method: str,
        user: BaseUser,
        payload: t.Optional[t.Union[str, t.Mapping[t.Any, t.Any]]] = None,
    ) -> requests.Response:

        tssa_url = url.replace("https", "http").lower()
        timestamp = int(time.time())
        uid = str(uuid.uuid4())
        str3 = f"yvktroj08t9jltr3ze0isf7r4wygb39s{method.upper()}{tssa_url}{timestamp}{uid}"
        if payload is not None:
            payload = json.dumps(payload, indent=None, separators=(",", ":"))
            encoded_payload = base64.b64encode(
                hashlib.md5(payload.encode("utf-8")).digest()
            ).decode("utf-8")
            str3 = f"{str3}{encoded_payload}"
        signature = base64.b64encode(
            hmac.new(encryption_key, str3.encode("utf-8"), digestmod=hashlib.sha256).digest()
        )
        tssa = (
            f"tssa yvktroj08t9jltr3ze0isf7r4wygb39s:{signature.decode('utf-8')}:{uid}:{timestamp}"
        )
        if isinstance(user, User):
            tssa = f"{tssa}:{user.access_token}"

        return requests.request(method, url, data=payload, headers=self.get_headers(tssa, user))

    def login(self, email: str, password: str) -> User:
        user = AnonymousUser()
        response = self.make_request(
            urljoin(self.BASE_URL, "account/login"),
            "POST",
            user,
            payload={
                "Email": email,
                "Password": password,
                "DeviceName": self.DEVICE_NAME,
                "DeviceOsNameVersion": self.OS_VERSION,
            },
        )
        response.raise_for_status()
        data = response.json()
        return user.login(
            firstname=data["FirstName"],
            account_id=data["AccountId"],
            access_token=response.headers["X-AccessToken"],
            device_secret=data["DeviceSecretToken"],
            balance=data["DigitalCard"]["Balance"],
        )

    def lockin(self, user: User, fuel_type: str, expected_price: float, location: Location) -> bool:
        session_response = self.make_request(
            urljoin(self.BASE_URL, "FuelLock/StartSession"),
            "POST",
            user,
            payload={
                "LastStoreUpdateTimestamp": int(time.time()),
                "Latitude": str(location.fuzzy_latitude),
                "Longitude": str(location.fuzzy_longitude),
            },
        )

        session_response.raise_for_status()
        ean = fuel_types[fuel_type]
        data = session_response.json()
        for store in data["CheapestFuelTypeStores"]:
            for offer in store["FuelPrices"]:
                if offer["Ean"] == ean:
                    if offer["Price"] != expected_price:
                        raise ValueError("Prices have changed")
                    break
        litres = int(data["Balance"] * 100 // expected_price)

        confirm_response = self.make_request(
            urljoin(self.BASE_URL, "FuelLock/Confirm"),
            "POST",
            user,
            payload={
                "AccountId": user.account_id,
                "FuelType": str(ean),
                "NumberOfLitres": str(litres),
            },
        )
        confirm_response.raise_for_status()
        return True

    def logout(self, user: User):
        response = self.make_request(
            urljoin(self.BASE_URL, "account/logout"), "POST", user, payload=""
        )
        response.raise_for_status()

    def account_details(self, user: User) -> AccountDetails:
        response = self.make_request(urljoin(self.BASE_URL, "account/GetAccountInfo"), "GET", user)
        response.raise_for_status()
        return response.json()


class ProjectZeroThreeClient(object):
    user_agent = "python/eleven7"

    @db_cached_result
    def prices(self) -> t.Dict[str, t.List[dict]]:
        response = requests.get(
            "https://projectzerothree.info/api.php?format=json",
            headers={"User-Agent": self.user_agent},
        )
        response.raise_for_status()
        data = response.json()
        return {region["region"]: region["prices"] for region in data["regions"]}

    def get_prices(self) -> t.Dict[str, t.List[FuelOffer]]:
        return {
            region: [FuelOffer(**offer) for offer in prices]
            for region, prices in self.prices.items()
        }

    def get_best_prices(self) -> t.Sequence[FuelOffer]:
        prices = self.get_prices()
        return prices["All"]
