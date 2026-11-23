# Simple Code — Simply C++ & Simple C

C++ and C for dummies, running right in your browser. Open `index.html`, pick a language at the top,
write code, press **Run**. The console explains every line and every mistake in plain English.

| Language   | File type | Print a line   | Input                 |
|------------|-----------|----------------|-----------------------|
| Simply C++ | `.scpp`   | `cout "hi"`    | `cin "Name? " name`   |
| Simple C   | `.sc`     | `print "hi"`   | `scan "Age? " age`    |

## What's simpler
- No `#include`, no `main()`, no semicolons needed (all still allowed)
- Glue text with `+`: `"hi" + "hi"`, `"Age: " + 5`; repeat with `"ha" * 3`
- Real text strings in C too: `string name = "Sam"`, compare with `==`
- `for i in 1 to 10`, `for x in myList`, `repeat 3 { }`
- `list v = [1, 2, 3]`, `v.add(4)`, `v[-1]`, `v.size()`, `v.sum()`, `v.sort()`
- `func add(a, b) { return a + b }`
- `and` / `or` / `not`, `7 / 2` is 3.5, `random(1, 6)`
- Simple C still understands `printf("%d\n", x)`, `scanf("%d", &x)`, `char name[50]`, `strlen`, `strcmp`…

Turn on **Explain mode** and every line tells you what it did. Errors show the line, what went wrong,
and how to fix it (including "did you mean…?"). Out-of-bounds arrays and bad `printf` placeholders
give clear errors instead of garbage.

See `examples/` for sample `.scpp` and `.sc` programs, and the **Cheat sheet** tab in the app.
Link straight to a language with `#cpp` or `#c` at the end of the URL.
