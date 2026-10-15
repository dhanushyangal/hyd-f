@tool
extends EditorPlugin

const DockScene = preload("res://addons/hydrilla/hydrilla_dock.tscn")

var dock: Control

func _enter_tree() -> void:
	dock = DockScene.instantiate()
	add_control_to_dock(DOCK_SLOT_RIGHT_UL, dock)

func _exit_tree() -> void:
	if dock:
		remove_control_from_docks(dock)
		dock.queue_free()
		dock = null
