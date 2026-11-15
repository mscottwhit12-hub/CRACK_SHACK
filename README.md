# CRACK_SHACK
Kinda crazy that we are in an age where entire softwares can be made for disposable purposes.

A 3D layout planner for the shed woodshop: the 15′ 5″ × 27′ 4″ framed interior plus the shop machines at their published sizes. Drag machines around the floor, rotate them, and read their clearance to each wall.

## Download

Every push builds a Windows `.exe` with GitHub Actions.

- **Latest build from `main`:** the [`latest` release](../../releases/tag/latest).
  - `CrackShack-1.2.0-portable.exe` runs without installing.
  - `CrackShack-1.2.0-setup.exe` installs it.
- **Builds from other branches:** open the run in the **Actions** tab and download the `CrackShack-windows` artifact.

The exe is not code-signed, so Windows SmartScreen may warn on first launch. Choose **More info → Run anyway**.

## Run from source

```
npm ci
npm start      # open the app
npm run dist   # build the exes into dist/
```

## Layout

- `app/index.html` is the whole model: shed, machines, controls. The 3D library is bundled in `app/vendor`, so it runs offline.
- `main.js` is the Electron desktop wrapper.
- `.github/workflows/build-exe.yml` builds and publishes the exes.

## Layouts

- The app opens with the default layout from the hand-drawn Nov 2026 floor plan, including the corner desk at 48″ × 30″ and 48″ × 18″.
- Machines snap to a 1″ grid measured from the double-door / entry-wall corner, and they can't overlap. A dragged machine stops flush against walls and other machines.
- **Ctrl+Z** undoes and **Ctrl+Y** (or **Ctrl+Shift+Z**) redoes moves, rotations, desk-size changes and file opens. **R** rotates the selected machine.
- **Save** writes the current layout, including desk sizes, to a `.json` file. **Open** loads one back.
- **More → Back to floor-plan layout** returns to the default arrangement. More also has the display toggles.
- The last layout you used is also remembered between sessions.
