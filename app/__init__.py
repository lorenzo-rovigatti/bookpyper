'''
Created on Jan 8, 2021

@author: lorenzo
'''

import flask

def create_app():
    from . import analyse_image
    app = flask.Flask(__name__, static_url_path='/static', static_folder="static")
    
    @app.route("/")
    def index():
        return flask.render_template("index.html")
    
    @app.route("/find", methods=["POST"])
    def find():
        data = flask.request.get_json()
        bookshelf_image = analyse_image.BookshelfImage(data['url'], None, None)
        
        rectangles = [data, ]
        
        return flask.jsonify(rectangles)
    
    return app