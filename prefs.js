import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WindowLimiterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Create the settings page using native Libadwaita styling
        const page = new Adw.PreferencesPage({
            title: 'Configurações',
            icon_name: 'preferences-system-symbolic',
        });

        // Group settings together
        const group = new Adw.PreferencesGroup({
            title: 'Configurações do Limitador',
            description: 'Configure o limite de janelas e o comportamento da transição.',
        });
        page.add(group);
        window.add(page);

        // Window Limit input field (SpinRow)
        const limitRow = new Adw.SpinRow({
            title: 'Limite de Janelas',
            subtitle: 'Número máximo de janelas normais permitidas em cada área de trabalho virtual.',
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
            title: 'Alternar Área de Trabalho Automaticamente',
            subtitle: 'Se ativado, foca a nova área de trabalho quando uma janela for redirecionada.',
        });
        group.add(switchRow);
        settings.bind('auto-switch-workspace', switchRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
