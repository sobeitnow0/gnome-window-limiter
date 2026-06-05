import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WindowLimiterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Prevent settings from being garbage-collected while the window is open
        window._settings = settings;

        // Create the settings page using native Libadwaita styling
        const page = new Adw.PreferencesPage({
            title: 'Settings',
            icon_name: 'preferences-system-symbolic',
        });

        // Group settings together
        const group = new Adw.PreferencesGroup({
            title: 'Window Limiter Settings',
            description: 'Configure window limits and transition behavior.',
        });
        page.add(group);
        window.add(page);

        // Window Limit input field (SpinRow)
        const limitRow = new Adw.SpinRow({
            title: 'Window Limit',
            subtitle: 'Maximum number of normal windows allowed per workspace.',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 20,
                step_increment: 1,
            }),
        });
        group.add(limitRow);
        settings.bind('window-limit', limitRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Auto Switch toggle switch (SwitchRow)
        const switchRow = new Adw.SwitchRow({
            title: 'Auto-Switch Workspace',
            subtitle: 'If enabled, automatically focuses the target workspace when a window is moved.',
        });
        group.add(switchRow);
        settings.bind('auto-switch-workspace', switchRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
