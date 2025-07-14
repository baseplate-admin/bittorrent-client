import os
import importlib


def import_submodules(package_name: str) -> None:
    """
    Import all submodules of a package, given its package name.
    """
    package = importlib.import_module(package_name)
    if package.__file__ is None:
        raise ValueError(
            f"Package '{package_name}' does not have a __file__ attribute."
        )
    package_dir = os.path.dirname(package.__file__)

    for filename in os.listdir(package_dir):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = filename[:-3]
            importlib.import_module(f".{module_name}", package=package_name)
