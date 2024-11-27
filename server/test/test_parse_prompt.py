import configure
from api import prompt

if __name__ == '__main__':
    with open(configure.get_store_path('test_prompt'), 'r', encoding='utf-8') as f:
        test_prompt = f.read()

    parsed_prompt = prompt.parse_prompt(test_prompt, {
        'user': lambda: 'Lucas',
        'user_prompt': lambda: 'Lucas prompt',
        'char': lambda: 'Yume',
        'char_prompt': lambda: 'Yume prompt',
    })
    print(parsed_prompt)
