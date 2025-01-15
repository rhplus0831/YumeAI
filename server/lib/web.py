def generate_event_stream_message(status: str, message: str):
    return f'type: {status}\ndata: {message.replace("\n","__YUME_LINE__")}\n\n'