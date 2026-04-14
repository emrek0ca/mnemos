import importlib
import pkgutil
from pathlib import Path
from typing import Dict, Type, List
from loguru import logger

from core.plugins.base import BaseIngestor

class PluginManager:
    """
    Orchestrates the discovery and loading of memory plugins.
    Silicon Valley Grade: Dynamic module loading for zero-touch extensibility.
    """

    def __init__(self, plugin_dir: str = "core/plugins"):
        self.plugin_dir = plugin_dir
        self.plugins: Dict[str, BaseIngestor] = {}
        self.discover_plugins()

    def discover_plugins(self):
        """Dynamically imports and registers plugins from the plugins directory."""
        package_path = self.plugin_dir.replace("/", ".")
        
        # Ensure we're relative to the core path
        base_path = Path(__file__).parent.parent / "plugins"
        
        if not base_path.exists():
            return

        for _, name, is_pkg in pkgutil.iter_modules([str(base_path)]):
            if is_pkg or name == "base":
                continue
                
            try:
                module = importlib.import_module(f"core.plugins.{name}")
                # Look for classes that inherit from BaseIngestor
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (isinstance(attr, type) and 
                        issubclass(attr, BaseIngestor) and 
                        attr is not BaseIngestor):
                        
                        plugin_instance = attr()
                        self.plugins[plugin_instance.plugin_id] = plugin_instance
                        logger.info(f"Plugin discovered and registered: {plugin_instance.source_label}")
            except Exception as e:
                logger.error(f"Failed to load plugin {name}: {e}")

    def get_plugin(self, plugin_id: str) -> BaseIngestor:
        return self.plugins.get(plugin_id)

    def list_plugins(self) -> List[str]:
        return list(self.plugins.keys())
