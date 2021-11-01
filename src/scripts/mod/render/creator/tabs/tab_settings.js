const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');

class TabSettings extends ITab{

    createTab() {
        this.tab = new tabpane.AnimatedImageTab('Settings','setting2_gray.png','setting2.png','tab-settings');

        this.element = this.tab.element;
    }

    construct() {
        this.element.classList.remove('center-flex');
        utils.clear(this.element);

        let form = new Form(this.element);
        form.push();

        this.createSection("Resources", form);
        let resourcesPanel = document.createElement('div');
        resourcesPanel.classList.add("resources-panel");
        let resourcesHeader = document.createElement('h4');
        resourcesHeader.innerText = "Loaded resources";
        let resourcesDescription = document.createElement('p');
        resourcesDescription.classList.add("resources-description");
        resourcesDescription.innerText = "Resources allow you to import external resource folder, like from Minecraft and use it in your files."

        utils.addChild(resourcesPanel, resourcesHeader, resourcesDescription);

        if(mod.modResources.count() === 0){
            let resourcesStatus = document.createElement('p');
            resourcesStatus.classList.add("resources-status");
            resourcesStatus.innerText = "No resources loaded.";
            utils.addChild(resourcesPanel, resourcesStatus);
        }else{
            let resourceTable = document.createElement('table');
            let header = document.createElement('tr');
            let headerName = document.createElement('th');
            headerName.innerText = "Name";
            let headerBlocks = document.createElement('th');
            headerBlocks.innerText = "Blocks";
            let headerModels = document.createElement('th');
            headerModels.innerText = "Block Models";
            let headerItems = document.createElement('th');
            headerItems.innerText = "Items";
            let headerTextures = document.createElement('th');
            headerTextures.innerText = "Textures";

            utils.addChild(header, headerName, headerBlocks, headerModels, headerItems, headerTextures);

            for (let key in mod.modResources.resources) {
                let value = mod.modResources.resources[key];
                let codename = value.codename;
                let blocksCount = 0;
                let blockModelsCount = 0;
                let itemsCount = 0;
                let texturesCount = 0;

                for (let key in mod.modRegistry.blocks) {
                    let value = mod.modRegistry.blocks[key];
                    if(value.codename === codename){
                        blocksCount++;
                    }
                }
                for (let key in mod.modRegistry.blockModels) {
                    let value = mod.modRegistry.blockModels[key];
                    if(value.codename === codename){
                        blockModelsCount++;
                    }
                }
                for (let key in mod.modRegistry.items) {
                    let value = mod.modRegistry.items[key];
                    if(value.codename === codename){
                        itemsCount++;
                    }
                }
                for (let key in mod.modRegistry.textures) {
                    let value = mod.modRegistry.textures[key];
                    if(value.codename === codename){
                        texturesCount++;
                    }
                }

                let row = document.createElement('tr');

                let name = document.createElement('td');
                name.innerText = codename;
                let blocks = document.createElement('td');
                blocks.innerText = blocksCount;
                let models = document.createElement('td');
                models.innerText = blockModelsCount;
                let items = document.createElement('td');
                items.innerText = itemsCount;
                let textures = document.createElement('td');
                textures.innerText = texturesCount;

                utils.addChild(row, name, blocks, models, items, textures);
                utils.addChild(resourceTable,row);
            }

            utils.addChild(resourceTable, header);
        }
    }

    /**
     * @param name {string}
     * @param form {Form}
     */
    createSection(name, form){
        let text = document.createElement('h3');
        text.innerText = name;
        text.classList.add("setting-section");

        form.addElement(text);
    }
}

module.exports.TabSettings = TabSettings;