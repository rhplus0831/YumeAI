from setuptools import setup

setup(
    name='yume_sqlalchemy_support',
    # ... 기타 설정 ...
    entry_points={
        'sqlalchemy.dialects': [
            'yumestore = yume_store:YumeStore'
        ]
    }
)