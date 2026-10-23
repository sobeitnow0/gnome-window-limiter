// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WindowLimiterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this.initTranslations();
        const settings = this.getSettings();

        // Settings Page
        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic',
        });

        // Group 1: Window Limits & Behavior
        const limitsGroup = new Adw.PreferencesGroup({
            title: _('Window Limits & Behavior'),
            description: _('Configure maximum allowed windows per workspace and transition behavior.'),
        });

        // Window Limit (SpinRow)
        const limitRow = new Adw.SpinRow({
            title: _('Window Limit'),
            subtitle: _('Maximum number of normal windows allowed per workspace (0 for unlimited).'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 30,
                step_increment: 1,
            }),
        });
        settings.bind('window-limit', limitRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        limitsGroup.add(limitRow);

        // Auto Switch Workspace (SwitchRow)
        const switchRow = new Adw.SwitchRow({
            title: _('Auto-Switch Workspace'),
            subtitle: _('Automatically switch view and focus to the target workspace when a window is moved.'),
        });
        settings.bind('auto-switch-workspace', switchRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        limitsGroup.add(switchRow);

        // Smart Workspace Fill (SwitchRow)
        const smartFillRow = new Adw.SwitchRow({
            title: _('Smart Workspace Fill'),
            subtitle: _('Place excess windows on the next workspace with available space before creating a new one.'),
        });
        settings.bind('smart-workspace-fill', smartFillRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        limitsGroup.add(smartFillRow);

        page.add(limitsGroup);

        // Group 2: Advanced & Exclusions
        const advancedGroup = new Adw.PreferencesGroup({
            title: _('Exclusions & Filters'),
            description: _('Fine-tune which windows count towards the workspace limit.'),
        });

        // Count Minimized Windows (SwitchRow)
        const minimizedRow = new Adw.SwitchRow({
            title: _('Count Minimized Windows'),
            subtitle: _('Include minimized windows when calculating the current workspace window limit.'),
        });
        settings.bind('count-minimized-windows', minimizedRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        advancedGroup.add(minimizedRow);

        // Primary Monitor Only (SwitchRow)
        const primaryRow = new Adw.SwitchRow({
            title: _('Apply Only to Primary Monitor'),
            subtitle: _('Ignore secondary monitor windows if workspaces are set to primary monitor only.'),
        });
        settings.bind('primary-monitor-only', primaryRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        advancedGroup.add(primaryRow);

        // Window Blacklist (EntryRow)
        const blacklistRow = new Adw.EntryRow({
            title: _('Window Blacklist'),
            subtitle: _('Comma-separated titles, classes, or App IDs to ignore (e.g. "chatgpt, vicinae, vlc").'),
        });
        settings.bind('window-blacklist', blacklistRow, 'text', Gio.SettingsBindFlags.DEFAULT);
        advancedGroup.add(blacklistRow);

        page.add(advancedGroup);
        window.add(page);
    }
}
