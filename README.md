# GNOME Window Limiter

A GNOME Shell extension that limits the number of active windows in each virtual workspace, automatically moving excess windows to the next workspace.

> [!NOTE]
> **Notice regarding GNOME Extensions (EGO):**
> This project was developed with the assistance of Artificial Intelligence (AI). In adherence to GNOME Extensions' submission guidelines and review policies regarding AI-assisted code, **this extension will not be submitted to extensions.gnome.org (EGO)**. It is maintained directly on GitHub for manual installation and community use via Git or releases.

## Features

- **Custom Window Limit** – Set the maximum number of normal windows allowed per workspace (or set to 0 for unlimited).
- **Smart Workspace Fill** – When the limit is reached, it automatically searches for the next workspace with available capacity before creating a new one, keeping workspaces organized.
- **Dynamic & Static Workspaces** – Seamlessly supports GNOME's dynamic workspaces as well as fixed static workspaces.
- **Focus Control / Auto-Switch** – Choose whether focus follows the moved window to the destination workspace or stays on your current workspace (background mode).
- **Smart Modal & Dialog Protection** – Child windows, file pickers, "Save As" dialogs, and modal windows remain with their parent application and are never separated.
- **Exclude Minimized Windows** – Optional setting to exclude minimized windows when calculating workspace occupancy.
- **Multi-Monitor Safe** – Respects Mutter's `workspaces-only-on-primary` setting, avoiding unexpected shifts on secondary monitors.
- **Window Blacklist** – Exclude specific applications, window titles, or WM_CLASS names from the limit (e.g. `chatgpt, vicinae, vlc`).
- **Modern Libadwaita Interface** – Native, clean settings dialog conforming to modern GNOME design standards.
- **Internationalization (i18n)** – Built-in gettext translation support (English and Brazilian Portuguese included).

## Compatibility

- **GNOME Shell:** 45, 46, 47, 48, 49, 50, 51+
- **Display Server:** Wayland and X11

## Installation

### Automated Installer

Run the included installer script:
```bash
./install.sh
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sobeitnow0/gnome-window-limiter.git
   cd gnome-window-limiter
   ```

2. Copy files to your extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/gnome-window-limiter@sobeitnow0.github.com
   cp -r metadata.json extension.js prefs.js schemas locale ~/.local/share/gnome-shell/extensions/gnome-window-limiter@sobeitnow0.github.com/
   ```

3. Compile the GSettings schema:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/gnome-window-limiter@sobeitnow0.github.com/schemas/
   ```

4. Restart GNOME Shell:
   - **X11:** Press `Alt` + `F2`, type `r`, and press `Enter`.
   - **Wayland:** Log out and log back in, or restart the session.

5. Enable the extension:
   ```bash
   gnome-extensions enable gnome-window-limiter@sobeitnow0.github.com
   ```

## Configuration

Open the **Extensions** app (or run `gnome-extensions prefs gnome-window-limiter@sobeitnow0.github.com`):

- **Window Limit:** Maximum windows per workspace before triggering a move.
- **Auto-Switch Workspace:** Toggle whether your view automatically switches to the destination workspace.
- **Smart Workspace Fill:** Look for existing workspaces with available slots before appending new workspaces.
- **Count Minimized Windows:** Choose whether minimized windows count against the limit.
- **Apply Only to Primary Monitor:** Ignore windows on secondary monitors when workspaces are configured on the primary display only.
- **Window Blacklist:** Add comma-separated keywords, window classes, or titles to ignore.

## Packaging

To create a clean distribution package:
```bash
./package.sh
```

## License

GNU General Public License v2.0 or later (GPL-2.0-or-later).
