import {App, PluginSettingTab, Setting} from "obsidian";
import OrbitPlugin from "./main";

export interface OrbitSettings {
	OrbitSetting: string;
}

export const DEFAULT_SETTINGS: OrbitSettings = {
	OrbitSetting: 'default'
}

export class OrbitSettingTab extends PluginSettingTab {
	plugin: OrbitPlugin;

	constructor(app: App, plugin: OrbitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.OrbitSetting)
				.onChange(async (value) => {
					this.plugin.settings.OrbitSetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
