# CRACK_SHACK
Kinda crazy that we are in an age where entire softwares can be made for disposable purposes.

A 3D layout planner for the shed woodshop: the 15′ 5″ × 27′ 4″ framed interior plus the shop machines at their published sizes. Drag machines around the floor, rotate them, and read their clearance to each wall.

## Download

Every push builds a Windows `.exe` with GitHub Actions.

- **Latest build from `main`:** the [`latest` release](../../releases/tag/latest).
  - `CrackShack-1.3.0-portable.exe` runs without installing.
  - `CrackShack-1.3.0-setup.exe` installs it.
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
- Floor pieces snap to a 1″ grid measured from the double-door / entry-wall corner and stop flush against walls and other pieces.
- Wall pieces (tool board, TVs, mini split, wood rack, microwave shelf, panel, gable fan) slide along and up their wall, and can be carried onto another wall. They can't enter windows or doors, other wall pieces, or the machines below them.
- 110V and 220V outlets snap beside a stud and slide up and down. They sit in the stud cavity, so a TV or board can cover them. Add or delete outlets from **More** (Delete key removes the selected one).
- New pieces (7′ workbench, router table, mini fridge, band saw and the wall pieces) have editable width, depth and height in their panel.
- **Ctrl+Z** undoes and **Ctrl+Y** (or **Ctrl+Shift+Z**) redoes moves, rotations, desk-size changes and file opens. **R** rotates the selected machine.
- **Save** writes the current layout, including desk sizes, to a `.json` file. **Open** loads one back.
- **More → Back to floor-plan layout** returns to the default arrangement. More also has the display toggles.
- The last layout you used is also remembered between sessions.
