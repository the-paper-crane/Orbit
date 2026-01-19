import {App, Editor, MarkdownView, Modal, Notice, Plugin, Setting} from 'obsidian';
import {DEFAULT_SETTINGS, OrbitSettings, OrbitSettingTab} from "./settings";

export const ControlPanelType = 'control-panel'

export default class OrbitPlugin extends Plugin {
	settings: OrbitSettings;

	//
	async onload() {
		await this.loadSettings();

		// 
		this.addRibbonIcon('satellite', 'Orbit', () => {
			// 
			new Notice('');
		});

		// 
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('');

		// 
		this.addCommand({
			id: '',
			name: '',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// 
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// 
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// 
					// 
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// 
					return true;
				}
				return false;
			}
		});

		//
		this.addCommand({
			id: 'launch-satellite',
			name: 'Launch Satellite',
			callback: () => {
				new LaunchSatelliteModal(this.app, (projectTitle) => {
					this.createSatelliteNote(projectTitle);
				}).open();
			}
		});

		// 
		this.addSettingTab(new OrbitSettingTab(this.app, this));

	}

	//
	async createSatelliteNote(projectTitle: string) {
		//
		const fileName = `SAT-${projectTitle}.md`;
		const today = new Date().toISOString().split('T')[0];
		
		//
		const frontmatter = [
			'---',
			'type: satellite',
			'satellite-id: SAT-001',
			`project: ${projectTitle}`,
			'status: active',
			'constellation: ',
			`launched: ${today}`,
			'---',
			''
		].join('\n');
		const content = `${frontmatter}`
		
		//
		try {
			await this.app.vault.create(fileName, content);
			new Notice(`Launching SAT-${projectTitle}...`);
		} catch(error) {
			new Notice(`Satellite already in orbit. \n ${error}`);
		}
	}

	//
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<OrbitSettings>);
	}

	//
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LaunchSatelliteModal extends Modal {
    result: string;
    onSubmit: (result: string) => void;

	// set up the modal
    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

	// build UI here
    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl("h2", { text: "Launch New Satellite" });

        new Setting(contentEl)
            .setName("Project Name")
            .addText((text) =>
                text.onChange((value) => {
                    this.result = value;
                })
            );

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Launch")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result);
                    })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
