let tooltips = {};
module.exports.tooltips = tooltips;

/**
 * @interface
 */
class Tooltip {
    /**
     * It has to be a DIV
     * @type HTMLElement
     */
    parent;

    /**
     * @type HTMLDivElement
     */
    tooltip;

    /**
     * tooltip
     * @type HTMLElement
     */
    element;

    /**
     * @type {number}
     */
    animationDuration = 150;

    isShowing = false;

    /**
     * @type {function[]}
     */
    showEvents = [];
    /**
     * @type {function[]}
     */
    hideEvents = [];


    /**
     * @type {"left" | "center" | "right"}
     */
    placementX = "left";

    /**
     * @type {"above" | "center" | "under"}
     */
    placementY = "under";

    /**
     * @private
     */
    updateInterval;

    /**
     * @private
     * @type {boolean}
     */
    widthSet = false;

    /**
     * @type {HTMLElement[]}
     * @private
     */
    nestedTooltips = [];

    animate = false;

    /**
     * @param parent {HTMLElement} has to be a DIV with position: relative
     */
    constructor(parent) {
        this.parent = parent;
        this.parent.classList.add("tooltip-parent");
    }

    /**
     * @abstract
     */
    construct(){

    }

    getElement(){
        this.tooltip = document.createElement('div');
        this.tooltip.classList.add("tooltip-wrapper");
        this.construct();
        this.element.classList.add("tooltip");
        utils.addChild(this.tooltip, this.element);
        return this.tooltip;
    }

    show(){
        if(this.isShowing){
            return;
        }

        this.widthSet = false;

        this.getElement();
        utils.fadeOut(this.tooltip,this.animationDuration)
        let tag = this.parent.tagName
        if(tag === "DIV" || tag === "SPAN" || tag === "SECTION" || tag === "MAIN"){
            utils.addChild(this.parent, this.tooltip);
        }else{
            utils.addChild(this.parent.parentNode, this.tooltip);
        }

        //calculate nested
        this.getNestedTooltips();

        //set width and show
        this.tooltip.style.display = "block";
        this.updateParentPosition();
        this.tooltip.style.width = this.tooltip.offsetWidth + "px";
        this.tooltip.style.minWidth = this.tooltip.offsetWidth + "px";
        this.tooltip.style.maxWidth = this.tooltip.offsetWidth + "px";

        utils.fadeIn(this.tooltip,this.animationDuration)

        this.isShowing = true;
        this.showEvents.forEach((e) => {
            e();
        });

        this.updateInterval = setInterval(() => {
            this.updateParentPosition();
        }, 10);
    }

    hide(){
        if(!this.isShowing){
            return;
        }
        utils.fadeOut(this.tooltip,this.animationDuration, () => {
            this.element.remove();
            this.tooltip.remove();
        });


        this.isShowing = false;
        this.hideEvents.forEach((e) => {
            e();
        });

        if(this.updateInterval != null){
            clearInterval(this.updateInterval)
        }
    }

    /**
     * @param e {function}
     */
    addShowEvent(e){
        this.showEvents.push(e);
    }

    /**
     * @param e {function}
     */
    addHideEvent(e){
        this.hideEvents.push(e);
    }

    updateParentPosition(){
        let bounds = this.parent.getBoundingClientRect();
        let top = bounds.top;
        if(this.placementY === "under"){
            top = (bounds.top + bounds.height);
        }else if(this.placementY === "above"){
            top = (bounds.top - this.element.offsetHeight);
        }else if(this.placementY === "center"){
            top = (bounds.top - this.element.offsetHeight / 2 + bounds.height / 2)
        }
        let left = bounds.left;
        if(this.placementX === "left"){
            left = bounds.left;
        }else if(this.placementX === "right"){
            left = bounds.left + bounds.width;
        }else if(this.placementX === "center"){
            left = bounds.left + bounds.width / 2;
        }

        let showWay = "left";

        if((left + this.element.offsetWidth + 10) > document.body.scrollWidth){
            left = document.body.scrollWidth - 10 - this.element.offsetWidth;
            showWay = "right";
        }

        let nested = this.getNestedSizes();
        top += nested.top;
        left += nested.left;

        this.tooltip.style.top = top + "px";
        this.tooltip.style.left = left + "px";
        if(this.animate){
            if(showWay === 'left'){
                this.tooltip.classList.add("tooltip-appear-left");
            }else{
                this.tooltip.classList.add("tooltip-appear-right");
            }
        }
    }

    /**
     * @param element {HTMLElement}
     */
    applyHover(element){
        element.addEventListener("mouseenter", () => {
            this.show();
        });
        element.addEventListener("mouseleave", () => {
            this.hide();
        });
    }

    getNestedTooltips(){
        this.nestedTooltips = [];
        let prevParent = this.tooltip;
        while(true){
            let parent = prevParent.parentNode;
            if(parent == null){
                break
            }

            if(parent instanceof HTMLElement){
                if(parent.classList.contains("tooltip-wrapper")){
                    this.nestedTooltips.push(parent);
                }
            }

            prevParent = parent;
        }
    }

    /**
     * @type {{left, top}}
     */
    getNestedSizes(){
        let top = 0;
        let left = 0;
        for (let nestedTooltip of this.nestedTooltips) {
            top -= parseInt(nestedTooltip.style.top, 10);
            left -= parseInt(nestedTooltip.style.left, 10);
        }
        return {
            top: top,
            left: left
        }
    }

}

class TextTooltip extends Tooltip{
    /**
     * @type HTMLElement | string
     */
    child;

    /**
     * @param parent {HTMLElement}
     * @param child {HTMLElement | string}
     */
    constructor(parent, child) {
        super(parent);
        this.child = child;
        this.parent.classList.add("text-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("text-tooltip");
        if(typeof(this.child) === "string"){
            this.element.innerHTML = this.child;
        }else{
            utils.addChild(this.element, this.child);
        }
    }
}
tooltips.TextTooltip = TextTooltip;

class DecisionTooltip extends Tooltip{
    /**
     * @type string
     */
    title;
    /**
     * @type string
     */
    iconName;
    /**
     * @type string
     */
    url;
    /**
     * @type string
     */
    description;
    /**
     * @type string
     */
    text1;
    /**
     * @type string
     */
    text2;
    /**
     * @type function
     */
    action1;
    /**
     * @type function
     */
    action2;

    /**
     * @type Button
     */
    button1;
    /**
     * @type Button
     */
    button2;

    /**
     * @param parent {HTMLElement}
     * @param title {string}
     * @param iconName {string} relative path from /icons/
     * @param description {string}
     * @param text1 {string}
     * @param text2 {string}
     * @param action1 {function}
     * @param action2 {function}
     */
    constructor(parent, title, iconName, description, text1, text2, action1, action2) {
        super(parent);
        this.title = title;
        this.iconName = iconName;
        this.description = description;
        this.text1 = text1;
        this.text2 = text2;
        this.action1 = action1;
        this.action2 = action2;
        this.url = utils.getIcon(this.iconName);
        this.animate = true;

        utils.preloadImage(this.url)
        this.parent.classList.add("decision-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("decision-tooltip", "text-tooltip");
        let title = document.createElement('div');
        title.classList.add("decision-title");
        let icon = document.createElement('img');
        icon.src = this.url;
        utils.addChild(title, icon);
        utils.addHTML(title, this.title);

        let description = document.createElement('div');
        description.classList.add("decision-description");
        description.innerHTML = this.description;

        let buttonInline = document.createElement('div');
        buttonInline.classList.add("decision-button-inline");

        this.button1 = new Button(this.text1, this.action1);
        this.button1.container.classList.add("decision-button-1");
        this.button1.addTo(buttonInline);

        this.button2 = new Button(this.text2, this.action2);
        this.button2.container.classList.add("decision-button-2");
        this.button2.addTo(buttonInline);

        utils.addChild(this.element, title);
        utils.addChild(this.element, description);
        utils.addChild(this.element, buttonInline);
    }

    setLoading(){
        this.button1.button.style.width = this.button1.button.offsetWidth + "px";
        this.button1.button.innerHTML = utils.getLoader(17);
    }
}

tooltips.DecisionTooltip = DecisionTooltip;

class FormTooltip extends Tooltip{
    /**
     * @type string
     */
    title;
    /**
     * @type string
     */
    iconName;
    /**
     * @type string
     */
    url;
    /**
     * @type string
     */
    description;
    /**
     * @type string
     */
    text1;
    /**
     * @type string
     */
    text2;
    /**
     * @type function
     */
    formCallback;

    /**
     * @type Button
     */
    button1;
    /**
     * @type Button
     */
    button2;

    /**
     * @type string
     */
    formQuery;

    /**
     * available after construct()
     * @type Form
     */
    form;

    /**
     * @type function(Form)
     */
    saveCallback;

    /**
     * @param parent {HTMLElement}
     * @param title {string}
     * @param iconName {string} relative path from /icons/
     * @param description {string}
     * @param text1 {string}
     * @param text2 {string}
     * @param saveCallback {function(Form)}
     * @param formQuery {string}
     * @param formCallback {function(HTMLElement): Form} FORM POP()'s HERE
     */
    constructor(parent, title, iconName, description, text1, text2, saveCallback, formQuery, formCallback) {
        super(parent);
        this.title = title;
        this.iconName = iconName;
        this.description = description;
        this.text1 = text1;
        this.text2 = text2;
        this.saveCallback = saveCallback;
        this.formQuery = formQuery;
        this.formCallback = formCallback;
        this.url = utils.getIcon(this.iconName);
        this.animate = true;

        this.parent.classList.add("decision-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("form-tooltip","decision-tooltip", "text-tooltip");
        let title = document.createElement('div');
        title.classList.add("decision-title");
        let icon = document.createElement('img');
        icon.src = this.url;
        utils.addChild(title, icon);
        utils.addHTML(title, this.title);

        let description = document.createElement('div');
        description.classList.add("decision-description");
        description.innerHTML = this.description;

        let buttonInline = document.createElement('div');
        buttonInline.classList.add("decision-button-inline");

        this.button1 = new forms.Button(this.text1, () => {
            this.setLoading()
            this.saveCallback(this.form);
        });
        this.button1.addTo(buttonInline);
        this.button1.container.classList.add("decision-button-1");

        this.button2 = new forms.Button(this.text2, () => {
            this.hide();
        });
        this.button2.addTo(buttonInline);
        this.button2.container.classList.add("decision-button-2");

        utils.addChild(this.element, title);
        utils.addChild(this.element, description);
        this.form = this.formCallback(this.element);
        utils.addChild(this.element, buttonInline);
    }

    setLoading(){
        this.button1.button.style.width = this.button1.button.offsetWidth + "px";
        this.button1.button.innerHTML = utils.getLoader(17,false);
        this.button2.button.disabled = true;
    }
}

tooltips.FormTooltip = FormTooltip;