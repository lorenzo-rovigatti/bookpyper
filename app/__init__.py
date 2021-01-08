'''
Created on Jan 8, 2021

@author: lorenzo
'''

import os
import flask

def create_app():
    from . import analyse_image
    app = flask.Flask(__name__, static_url_path='/static', static_folder="static", instance_relative_config=True)

    app.config.from_object("app.default_settings.Config")    
    app.config.from_pyfile("config.py", silent=True)
    
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    @app.route("/")
    def index():
        return flask.render_template("index.html")
    
    @app.route("/find", methods=["POST"])
    def find():
        data = flask.request.get_json()
        bookshelf_image = analyse_image.BookshelfImage(data['url'], os.path.join(app.instance_path, app.config["GOOGLE_API_JSON_FILE"]), app.config["GOOGLE_API_KEY"])
        
        rectangles = [data, ]
        
        return flask.jsonify(rectangles)
    
    return app