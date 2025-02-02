from lib.prompt import parse_cbs


def check_func_for_test(inner: str):
    if inner == "hatsune miku":
        return "great!", True

    if inner == "mepi":
        return "lovely!", True

    if inner == "love":
        return "mepi", True

    if inner == "generate_tag":
        return "{{love}}", True

    if inner == "hatsune miku is great":
        return "1", True

    return inner, False


def test_parse_cbs_with_no_tag():
    assert parse_cbs("this is great!", check_func_for_test) == ('this is great!', [])


def test_parse_cbs_with_single():
    assert parse_cbs("this is {{hatsune miku}}", check_func_for_test) == ('this is great!', [])


def test_parse_cbs_with_multiple():
    assert parse_cbs("this is {{hatsune miku}} and {{mepi}}", check_func_for_test) == ('this is great! and lovely!', [])


def test_parse_cbs_with_nested():
    assert parse_cbs("this is {{{{love}}}}", check_func_for_test) == ('this is lovely!', [])


def test_parse_cbs_incomplete():
    assert parse_cbs('{{{{love}}', check_func_for_test) == ('{{mepi', [])


def test_parse_cbs_incomplete_deep():
    assert parse_cbs('{{{{{{{{love}}', check_func_for_test) == ('{{{{{{mepi', [])


def test_parse_cbs_with_generate_tag():
    assert parse_cbs('{{generate_tag}}', check_func_for_test) == ('mepi', [])


def test_parse_cbs_with_if_true():
    assert parse_cbs('{{#if 1}}Test{{/if}}', check_func_for_test) == ('Test', [])


def test_parse_cbs_with_if_false():
    assert parse_cbs('{{#if 0}}Test{{/if}}', check_func_for_test) == ('', [])


def test_parse_cbs_with_if_nested():
    assert parse_cbs('{{#if 1}}{{#if 1}}Test{{/if}}{{/if}}', check_func_for_test) == ('Test', [])


def test_parse_cbs_with_if_nested_false():
    assert parse_cbs('{{#if 0}}{{#if 1}}Test{{/if}}{{/if}}', check_func_for_test) == ('', [])


def test_parse_cbs_with_if_true_and_false():
    assert parse_cbs('{{#if 1}}Show{{#if 0}}Hide{{/if}}{{/if}}', check_func_for_test) == ('Show', [])


def test_parse_cbs_with_if_cbs():
    assert parse_cbs('{{#if {{hatsune miku is great}}}}Right!{{/if}}', check_func_for_test) == ('Right!', [])
