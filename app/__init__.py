'''
Created on Jan 8, 2021

@author: lorenzo
'''

import os
from flask import Flask, request, flash, redirect, render_template, url_for, jsonify, send_from_directory
from werkzeug.utils import secure_filename

def create_app():
    from . import analyse_image
    app = Flask(__name__, static_url_path='/static', static_folder="static", instance_relative_config=True)

    app.config.from_object("app.default_settings.Config")    
    app.config.from_pyfile("config.py")
    
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    @app.route("/")
    def index():
        return render_template("index.html")
    
    @app.route("/find", methods=["post"])
    def find():
        data = request.get_json()
        bookshelf_image = analyse_image.BookshelfImage(data['url'], os.path.join(app.instance_path, app.config["GOOGLE_API_JSON_FILE"]), app.config["GOOGLE_API_KEY"])
        
        rectangles = [data, ]
        
        return jsonify(rectangles)
    
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config["ALLOWED_IMAGE_EXTENSIONS"]
    
    @app.route("/upload", methods=["post"])
    def upload():
        if 'file' not in request.files:
            return jsonify(ok=False, message='No file part'), 500
        file = request.files['file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify(ok=False, message='No selected file'), 500
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return jsonify(ok=True, url=filename)
            return jsonify(ok=True, url=url_for('uploaded_image', filename=filename))
        
    @app.route('/uploads/<filename>')
    def uploaded_image(filename):
        print(url_for(app.config['UPLOAD_FOLDER'], filename=filename), "daje")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    return app