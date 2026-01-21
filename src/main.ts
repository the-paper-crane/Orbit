import {App, ItemView, Modal, Notice, Plugin, Setting, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, OrbitSettings, OrbitSettingTab} from "./settings";

const VIEW_TYPE_ORBIT_CONTROL = "orbit-control-panel";

export default class OrbitPlugin extends Plugin {
	settings: OrbitSettings;

	//
	async onload() {
		await this.loadSettings();

		//
		this.registerView(
			VIEW_TYPE_ORBIT_CONTROL,
			(leaf) => new OrbitControlView(leaf)
		);
		
		// 
		this.addRibbonIcon('satellite', 'Orbit', () => {
			// 
			new Notice('Orbit');
		});

		// 
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Satellite');

		//
		this.addCommand({
			id: 'launch-satellite',
			name: 'Launch satellite',
			callback: () => {
				new LaunchSatelliteModal(this.app, (projectTitle) => {
					void this.createSatelliteNote(projectTitle);
				}).open();
			}
		});
		
		//
		this.addCommand({
			id: 'open-orbit-control',
			name: 'Open control panel',
			callback: () => {
				void this.activateView();
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
			'constellation:',
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
			new Notice(`Satellite already in orbit. \n ${String(error)}`);
		}
	}

	// open the control panel leaf
	async activateView() {
		const { workspace } = this.app;
		// find the first instance of the control panel, if this exists
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_ORBIT_CONTROL)[0];
		// otherwise, open to satellites
		if (!leaf) {
			// initialise in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				// create panel of type orbit control
				await leaf.setViewState({
					type: VIEW_TYPE_ORBIT_CONTROL,
					active: true,
				});
			}
		}
		// switch to orbit control panel leaf
		if (leaf) {
			void workspace.revealLeaf(leaf);
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
        
        contentEl.createEl("h2", { text: "Launch new satellite" });

        new Setting(contentEl)
            .setName("Project name")
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

class OrbitControlView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

	//
    getViewType() {
        return VIEW_TYPE_ORBIT_CONTROL;
    }

	//
    getDisplayText() {
        return "Orbit";
    }

	//
    getIcon() {
        return "satellite";
    }

	//
    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl("h4", { text: "Satellite control panel" });
        
        // 
        const satelliteList = contentEl.createEl("div", { cls: "orbit-satellite-list" });
        await this.renderSatellites(satelliteList);
    }

	//
    async onClose() {
        // 
    }

	//
    async renderSatellites(container: HTMLElement) {
		container.empty();
		
		// 
		const files = this.app.vault.getMarkdownFiles();
		
		const satellites = [];
		
		// 
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			
			if (cache?.frontmatter && cache.frontmatter.type === 'satellite') {
				satellites.push({
					file: file,
					frontmatter: cache.frontmatter
				});
			}
		}
		
    
		//
		if (satellites.length === 0) {
			container.createEl("p", { 
				text: "Orbit is empty. Launch to start...",
				cls: "orbit-empty-state"
			});
			return;
		}
		
		const header = container.createEl("div", { 
			text: `Active satellites: ${satellites.length}`,
			cls: "orbit-header"
		});
		header.setCssStyles({ marginBottom: "12px" });
		
		// 
		const list = container.createEl("div", { cls: "orbit-satellite-container" });
		
		for (const sat of satellites) {
			const item = list.createEl("div", { cls: "tree-item-self is-clickable orbit-satellite-item" });
			
			const itemInner = item.createEl("div", { cls: "tree-item-inner" });
			itemInner.createEl("span", { 
				text: (sat.frontmatter.project as string) || "Unknown Mission",
				cls: "tree-item-inner-text"
			});
			
			const itemFlair = item.createEl("div", { cls: "tree-item-flair-outer" });
			const statusIndicator = itemFlair.createEl("span", { cls: "orbit-status-indicator" });

			//
			const isActive = sat.frontmatter.status === 'active';
			const svg = statusIndicator.createSvg("svg", {
				attr: { width: "12", height: "12", viewBox: "0 0 12 12" }
			  });
			  svg.createSvg("circle", {
				attr: {
				  cx: "6",
				  cy: "6",
				  r: "5",
				  fill: isActive ? 'var(--interactive-accent)' : 'none',
				  stroke: "var(--interactive-accent)",
				  "stroke-width": "1.5"
				}
			  });
			
			// 
			item.addEventListener('click', () => {
				void this.app.workspace.getLeaf().openFile(sat.file);
			});
		}
	}
}