import hmac
import os
import uuid

from Cryptodome.Cipher import AES
from Cryptodome.Util.Padding import pad, unpad
from flask.json.tag import TaggedJSONSerializer
from flask.sessions import SessionInterface, SessionMixin
from itsdangerous import BadSignature, Signer
from werkzeug.datastructures import CallbackDict


class AccessCallbackDict(CallbackDict):
    def __init__(self, initial=None, on_update=None, on_access=None):
        super(AccessCallbackDict, self).__init__(initial, on_update)
        self.on_access = on_access

    def __getitem__(self, item):
        self._accessed()
        return super(AccessCallbackDict, self).__getitem__(item)

    def get(self, k, default=None):
        self._accessed()
        return super(AccessCallbackDict, self).get(k, default)

    def _accessed(self):
        if self.on_access:
            self.on_access(self)


class FirestoreSession(AccessCallbackDict, SessionMixin):
    def __init__(self, data=None, sid=None, salt=None):
        if salt is None:
            salt = os.urandom(8).hex()

        def on_update(s):
            s.modified = True

        def on_access(s):
            s.accessed = True

        AccessCallbackDict.__init__(self, data, on_update, on_access)
        self.sid = sid
        self.salt = salt
        self.permanent = True
        self.modified = False


class FirestoreSessionInterface(SessionInterface):
    serializer = TaggedJSONSerializer()
    session_class = FirestoreSession

    def __init__(self, db):
        self.db = db

    def _get_doc(self, sid):
        return self.db.collection("sessions").document(sid)

    def _get_signer(self, app):
        return Signer(app.secret_key, salt="session-id", key_derivation="hmac")

    def _get_crypt(self, app):
        return AES.new(app.secret_key[:16], mode=AES.MODE_ECB)

    def _decrypt(self, app, encrypted: str, verify_salt: str) -> dict:
        crypt = self._get_crypt(app)
        salted = unpad(crypt.decrypt(bytes.fromhex(encrypted)), AES.block_size).decode("utf-8")
        serialised, salt = salted.split(":", 1)
        if not hmac.compare_digest(salt, verify_salt):
            raise ValueError()
        return self.serializer.loads(serialised)

    def _encrypt(self, app, data: dict, salt: str):
        serialised = self.serializer.dumps(data)
        salted = f"{salt}:{serialised}".encode("utf-8")
        crypt = self._get_crypt(app)
        return crypt.encrypt(pad(salted, AES.block_size)).hex()

    def save_session(self, app, session: FirestoreSession, response):
        session_id = self._get_signer(app).sign(session.sid.encode("utf-8"))
        if session.modified:
            self._get_doc(session.sid).set(
                dict(encrypted=self._encrypt(app, dict(session), session.salt), salt=session.salt)
            )
        if session.accessed:
            response.set_cookie(
                app.session_cookie_name,
                session_id,
                expires=self.get_expiration_time(app, session),
                httponly=self.get_cookie_httponly(app),
                domain=self.get_cookie_domain(app),
                path=self.get_cookie_path(app),
                secure=self.get_cookie_secure(app),
            )

    def open_session(self, app, request):
        sid = request.cookies.get(app.session_cookie_name)
        if not sid:
            return self.session_class(sid=uuid.uuid4().hex)
        try:
            sid = self._get_signer(app).unsign(sid).decode("utf-8")
        except BadSignature:
            return self.session_class(sid=uuid.uuid4().hex)
        doc = self._get_doc(sid).get()
        if not doc.exists:
            return self.session_class(sid=uuid.uuid4().hex)
        data = doc.to_dict()
        salt = data["salt"]
        return self.session_class(
            data=self._decrypt(app, data["encrypted"], salt), sid=sid, salt=salt
        )
