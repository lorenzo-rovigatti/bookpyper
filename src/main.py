'''
Created on Jan 3, 2021

@author: lorenzo
'''

import flask

app = flask.Flask(__name__, static_url_path='/static', static_folder="static")

@app.route("/")
def index():
    return flask.render_template("index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9000)
    