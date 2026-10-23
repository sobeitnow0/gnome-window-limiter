// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class WindowLimiterExtension extends Extension {
    enable() {
        this.initTranslations();
        this._settings = this.getSettings();
        this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
        this._wmSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.wm.preferences' });
        this._idleSources = new Set();
        this._processedWindows = new WeakSet();

        // Connect to window-created using safe connectObject
        global.display.connectObject('window-created', (display, window) => {
            this._onWindowCreated(window);
        }, this);
    }

    disable() {
        global.display.disconnectObject(this);

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
        this._processedWindows = null;
    }

    _isWindowBlacklisted(window) {
        if (!this._settings || !window) return false;

        const blacklistStr = this._settings.get_string('window-blacklist');
        if (!blacklistStr) return false;

        const tokens = blacklistStr
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0);

        if (tokens.length === 0) return false;

        const wmClass = (window.get_wm_class ? window.get_wm_class() : '')?.toLowerCase() || '';
        const wmInstance = (window.get_wm_class_instance ? window.get_wm_class_instance() : '')?.toLowerCase() || '';
        const title = (window.get_title ? window.get_title() : '')?.toLowerCase() || '';
        const gtkAppId = (window.get_gtk_application_id ? window.get_gtk_application_id() : '')?.toLowerCase() || '';

        return tokens.some(token =>
            wmClass.includes(token) ||
            wmInstance.includes(token) ||
            title.includes(token) ||
            gtkAppId.includes(token)
        );
    }

    _isWindowValidForLimit(window) {
        if (!window) return false;

        try {
            if (window.get_window_type() !== Meta.WindowType.NORMAL) return false;
            // Modals, dialogs, and child windows stay with their parent
            if (window.get_transient_for && window.get_transient_for()) return false;
            // Pinned windows and always-on-top utility windows do not count
            if (window.skip_taskbar || window.is_on_all_workspaces() || window.is_above()) return false;

            // Optionally ignore minimized windows
            const countMinimized = this._settings.get_boolean('count-minimized-windows');
            if (!countMinimized && window.minimized) return false;

            // Multi-monitor handling: ignore windows on secondary monitors if workspaces are primary-only
            const primaryOnly = this._settings.get_boolean('primary-monitor-only');
            if (primaryOnly && Meta.prefs_get_workspaces_only_on_primary && Meta.prefs_get_workspaces_only_on_primary()) {
                if (window.is_on_primary_monitor && !window.is_on_primary_monitor()) {
                    return false;
                }
            }

            if (this._isWindowBlacklisted(window)) return false;

            return true;
        } catch (e) {
            return false;
        }
    }

    _countWindowsOnWorkspace(workspace) {
        if (!workspace) return 0;
        const windows = workspace.list_windows();
        return windows.filter(w => this._isWindowValidForLimit(w)).length;
    }

    _onWindowCreated(window) {
        if (!this._settings || !window) return;

        // Skip non-normal windows immediately
        if (window.get_window_type() !== Meta.WindowType.NORMAL) return;
        if (window.get_transient_for && window.get_transient_for()) return;
        if (window.skip_taskbar || window.is_on_all_workspaces() || window.is_above()) return;

        // Defer execution using GLib.idle_add to let Mutter and Shell initialize the window
        const sourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            if (this._idleSources) {
                this._idleSources.delete(sourceId);
            }

            if (!this._settings) return GLib.SOURCE_REMOVE;

            this._processNewWindow(window);
            return GLib.SOURCE_REMOVE;
        });

        if (this._idleSources) {
            this._idleSources.add(sourceId);
        }
    }

    _processNewWindow(window) {
        if (!this._settings || !window) return;
        if (this._processedWindows.has(window)) return;

        try {
            if (!window.get_compositor_private()) return;
        } catch (e) {
            return;
        }

        this._processedWindows.add(window);

        if (!this._isWindowValidForLimit(window)) return;

        const currentWs = window.get_workspace();
        if (!currentWs) return;

        const limit = this._settings.get_int('window-limit');
        if (limit <= 0) return; // 0 represents unlimited

        const normalWindows = currentWs.list_windows().filter(w => this._isWindowValidForLimit(w));

        // If current workspace exceeds limit
        if (normalWindows.length > limit) {
            const workspaceManager = global.workspace_manager;
            const nWorkspaces = workspaceManager.get_n_workspaces();
            const currentIndex = currentWs.index();
            const smartFill = this._settings.get_boolean('smart-workspace-fill');
            const autoSwitch = this._settings.get_boolean('auto-switch-workspace');

            let targetWs = null;

            if (smartFill) {
                // Find next existing workspace with available capacity
                for (let i = currentIndex + 1; i < nWorkspaces; i++) {
                    const ws = workspaceManager.get_workspace_by_index(i);
                    if (this._countWindowsOnWorkspace(ws) < limit) {
                        targetWs = ws;
                        break;
                    }
                }
            } else if (currentIndex + 1 < nWorkspaces) {
                targetWs = workspaceManager.get_workspace_by_index(currentIndex + 1);
            }

            // If all existing forward workspaces are full, allocate a new one
            if (!targetWs) {
                const isDynamic = this._mutterSettings ? this._mutterSettings.get_boolean('dynamic-workspaces') : true;

                if (isDynamic) {
                    try {
                        targetWs = workspaceManager.append_new_workspace(false, global.display.get_current_time());
                    } catch (e) {
                        console.error(`[WindowLimiter] Failed to append workspace: ${e.message}`);
                    }
                } else if (this._wmSettings) {
                    const numWorkspaces = this._wmSettings.get_int('num-workspaces');
                    this._wmSettings.set_int('num-workspaces', numWorkspaces + 1);
                    targetWs = workspaceManager.get_workspace_by_index(numWorkspaces);
                }
            }

            if (targetWs && window.get_workspace() !== targetWs) {
                const originWs = workspaceManager.get_active_workspace();
                window.change_workspace(targetWs);

                if (autoSwitch) {
                    targetWs.activate(global.get_current_time());
                    Main.activateWindow(window);
                } else {
                    // Stay on origin workspace without flicker
                    if (workspaceManager.get_active_workspace() !== originWs) {
                        originWs.activate(global.get_current_time());
                    }
                }
            }
        }
    }
}
