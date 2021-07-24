class ContextMenu{
    /**
     * @type HTMLElement
     */
    parent;

    /**
     * @type function(ContextItem[])
     */
    items;

    /**
     * @private
     * @type {function(Event)}
     * @param e {Event}
     */
    openListener = (e) => {
        e.preventDefault();
        this.open(e);
    };

    /**
     * @param parent {HTMLElement}
     */
    constructor(parent) {
        this.parent = parent;
        this.init();
    }

    /**
     * @param items {function(ContextItem[])}
     */
    setup(items){
        this.items = items;
    }

    /**
     * @private
     */
    init(){
        this.parent.addEventListener('contextmenu', this.openListener);
    }

    remove(){
        this.parent.removeEventListener('contextmenu', this.openListener)
    }

    /**
     * @param e {Event}
     * @private
     */
    open(e){
        if(this.items === null){
            throw new Error("Context menu not initialized - no items defined.");
        }

        let items = [];
        this.items(items);

        let element = document.createElement('div');
        element.classList.add('context-menu');

        for (let item of items) {
            item.construct();
            utils.addChild(element, item.element);
        }

        element.classList.add('open');

        utils.addChild(document.body, element);

        //pos
        let left = e.clientX;
        let height = element.offsetHeight;
        let top = e.clientY;
        top = top + height >= window.screen.width ? (window.screen.height - 10 - height) : top;

        element.style.left = left + "px";
        element.style.top = top + "px";

        setTimeout(() => {
            element.classList.remove('open');
        }, 150);

        element.setAttribute('tabindex','1');
        element.focus();
        element.addEventListener('blur', () => {
            this.close(element);
        })
    }
    /**
     * @param element {HTMLElement}
     * @private
     */
    close(element){
        utils.fadeOut(element, 50, () => {
            element.remove();
        })
    }
}

module.exports.ContextMenu = ContextMenu;

/**
 * @interface
 */
class ContextItem{
    /**
     * @type HTMLElement
     */
    element;

    constructor() {
    }

    /**
     * @abstract
     */
    construct(){

    }
}

//!---------------------------------------------------------------------------------------------------------------------

class ButtonContextItem extends ContextItem{
    /**
     * @type string
     */
    text;
    /**
     * @type ?string
     */
    style;
    /**
     * @type function
     */
    action;

    /**
     * @param text {string}
     * @param action {function}
     * @param style {?string}
     */
    constructor(text, action, style = null) {
        super();
        this.text = text;
        this.action = action;
        this.style = style;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add('context-item');

        if(this.style != null){
            this.element.setAttribute('style', this.style);
        }

        this.element.innerText = this.text;
        this.element.addEventListener('click', this.action)
    }
}

module.exports.ButtonContextItem = ButtonContextItem;