const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const contextmenu = require('../../../../gui/context-menu');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabBlockModels extends ITab{
    /**
     * @type FileExplorer
     */
    explorer;
    /**
     * @type HTMLElement
     */
    tabExplorer;
    /**
     * @type TabPane
     */
    contentPane;
    /**
     * @type function
     */
    openCallback;

    //
    /**
     * @type HTMLElement
     */
    toolbar;

    createTab() {
        this.tab = new tabpane.AnimatedImageTab('Models','models_gray.svg','model.svg','tab-editor','tab-block-models');
        this.element = this.tab.element;
    }

    construct() {
        // ? -------------------------- MENU ---------
        let leftBox = document.createElement('div');
        leftBox.classList.add("left-box");

        let expl = document.createElement('div');
        expl.classList.add("file-explorer-holder")
        let toolbar = this.createToolbar((text) => {
            if(this.explorer != null){
                this.explorer.search(text)
            }
        }, (name, callback) => {
            if(this.explorer != null){
                let folder = this.explorer.createFolder(name, this.mod.blockStatePath, null, callback);
            }
        });

        this.tabExplorer = expl;
        utils.addChild(leftBox, expl, toolbar);

        // ? -------------------------- CONTENT ---------
        let rightBox = document.createElement('div');
        rightBox.classList.add("right-box");


        let contentTabHolder = document.createElement('div');
        contentTabHolder.classList.add("editor-content-tab-holder");

        let content = document.createElement('div');
        content.classList.add("editor-content");

        utils.addChild(rightBox, contentTabHolder, content);

        this.contentPane = new tabpane.LimitedTabPane();
        this.contentPane.push(contentTabHolder, content);
        this.contentPane.setEmptyHTML = this.emptyHTML
        this.contentPane.pop();

        this.openCallback = (file) => {
            if(file instanceof explorer.BlockModelFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof BlockModelTab && tab.blockModelFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new BlockModelTab(file);
                    this.contentPane.addTab(tab);
                    tab.clicked()
                }else{
                    this.contentPane.select(existingTab);
                }
            }else{
                //ignore all others
            }
        }

        utils.addChild(this.element, leftBox, rightBox);

        // ! --------------------------------------------------------------------
        this.controller.contentPanes.blockModel = this.contentPane;
        this.controller.tabExplorers.blockModel = this.tabExplorer;
        this.controller.explorers.blockModel = this.explorer;
        this.controller.callbacks.blockModel = {
            open: this.openCallback,
            render: (explorer) => {
                this.explorer = explorer;
                explorer.onContextClick = (element, event) => {
                    this.createContextMenu(element,event);
                }
            }
        }
    }

    /**
     * @param searchCallback {function(string)}
     * @param newFolderCallback {function(string, function)}
     * @return {HTMLDivElement}
     */
    createToolbar(searchCallback, newFolderCallback){
        this.toolbar = document.createElement('div');
        this.toolbar.classList.add("explorer-toolbar");
        this.toolbar.style.display = "none";

        let search = new forms.FormField('search-bar',"");
        search.placeholder = "Search";
        search.changeListeners.push((entry) => {
            searchCallback(search.getValue());
        })

        utils.addChild(this.toolbar, search.getElement());


        let closeButton = new forms.IconButton("Close",'clear.svg',() => {
            utils.fadeOut(this.toolbar,150);
        })

        closeButton.addTo(this.toolbar);

        return this.toolbar;
    }

    createContextMenu(parent, e) {
        if(parent != null){
            if(parent instanceof explorer.File){
                let contextMenu = new contextmenu.ContextMenu(parent.element);
                contextMenu.open((items) => {
                    items.push(new contextmenu.MenuButtonContextItem("New", () => {}, (items) => {
                        items.push(new contextmenu.ImageButtonContextItem("Model", utils.getIcon('model.svg'),() => {

                        }));
                        items.push(new contextmenu.ImageButtonContextItem("Folder", utils.getIcon('folder.svg'), () => {
                            contextMenu.close();
                            this.controller.sendMessage('modal:create_folder', {explorer: 'block', index: this.explorer.allChilds.indexOf(parent)});
                        },true));
                    }));
                    //
                    //items.push(new contextMenu.DividerContextItem('test'));
                    //
                    items.push(new contextmenu.ButtonContextItem("Rename", () => {

                    }));
                    //
                    items.push(new contextmenu.ButtonContextItem("Search...", () => {
                        utils.fadeIn(this.toolbar,150);
                    }));
                    //
                    items.push(new contextmenu.ButtonContextItem("Delete", () => {

                    }));
                },e);
            }else if(parent instanceof explorer.Folder){
                let contextMenu = new contextmenu.ContextMenu(parent.element);
                if(parent instanceof explorer.ResourceFolder || parent in explorer.ErrorsFolder){
                    contextMenu.open((items) => {
                        items.push(new contextmenu.ButtonContextItem(parent.collapsed ? "Show contents" : "Collapse contents", () => {

                        }));
                    },e);
                }else{
                    contextMenu.open((items) => {
                        items.push(new contextmenu.MenuButtonContextItem("New", () => {}, (items) => {
                            items.push(new contextmenu.ImageButtonContextItem("Model", utils.getIcon('model.svg'),() => {

                            }));
                            items.push(new contextmenu.ImageButtonContextItem("Folder", utils.getIcon('folder.svg'), () => {
                                contextMenu.close();
                                this.controller.sendMessage('modal:create_folder', {explorer: 'block', index: this.explorer.allChilds.indexOf(parent)});
                            },true));
                        }));
                        //
                        //items.push(new contextMenu.DividerContextItem('test'));
                        //
                        items.push(new contextmenu.ButtonContextItem(parent.collapsed ? "Show contents" : "Collapse contents", () => {

                        }));
                        //
                        items.push(new contextmenu.ButtonContextItem("Rename", () => {

                        }));
                        //
                        items.push(new contextmenu.ButtonContextItem("Delete", () => {

                        }));
                    },e);
                }
            }
        }
    }
}

module.exports.TabBlockModels = TabBlockModels;

class BlockModelTab extends tabpane.ElementTab{
    /**
     * @type BlockModelFile
     */
    blockModelFile;

    /**
     * @type BlockModel
     */
    blockModel;

    /**
     * @param blockModelFile {BlockModelFile}
     */
    constructor(blockModelFile) {
        super(blockModelFile.getName(), blockModelFile.getIcon(), '45D32C');
        this.blockModelFile = blockModelFile;
        this.blockModel = blockModelFile.getBlockModel()
    }

    make(content) {
        content.classList.add('element-tab-content');
        // ? LEFT
        let contentLeft = document.createElement('div');
        contentLeft.classList.add("element-content-left", "element-content-tabs");

        // * PANE CONTENT
        let paneContent = document.createElement('div');
        paneContent.classList.add("pane-content");
        let paneHolder = document.createElement('div');
        paneHolder.classList.add("pane-holder");
        utils.addChild(contentLeft, paneContent, paneHolder);

        // * PANE
        this.pane = new tabpane.PanelTabPane();
        this.pane.type = "LEFT";
        this.pane.push(paneHolder, paneContent);

        let tabData = new tabpane.AnimatedImageTab("Data",'data_gray.svg','data.svg',"pane-inside");
        this.pane.addTab(tabData);
        this.createDataTab(tabData.element);

        let tabLinks = new tabpane.AnimatedImageTab("Linked",'link_gray.svg','link.svg',"pane-inside");
        this.pane.addTab(tabLinks);
        this.createLinkTab(tabLinks.element);

        let tabCode = new tabpane.AnimatedImageTab("Code",'code_gray.svg','code.svg',"pane-inside");
        this.pane.addTab(tabCode);
        this.createCodeTab(tabCode.element);

        this.pane.pop();


        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");
        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Model View";
        utils.addChild(header, headerText);
        let modelContent = document.createElement('div');
        modelContent.classList.add("model-content");

        {
            //
            let count = 0;
            for (let texture of this.blockModel.getTextures()) {
                if(texture.exists()) {
                    let div = document.createElement('div');
                    div.classList.add("texture-view-holder");
                    let img = document.createElement('img');
                    img.classList.add('texture-view-img');
                    img.src = texture.path;
                    let tooltip = new tooltips.TextureTooltip(div,texture);
                    tooltip.applyHover(div);
                    utils.addChild(div,img);
                    utils.addChild(modelContent, div);
                    count++;
                }
            }
            if(count > 1){
                modelContent.classList.add("lot");
            }
        }

        utils.addChild(contentRight, header, modelContent);

        //
        utils.addChild(content, contentLeft, contentRight);
    }

    // # -----------------------
    /**
     * @param element {HTMLElement}
     */
    createDataTab(element){
        modutils.createRegistrySection('Properties', section => {
            let holder = document.createElement('div');
            holder.classList.add('property-section');
            modutils.createPropertySection('ID',(content) => {
                content.innerText = this.blockModel.location.location;
                content.style.cursor = 'pointer';
                utils.onClick(content, () => {
                    utils.copyToClipboard(this.blockModel.location.location, content, 'under');
                })
            }, holder);
            utils.addChild(section, holder)
        }, element);

        modutils.createRegistrySection('Modify', section => {
            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Name");
            name.setValue(this.blockModelFile.getName());
            form.addEntry(name);
            form.pop()
        }, element);

        modutils.createRegistrySection('Textures', section => {
            let texturesList = document.createElement('div');
            texturesList.classList.add("info-textures", 'texture-list');

            // ? TEXTURES
            /**
             * @type {{texture: Texture, count: number}[]}
             */
            let textures = [];
            for (let texture of this.blockModel.textures) {
                let regTexture = mod.modRegistry.getTexture(texture.location);
                let contains = false;
                for (let tex of textures) {
                    if (tex.texture === regTexture) {
                        tex.count++;
                        contains = true;
                        break;
                    }
                }

                if (!contains) {
                    textures.push({
                        texture: regTexture,
                        count: 1
                    })
                }
            }

            for (let texture of textures) {
                let visual = new modelmenu.TextureVisual(texture.texture, texture.count);
                let el = visual.construct();
                utils.addChild(texturesList, el);
            }
            utils.addChild(section, texturesList);
        }, element);
    }

    /**
     * @param element {HTMLElement}
     */
    createLinkTab(element){
        modutils.createRegistrySection('Usages', section => {
            let modelUsageList = new modelmenu.ModelUsageList(section, this.blockModel);
            setTimeout(() => {
                modelUsageList.construct();
            }, 0)
        }, element);
    }

    /**
     * @param element {HTMLElement}
     */
    createCodeTab(element) {
        element.classList.add("json-panel");
        const jsonEditor = require('jsoneditor');
        const editor = new jsonEditor(element, {
            mode: 'form',
            modes: ['code', 'form', 'tree'],
            onChange: () => {
                if(editor.getText() !== this.blockModel.json) {
                    this.markDirty('json');
                }
            },
            onModeChange: (o, n) => {
                if(editor != null) {
                    editor.expandAll();
                }
            }
        });
        editor.setText(this.blockModel.json);
        editor.expandAll();

        this.addSaveEvent(() => {
            this.blockModel.jsonRemote = editor.getText();
            this.controller.sendMessage('save:json',{
                type: "blockModel",
                location: this.blockModel.location.location,
                file: this.blockModel.path,
                content: this.blockModel.jsonRemote
            })
        })

        this.addResetEvent(() => {
            editor.setText(this.blockModel.json);
            editor.expandAll();
        })
    }

    // # -----------------------

    onOpen() {
        super.onOpen();
        this.blockModelFile.open();
    }

    onClose() {
        super.onClose();
        this.blockModelFile.close();
    }
}
