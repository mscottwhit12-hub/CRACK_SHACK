# CRACK_SHACK
Kinda crazy that we are in an age where entire softwares can be made for disposable purposes.

A 3D layout planner for the shed woodshop: the 15′ 5″ × 27′ 4″ framed interior plus the shop machines at their published sizes. Drag machines around the floor, rotate them, and read their clearance to each wall.

## Download

Every push builds a Windows `.exe` with GitHub Actions.

- **Latest build from `main`:** the [`latest` release](../../releases/tag/latest).
  - `CrackShack-1.5.0-portable.exe` runs without installing.
  - `CrackShack-1.5.0-setup.exe` installs it.
- **Builds from other branches:** open the run in the **Actions** tab and download the `CrackShack-windows` artifact.

The exe is not code-signed, so Windows SmartScreen may warn on first launch. Choose **More info → Run anyway**.

## Wiring plan

**Wiring** shows every circuit as a colored cable run, routed the way electricians commonly wire open-stud shops ("up and over"): horizontal runs along the top plates, drops down the studs to each box, up the rafters to ceiling boxes, along running boards between them. It opens a drawer with:

- the assumed feed (50A, 240V, 4-wire) and panel (100A main breaker, 24 spaces)
- an estimated peak load per leg
- an editable panel schedule: circuit names, breaker sizes, wire gauge, what each circuit feeds, and cable length from the routes
- a one-line diagram, a materials estimate, and Massachusetts code notes

Each outlet, switch and light has a **Circuit** picker in its panel. **Save…** in the drawer writes the whole plan to an HTML file you can print.

**This is a planning drawing only. It is not for permit or construction.** Have a licensed electrician design and permit the installation.

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
- Floor pieces snap to a 1″ grid measured from the double-door / entry-wall corner. While dragging, a piece jumps straight to the spot under the pointer if it's free, even past other pieces; if that spot is taken it stops flush against the blocker.
- Wall pieces (tool board, TVs, mini split, wood rack, microwave shelf, panel, gable fan) slide along and up their wall, and can be carried onto another wall. They can't enter windows or doors, other wall pieces, or the machines below them.
- 110V and 220V outlets snap beside a stud and slide up and down. They sit in the stud cavity, so a TV or board can cover them. Add or delete outlets from **More** (Delete key removes the selected one).
- Light switches (single-pole and 3-way) snap to studs like outlets. 8′ LED shop lights hang on chains (hang height is editable), each plugged into a switched ceiling receptacle on the rafter above; three per side by default. A 240V twist-lock ceiling drop feeds the table saw in the middle of the floor. Add or delete any of these from **More**.
- 110V outlets show a duplex NEMA 5-20 face; 220V outlets show an orange NEMA 6-20 face marked 240V in a 4″ box.
- New pieces (7′ workbench, router table, mini fridge, band saw and the wall pieces) have editable width, depth and height in their panel.
- **Ctrl+Z** undoes and **Ctrl+Y** (or **Ctrl+Shift+Z**) redoes moves, rotations, desk-size changes and file opens. **R** rotates the selected machine.
- **Save** writes the current layout, including desk sizes, to a `.json` file. **Open** loads one back.
- **More → Back to floor-plan layout** returns to the default arrangement. More also has the display toggles.
- The last layout you used is also remembered between sessions.

## Run it as a web app (Docker)

Every push builds a Docker image at `ghcr.io/mscottwhit12-hub/crack_shack`. The web version keeps **one shared layout** on the server. Every browser that opens it sees the same layout, and edits from one device show up on the others within a few seconds. Ctrl+Z undoes a change that came in from another device.

Add this to `docker-compose.yml`:

```yaml
  crack-shack:
    image: ghcr.io/mscottwhit12-hub/crack_shack:latest
    container_name: crack-shack
    ports:
      - "8088:8080"
    volumes:
      - ./crack-shack-data:/data
    restart: unless-stopped
```

Then start it with `docker compose up -d crack-shack` and open `http://<server>:8088`. That works from the LAN and from the tailnet.

- The layout is stored in `./crack-shack-data/layout.json`. Back up that file to keep the layout safe.
- The container fixes the data folder's ownership when it starts, then runs the app as an unprivileged user (uid 1000).
- Save and Open ask whether to use this computer (a .json file) or the shop server. Layouts saved to the server are kept in `./crack-shack-data/layouts/` and can be opened from any device.
- There is no login. Anyone who can reach the port can edit, so expose it only on the LAN or tailnet.

## Using it

- Click a piece to select it, then drag it to move it. Dragging anywhere else orbits the view.
- Arrow keys or W/A/S/D nudge the selected piece 1″ (hold Shift for 12″), relative to the view. Q and E turn it 15° counter-clockwise and clockwise. A piece against a wall shifts out as it turns.
- Yard (top bar) shows the surroundings modeled from an aerial screenshot: lawn, driveway, house, tree lines and the young trees.
- A selected floor piece gets a ring; drag its handle to turn the piece in 15° steps. R (or Rotate 90°) still turns it a quarter turn.
- **+ Add** (top bar) adds any piece: machines, TVs and wall pieces, outlets, switches, floor boxes, the panel, strip lights and focus lights. To remove a piece, select it and press Delete.
- Sheetrock (sloped ceiling plus the flat ceiling at the collar ties) and Pine walls (horizontal 1×6 boards, staggered 8′ joints, cut around windows, doors, outlets and switches) are display toggles on the top bar.
- **Show** holds every visibility toggle: pieces (floor, wall, lights, electrical), finishes (sheetrock, pine walls), the shed and yard, and guides (grid, labels, dimensions). Electrical turns on by itself with Wiring.
- **Lighting** switches between even light, daytime, dusk/dawn and night, and turns the shop lights on or off. The day, dusk and night scenes use sun or moon through the windows, with shadows, plus real light from the strip and focus lights. Fixture specs (lumens, color temperature, beam angle, edge softness, uplight) are set in the Lighting menu and saved with the layout. Light levels are in real units, bounce light depends on the finishes, and exposure adapts like your eyes.
- **File** has Save, Open, Print to PDF (or Ctrl+P) exports a 9-page PDF of whatever is showing: floor plan, two 3D views, two inside views and all four walls. Electrical (outlets, switches, floor boxes, panel) is hidden by default and turns on with Wiring.

- **?** (or the ? key) lists every mouse and keyboard control, plus the shed's measurements.

## More tools

- **Measure** (or M): click two points; Shift locks to an axis. Points snap to the corners of parts. Esc or M clears them.
- **Work zones** (Show → Guides): the clear floor each machine needs (infeed, outfeed, where you stand), red where something is in the way. The selected machine always shows its own zones, and the selection panel says what they run into.
- **Duplicate** (Ctrl+D or the panel button), **double-click** to zoom to a piece, **Esc** cancels a drag. The camera view is remembered between visits.
- **File → Restore earlier version** (server only): the server keeps the last 50 versions of the shared layout in `crack-shack-data/history/`.
- The dot on **File** shows sync status: green saved, gray saving, red can't reach the server. The version is at the bottom of the **?** menu, and a banner offers a reload when the server has a newer one.
