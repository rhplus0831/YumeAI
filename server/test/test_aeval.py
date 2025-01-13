from lib.cbs import fix_asteval_alias, fix_asteval_result

if __name__ == "__main__":
    from asteval import Interpreter
    aeval = Interpreter()

    print(fix_asteval_result(aeval.eval(fix_asteval_alias("1 = 1"))))