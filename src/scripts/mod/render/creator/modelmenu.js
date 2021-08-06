const {ModUtils, ResourceLocation} = require('../../util/modutils');

class ModelBlockList {
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type Block
     */
    block;

    /**
     * @type HTMLElement
     */
    element;

    constructor(parent, block) {
        this.parent = parent;
        this.block = block;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('model-menu');

        /**
         * @type {{model: BlockModel, count: number}[]}
         */
        let models = [];
        for (let model of this.block.models) {
            let regModel = mod.modRegistry.getBlockModel(model.location);
            let contains = false;
            for (let mdl of models) {
                if (mdl.model === regModel) {
                    mdl.count++;
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                models.push({
                    model: regModel,
                    count: 1
                })
            }
        }

        for (let model of models) {
            let visual = new ModelVisual(model.model, model.count);
            let el = visual.construct();
            utils.addChild(this.element, el);
        }

        utils.addChild(this.parent, this.element);
    }
}

module.exports.ModelBlockList = ModelBlockList;

class IListVisual {
    /**
     * @type number
     */
    count;


    /**
     * @type HTMLElement
     */
    element;

    /**
     * @param count {number}
     */
    constructor(count = 1) {
        this.count = count;
    }

    /**
     * @return HTMLElement
     */
    construct() {

    }
}
class BlockVisual extends IListVisual {
    /**
     * @type Block
     */
    block;

    /**
     * @param model {Block}
     * @param count {number}
     */
    constructor(model, count = 1) {
        super(count)
        this.block = model;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('model-visual');

        // ? HEADER
        let header = document.createElement('div');
        header.classList.add("model-name");

        let modeImg = document.createElement('img');
        modeImg.classList.add("model-img");
        modeImg.src = utils.getIcon('block.svg');

        let name = document.createElement('span');
        name.innerHTML = this.block.location.namespace + ":" + this.block.location.path;
        utils.addChild(header, modeImg, name);

        if (this.count > 1) {
            let count = document.createElement('span');
            count.classList.add("model-count");
            count.innerHTML = 'x' + this.count;
            utils.addChild(header, count);
        }

        if (!this.block.valid) {
            let invalidImg = document.createElement('img');
            invalidImg.classList.add("invalid");
            invalidImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(header, invalidImg);
        }

        utils.addChild(this.element, header)
        // ? DATA
        let pathSection = createSection('Path');
        let path = document.createElement('span');
        path.classList.add("model-info", "info-path");
        path.innerHTML = this.block.path;
        let buttonPathOpen = new forms.IconButton('Open', 'open.svg', () => {

        });
        buttonPathOpen.addTo(path);
        utils.addChild(pathSection, path);
        utils.addChild(this.element, pathSection);
        //
        if (!this.block.valid) {
            let errorSection = createSection('Error', 'color: red');
            let error = document.createElement('span');
            error.classList.add("model-info", "info-error");
            error.innerHTML = this.block.errorMessage;
            utils.addChild(errorSection, error);
            utils.addChild(this.element, errorSection);
        }

        function createSection(title, style = null) {
            let section = document.createElement('div');
            section.classList.add("model-section");
            let sectionTitle = document.createElement('h4');
            sectionTitle.classList.add("section-title");
            sectionTitle.innerHTML = title;
            if (style != null) {
                sectionTitle.setAttribute('style', style);
            }

            utils.addChild(section, sectionTitle);
            return section;
        }

        return this.element;
    }
}

module.exports.BlockVisual = BlockVisual;

class ModelVisual extends IListVisual {
    /**
     * @type BlockModel
     */
    model;

    showTextures = true;

    /**
     * @type {?Texture}
     */
    highlightTexture = null;

    /**
     * @param model {BlockModel}
     * @param count {number}
     */
    constructor(model, count = 1) {
        super(count)
        this.model = model;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('model-visual');

        // ? HEADER
        let header = document.createElement('div');
        header.classList.add("model-name");

        let modeImg = document.createElement('img');
        modeImg.classList.add("model-img");
        modeImg.src = utils.getIcon('model.svg');

        let name = document.createElement('span');
        name.innerHTML = this.model.location.namespace + ":" + this.model.location.path;
        utils.addChild(header, modeImg, name);

        if (this.count > 1) {
            let count = document.createElement('span');
            count.classList.add("model-count");
            count.innerHTML = 'x' + this.count;
            utils.addChild(header, count);
        }

        if (!this.model.valid) {
            let invalidImg = document.createElement('img');
            invalidImg.classList.add("invalid");
            invalidImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(header, invalidImg);
        }

        utils.addChild(this.element, header)
        // ? DATA
        let pathSection = createSection('Path');
        let path = document.createElement('span');
        path.classList.add("model-info", "info-path");
        path.innerHTML = this.model.path;
        let buttonPathOpen = new forms.IconButton('Open', 'open.svg', () => {

        });
        buttonPathOpen.addTo(path);
        utils.addChild(pathSection, path);
        utils.addChild(this.element, pathSection);
        //
        if (!this.model.valid) {
            let errorSection = createSection('Error', 'color: red');
            let error = document.createElement('span');
            error.classList.add("model-info", "info-error");
            error.innerHTML = this.model.errorMessage;
            utils.addChild(errorSection, error);
            utils.addChild(this.element, errorSection);
        }
        //
        if (this.showTextures) {
            let textureSection = createSection('Textures');
            let texturesList = document.createElement('div');
            texturesList.classList.add("model-info", "info-textures", 'texture-list');

            // ? TEXTURES
            /**
             * @type {{texture: Texture, count: number}[]}
             */
            let textures = [];
            for (let texture of this.model.textures) {
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
                let visual = new TextureVisual(texture.texture, texture.count);
                let el = visual.construct();
                if (this.highlightTexture != null && this.highlightTexture === texture.texture) {
                    visual.highlight()
                }
                utils.addChild(texturesList, el);
            }
            utils.addChild(textureSection, texturesList);
            utils.addChild(this.element, textureSection);
        }

        function createSection(title, style = null) {
            let section = document.createElement('div');
            section.classList.add("model-section");
            let sectionTitle = document.createElement('h4');
            sectionTitle.classList.add("section-title");
            sectionTitle.innerHTML = title;
            if (style != null) {
                sectionTitle.setAttribute('style', style);
            }

            utils.addChild(section, sectionTitle);
            return section;
        }

        return this.element;
    }
}

module.exports.ModelVisual = ModelVisual;

class TextureVisual extends IListVisual {
    /**
     * @type Texture
     */
    texture;

    /**
     * @param texture {Texture}
     * @param count {number}
     */
    constructor(texture, count = 1) {
        super(count);
        this.texture = texture;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("texture-holder");

        let img = document.createElement('img');
        img.classList.add("texture");
        let path = this.texture == null ? null : this.texture.pathOrNull;
        img.src = path == null ? utils.getIcon('error-mark.svg') : path;
        if (path == null) {
            img.style.padding = "7px";
        }
        utils.addChild(this.element, img);

        let tooltip = new tooltips.TextureTooltip(img, this.texture);
        tooltip.applyHover(this.element)

        return this.element;
    }

    highlight() {
        this.element.classList.add("highlight")
    }
}

module.exports.TextureVisual = TextureVisual;

class ItemVisual extends IListVisual {
    /**
     * @type Item
     */
    item;

    /**
     * @type {?Texture}
     */
    highlightTexture = null;

    showTextures = true;

    /**
     * @param item {Item}
     * @param count {number}
     */
    constructor(item, count = 1) {
        super(count)
        this.item = item;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('model-visual');

        // ? HEADER
        let header = document.createElement('div');
        header.classList.add("model-name");

        let modeImg = document.createElement('img');
        modeImg.classList.add("model-img");
        modeImg.src = utils.getIcon('item.svg');

        let name = document.createElement('span');
        name.innerHTML = this.item.location.namespace + ":" + this.item.location.path;
        utils.addChild(header, modeImg, name);

        if (this.count > 1) {
            let count = document.createElement('span');
            count.classList.add("model-count");
            count.innerHTML = 'x' + this.count;
            utils.addChild(header, count);
        }

        if (!this.item.valid) {
            let invalidImg = document.createElement('img');
            invalidImg.classList.add("invalid");
            invalidImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(header, invalidImg);
        }

        utils.addChild(this.element, header)
        // ? DATA
        let pathSection = createSection('Path');
        let path = document.createElement('span');
        path.classList.add("model-info", "info-path");
        path.innerHTML = this.item.path;
        let buttonPathOpen = new forms.IconButton('Open', 'open.svg', () => {

        });
        buttonPathOpen.addTo(path);
        utils.addChild(pathSection, path);
        utils.addChild(this.element, pathSection);
        //
        if (!this.item.valid) {
            let errorSection = createSection('Error', 'color: red');
            let error = document.createElement('span');
            error.classList.add("model-info", "info-error");
            error.innerHTML = this.item.errorMessage;
            utils.addChild(errorSection, error);
            utils.addChild(this.element, errorSection);
        }
        //
        if (this.showTextures) {
            let textureSection = createSection('Textures');
            let texturesList = document.createElement('div');
            texturesList.classList.add("model-info", "info-textures", 'texture-list');

            // ? TEXTURES
            /**
             * @type {{texture: Texture, count: number}[]}
             */
            let textures = [];
            for (let texture of this.item.textures) {
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
                let visual = new TextureVisual(texture.texture, texture.count);
                let el = visual.construct();
                if (this.highlightTexture != null && this.highlightTexture === texture.texture) {
                    visual.highlight()
                }
                utils.addChild(texturesList, el);
            }

            utils.addChild(textureSection, texturesList);
            utils.addChild(this.element, textureSection);
        }

        function createSection(title, style = null) {
            let section = document.createElement('div');
            section.classList.add("model-section");
            let sectionTitle = document.createElement('h4');
            sectionTitle.classList.add("section-title");
            sectionTitle.innerHTML = title;
            if (style != null) {
                sectionTitle.setAttribute('style', style);
            }

            utils.addChild(section, sectionTitle);
            return section;
        }

        return this.element;
    }
}

module.exports.ItemVisual = ItemVisual;

// ! -------------------------------------------------------------------------------------------------------------------
// # TEXTUREUSAGE  MENU

class TextureUsageList {
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type Texture
     */
    texture;

    /**
     * @type HTMLElement
     */
    element;

    constructor(parent, texture) {
        this.parent = parent;
        this.texture = texture;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('texture-usage-menu');

        //find models that use that texture
        //futurely add here particles, mobs, etc
        /**
         * @type {{model: BlockModel, count: number}[]}
         */
        let models = [];
        for (let [key, model] of mod.modRegistry.blockModels) {
            let containsTexture = false;
            for (let texture of model.textures) {
                if (texture.path === this.texture.path) {
                    containsTexture = true;
                    break
                }
            }
            if (!containsTexture) {
                continue;
            }
            let contains = false;
            for (let mdl of models) {
                if (mdl.model === model) {
                    mdl.count++;
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                models.push({
                    model: model,
                    count: 1
                })
            }
        }

        this.createSeparator("Block Models", models.length);

        for (let model of models) {
            let visual = new ModelVisual(model.model, model.count);
            visual.highlightTexture = this.texture;
            let el = visual.construct();
            utils.addChild(this.element, el);
        }

        // ! ITEM MODELS
        /**
         * @type {{model: Item, count: number}[]}
         */
        let items = [];
        for (let [key, item] of mod.modRegistry.items) {
            let containsTexture = false;
            for (let texture of item.getTextures()) {
                if (texture.path === this.texture.path) {
                    containsTexture = true;
                    break
                }
            }
            if (!containsTexture) {
                continue;
            }
            let contains = false;
            for (let mdl of items) {
                if (mdl.model === item) {
                    mdl.count++;
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                items.push({
                    model: item,
                    count: 1
                })
            }
        }
        this.createSeparator("Item Models", items.length);
        for (let item of items) {
            let visual = new ItemVisual(item.model, item.count);
            visual.highlightTexture = this.texture;
            let el = visual.construct();
            utils.addChild(this.element, el);
        }

        utils.addChild(this.parent, this.element);
    }

    /**
     * @private
     * @param text {string}
     * @param count {number}
     */
    createSeparator(text, count) {
        let separator = document.createElement('div');
        separator.classList.add("separator");
        let separatorImg = document.createElement('img');
        separatorImg.src = utils.getIcon('arrow_collapse.svg');
        let separatorText = document.createElement('span');
        separatorText.innerText = text;
        let separatorCount = document.createElement('span');
        separatorCount.innerText = count + " usage" + (count === 1 ? "" : "s");
        separatorCount.classList.add("count");
        utils.addChild(separator, separatorImg, separatorText, separatorCount)
        utils.addChild(this.element, separator);
    }
}

module.exports.TextureUsageList = TextureUsageList

// ! -------------------------------------------------------------------------------------------------------------------
// # PARENT TEXTURE DIAGRAM
class ParentTextureDiagram {
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type IModel
     */
    model;

    /**
     * @type HTMLElement
     */
    element;

    /**
     * @param parent {HTMLElement}
     * @param model {IModel}
     */
    constructor(parent, model) {
        this.parent = parent;
        this.model = model;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('parent-texture-menu');

        let diagram = this.model.getParentDiagram();
        for (let i = 0; i < diagram.length; i++) {
            let dg = diagram[i];
            let model = dg[0].origin;
            let level = this.createLevel(model, dg, i);
            utils.addChild(this.element, level);
        }

        utils.addChild(this.parent, this.element);
    }

    /**
     * @param model {IModel}
     * @param textures {{origin: IModel, texture: ?Texture, overridden: boolean}[]}
     * @param intend {number} padding-left
     * @return HTMLElement
     */
    createLevel(model, textures, intend = 0) {
        let modelLevel = document.createElement('div');
        modelLevel.classList.add('parent-texture-level');
        modelLevel.style.paddingLeft = (intend * 10) + "px";

        let name = document.createElement('div');
        name.classList.add("model-name");
        let img = document.createElement('img');
        img.classList.add("model-img");
        const {BlockModel, Item} = require('../../resource/assets');
        img.src = utils.getIcon(model instanceof BlockModel ? 'model.svg' : 'item.svg');
        let span = document.createElement('span');
        span.innerHTML = model.location.location;
        utils.addChild(name, img, span);

        let list = document.createElement('div');
        list.classList.add("texture-list");
        let valid = [];
        let others = [];
        for (let texture of textures) {
            if (texture.texture != null) {
                if (texture.overridden) {
                    others.push(texture);
                } else {
                    valid.push(texture);
                }
            }
        }
        for (let texture of valid) {
            let textureVisual = new TextureVisual(texture.texture);
            utils.addChild(list, textureVisual.construct());
        }
        for (let texture of others) {
            let textureVisual = new TextureVisual(texture.texture);
            let tx = textureVisual.construct();
            tx.classList.add("overridden");
            utils.addChild(list, tx);
        }
        utils.addChild(modelLevel, name, list);

        return modelLevel;
    }
}

module.exports.ParentTextureDiagram = ParentTextureDiagram;

// ! -------------------------------------------------------------------------------------------------------------------
// # MODEL USAGE MENU

class ModelUsageList {
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type BlockModel
     */
    model;

    /**
     * @type HTMLElement
     */
    element;

    constructor(parent, texture) {
        this.parent = parent;
        this.model = texture;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('model-usage-menu');

        //find models that use that texture
        //futurely add here particles, mobs, etc
        /**
         * @type {{state: Block, count: number}[]}
         */
        let states = [];
        for (let [key, state] of mod.modRegistry.blocks) {
            let containsModel = false;
            for (let model of state.models) {
                if (model.path === this.model.path) {
                    containsModel = true;
                    break
                }
            }
            if (!containsModel) {
                continue;
            }
            let contains = false;
            for (let mdl of states) {
                if (mdl.state === state) {
                    mdl.count++;
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                states.push({
                    state: state,
                    count: 1
                })
            }
        }

        this.createSeparator("Blockstates", states.length);

        for (let block of states) {
            let visual = new BlockVisual(block.state, block.count);
            let el = visual.construct();
            utils.addChild(this.element, el);
        }

        utils.addChild(this.parent, this.element);
    }

    /**
     * @private
     * @param text {string}
     * @param count {number}
     */
    createSeparator(text, count) {
        let separator = document.createElement('div');
        separator.classList.add("separator");
        let separatorImg = document.createElement('img');
        separatorImg.src = utils.getIcon('arrow_collapse.svg');
        let separatorText = document.createElement('span');
        separatorText.innerText = text;
        let separatorCount = document.createElement('span');
        separatorCount.innerText = count + " usage" + (count === 1 ? "" : "s");
        separatorCount.classList.add("count");
        utils.addChild(separator, separatorImg, separatorText, separatorCount)
        utils.addChild(this.element, separator);
    }
}

module.exports.ModelUsageList = ModelUsageList