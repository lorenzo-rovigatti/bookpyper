'''
Created on Jan 8, 2021

@author: lorenzo
'''

from app import create_app

app = create_app()
app.run(host="0.0.0.0", port=9000, debug=True)
