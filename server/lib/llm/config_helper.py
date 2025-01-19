import json
from typing import Optional


class JsonConfigHelper:
    def __init__(self, config: Optional[str] = None):
        if config:
            self.config = json.loads(config)
        else:
            self.config = {}

    def get_data(self, key: str):
        if key not in self.config:
            return None
        return self.config[key]

    def get_string_data(self, key: str, default_value=None) -> Optional[str]:
        data = self.get_data(key)
        if not data:
            return default_value
        return str(self.config[key])

    def get_integer_data(self, key: str, default_value=None) -> Optional[int]:
        data = self.get_data(key)
        if not data:
            return default_value
        return int(self.config[key])

    def get_float_data(self, key: str, default_value=None) -> Optional[float]:
        data = self.get_data(key)
        if not data:
            return default_value
        return float(self.config[key])

    def to_json(self) -> str:
        return json.dumps(self.__dict__)
