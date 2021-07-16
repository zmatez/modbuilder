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
        // ? --- ABOUT
        const tab_about = require('../../../mod/render/creator/tabs/tab_about');
        let tabAbout = this.createTab(new tab_about.TabAbout(this));
        // ? --- BLOCKS
        const tab_blocks = require('../../../mod/render/creator/tabs/tab_blocks');
        let tabBlocks = this.createTab(new tab_blocks.TabBlocks(this));
        tabBlocks.construct();
        /*
        // ? --- BLOCK MODELS
        let tabBlockModels = new tabpane.ImageTab('Models','models-gray.svg','tab-editor','tab-block-models');
        this.createTabBlockModels(tabBlockModels.element)
        this.menuPane.addTab(tabBlockModels);
        this.menuPane.pop();
        // ? --- ITEMS
        let tabItems = new tabpane.ImageTab('Items','items-gray.svg','tab-editor','tab-items');
        this.createTabItems(tabItems.element)
        this.menuPane.addTab(tabItems);
        this.menuPane.pop();
        // ? --- TEXTURES
        let tabTextures = new tabpane.ImageTab('Textures','textures-gray.svg','tab-editor','tab-textures');
        this.createTabTextures(tabTextures.element)
        this.menuPane.addTab(tabTextures);
        this.menuPane.pop();
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
        //----------

        // ? LOADER
        this.assetProgress = new progress.AssetProgress(utils.byClass('content'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Mod Data', 'mod_data'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Resources', 'resources'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Blockstates', 'blockstates'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Block Models', 'models_block'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Item Models', 'models_item'));
        this.assetProgress.addEntry(new progress.AssetProgressEntry('Textures', 'textures'));
        this.assetProgress.start();

        this.receive('data:about', (data) => {
            tabAbout.data = data;
            tabAbout.construct()
        })

        this.receive('data:assets',(data) => {
            console.log("Received assets")
            /**
             * @type {Mod}
             */
            global.mod = _mod.Mod.deserialize(data, () => {
                //todo transferCallback ?
            })
        });

        this.receive('data:registry', (data) => {
            console.log("Received registry")
            mod.modRegistry.deserialize(data);
        });

        this.receive('data:render', (data) => {
            console.log("Rendering")
            this.explorers.block = explorer.FileExplorer.deserialize(data.blockstates, this.tabExplorers.block, this.callbacks.block);
            this.explorers.block.renderAsync(() => {

            });

            /*this.itemExplorer = explorer.FileExplorer.deserialize(data.items, this.tabItemExplorer, {
                openFile: this.openItemCallback
            });
            this.itemExplorer.renderAsync(() => {

            });

            this.textureExplorer = explorer.FileExplorer.deserialize(data.textures, this.tabTextureExplorer, {
                openFile: this.openTextureCallback
            });
            this.textureExplorer.renderAsync(() => {

            });*/
        })

        this.receive('data:progress', (data) => {
            this.assetProgress.update(data.progress);
            if(data.loaded){
                this.assetProgress.finish()
            }
        });

        this.receive('data:reload', (data) => {
            this.assetProgress.start();
            this.reload();
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

    /**
     * @param element {HTMLElement}
     */
    createTabBlocks(element){
        // ? -------------------------- MENU ---------
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("item-explorer-holder")
        let toolbar = createToolbar((text) => {
            if(this.blockExplorer != null){
                this.blockExplorer.search(text)
            }
        }, (name, callback) => {
            if(this.blockExplorer != null){
                let folder = this.blockExplorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabBlocksExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        /**
         * @param searchCallback {function(string)}
         * @param newFolderCallback {function(string, function)}
         * @return {HTMLDivElement}
         */
        function createToolbar(searchCallback, newFolderCallback){
            let toolbar = document.createElement('div');
            toolbar.classList.add("explorer-toolbar");

            let search = new forms.FormField('search-bar',"");
            search.placeholder = "Search";
            search.changeListeners.push((entry) => {
                searchCallback(search.getValue());
            })

            utils.addChild(toolbar, search.getElement());

            //buttons
            let buttons = document.createElement('div');
            buttons.classList.add('buttons');

            function createButton(name, icon, action){
                let button = new forms.IconButton(name, icon, action);
                button.addTo(buttons);
                return button;
            }

            createButton("New asset", "new_file.svg", () => {

            })

            /**
             * @type {?FormTooltip}
             */
            let newFolderTooltip = null;
            createButton("New folder", "new_folder.svg", () => {
                if(newFolderTooltip != null){
                    newFolderTooltip.hide();
                    newFolderTooltip = null;
                    return
                }
                newFolderTooltip = new tooltips.FormTooltip(buttons, "Add new folder", 'new_folder.svg', '', 'Create', 'Cancel', (form) => {
                    let name = form.serialize()['folder-name'];
                    newFolderCallback(name, () => {
                        newFolderTooltip.hide();
                    });
                }, 'media-folder-create', (element) => {
                    let form = new Form(element);
                    form.push();
                    let nameField = new forms.FormField('folder-name', "Name");
                    form.addEntries(nameField);
                    form.pop();
                    return form;
                });
                newFolderTooltip.placementY = "above";
                newFolderTooltip.show();
                newFolderTooltip.addHideEvent(() => {
                    newFolderTooltip = null;
                })
            })

            createButton("Copy", "copy.svg", () => {

            })

            createButton("Delete", "delete.svg", () => {

            })

            utils.addChild(toolbar, buttons);

            return toolbar;
        }

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");

        utils.addChild(element, rightBox);

        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.blockstateContentPane = new tabpane.LimitedTabPane();
        this.blockstateContentPane.push(contentTabHolder, content);
        /**
         * @param element {HTMLElement}
         */
        this.blockstateContentPane.setEmptyHTML = (element) => {
            let emptyHolder = document.createElement('div');
            emptyHolder.classList.add('empty-holder','center-flex');
            let empty = document.createElement('div');
            empty.classList.add("empty");

            let title = document.createElement('h1');
            title.innerHTML = "Nothing's here";
            let text1 = document.createElement('div');
            text1.innerHTML = "<span>Click</span> on any file to select";
            let text2 = document.createElement('div');
            text2.innerHTML = "<span>Double Click</span> on any file to edit";
            let text3 = document.createElement('div');
            text3.innerHTML = "<span>CTRL + Click</span> on files to select multiple";
            let text4 = document.createElement('div');
            text4.innerHTML = "<span>SHIFT + Click</span> on two files to select all between them";
            let text5 = document.createElement('div');
            text5.innerHTML = "<span>RClick</span> on any file(s) shows options";
            utils.addChild(empty, title, text1,text2,text3,text4,text5);
            utils.addChild(emptyHolder, empty);
            utils.addChild(element, emptyHolder);
        }
        this.blockstateContentPane.pop();

        this.openBlockstateCallback = (file) => {
            if(file instanceof explorer.BlockFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.blockstateContentPane.tabs) {
                    if(tab instanceof BlockTab && tab.blockFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new BlockTab(file);
                    this.blockstateContentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.blockstateContentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }
    }

    /**
     * @param element {HTMLElement}
     */
    createTabBlockModels(element){
        // ? -------------------------- MENU ---------
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("item-explorer-holder")
        let toolbar = createToolbar((text) => {
            if(this.blockExplorer != null){
                this.blockExplorer.search(text)
            }
        }, (name, callback) => {
            if(this.blockExplorer != null){
                let folder = this.blockExplorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabBlocksExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        /**
         * @param searchCallback {function(string)}
         * @param newFolderCallback {function(string, function)}
         * @return {HTMLDivElement}
         */
        function createToolbar(searchCallback, newFolderCallback){
            let toolbar = document.createElement('div');
            toolbar.classList.add("explorer-toolbar");

            let search = new forms.FormField('search-bar',"");
            search.placeholder = "Search";
            search.changeListeners.push((entry) => {
                searchCallback(search.getValue());
            })

            utils.addChild(toolbar, search.getElement());

            //buttons
            let buttons = document.createElement('div');
            buttons.classList.add('buttons');

            function createButton(name, icon, action){
                let button = new forms.IconButton(name, icon, action);
                button.addTo(buttons);
                return button;
            }

            createButton("New asset", "new_file.svg", () => {

            })

            /**
             * @type {?FormTooltip}
             */
            let newFolderTooltip = null;
            createButton("New folder", "new_folder.svg", () => {
                if(newFolderTooltip != null){
                    newFolderTooltip.hide();
                    newFolderTooltip = null;
                    return
                }
                newFolderTooltip = new tooltips.FormTooltip(buttons, "Add new folder", 'new_folder.svg', '', 'Create', 'Cancel', (form) => {
                    let name = form.serialize()['folder-name'];
                    newFolderCallback(name, () => {
                        newFolderTooltip.hide();
                    });
                }, 'media-folder-create', (element) => {
                    let form = new Form(element);
                    form.push();
                    let nameField = new forms.FormField('folder-name', "Name");
                    form.addEntries(nameField);
                    form.pop();
                    return form;
                });
                newFolderTooltip.placementY = "above";
                newFolderTooltip.show();
                newFolderTooltip.addHideEvent(() => {
                    newFolderTooltip = null;
                })
            })

            createButton("Copy", "copy.svg", () => {

            })

            createButton("Delete", "delete.svg", () => {

            })

            utils.addChild(toolbar, buttons);

            return toolbar;
        }

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");

        utils.addChild(element, rightBox);

        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.blockstateContentPane = new tabpane.LimitedTabPane();
        this.blockstateContentPane.push(contentTabHolder, content);
        /**
         * @param element {HTMLElement}
         */
        this.blockstateContentPane.setEmptyHTML = (element) => {
            let emptyHolder = document.createElement('div');
            emptyHolder.classList.add('empty-holder','center-flex');
            let empty = document.createElement('div');
            empty.classList.add("empty");

            let title = document.createElement('h1');
            title.innerHTML = "Nothing's here";
            let text1 = document.createElement('div');
            text1.innerHTML = "<span>Click</span> on any file to select";
            let text2 = document.createElement('div');
            text2.innerHTML = "<span>Double Click</span> on any file to edit";
            let text3 = document.createElement('div');
            text3.innerHTML = "<span>CTRL + Click</span> on files to select multiple";
            let text4 = document.createElement('div');
            text4.innerHTML = "<span>SHIFT + Click</span> on two files to select all between them";
            let text5 = document.createElement('div');
            text5.innerHTML = "<span>RClick</span> on any file(s) shows options";
            utils.addChild(empty, title, text1,text2,text3,text4,text5);
            utils.addChild(emptyHolder, empty);
            utils.addChild(element, emptyHolder);
        }
        this.blockstateContentPane.pop();

        this.openBlockstateCallback = (file) => {
            if(file instanceof explorer.BlockFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.blockstateContentPane.tabs) {
                    if(tab instanceof BlockTab && tab.blockFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new BlockTab(file);
                    this.blockstateContentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.blockstateContentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }
    }

    /**
     * @param element {HTMLElement}
     */
    createTabItems(element){
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("item-explorer-holder")
        let toolbar = createToolbar((text) => {
            if(this.itemExplorer != null){
                this.itemExplorer.search(text)
            }
        }, (name, callback) => {
            if(this.itemExplorer != null){
                let folder = this.itemExplorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabItemExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        /**
         * @param searchCallback {function(string)}
         * @param newFolderCallback {function(string, function)}
         * @return {HTMLDivElement}
         */
        function createToolbar(searchCallback, newFolderCallback){
            let toolbar = document.createElement('div');
            toolbar.classList.add("explorer-toolbar");

            let search = new forms.FormField('search-bar',"");
            search.placeholder = "Search";
            search.changeListeners.push((entry) => {
                searchCallback(search.getValue());
            })

            utils.addChild(toolbar, search.getElement());

            //buttons
            let buttons = document.createElement('div');
            buttons.classList.add('buttons');

            function createButton(name, icon, action){
                let button = new forms.IconButton(name, icon, action);
                button.addTo(buttons);
                return button;
            }

            createButton("New asset", "new_file.svg", () => {

            })

            /**
             * @type {?FormTooltip}
             */
            let newFolderTooltip = null;
            createButton("New folder", "new_folder.svg", () => {
                if(newFolderTooltip != null){
                    newFolderTooltip.hide();
                    newFolderTooltip = null;
                    return
                }
                newFolderTooltip = new tooltips.FormTooltip(buttons, "Add new folder", 'new_folder.svg', '', 'Create', 'Cancel', (form) => {
                    let name = form.serialize()['folder-name'];
                    newFolderCallback(name, () => {
                        newFolderTooltip.hide();
                    });
                }, 'media-folder-create', (element) => {
                    let form = new Form(element);
                    form.push();
                    let nameField = new forms.FormField('folder-name', "Name");
                    form.addEntries(nameField);
                    form.pop();
                    return form;
                });
                newFolderTooltip.placementY = "above";
                newFolderTooltip.show();
                newFolderTooltip.addHideEvent(() => {
                    newFolderTooltip = null;
                })
            })

            createButton("Copy", "copy.svg", () => {

            })

            createButton("Delete", "delete.svg", () => {

            })

            utils.addChild(toolbar, buttons);

            return toolbar;
        }

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");

        utils.addChild(element, rightBox);

        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.itemContentPane = new tabpane.LimitedTabPane();
        this.itemContentPane.push(contentTabHolder, content);
        /**
         * @param element {HTMLElement}
         */
        this.itemContentPane.setEmptyHTML = (element) => {
            let emptyHolder = document.createElement('div');
            emptyHolder.classList.add('empty-holder','center-flex');
            let empty = document.createElement('div');
            empty.classList.add("empty");

            let title = document.createElement('h1');
            title.innerHTML = "Nothing's here";
            let text1 = document.createElement('div');
            text1.innerHTML = "<span>Click</span> on any file to select";
            let text2 = document.createElement('div');
            text2.innerHTML = "<span>Double Click</span> on any file to edit";
            let text3 = document.createElement('div');
            text3.innerHTML = "<span>CTRL + Click</span> on files to select multiple";
            let text4 = document.createElement('div');
            text4.innerHTML = "<span>SHIFT + Click</span> on two files to select all between them";
            let text5 = document.createElement('div');
            text5.innerHTML = "<span>RClick</span> on any file(s) shows options";
            utils.addChild(empty, title, text1,text2,text3,text4,text5);
            utils.addChild(emptyHolder, empty);
            utils.addChild(element, emptyHolder);
        }
        this.itemContentPane.pop();

        this.openItemCallback = (file) => {
            if(file instanceof explorer.ItemFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.itemContentPane.tabs) {
                    if(tab instanceof ItemTab && tab.itemFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new ItemTab(file);
                    this.itemContentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.itemContentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }

        utils.addChild(element, leftBox, rightBox);
    }

    /**
     * @param element {HTMLElement}
     */
    createTabTextures(element){
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("texture-explorer-holder")
        let toolbar = createToolbar((text) => {
            if(this.textureExplorer != null){
                this.textureExplorer.search(text)
            }
        }, (name, callback) => {
            if(this.textureExplorer != null){
                let folder = this.textureExplorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabTextureExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        /**
         * @param searchCallback {function(string)}
         * @param newFolderCallback {function(string, function)}
         * @return {HTMLDivElement}
         */
        function createToolbar(searchCallback, newFolderCallback){
            let toolbar = document.createElement('div');
            toolbar.classList.add("explorer-toolbar");

            let search = new forms.FormField('search-bar',"");
            search.placeholder = "Search";
            search.changeListeners.push((entry) => {
                searchCallback(search.getValue());
            })

            utils.addChild(toolbar, search.getElement());

            //buttons
            let buttons = document.createElement('div');
            buttons.classList.add('buttons');

            function createButton(name, icon, action){
                let button = new forms.IconButton(name, icon, action);
                button.addTo(buttons);
                return button;
            }

            createButton("New asset", "new_file.svg", () => {

            })

            /**
             * @type {?FormTooltip}
             */
            let newFolderTooltip = null;
            createButton("New folder", "new_folder.svg", () => {
                if(newFolderTooltip != null){
                    newFolderTooltip.hide();
                    newFolderTooltip = null;
                    return
                }
                newFolderTooltip = new tooltips.FormTooltip(buttons, "Add new folder", 'new_folder.svg', '', 'Create', 'Cancel', (form) => {
                    let name = form.serialize()['folder-name'];
                    newFolderCallback(name, () => {
                        newFolderTooltip.hide();
                    });
                }, 'media-folder-create', (element) => {
                    let form = new Form(element);
                    form.push();
                    let nameField = new forms.FormField('folder-name', "Name");
                    form.addEntries(nameField);
                    form.pop();
                    return form;
                });
                newFolderTooltip.placementY = "above";
                newFolderTooltip.show();
                newFolderTooltip.addHideEvent(() => {
                    newFolderTooltip = null;
                })
            })

            createButton("Copy", "copy.svg", () => {

            })

            createButton("Delete", "delete.svg", () => {

            })

            utils.addChild(toolbar, buttons);

            return toolbar;
        }

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");

        utils.addChild(element, rightBox);

        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.textureContentPane = new tabpane.LimitedTabPane();
        this.textureContentPane.push(contentTabHolder, content);
        /**
         * @param element {HTMLElement}
         */
        this.textureContentPane.setEmptyHTML = (element) => {
            let emptyHolder = document.createElement('div');
            emptyHolder.classList.add('empty-holder','center-flex');
            let empty = document.createElement('div');
            empty.classList.add("empty");

            let title = document.createElement('h1');
            title.innerHTML = "Nothing's here";
            let text1 = document.createElement('div');
            text1.innerHTML = "<span>Click</span> on any file to select";
            let text2 = document.createElement('div');
            text2.innerHTML = "<span>Double Click</span> on any file to edit";
            let text3 = document.createElement('div');
            text3.innerHTML = "<span>CTRL + Click</span> on files to select multiple";
            let text4 = document.createElement('div');
            text4.innerHTML = "<span>SHIFT + Click</span> on two files to select all between them";
            let text5 = document.createElement('div');
            text5.innerHTML = "<span>RClick</span> on any file(s) shows options";
            utils.addChild(empty, title, text1,text2,text3,text4,text5);
            utils.addChild(emptyHolder, empty);
            utils.addChild(element, emptyHolder);
        }
        this.textureContentPane.pop();

        this.openTextureCallback = (file) => {
            if(file instanceof explorer.TextureFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.textureContentPane.tabs) {
                    if(tab instanceof TextureTab && tab.textureFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new TextureTab(file);
                    this.textureContentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.textureContentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }

        utils.addChild(element, leftBox, rightBox);
    }
}

module.exports.adapter = new Adapter();
module.exports.controller = new CreatorController();
//----------------------------------------------------------------------------------------------------------------------

// ! -------------------------------------------------------------------------------------------------------------------

class ItemTab extends tabpane.ElementTab{
    /**
     * @type ItemFile
     */
    itemFile;

    /**
     * @type Item
     */
    item;

    /**
     * @param itemFile {ItemFile}
     */
    constructor(itemFile) {
        super(itemFile.getName(), itemFile.getIcon(), '45D32C');
        this.itemFile = itemFile;
        this.item = itemFile.getItem();
    }

    make(content) {
        content.classList.add('element-tab-content');
        // ? LEFT
        let contentLeft = document.createElement('div');
        contentLeft.classList.add("element-content-left");

        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Properties";
            utils.addChild(section, header);

            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Codename");
            name.setValue(this.itemFile.getName());
            let displayName = new forms.FormField('display_name','Display Name');//todo display name
            displayName.bottomHTML = "More languages are available in Languages tab.";
            form.addEntries(name, displayName);
            form.pop()

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Parent";
            utils.addChild(section, header);

            let parent = this.item.findParent();
            let itemParent = document.createElement('div');
            itemParent.classList.add("item-parent-section");
            if(this.item.parent == null || parent == null){
                itemParent.classList.add("item-parent-empty");
                if(this.item.parent == null){
                    itemParent.innerHTML = "This item has no parent specified."
                }else{
                    itemParent.innerHTML = "Unable to find parent in the Registry: " + this.item.parent;
                }
            }else{
                const {BlockModel, Item} = require('../../../mod/resource/assets');
                let modelmenu = require('../../../mod/render/creator/modelmenu');
                if(parent instanceof Item){
                    let item = new modelmenu.ItemVisual(parent,1);
                    item.showTextures = false;
                    utils.addChild(itemParent, item.construct());
                }else if(parent instanceof BlockModel){
                    let model = new modelmenu.ModelVisual(parent, 1);
                    model.showTextures = false;
                    utils.addChild(itemParent, model.construct());
                }else{
                    //rip
                }
            }
            utils.addChild(section, itemParent);

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Parent Texture Diagram";
            utils.addChild(section, header);

            let modelmenu = require('../../../mod/render/creator/modelmenu');
            let diagram = new modelmenu.ParentTextureDiagram(section, this.item);
            diagram.construct();

            utils.addChild(contentLeft, section);
        }

        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");
        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Item View";
        utils.addChild(header, headerText);
        let modelContent = document.createElement('div');
        modelContent.classList.add("model-content");

        //let ModelRender = require('minerender/src/model');
        //let render = new ModelRender({}, modelContent);
        //render.render(['block/stone']);

        utils.addChild(contentRight, header, modelContent);
        //
        utils.addChild(content, contentLeft, contentRight);
    }

    onOpen() {
        super.onOpen();
        this.itemFile.open();
    }

    onClose() {
        super.onClose();
        this.itemFile.close();
    }
}

class TextureTab extends tabpane.ElementTab{
    /**
     * @type TextureFile
     */
    textureFile;

    /**
     * @type Texture
     */
    texture;

    /**
     * @param textureFile {TextureFile}
     */
    constructor(textureFile) {
        super(textureFile.getName(), textureFile.getIcon(), '45D32C');
        this.textureFile = textureFile;
        this.texture = textureFile.getTexture();
    }

    make(content) {
        content.classList.add('element-tab-content');
        // ? LEFT
        let contentLeft = document.createElement('div');
        contentLeft.classList.add("element-content-left");

        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Properties";
            utils.addChild(section, header);

            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Name");
            name.setValue(this.textureFile.getName());
            form.addEntry(name);
            form.pop()

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Usages";
            utils.addChild(section, header);

            let modelmenu = require('../../../mod/render/creator/modelmenu');
            let textureUsageList = new modelmenu.TextureUsageList(section, this.texture);
            setTimeout(() => {
                textureUsageList.construct();
            }, 0)

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Animation";
            utils.addChild(section, header);



            utils.addChild(contentLeft, section);
        }

        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right",'texture-content-right');

        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Texture View";
        utils.addChild(header, headerText);
        let textureContent = document.createElement('div');
        textureContent.classList.add("texture-content");
        let textureImg = document.createElement('img');
        textureImg.src = this.texture.path;
        utils.addChild(textureContent, textureImg);
        let textureTools = document.createElement('div');
        textureTools.classList.add("texture-tools");
        {
            // * tools
            let toolOpen = new forms.IconButton('Open in explorer', 'open.svg',() => {

            });
            toolOpen.addTo(textureTools);
            let toolEdit = new forms.IconButton('Edit', 'edit.svg',() => {

            });
            toolEdit.addTo(textureTools);

        }

        utils.addChild(contentRight, header, textureContent, textureTools);


        //
        utils.addChild(content, contentLeft, contentRight);
    }

    onOpen() {
        super.onOpen();
        this.textureFile.open();
    }

    onClose() {
        super.onClose();
        this.textureFile.close();
    }
}
