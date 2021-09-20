const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const contextmenu = require('../../../../gui/context-menu');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabItems extends ITab{
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
        this.tab = new tabpane.AnimatedImageTab('Items','items_gray.svg','item.svg','tab-editor','tab-items');
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
            if(file instanceof explorer.ItemFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof ItemTab && tab.itemFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new ItemTab(file);
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
        this.controller.contentPanes.item = this.contentPane;
        this.controller.tabExplorers.item = this.tabExplorer;
        this.controller.explorers.item = this.explorer;
        this.controller.callbacks.item = {
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
                        items.push(new contextmenu.ImageButtonContextItem("Item", utils.getIcon('item.svg'),() => {

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
                            items.push(new contextmenu.ImageButtonContextItem("Item", utils.getIcon('item.svg'),() => {

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

module.exports.TabItems = TabItems;

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


            let count = 0;
            let textures = this.item.getTextures();
            if(textures.length > 0){
                for (let texture of textures) {
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
            }else{
                //todo get parent texture if item has none
                //or get block texture
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
                content.innerText = this.item.location.location;
                content.style.cursor = 'pointer';
                utils.onClick(content, () => {
                    utils.copyToClipboard(this.item.location.location, content, 'under');
                });
            }, holder);
            utils.addChild(section, holder)
        }, element);

        modutils.createRegistrySection('Modify', section => {
            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Codename");
            name.setValue(this.itemFile.getName());
            let displayName = new forms.FormField('display_name','Display Name');//todo display name
            displayName.bottomHTML = "More languages are available in Languages tab.";
            form.addEntries(name, displayName);
            form.pop()
        }, element);

        //
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
                const {BlockModel, Item} = require('../../../resource/assets');
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

            utils.addChild(element, section);
        }

        //
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Parent Texture Diagram";
            utils.addChild(section, header);

            let diagram = new modelmenu.ParentTextureDiagram(section, this.item);
            diagram.construct();

            utils.addChild(element, section);
        }
    }

    /**
     * @param element {HTMLElement}
     */
    createLinkTab(element){
        modutils.createRegistrySection('Usages', section => {
            //todo blocks that use current block OR if block is registered as single
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
                if(editor.getText() !== this.item.json) {
                    this.markDirty('json');
                }
            },
            onModeChange: (o, n) => {
                if(editor != null) {
                    editor.expandAll();
                }
            }
        });
        editor.setText(this.item.json);
        editor.expandAll();

        this.addSaveEvent(() => {
            this.item.jsonRemote = editor.getText();
            this.controller.sendMessage('save:json',{
                type: "block",
                location: this.item.location.location,
                file: this.item.path,
                content: this.item.jsonRemote
            })
        })

        this.addResetEvent(() => {
            editor.setText(this.item.json);
            editor.expandAll();
        })
    }

    // # -----------------------

    onOpen() {
        super.onOpen();
        this.itemFile.open();
    }

    onClose() {
        super.onClose();
        this.itemFile.close();
    }
}