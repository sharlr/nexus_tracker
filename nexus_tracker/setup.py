from setuptools import setup, find_packages
with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")
setup(
    name="nexus_tracker",
    version="2.0.0",
    description="NEXUS RAJAN - TRACKER PRO",
    author="NEXUS RAJAN",
    author_email="admin@nexusrajan.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
