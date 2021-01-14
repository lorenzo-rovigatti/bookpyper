'''
Created on Jan 3, 2021

@author: lorenzo
'''

import cv2
import tempfile
import urllib
import numpy as np
from google.cloud import vision

from app.detect_books_from_shelf import make_crops_from_rect, get_book_lines, find_rectangles
from app.image_title_author_scrape import OCRApi
from app.google_books_api import BooksApi


class Rectangle(object):
    '''
    Coordinates are x0, y0, x1, y1, where 0 is bottom left and 1 is top right
    '''

    def __init__(self, coordinates):
        self.coordinates = [int(x) for x in coordinates]
        
    def serialise(self):
        '''
        Konva uses the coordinates of the top left vertex, width and height
        '''
        return {
            'x' : self.coordinates[0],
            'y' : self.coordinates[1],
            'width' : self.coordinates[2] - self.coordinates[0],
            'height' : self.coordinates[3] - self.coordinates[1]
        }


class BookshelfImage(object):
    '''
    classdocs
    '''

    def __init__(self, url, google_api_json, google_api_key):
        '''
        Constructor
        '''
        self.books_api = BooksApi(google_api_key)
        self.OCR_api = OCRApi(google_api_json)
        self.vision_client = vision.ImageAnnotatorClient.from_service_account_json(google_api_json)
        
        # download the image, convert it to a NumPy array, and then read
        # it into OpenCV format
        resp = urllib.request.urlopen(url)
        image_as_array = np.asarray(bytearray(resp.read()), dtype="uint8")
        self.img = cv2.imdecode(image_as_array, cv2.IMREAD_COLOR)

    def init_from_serialised_rectangles(self, serialised_rectangles):
        coordinate_list = list(map(lambda r: [r['x'], r['y'], r['x'] + r['width'], r['y'] + r['height']], serialised_rectangles))
        self.init_from_coordinate_list(coordinate_list)

    def init_from_coordinate_list(self, coordinate_list):
        self.rectangles = []
        for coordinates in coordinate_list:
            self.rectangles.append(Rectangle(coordinates))
        
    def serialised_rectangles(self):
        return [rect.serialise() for rect in self.rectangles]
    
    def identify_rectangles(self):
        booklines = get_book_lines(self.img, debug=False)
        
        self.init_from_coordinate_list(find_rectangles(booklines))
        
    def do_OCR(self):
        for rectangle in self.rectangles:
            output_file = tempfile.NamedTemporaryFile()
            
            print(rectangle.coordinates)
                
            rect_img = make_crops_from_rect(self.img, rectangle.coordinates)
            _, buffer = cv2.imencode(".jpg", rect_img)
            output_file.write(buffer.tobytes())
    
            rectangle.detected_text = self.OCR_api.detect_text(output_file.name)
        
    def analyse(self):
        self.identify_rectangles()
        self.do_OCR()
    
