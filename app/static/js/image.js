var stage;
var image_layer;
var shape_layer;
var mode;
var rubber_rect;
var image;
var image_url;
var image_ratio;
var selected_rect;
var rect_transformer;

const mode_enum = Object.freeze({
	"nothing": 1,
	"add": 2,
	"remove": 3,
	"drawing": 4,
	"select": 5,
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
		fill: 'rgba(0,255,0,0.5)',
		listening: false
	});
	shape_layer.add(rubber_rect);

	rect_transformer = new Konva.Transformer({
		rotateEnabled: false,
		keepRatio: false,
		enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
	});
	shape_layer.add(rect_transformer);

	stage.add(image_layer);
	stage.add(shape_layer);

	// listen for the file input change event and load the image.
	document.querySelector("#set_image").addEventListener("submit", function(e) {
		e.preventDefault();
		upload_image();
	});

	//document.querySelector("#file_input").addEventListener("change", load_image);

	document.querySelector("#add").addEventListener("click", function(e) {
		update_mode(mode_enum.add);
	});
	document.querySelector("#remove").addEventListener("click", function(e) {
		update_mode(mode_enum.remove);
	});
	document.querySelector("#select").addEventListener("click", function(e) {
		update_mode(mode_enum.select);
	});
	document.querySelector("#find").addEventListener("click", function(e) {
		show_loading();

		var json_body = {
			url: image_url
		};

		fetch("/find", {
			body: JSON.stringify(json_body),
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
		})
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				for (rect_id in data.rectangles) {
					rect = data.rectangles[rect_id];
					// scale the rectangle
					rect.x /= image_ratio;
					rect.y /= image_ratio;
					rect.width /= image_ratio;
					rect.height /= image_ratio;
					add_rectangle(rect.x, rect.y, rect.width, rect.height);
				}

				hide_loading();
			});
	});

	stage.on('mousedown touchstart', function(e) {
		if (mode == mode_enum.add) {
			update_mode(mode_enum.drawing);
			start_drawing({ x: e.evt.layerX, y: e.evt.layerY });
		}
	});

	stage.on('mousemove touchmove', function(e) {
		if (mode == mode_enum.drawing) {
			update_drawing({ x: e.evt.layerX, y: e.evt.layerY });
		}
	});

	// here we create the new rect using the location and dimensions of the drawing rect.
	stage.on('mouseup touchend', function(e) {
		if (mode == mode_enum.drawing) {
			reset_mode();
			rubber_rect.visible(false);
			add_rectangle(rubber_rect.x(), rubber_rect.y(), rubber_rect.width(), rubber_rect.height());
		}
	})

	stage.on('click tap', function(e) {

		// remove all selections
		if (e.target === image) {
			set_as_selected([]);
			shape_layer.draw();
			return;
		}

		// do nothing if the user has not clicked on a rectangle
		if (!e.target.hasName('rect')) {
			return;
		}

		// do we pressed shift or ctrl?
		const meta_pressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
		const is_selected = rect_transformer.nodes().indexOf(e.target) >= 0;

		if (!meta_pressed && !is_selected) {
			// if no key pressed and the node is not selected
			// select just one
			set_as_selected([e.target]);
		} 
		else if (meta_pressed && is_selected) {
			// if we pressed keys and node was selected
			// we need to remove it from selection:
			const nodes = rect_transformer.nodes().slice(); // use slice to have new copy of array
			// remove node from array
			nodes.splice(nodes.indexOf(e.target), 1);
			set_as_selected(nodes);
		} 
		else if (meta_pressed && !is_selected) {
			// add the node into selection
			const nodes = rect_transformer.nodes().concat([e.target]);
			set_as_selected(nodes);
		}
		shape_layer.draw();
	});
}

function set_as_selected(nodes) {
	// we first deselect all the nodes currently selected
	rect_transformer.nodes().forEach(elem => {
		elem.draggable(false);
		elem.fill(null);
	});
	
	// and then add the new ones	
	nodes.forEach(elem => {
		elem.draggable(true);
		elem.fill('rgba(255,0,0,0.5)');
	});
	rect_transformer.nodes(nodes);
}

function add_rectangle(x, y, width, height) {
	var new_rect = new Konva.Rect({
		x: x,
		y: y,
		width: width,
		height: height,
		stroke: 'red',
		strokeWidth: 2,
		strokeScaleEnabled: false,
		name: 'rect'
	})
	new_rect.on("click", function(e) {
		if (mode == mode_enum.remove) {
			reset_mode();
			this.destroy();
			shape_layer.batchDraw();
		}
	});
	shape_layer.add(new_rect);
	shape_layer.draw();
}

function update_mode(new_mode) {
	mode = new_mode;
}

function reset_mode() {
	mode = mode_enum.nothing;
}

function upload_image() {
	form_element = document.querySelector("#file");
	form_data = new FormData();
	form_data.append('file', form_element.files[0]);

	data = new URLSearchParams(form_data);

	fetch("/upload", {
		body: form_data,
		method: "post",
	})
		.then(function(response) {
			return response.json();
		})
		.then(function(data) {
			if (data.ok == false) {
				alert(data.message)
			}
			else {
				var img = new Image();
				img.src = "/static/images/upload/" + data.filename;
				image_url = img.src;

				img.onload = function() {
					var img_width = img.width;
					var img_height = img.height;

					// calculate dimensions to get max 1000px
					var max = 600;
					image_ratio = (img_width > img_height ? (img_width / max) : (img_height / max))

					// now load the Konva image
					image = new Konva.Image({
						image: img,
						x: 0,
						y: 0,
						width: img_width / image_ratio,
						height: img_height / image_ratio,
					});

					image_layer.clear();
					image_layer.add(image);
					image_layer.draw();
				}
			}
		});
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

	shape_layer.batchDraw();
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

// selecting loading div
const loader = document.querySelector("#loading");
// show the loading animation
function show_loading() {
	document.querySelectorAll("button, input").forEach(elem => {
		elem.disabled = true;
	});

	loader.classList.add("display");
	// to stop loading after some time
	setTimeout(() => {
		hide_loading();
	}, 30000);
}

// hide the loading animation
function hide_loading() {
	loader.classList.remove("display");

	document.querySelectorAll("button, input").forEach(elem => {
		elem.disabled = false;
	});
}
