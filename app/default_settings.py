import os

class Config:
    SECRET_KEY = os.urandom(24)
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
