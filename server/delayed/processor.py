# 지연되어도 상관없는 지시를 저장 및 처리하는 시스템
# 임시 구현이고 FastAPI 에 붙여두지만, 별도로 실행하거나 좀 더 효율적인 시스템으로 바꾸는게 좋을것 같음

import json
import logging
import os
import time
import uuid

from configure import get_fast_store_path
from delayed.tasks import upload_to_s3, remove_file

known_tasks = {
    'upload_to_s3': upload_to_s3.process,
    'remove_file': remove_file.process,
}
task_dir = get_fast_store_path('#tasks')
process_task_dir = get_fast_store_path('#tasks_process')

logger = logging.getLogger('yumeai-processor')
logging.basicConfig(filename='processor.log', encoding='utf-8', level=logging.INFO)


def queue_task(data: dict):
    file_path = os.path.join(task_dir, f'{uuid.uuid4()}.json')
    with open(file_path, 'w') as f:
        f.write(json.dumps(data))


def main():
    os.makedirs(task_dir, exist_ok=True)
    os.makedirs(process_task_dir, exist_ok=True)
    while True:
        # TODO: Recover process_task to task if server not busy (it's may be failed task because file is removed when task completed)

        try:
            files = os.listdir(task_dir)
            for file in files:
                file_path = os.path.join(task_dir, file)
                with open(file_path, 'r') as f:
                    data = f.read()
                json_data = json.loads(data)

                process_file_path = os.path.join(process_task_dir, file)
                os.rename(file_path, process_file_path)

                task_type: str = json_data['type']

                if task_type in known_tasks:
                    logger.info(f'processing task: {task_type}')
                    known_tasks[task_type](logger, json_data)
                    logger.info(f'processed task: {task_type}')
                else:
                    raise Exception(f'unknown task type: {task_type}')

                os.remove(process_file_path)
        except:
            logger.exception('Error in delayed task processor')
            pass

        time.sleep(1)
