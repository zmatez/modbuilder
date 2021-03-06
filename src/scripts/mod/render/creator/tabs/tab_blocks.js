const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const contextmenu = require('../../../../gui/context-menu');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabBlocks extends ITab{
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
        this.tab = new tabpane.AnimatedImageTab('Blocks','blocks_gray.svg','block.svg','tab-editor','tab-blocks');
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
            if(file instanceof explorer.BlockFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof BlockTab && tab.blockFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new BlockTab(file, this.controller);
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
        this.controller.contentPanes.block = this.contentPane;
        this.controller.tabExplorers.block = this.tabExplorer;
        this.controller.explorers.block = this.explorer;
        /**
         * @type {{render: function(FileExplorer), open: Function}}
         */
        this.controller.callbacks.block = {
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
                        items.push(new contextmenu.ImageButtonContextItem("Block", utils.getIcon('block.svg'),() => {

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
                            items.push(new contextmenu.ImageButtonContextItem("Block", utils.getIcon('block.svg'),() => {

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

module.exports.TabBlocks = TabBlocks;

class BlockTab extends tabpane.ElementTab{
    /**
     * @type BlockFile
     */
    blockFile;

    /**
     * @type Block
     */
    block;

    /**
     * @type PanelTabPane
     */
    pane;

    /**
     * @param blockFile {BlockFile}
     * @param controller {CreatorController}
     */
    constructor(blockFile, controller) {
        super(blockFile.getName(), blockFile.getIcon(), '45D32C',controller);
        this.blockFile = blockFile;
        this.block = blockFile.getBlock();
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


        //-------------------------------------------------------------------
        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");
        let header = document.createElement('div');
        header.classList.add("right-header");
        let headerText = document.createElement('h2');
        headerText.innerHTML = "Block View";
        utils.addChild(header, headerText);
        let modelContent = document.createElement('div');
        modelContent.classList.add("model-content");

        {
            //
            let count = 0;
            for (let model of this.block.models) {
                for (let texture of model.getTextures()) {
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
                content.innerText = this.block.location.location;
                content.style.cursor = 'pointer';
                utils.onClick(content, () => {
                    utils.copyToClipboard(this.block.location.location, content, 'under');
                });
            }, holder);
            utils.addChild(section, holder)
        }, element);

        modutils.createRegistrySection('Information', section => {
            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Name");
            name.setValue(this.blockFile.getName());
            let displayName = new forms.FormField('display_name','Display Name');//todo display name
            displayName.bottomHTML = "More languages are available in Languages tab.";
            form.addEntries(name, displayName);
            form.pop()
        }, element);

        modutils.createRegistrySection('Registry', section => {
            let form = new Form(section);
            form.push();
            let constructor = new forms.FormField('constructor', "Constructor");
            constructor.setValue("");
            form.addEntries(constructor);
            form.pop()
        }, element);
    }

    /**
     * @param element {HTMLElement}
     */
    createLinkTab(element){
        modutils.createRegistrySection('Models', section => {
            let modelList = new modelmenu.ModelBlockList(section, this.block);
            modelList.construct();
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
                if(editor.getText() !== this.block.json) {
                    this.markDirty('json');
                }
            },
            onModeChange: (o, n) => {
                if(editor != null) {
                    editor.expandAll();
                }
            }
        });
        editor.setText(this.block.json);
        editor.expandAll();

        this.addSaveEvent(() => {
            this.block.jsonRemote = editor.getText();
            this.controller.sendMessage('save:json',{
                type: "block",
                location: this.block.location.location,
                file: this.block.path,
                content: this.block.jsonRemote
            })
        })

        this.addResetEvent(() => {
            editor.setText(this.block.json);
            editor.expandAll();
        })
    }

    // # -----------------------

    onOpen() {
        super.onOpen();
        this.blockFile.open();
    }

    onClose() {
        super.onClose();
        this.blockFile.close();
    }
}
