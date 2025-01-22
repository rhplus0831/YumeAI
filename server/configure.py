import os


def get_fast_store_path(path: str) -> str:
    # DB 등 용량이 작으면서 잦은 접근이 필요한 데이터를 저장할 공간?
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store-fast')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)


def get_store_path(path: str) -> str:
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)


def use_s3_for_store():
    return os.getenv('S3_ENDPOINT') is not None


def get_s3_address():
    return os.getenv('S3_ENDPOINT')


def get_s3_access_key():
    return os.getenv('S3_ACCESS_KEY')


def get_s3_secret_key():
    return os.getenv('S3_SECRET_KEY')


def get_s3_bucket():
    return os.getenv('S3_BUCKET')


def get_s3_client():
    import boto3
    from botocore.config import Config
    return boto3.client('s3', endpoint_url=get_s3_address(),
                        aws_access_key_id=get_s3_access_key(),
                        aws_secret_access_key=get_s3_secret_key())


# https://cdn.example.com/
def get_cdn_address():
    return os.getenv('CDN_ENDPOINT')


def use_encrypted_db():
    if os.getenv("USE_ENCRYPTED_DB") is None:
        return False
    return os.getenv("USE_ENCRYPTED_DB").lower() == "true"
