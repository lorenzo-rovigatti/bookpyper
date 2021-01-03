'''
Created on Jan 3, 2021

@author: lorenzo
'''

import cv2
import tempfile
from google.cloud import vision

import detect_books_from_shelf
import image_title_author_scrape
import google_books_api


class Rectangle(object):
    def __init__(self, img, coordinates):
        self.coordinates = coordinates
        self.img = detect_books_from_shelf.make_crops_from_rect(img, coordinates)
        
    def do_ocr(self, filename=None):
        if filename is None:
            output_file = tempfile.NamedTemporaryFile()
        else:
            output_file = open(filename, "w+b")
            
        _, buffer = cv2.imencode(".jpg", self.img)
        output_file.write(buffer.tobytes())

        self.detected_text = image_title_author_scrape.detect_text(output_file.name)

class BookshelfImage(object):
    '''
    classdocs
    '''

    def __init__(self, path, google_api_json, google_api_key):
        '''
        Constructor
        '''
        self.books_api = google_books_api.Api(google_api_key)
        self.vision_client = vision.ImageAnnotatorClient.from_service_account_json('google_api_cred.json')
        self.img = cv2.imread(path)
        
    def identify_rectangles(self):
        booklines = detect_books_from_shelf.get_book_lines(self.img, debug=False)
        
        self.rectangles = []
        for coordinates in detect_books_from_shelf.find_rectangles(booklines):
            self.rectangles.append(Rectangle(self.img, coordinates))
         
        print("%d rectangles identified" % len(self.rectangles))
        
    def do_ocr_on_rectangles(self):
        for rectangle in self.rectangles:
            rectangle.do_ocr()
        
    def analyse(self):
        self.identify_rectangles()
        self.do_ocr_on_rectangles()
    
