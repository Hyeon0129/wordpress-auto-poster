from pydantic import BaseModel

class Settings(BaseModel):
    authjwt_secret_key: str = 'jwt-secret-string-wordpress-auto-poster'
    authjwt_token_location: set = {"headers"}
    authjwt_access_token_expires: bool = False

def get_settings():
    return Settings()
