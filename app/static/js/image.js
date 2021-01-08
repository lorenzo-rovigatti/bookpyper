var stage;
var image_layer;
var shape_layer;
var mode;
var rubber_rect;

const mode_enum = Object.freeze({
	"nothing": 1,
	"add": 2,
	"remove": 3,
	"drawing": 4
});

window.onload = function(event) {
	reset_mode();

	var width = window.innerWidth;
	var height = window.innerHeight;

	stage = new Konva.Stage({
		container: 'container',
		width: width,
		height: height,
	});

	image_layer = new Konva.Layer();
	shape_layer = new Konva.Layer();

	rubber_rect = new Konva.Rect({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		stroke: 'red',
		strokeWidth: 2,
		listening: false
	});
	shape_layer.add(rubber_rect);

	stage.add(image_layer);
	stage.add(shape_layer);

	// listen for the file input change event and load the image.
	document.querySelector("#file_input").addEventListener("change", load_image);
	load_image();

	document.querySelector("#add").addEventListener("click", function(e) {
		mode = mode_enum.add;
	});
	document.querySelector("#remove").addEventListener("click", function(e) {
		mode = mode_enum.remove;
	});
	document.querySelector("#find").addEventListener("click", function(e) {
		var URL = window.webkitURL || window.URL;
		var url = URL.createObjectURL(document.querySelector("#file_input").files[0]);
		var json_body = {
			url: url
		};
		
		fetch("/find", {
			body: JSON.stringify(json_body),
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
		});
	});

	stage.on('mousedown', function(e) {
		if (mode == mode_enum.add) {
			mode = mode_enum.drawing;
			start_drawing({ x: e.evt.layerX, y: e.evt.layerY });
		}
	});

	stage.on('mousemove', function(e) {
		if (mode == mode_enum.drawing) {
			update_drawing({ x: e.evt.layerX, y: e.evt.layerY });
		}
	});

	// here we create the new rect using the location and dimensions of the drawing rect.
	stage.on('mouseup', function(e) {
		if (mode == mode_enum.drawing) {
			reset_mode();
			rubber_rect.visible(false);
			var new_rect = new Konva.Rect({
				x: rubber_rect.x(),
				y: rubber_rect.y(),
				width: rubber_rect.width(),
				height: rubber_rect.height(),
				stroke: 'black',
				strokeWidth: 2,
			})
			new_rect.on("click", function(e) {
				if (mode == mode_enum.remove) {
					reset_mode();
					this.destroy();
					shape_layer.draw();
				}
			});
			shape_layer.add(new_rect);
			shape_layer.draw();
		}
	})
}

function reset_mode() {
	mode = mode_enum.nothing;
}

function load_image() {
	var URL = window.webkitURL || window.URL;
	var url = URL.createObjectURL(document.querySelector("#file_input").files[0]);
	var img = new Image();
	img.src = url;

	img.onload = function() {

		var img_width = img.width;
		var img_height = img.height;

		// calculate dimensions to get max 1000px
		var max = 600;
		var ratio = (img_width > img_height ? (img_width / max) : (img_height / max))

		// now load the Konva image
		var my_img = new Konva.Image({
			image: img,
			x: 0,
			y: 0,
			width: img_width / ratio,
			height: img_height / ratio,
		});

		image_layer.clear();
		image_layer.add(my_img);
		image_layer.draw();
	}
}

var initial_pos;
var current_pos;
function start_drawing(pos) {
	initial_pos = { x: pos.x, y: pos.y };
	current_pos = { x: pos.x, y: pos.y };
}

function update_drawing(pos) {
	current_pos = { x: pos.x, y: pos.y };
	var rect_pos = reverse(initial_pos, current_pos);
	rubber_rect.x(rect_pos.x1);
	rubber_rect.y(rect_pos.y1);
	rubber_rect.width(rect_pos.x2 - rect_pos.x1);
	rubber_rect.height(rect_pos.y2 - rect_pos.y1);
	rubber_rect.visible(true);

	shape_layer.draw(); // redraw any changes.
}


// reverse co-ords if user drags left / up
function reverse(r1, r2) {
	var r1x = r1.x, r1y = r1.y, r2x = r2.x, r2y = r2.y, d;
	if (r1x > r2x) {
		d = Math.abs(r1x - r2x);
		r1x = r2x; r2x = r1x + d;
	}
	if (r1y > r2y) {
		d = Math.abs(r1y - r2y);
		r1y = r2y; r2y = r1y + d;
	}
	return ({ x1: r1x, y1: r1y, x2: r2x, y2: r2y }); // return the corrected rect.     
}
