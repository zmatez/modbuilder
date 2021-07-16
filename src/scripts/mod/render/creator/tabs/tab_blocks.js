const ITab = require('./itab.js');
const tabpane = require('../../../../gui/tabpane');
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

    createTab() {
        this.tab = new tabpane.ImageTab('Blocks','blocks-gray.svg','tab-editor','tab-blocks');
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
                    let tab = new BlockTab(file);
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
        this.controller.callbacks.block = {
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
     * @param blockFile {BlockFile}
     */
    constructor(blockFile) {
        super(blockFile.getName(), blockFile.getIcon(), '45D32C');
        this.blockFile = blockFile;
        this.block = blockFile.getBlock();
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
            name.setValue(this.blockFile.getName());
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
            header.innerHTML = "Models";
            utils.addChild(section, header);

            let modelList = new modelmenu.ModelBlockList(section, this.block);
            modelList.construct();

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section","json-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Blockstate";
            utils.addChild(section, header);

            const json = require('jsoneditor')

            /**
             * @type JSONEditor
             */
            let editor = new json(section,{
                "modes": ['view'],
                "autocomplete": {
                    applyTo: ['value'],
                    filter: "contain",
                    trigger: "focus",
                    getOptions: function (text, path) {
                        if(path[path.length-1] === 'model'){
                            let suggestions = [];
                            for (let [key, model] of mod.modRegistry.blockModels) {
                                suggestions.push(key);
                            }
                            return suggestions;
                        }
                        return [];
                    }
                }
            }, JSON.parse(this.block.json));

            utils.addChild(contentLeft, section);
        }
        {
            let section = document.createElement('div');
            section.classList.add("content-section");
            // * HEADER
            let header = document.createElement('h2');
            header.innerHTML = "Dependencies";
            utils.addChild(section, header);

            utils.addChild(contentLeft, section);
        }

        // ? RIGHT
        let contentRight = document.createElement('div');
        contentRight.classList.add("element-content-right");

        //
        utils.addChild(content, contentLeft, contentRight);
    }

    onOpen() {
        super.onOpen();
        this.blockFile.open();
    }

    onClose() {
        super.onClose();
        this.blockFile.close();
    }
}
