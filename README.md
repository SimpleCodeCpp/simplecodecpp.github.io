# Simple Code

46 beginner-friendly languages that run right in your browser. Go to https://simplecodecpp.github.io
and press **Try SimpleCode** (or open `app.html`), pick a language at the top, write code, press **Run**.
The console explains every line and every mistake in plain English.

## Languages

| Group | Languages (link with `#key`) |
|-------|------------------------------|
| Our own | Simple (`#simple`): plain English that turns into Python |
| Classic | Simply C++ (`#cpp`), Simple C (`#c`), Python (`#py`), JavaScript (`#js`), TypeScript (`#ts`), Java (`#java`), C# (`#cs`) |
| Modern | Kotlin (`#kt`), Swift (`#swift`), Dart (`#dart`), Go (`#go`), Rust (`#rs`), Ruby (`#rb`), Lua (`#lua`), PHP (`#php`), Scala (`#scala`), Crystal (`#cr`), Mojo (`#mojo`), Nim (`#nim`), Elixir (`#ex`) |
| Science | Julia (`#jl`), R (`#r`), MATLAB (`#m`), Fortran (`#f90`) |
| Games & gadgets | GDScript / Godot (`#gd`), microScript / microStudio (`#ms`), MicroPython (`#mpy`) and Arduino sketches (`#ino`) on a pretend board: pick Raspberry Pi Pico, ESP32 or Arduino |
| Drawing | Logo (`#logo`): a turtle draws your program live |
| App screens | SwiftUI (`#swiftui`) on a pretend iPhone, Java Swing (`#javaui`) windows. Both are live previews where the buttons, text fields and toggles really work |
| Old-school & niche | Pascal (`#pas`), COBOL (`#cob`), BASIC (`#bas`), Visual Basic (`#vb`), Perl (`#pl`), Bash (`#sh`), Brainfuck (`#bf`), HolyC (`#hc`), LOLCODE (`#lol`), Assembly with a pretend CPU (`#asm`), Binary (`#binary`) |
| Web & data | HTML (`#html`), CSS (`#css`), SQL (`#sql`), each with a live preview or table view |

Every language has its own file extension (`.scpp`, `.sc`, `.spy`, `.sgd`, `.spas`, `.scob`, …),
built-in examples, and a **Cheat sheet** tab comparing the real language with the Simple version.
Real code in each language still works, so you can grow into the real thing.

## Levels

The level switch changes how strict each language is:

- **Simple**: forgiving shortcuts (`"Age: " + 5`, `for i in 1 to 5`).
- **Better**: Simple plus safety. You must create boxes before using them, they keep their kind, and likely typos are caught.
- **Complex**: the real language's rules.

## Convert

Press **🔄 Convert** to turn a file from any of the code languages into any of 21 languages: Simple, Python,
JavaScript, TypeScript, Java, C#, C++, C, Kotlin, Swift, Dart, Go, Rust, Ruby, Lua, PHP, Julia, R,
MATLAB, MicroPython or HolyC. You can open the result, save it, or copy it. The converter also
handles counting from 0 vs 1, text joining, input and printf formatting, and it lists anything you
should check under "Good to know".

## Explain mode and the Helper

Turn on **Explain mode** and every line tells you what it did. Errors show the line, what went wrong,
and how to fix it (including "did you mean…?").

The **🤖 Helper** tab talks to [Ollama](https://ollama.com) running on your own computer. To use it from
the live site, run `launchctl setenv OLLAMA_ORIGINS "https://simplecodecpp.github.io"` and restart Ollama.

## Tools

The **🧰 Tools** button has:

- **✨ Tidy up** (Ctrl/⌘+Shift+F): fixes the indentation.
- **🔍 Find & replace** (Ctrl/⌘+F).
- **🔠 Text size** (Ctrl/⌘ + / −).
- **🐢 Slow motion**: runs your program line by line with a green highlight and a live table of your boxes (variables).
- **📦 Boxes table**: shows every variable's final value after a run.

Next to the console there are two more tabs:

- **🧮 Gadgets**: a number converter (decimal, binary, hex, octal), a color picker that writes the code for you, tap-to-type symbols, and a letter-code (ASCII) table.
- **🏆 Challenges**: 12 puzzles that check your program's output. Solve each one in different languages to collect badges.

## Share

The **📤 Share** button (next to Convert) opens the sharing area:

- **This program**: a link with your code inside it (no account needed), Share… (Messages, Mail, AirDrop on devices that have it),
  download the file, save a picture of your code, copy the code, email it, copy embed code for your own website, and a QR code
  to open it on a phone.
- **Simple Code**: the website link, its QR code, and the Mac and Windows downloads.

## Files

- `index.html`: the main page, with the **Try SimpleCode** button, features, languages, downloads and sharing.
- `app.html`: the studio itself. Old links like `simplecodecpp.github.io/#py&code=…` still work; the main page sends them on to `app.html`.
- `logo.svg` and `logo-*.png`: the brand logo and one logo per language.
- `desktop/`: the Mac and Windows app.

## Mac and Windows app

The `desktop` folder wraps the studio in its own window with Electron. It works offline, and the 🤖 Helper can talk to
Ollama without any setup because Ollama already trusts desktop apps.

```bash
cd desktop
npm install
npm start            # try it
npm run icons -- ../my-logo.png   # make the app icon from your logo (png, jpg or svg; leave it out to use logo.svg)
npm run dist         # builds dist/SimpleCode-mac.dmg and dist/SimpleCode-windows.exe
```

The apps aren't code-signed, so the first time someone opens them they see a warning.
On a Mac: right-click the app → Open. On Windows: More info → Run anyway.

To publish them, make a GitHub release on the site's repository and drag both files in. The download buttons point to
`releases/latest/download/SimpleCode-mac.dmg` and `SimpleCode-windows.exe`, so they always get the newest release.
