import pytest
from pathlib import Path
from core.plugins.manager import PluginManager
from core.plugins.whatsapp import WhatsAppIngestor

def test_plugin_discovery():
    manager = PluginManager()
    plugins = manager.list_plugins()
    assert "whatsapp" in plugins
    
    wa_plugin = manager.get_plugin("whatsapp")
    assert isinstance(wa_plugin, WhatsAppIngestor)
    assert wa_plugin.plugin_id == "whatsapp"

def test_whatsapp_parsing(tmp_path):
    # Mock WhatsApp export line
    mock_file = tmp_path / "wa_export.txt"
    mock_file.write_text("[12.04.2024, 14:30:15] Emre: Hello world\n")
    
    plugin = WhatsAppIngestor()
    raw_data = plugin.ingest(mock_file)
    
    assert len(raw_data) == 1
    assert raw_data[0]["sender"] == "Emre"
    assert raw_data[0]["content"] == "Hello world"
    
    memories = plugin.transform(raw_data)
    assert len(memories) == 1
    assert memories[0].content == "Hello world"
    assert memories[0].sender_id == "Emre"

def test_plugin_discovery_singleton():
    manager1 = PluginManager()
    manager2 = PluginManager()
    assert manager1.list_plugins() == manager2.list_plugins()
