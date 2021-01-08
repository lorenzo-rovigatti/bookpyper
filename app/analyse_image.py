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
from app.image_title_author_scrape import detect_text
from app.google_books_api import BooksApi


class Rectangle(object):

    def __init__(self, img, coordinates):
        self.coordinates = coordinates
        self.img = make_crops_from_rect(img, coordinates)
        
    def do_ocr(self, filename=None):
        if filename is None:
            output_file = tempfile.NamedTemporaryFile()
        else:
            output_file = open(filename, "w+b")
            
        _, buffer = cv2.imencode(".jpg", self.img)
        output_file.write(buffer.tobytes())

        self.detected_text = detect_text(output_file.name)


class BookshelfImage(object):
    '''
    classdocs
    '''

    def __init__(self, url, google_api_json, google_api_key):
        '''
        Constructor
        '''
        self.books_api = BooksApi(google_api_key)
        self.vision_client = vision.ImageAnnotatorClient.from_service_account_json(google_api_json)
        
        # download the image, convert it to a NumPy array, and then read
        # it into OpenCV format
        resp = urllib.request.urlopen(url)
        image_as_array = np.asarray(bytearray(resp.read()), dtype="uint8")
        self.img = cv2.imdecode(image_as_array, cv2.IMREAD_COLOR)
        
    def identify_rectangles(self):
        booklines = get_book_lines(self.img, debug=False)
        
        self.rectangles = []
        for coordinates in find_rectangles(booklines):
            self.rectangles.append(Rectangle(self.img, coordinates))
         
        print("%d rectangles identified" % len(self.rectangles))
        
    def do_ocr_on_rectangles(self):
        for rectangle in self.rectangles:
            rectangle.do_ocr()
        
    def analyse(self):
        self.identify_rectangles()
        self.do_ocr_on_rectangles()
    
