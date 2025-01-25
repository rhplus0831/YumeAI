import os

import configure


def process(json_data):
    path: str = json_data['path']
    local_path = configure.get_store_path(path)
    os.remove(local_path)

    if configure.use_s3_for_store():
        client = configure.get_s3_client()
        client.delete_object(Bucket=configure.get_s3_bucket(), Key=path)


def queue_task(path: str):
    from delayed.processor import queue_task
    queue_task({
        'type': 'remove_file',
        'path': path
    })
