import configure
from lib.cbs import CBSHelper
from lib.prompt import parse_prompt

if __name__ == '__main__':
    with open(configure.get_store_path('test_prompt'), 'r', encoding='utf-8') as f:
        test_prompt = f.read()

    cbs = CBSHelper()
    cbs.user = 'Lucas'
    cbs.user_prompt = 'Lucas Prompt'
    cbs.char = 'Yume'
    cbs.char_prompt = 'Yume Prompt'
    cbs.global_vars['toggle_input'] = '1'
    cbs.global_vars['toggle_stat'] = '1'

    parsed_prompt, _ = parse_prompt(test_prompt, cbs)
    print(parsed_prompt)
