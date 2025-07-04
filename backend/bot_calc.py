import json
import sys
from worker import process_task


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            task = json.load(f)
    else:
        data = sys.stdin.read()
        task = json.loads(data)

    result = process_task(task)
    json.dump(result, sys.stdout)


if __name__ == '__main__':
    main()
