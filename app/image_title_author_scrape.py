# google_api_image_scrape.py
import csv
import io

from google.cloud import vision

class OCRApi(object):
    
    def __init__(self, google_api_json):
        self.client = vision.ImageAnnotatorClient.from_service_account_json(google_api_json)

    def detect_text(self, path):
        """Detects text in the file."""
    
        print('calling api to recognize text from image')
    
        with io.open(path, 'rb') as image_file:
            content = image_file.read()
    
        image = vision.Image(content=content)
    
        response = self.client.text_detection(image=image)
        texts = response.text_annotations
        if len(texts) > 0:
            text = response.text_annotations[0].description
        else:
            text = None
    
        return text
