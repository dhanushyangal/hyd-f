@tool
extends VBoxContainer

@onready var api_key: LineEdit = $ApiKey
@onready var api_base: LineEdit = $ApiBase
@onready var prompt: LineEdit = $Prompt
@onready var image_url: LineEdit = $ImageUrl
@onready var bridge_url: LineEdit = $BridgeUrl
@onready var status: Label = $Status

func _ready() -> void:
	$GenerateText.pressed.connect(_on_generate_text)
	$GenerateImage.pressed.connect(_on_generate_image)
	$BridgeRow/CheckBridge.pressed.connect(_on_check_bridge)
	$BridgeRow/ImportBridge.pressed.connect(_on_import_bridge)

func _set_status(message: String) -> void:
	status.text = message

func _headers(auth: bool = true) -> PackedStringArray:
	var headers := PackedStringArray(["Accept: application/json", "Content-Type: application/json"])
	if auth:
		headers.append("Authorization: Bearer %s" % api_key.text.strip_edges())
	return headers

func _on_generate_text() -> void:
	var body := JSON.stringify({"prompt": prompt.text.strip_edges()})
	_set_status("Submitting…")
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		_handle_task_response(result, code, body_bytes, http)
	)
	var err := http.request("%s/v1/3d/text-to-3d" % api_base.text.strip_edges().rstrip("/"), _headers(), HTTPClient.METHOD_POST, body)
	if err != OK:
		_set_status("Request failed to start")
		http.queue_free()

func _on_generate_image() -> void:
	var body := JSON.stringify({"image_url": image_url.text.strip_edges()})
	_set_status("Submitting…")
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		_handle_task_response(result, code, body_bytes, http)
	)
	var err := http.request("%s/v1/3d/image-to-3d" % api_base.text.strip_edges().rstrip("/"), _headers(), HTTPClient.METHOD_POST, body)
	if err != OK:
		_set_status("Request failed to start")
		http.queue_free()

func _handle_task_response(result: int, code: int, body_bytes: PackedByteArray, http: HTTPRequest) -> void:
	http.queue_free()
	if result != HTTPRequest.RESULT_SUCCESS or code >= 400:
		_set_status("Error %s: %s" % [code, body_bytes.get_string_from_utf8()])
		return
	var data = JSON.parse_string(body_bytes.get_string_from_utf8())
	if typeof(data) != TYPE_DICTIONARY or not data.has("id"):
		_set_status("No task id")
		return
	_poll_task(str(data["id"]))

func _poll_task(task_id: String) -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		http.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code >= 400:
			_set_status("Poll error %s" % code)
			return
		var data = JSON.parse_string(body_bytes.get_string_from_utf8())
		if typeof(data) != TYPE_DICTIONARY:
			_set_status("Bad poll payload")
			return
		var task_status := str(data.get("status", ""))
		_set_status("%s %s%%" % [task_status, data.get("progress", 0)])
		if task_status == "SUCCEEDED":
			var mesh_url := str((data.get("result") or {}).get("mesh_url", ""))
			if mesh_url != "":
				_download_mesh(mesh_url, task_id)
			return
		if task_status in ["FAILED", "CANCELLED"]:
			_set_status(str(data.get("error", task_status)))
			return
		get_tree().create_timer(2.0).timeout.connect(func(): _poll_task(task_id))
	)
	http.request("%s/v1/3d/tasks/%s" % [api_base.text.strip_edges().rstrip("/"), task_id.uri_encode()], _headers())

func _download_mesh(mesh_url: String, stem: String) -> void:
	_set_status("Downloading…")
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		http.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code >= 400:
			_set_status("Download failed")
			return
		var dir := "res://hydrilla"
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dir))
		var path := "%s/%s.glb" % [dir, stem.validate_filename()]
		var file := FileAccess.open(path, FileAccess.WRITE)
		if file == null:
			_set_status("Could not write %s" % path)
			return
		file.store_buffer(body_bytes)
		file.close()
		EditorInterface.get_resource_filesystem().scan()
		_set_status("Saved %s" % path)
	)
	http.request(mesh_url)

func _on_check_bridge() -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		http.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code >= 400:
			_set_status("Bridge unreachable")
			return
		_set_status("Bridge ok")
		var reg := HTTPRequest.new()
		add_child(reg)
		reg.request_completed.connect(func(_r, _c, _h, _b): reg.queue_free())
		reg.request("%s/register" % bridge_url.text.strip_edges().rstrip("/"), ["Content-Type: application/json"], HTTPClient.METHOD_POST, JSON.stringify({"app": "godot"}))
	)
	http.request("%s/health" % bridge_url.text.strip_edges().rstrip("/"))

func _on_import_bridge() -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(result, code, _headers_resp, body_bytes):
		http.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code >= 400:
			_set_status("Bridge unreachable")
			return
		var data = JSON.parse_string(body_bytes.get_string_from_utf8())
		var items = data.get("items", []) if typeof(data) == TYPE_DICTIONARY else []
		if items.is_empty():
			_set_status("Bridge idle")
			return
		var item = items[0]
		var file_path := str(item.get("file_path", ""))
		if file_path != "" and FileAccess.file_exists(file_path):
			var dest := "res://hydrilla/%s.glb" % str(item.get("id", "bridge")).validate_filename()
			DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://hydrilla"))
			DirAccess.copy_absolute(file_path, ProjectSettings.globalize_path(dest))
			EditorInterface.get_resource_filesystem().scan()
			_set_status("Saved %s" % dest)
		else:
			_download_mesh(str(item.get("mesh_url", "")), str(item.get("id", "bridge")))
		var ack := HTTPRequest.new()
		add_child(ack)
		ack.request_completed.connect(func(_r, _c, _h, _b): ack.queue_free())
		ack.request("%s/ack" % bridge_url.text.strip_edges().rstrip("/"), ["Content-Type: application/json"], HTTPClient.METHOD_POST, JSON.stringify({"id": item.get("id")}))
	)
	http.request("%s/pending?app=godot" % bridge_url.text.strip_edges().rstrip("/"))
