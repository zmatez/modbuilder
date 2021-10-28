const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
const contextmenu = require('../../../../gui/context-menu');
const explorer = require('../../../../gui/fileexplorer');
const modelmenu = require('../modelmenu');

class TabTextures extends ITab{
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
        this.tab = new tabpane.AnimatedImageTab('Textures','textures_gray.svg','texture.svg','tab-editor','tab-textures');
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
            if(file instanceof explorer.TextureFile){
                /**
                 * @type {?ElementTab}
                 */
                let existingTab = null;
                for (let tab of this.contentPane.tabs) {
                    if(tab instanceof TextureTab && tab.textureFile === file){
                        existingTab = tab;
                        break
                    }
                }

                if(existingTab == null){
                    let tab = new TextureTab(file);
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
        this.controller.contentPanes.texture = this.contentPane;
        this.controller.tabExplorers.texture = this.tabExplorer;
        this.controller.explorers.texture = this.explorer;
        this.controller.callbacks.texture = {
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
                            this.controller.sendMessage('modal:create_folder', {explorer: 'texture', index: this.explorer.allChilds.indexOf(parent)});
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
                                this.controller.sendMessage('modal:create_folder', {explorer: 'texture', index: this.explorer.allChilds.indexOf(parent)});
                            },true));
                        }));
                        //
                        //items.push(new contextMenu.DividerContextItem('test'));
                        //
                        items.push(new contextmenu.ButtonContextItem(parent.collapsed ? "Show contents" : "Collapse contents", () => {

                        }));
                        items.push(new contextmenu.ButtonContextItem("Open in explorer", () => {
                            require('child_process').exec(`start "" "${parent.path}"`);
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

module.exports.TabTextures = TabTextures;

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

        let tabEditor = new tabpane.AnimatedImageTab("Code",'code_gray.svg','code.svg',"pane-inside");
        this.pane.addTab(tabEditor);
        this.createEditorTab(tabEditor.element);

        this.pane.pop();

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

    // # -----------------------
    /**
     * @param element {HTMLElement}
     */
    createDataTab(element){
        modutils.createRegistrySection('Properties', section => {
            let holder = document.createElement('div');
            holder.classList.add('property-section');
            modutils.createPropertySection('ID',(content) => {
                content.innerText = this.texture.location.location;
                content.style.cursor = 'pointer';
                utils.onClick(content, () => {
                    utils.copyToClipboard(this.texture.location.location, content, 'under');
                });
            }, holder);
            if(this.texture.exists()) {
                modutils.createPropertySection('Resolution', (content) => {
                    let res = "Calculating...";
                    this.texture.size((w, h) => {
                        res = w + "x" + h;
                        content.innerText = res;
                    })
                    content.innerText = res;
                    content.style.cursor = 'pointer';
                    utils.onClick(content, () => {
                        utils.copyToClipboard(res, content, 'under');
                    });
                }, holder);
            }else{
                modutils.createPropertySection('Error',(content) => {
                    content.innerText = "No texture found, but some dependencies require it.";
                }, holder,'property-error');
            }
            utils.addChild(section, holder)
        }, element);

        modutils.createRegistrySection('Modify', section => {
            let form = new Form(section);
            form.push();
            let name = new forms.FormField('name', "Name");
            name.setValue(this.textureFile.getName());
            form.addEntry(name);
            form.pop()
        }, element);
    }

    /**
     * @param element {HTMLElement}
     */
    createLinkTab(element){
        modutils.createRegistrySection('Usages', section => {
            let textureUsageList = new modelmenu.TextureUsageList(section, this.texture);
            setTimeout(() => {
                textureUsageList.construct();
            }, 0)
        }, element);
    }

    /**
     * @param element {HTMLElement}
     */
    createEditorTab(element) {

    }

    // # -----------------------

    onOpen() {
        super.onOpen();
        this.textureFile.open();
    }

    onClose() {
        super.onClose();
        this.textureFile.close();
    }
}
