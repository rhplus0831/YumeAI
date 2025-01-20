def generate_event_stream_message(status: str, message: str):
    if not message:
        return f'type: empty\ndata: _\n\n'

    return f'type: {status}\ndata: {message.replace("\n","__YUME_LINE__")}\n\n'