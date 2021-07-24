const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
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
            open: this.openCallback
        }
    }

    /**
     * @param searchCallback {function(string)}
     * @param newFolderCallback {function(string, function)}
     * @return {HTMLDivElement}
     */
    createToolbar(searchCallback, newFolderCallback){
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
