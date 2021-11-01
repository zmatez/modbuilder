//---- RENDERER --------------------------------------------------------------------------------------------------------
let {RendererController, RendererAdapter} = require('../../../init/controller_renderer');

// * --------- IMPORTS -----------
const tabpane = require('../../../gui/tabpane');
const explorer = require('../../../gui/fileexplorer');
const _mod = require('../../../mod/mod');
const progress = require('../../../mod/render/creator/progress');
// * -----------------------------

let rName = "creator";

class Adapter extends RendererAdapter{
    getName() {
        return rName;
    }
}

class CreatorController extends RendererController{
    /**
     * @type HTMLDivElement
     */
    header;
    /**
     * @type IMod
     */
    mod;
    /**
     * @type TabPane
     */
    menuPane;

    /**
     * @type {Object<?TabPane>}
     */
    contentPanes = {
        block: null,
        blockModel: null,
        item: null,
        texture: null
    }

    /**
     * @type {Object<?HTMLElement>}
     */
    tabExplorers = {
        block: null,
        blockModel: null,
        item: null,
        texture: null
    }

    /**
     * @type {Object<?FileExplorer>}
     */
    explorers = {
        block: null,
        blockModel: null,
        item: null,
        texture: null
    }

    /**
     * @type {Object<?function>}
     */
    callbacks = {
        block: {
            open: null
        },
        blockModel: {
            open: null
        },
        item: {
            open: null
        },
        texture: {
            open: null
        }
    }

    /**
     * @type AssetProgress
     */
    assetProgress;

    getName() {
        return rName;
    }

    // ! ===============================================================================================================
    onOpen(data) {
        global.modutils = require('../../../mod/util/modutils').ModUtils;

        this.mod = new IMod(data, (registry) => {
            //api.send("data:registry", registry);
        });

        global.mod = this.mod;

        // ? ---------------------------------------- HEADER -----------
        this.header = utils.byClass('header');
        this.createHeader()

        // ? ---------------------------------------- MENU -----------
        this.menuPane = new tabpane.PanelTabPane();
        this.menuPane.push(utils.byClass('menu-panel'), utils.byClass('menu-content'));
        // ? --- SETTINGS
        const tab_settings = require('../../../mod/render/creator/tabs/tab_settings');
        let tabSettings = this.createTab(new tab_settings.TabSettings(this));
        // ? --- ABOUT
        const tab_about = require('../../../mod/render/creator/tabs/tab_about');
        let tabAbout = this.createTab(new tab_about.TabAbout(this));
        // ? --- BLOCKS
        const tab_blocks = require('../../../mod/render/creator/tabs/tab_blocks');
        let tabBlocks = this.createTab(new tab_blocks.TabBlocks(this));
        tabBlocks.construct();
        // ? --- BLOCK MODELS
        const tab_block_models = require('../../../mod/render/creator/tabs/tab_block_models');
        let tabBlockModels = this.createTab(new tab_block_models.TabBlockModels(this));
        tabBlockModels.construct();
        // ? --- ITEMS
        const tab_items = require('../../../mod/render/creator/tabs/tab_items');
        let tabItems = this.createTab(new tab_items.TabItems(this));
        tabItems.construct();
        // ? --- TEXTURES
        const tab_textures = require('../../../mod/render/creator/tabs/tab_textures');
        let tabTextures = this.createTab(new tab_textures.TabTextures(this));
        tabTextures.construct();
        // ? --- REGISTRY
        const tab_registry = require('../../../mod/render/creator/tabs/tab_registry');
        let tabRegistry = this.createTab(new tab_registry.TabRegistry(this));
        tabRegistry.construct();
        /*
        // ? --- RECIPES
        let tabRecipes = new tabpane.ImageTab('Recipes','recipes-gray.svg','tab-editor','tab-recipes');
        //this.createTabBlocks(tabBlocks.element)
        this.menuPane.addTab(tabRecipes);
        this.menuPane.pop();
        // ? --- LANGUAGES
        let tabLanguages = new tabpane.ImageTab('Lang','languages-gray.svg','tab-editor','tab-languages');
        //this.createTabBlocks(tabBlocks.element)
        this.menuPane.addTab(tabLanguages);
        this.menuPane.pop();*/

        this.menuPane.pop()
        //----------

        // ? LOADER
        this.assetProgress = new progress.AssetProgress(utils.byClass('content'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Mod Data', 'mod_data'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Resources', 'resources'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Blockstates', 'blockstates'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Block Models', 'models_block'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Item Models', 'models_item'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Textures', 'textures'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Render', 'render'));
        this.assetProgress.start();

        this.receive('data:about', (data) => {
            tabAbout.data = data;
            tabAbout.construct()
        })
        this.receive('data:settings', (data) => {
            tabSettings.data = data;
            tabSettings.construct()
        })

        this.receive('data:assets',(data) => {
            console.log("Received assets")
            /**
             * @type {Mod}
             */
            global.mod = _mod.Mod.deserialize(data, () => {
                //todo transferCallback ?
            }, this);
        });

        this.receive('data:registry', (data) => {
            console.log("Received registry")
            mod.modRegistry.deserialize(data);
        });

        this.receive('data:render', (data) => {
            console.log("Rendering")
            this.explorers.block = explorer.FileExplorer.deserialize(this,data.blockstates, this.tabExplorers.block, this.callbacks.block);
            this.explorers.blockModel = explorer.FileExplorer.deserialize(this,data.blockModels, this.tabExplorers.blockModel, this.callbacks.blockModel);
            this.explorers.item = explorer.FileExplorer.deserialize(this,data.items, this.tabExplorers.item, this.callbacks.item);
            this.explorers.texture = explorer.FileExplorer.deserialize(this,data.textures, this.tabExplorers.texture, this.callbacks.texture);


            this.explorers.block.renderAsync(() => {
                this.callbacks.block.render(this.explorers.block);
                update(this.assetProgress);
            });

            this.explorers.blockModel.renderAsync(() => {
                this.callbacks.blockModel.render(this.explorers.blockModel);
                update(this.assetProgress);
            });

            this.explorers.item.renderAsync(() => {
                this.callbacks.item.render(this.explorers.item);
                update(this.assetProgress);
            });

            this.explorers.texture.renderAsync(() => {
                this.callbacks.texture.render(this.explorers.texture);
                update(this.assetProgress);
            });

            let rendered = 0;
            let max = 4;
            function update(assetProgress){
                rendered++;
                assetProgress.update({
                    render: {
                        value: rendered >= max,
                        info: rendered + "/" + max
                    }
                });
                if(rendered >= max){
                    assetProgress.finish()
                }
            }
        })

        this.receive('data:progress', (data) => {
            this.assetProgress.update(data.progress);
        });

        this.receive('data:reload', (data) => {
            this.assetProgress.start();
            this.reload();
        });

        // ? CREATE FOLDER
        this.receive('modal:create_folder', (data) => {
            let expl = data.origin.explorer;
            let index = data.origin.index;

            /**
             * @type ?FileExplorer
             */
            let rex;

            switch (expl){
                case "block":
                    rex = this.explorers.block;
                    break;
                case "blockModel":
                    rex = this.explorers.blockModel;
                    break;
                case "item":
                    rex = this.explorers.item;
                    break;
                case "texture":
                    rex = this.explorers.texture;
                    break;
            }

            if(rex != null){
                let parent = rex.allChilds[index];
                let path = null;

                if(!(parent instanceof explorer.Folder)){
                    path = (parent.path.substring(0, parent.path.lastIndexOf("/"))) + "/" + data.data;
                    parent = null;
                }
                rex.createFolder(data.data,path,parent);
            }
        })
    }

    onClose() {

    }

    reload(){

    }

    createHeader(){
        let headerData = document.createElement('div');
        headerData.classList.add("header-data");

        let project = document.createElement('div');
        project.classList.add("titlebox");
        project.innerText = "Project";

        let projectName = document.createElement('div');
        projectName.classList.add("project-name");
        projectName.innerText = this.mod.name;

        utils.addChild(headerData, project, projectName);
        utils.addChild(this.header, headerData);

        let headerData2 = document.createElement('div');
        headerData2.classList.add("header-data");

        let codename = document.createElement('div');
        codename.classList.add("titlebox");
        codename.innerText = "Codename";

        let codenameName = document.createElement('div');
        codenameName.classList.add("project-name");
        codenameName.innerText = this.mod.codename;

        utils.addChild(headerData2, codename, codenameName);
        utils.addChild(this.header, headerData2);

        // ? BUTTONS
        let buttons = document.createElement('div');
        buttons.classList.add("buttons");

        let buttonResources = new forms.IconButton('Resources','pack.svg',() => {
            this.sendMessage('open:resources','');
        });
        buttonResources.addTo(buttons);
        utils.addChild(this.header, buttons);
    }

    /**
     * @param tab {ITab}
     */
    createTab(tab){
        tab.createTab();
        this.menuPane.addTab(tab.tab);
        return tab;
    }
}

module.exports.adapter = new Adapter();
module.exports.controller = new CreatorController();
//----------------------------------------------------------------------------------------------------------------------

// ! -------------------------------------------------------------------------------------------------------------------