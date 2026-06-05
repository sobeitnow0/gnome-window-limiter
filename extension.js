import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class WindowLimiterExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
        this._wmSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.wm.preferences' });
        this._idleSources = new Set();
        
        // Connect to the window-created signal on the global display object
        this._windowCreatedId = global.display.connect('window-created', (display, window) => {
            this._onWindowCreated(window);
        });
    }

    disable() {
        // Safely disconnect the event listener to avoid memory leaks or crashes after disabling
        if (this._windowCreatedId) {
            global.display.disconnect(this._windowCreatedId);
            this._windowCreatedId = null;
        }

        // Clean up any pending idle handlers to avoid memory leaks or executing code after extension is disabled
        if (this._idleSources) {
            for (const id of this._idleSources) {
                GLib.Source.remove(id);
            }
            this._idleSources.clear();
            this._idleSources = null;
        }

        this._settings = null;
        this._mutterSettings = null;
        this._wmSettings = null;
    }

    _onWindowCreated(window) {
        // Only monitor normal application windows (skip tooltips, menus, desktop background, etc.)
        if (window.get_window_type() !== Meta.WindowType.NORMAL) {
            return;
        }

        // Defer execution using GLib.idle_add to ensure the window has been fully initialized
        // and assigned to its initial workspace by Mutter before we count and move it.
        const sourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            if (this._idleSources) {
                this._idleSources.delete(sourceId);
            }

            // Exit if the extension was disabled during the idle deferral
            if (!this._settings) {
                return GLib.SOURCE_REMOVE;
            }

            // Verify the window still exists and was not immediately destroyed
            let currentWs;
            try {
                if (!window || !window.get_workspace) {
                    return GLib.SOURCE_REMOVE;
                }
                currentWs = window.get_workspace();
                if (!currentWs) {
                    return GLib.SOURCE_REMOVE;
                }
            } catch (e) {
                return GLib.SOURCE_REMOVE; // Window is finalized/destroyed
            }

            // Get settings
            const limit = this._settings.get_int('window-limit');
            const autoSwitch = this._settings.get_boolean('auto-switch-workspace');

            if (limit <= 0) {
                return GLib.SOURCE_REMOVE; // 0 or negative value represents unlimited
            }

            // Fetch and filter windows in the current workspace
            const windows = currentWs.list_windows();
            const normalWindows = windows.filter(w => {
                try {
                    return w && w.get_window_type() === Meta.WindowType.NORMAL;
                } catch (e) {
                    return false;
                }
            });

            // If the workspace has exceeded the window limit
            if (normalWindows.length > limit) {
                const currentIndex = currentWs.index();
                const nextIndex = currentIndex + 1;
                const workspaceManager = global.workspace_manager;
                const nWorkspaces = workspaceManager.get_n_workspaces();

                let nextWs = null;
                if (nextIndex < nWorkspaces) {
                    nextWs = workspaceManager.get_workspace_by_index(nextIndex);
                } else {
                    // Check if dynamic workspaces are enabled
                    const isDynamic = this._mutterSettings.get_boolean('dynamic-workspaces');

                    if (isDynamic) {
                        try {
                            // Append new workspace dynamically
                            nextWs = workspaceManager.append_new_workspace(false, global.get_current_time());
                        } catch (e) {
                            console.error(`[WindowLimiter] Failed to append workspace: ${e.message}`);
                        }
                    } else {
                        // If static workspaces, programmatically increment num-workspaces in preferences
                        const numWorkspaces = this._wmSettings.get_int('num-workspaces');
                        this._wmSettings.set_int('num-workspaces', numWorkspaces + 1);
                        
                        // Retrieve the newly created workspace
                        nextWs = workspaceManager.get_workspace_by_index(numWorkspaces);
                    }
                }

                if (nextWs) {
                    if (!autoSwitch) {
                        // If auto-switch is disabled, we move the window in the background.
                        // To prevent Mutter from switching workspaces to follow the newly created window,
                        // we focus another window on the current workspace first.
                        const otherWindow = normalWindows.find(w => w !== window);
                        if (otherWindow) {
                            otherWindow.activate(global.get_current_time());
                        } else {
                            currentWs.activate(global.get_current_time());
                        }
                    }

                    // Move the window to the target workspace
                    window.change_workspace(nextWs);

                    // If auto-switch is enabled, focus the workspace and the window
                    if (autoSwitch) {
                        nextWs.activate(global.get_current_time());
                        window.activate(global.get_current_time());
                    }
                }
            }

            return GLib.SOURCE_REMOVE; // Remove the idle handler so it only runs once
        });

        if (this._idleSources) {
            this._idleSources.add(sourceId);
        }
    }
}
