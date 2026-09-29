import os, sys, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import villain_factory, roster_factory
importlib.reload(villain_factory)
importlib.reload(roster_factory)

for number in range(1, 31):
    roster_factory.build_character(number)
    print(f"REBUILT {number:02d}/30")

print("REBUILD_ALL_COMPLETE")
