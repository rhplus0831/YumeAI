import os
from logging import Logger

import configure


def process(logger: Logger, json_data):
    src: str = json_data['src']
    dest: str = json_data['dest']
    remove_source: bool = json_data['remove_source']

    if not configure.use_s3_for_store():
        raise Exception("S3 is not enabled")

    client = configure.get_s3_client()
    client.upload_file(src, configure.get_s3_bucket(), dest)
    if remove_source:
        os.remove(src)


def queue_task(src: str, dest: str, remove_source: bool = True):
    from delayed.processor import queue_task
    queue_task({
        'type': 'upload_to_s3',
        'src': src,
        'dest': dest,
        'remove_source': remove_source
    })
