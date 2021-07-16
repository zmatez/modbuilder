module.exports.el = {};
class Form{
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type HTMLFormElement
     */
    element;
    /**
     * @type function | null
     */
    action;

    /**
     * @type IFormEntry[]
     */
    entries = [];
    /**
     * @type IFormEntry[]
     */
    readyEntries = [];

    /**
     * @type function(IFormEntry)[]
     */
    changeEvents = [];

    /**
     * @type function(IFormEntry)[]
     */
    removeEvents = [];

    /**
     * @type function(IFormEntry)[]
     */
    readyEvents = [];

    /**
     * @type function()[]
     */
    resetListeners = [];

    /**
     * @type {boolean}
     */
    popped = false;

    enableScroll = true;

    scroll;

    /**
     * @param parent {HTMLElement}
     */
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * @param action {function | null}
     * @param id {string | null}
     * @param clazz {string | null}
     */
    push(action = null, id = null, clazz = null){
        this.element = document.createElement("form");
        if(id != null){
            this.element.id = id;
        }
        if(clazz != null){
            this.element.classList.add(clazz);
        }
        this.action = action;
    }

    pop(){
        this.parent.insertAdjacentElement('beforeend', this.element);
        if(this.enableScroll) {
            //todo scroll
        }

        this.popped = true;
        this.fireReadyEvents(null);
    }

    post(){
        this.updateEntries();
        this.entries.forEach((entry) => {
            entry.post();
        });
    }

    /**
     * @param formEntry {IFormEntry}
     */
    addEntry(formEntry){
        this.entries.push(formEntry);
        formEntry.addChangeListener((entry) => {
            this.fireChangeEvents(entry);
        });
        formEntry.addRemoveListener((entry) => {
            this.fireRemoveEvents(entry);
        })
        formEntry.addReadyListener((entry) => {
            if(!this.readyEntries.includes(entry)){
                this.readyEntries.push(entry);
            }
            this.fireReadyEvents(entry);
        });
        this.addElement(formEntry.getElement());
    }

    /**
     * @param formEntry {...IFormEntry}
     */
    addEntries(...formEntry){
        formEntry.forEach((entry) => {this.addEntry(entry)})
    }

    /**
     * @param element {HTMLElement}
     */
    addElement(element){
        if(this.element == null){
            throw new Error("Form not pushed! Do push() at start and pop() at the end")
        }
        this.element.insertAdjacentElement('beforeend',element);
    }

    /**
     * @param button {SubmitButton}
     * @param append {boolean} append to form
     */
    addSubmit(button, append = true){
        button.validCallback = () => {
            return this.validate();
        };
        button.addAction(() => {
            if(this.action != null){
                this.action();
            }
        })
        if(append){
            this.addElement(button.container);
        }
    }

    /**
     * @return boolean is valid
     */
    validate(){
        let messages = [];

        for (let entry of this.entries) {
            let state = entry.isValid();
            if(!state.valid){
                for (let string of state.message) {
                    messages.push({
                        title: utils.capitalizeFirstLetter(state.formEntry.id),
                        html: string
                    });
                }
            }
        }

        if(messages.length !== 0){
            let modal = new IModal("info",{
                icon: "error-mark.svg",
                title: "Form is not valid",
                text: "Found " + messages.length + " errors. Fix them and try again."
            });
            modal.open();
        }

        return messages.length === 0;
    }

    /**
     * @param channel {string}
     * @param additionalData {{} | null}
     */
    serializeAndSend(channel,additionalData = null){
        if(this.validate()) {
            let data = this.serialize();
            if(additionalData != null){
                for (let additionalDataKey in additionalData) {
                    data[additionalDataKey] = additionalData[additionalDataKey];
                }
            }
            api.send(channel,data);
        }
    }

    /**
     * @return {{}}
     */
    serialize(){
        let data = {};
        this.updateEntries();
        this.entries.forEach((entry) => {
            data[entry.id] = entry.serialize();
        });
        return data;
    }

    /**
     * @param callback {function(IFormEntry)}
     */
    addChangeListener(callback){
        this.changeEvents.push(callback);
    }

    /**
     * @param entry {IFormEntry}
     * @protected
     */
    fireChangeEvents(entry){
        this.changeEvents.forEach((event) => {
            event(entry);
        });
        if(this.enableScroll) {
            //todo scroll
        }

    }

    /**
     * @param callback {function(IFormEntry)}
     */
    addRemoveListener(callback){
        this.removeEvents.push(callback);
    }

    /**
     * @param entry {IFormEntry}
     * @protected
     */
    fireRemoveEvents(entry){
        this.removeEvents.forEach((event) => {
            event(entry);
        })
    }

    /**
     * ADD BEFORE POP()!
     * @param callback {function(IFormEntry)}
     */
    addReadyListener(callback){
        this.readyEvents.push(callback);
    }

    /**
     * @param entry {IFormEntry}
     * @protected
     */
    fireReadyEvents(entry){
        if(this.readyEntries.length === this.entries.length && this.popped){
            this.readyEvents.forEach((event) => {
                event(entry);
            })
        }
    }

    /**
     * @param callback {function()}
     */
    addResetListener(callback){
        this.resetListeners.push(callback);
    }

    /**
     * @protected
     */
    fireResetListeners(){
        this.resetListeners.forEach((event) => {
            event();
        })
    }

    reset(){
        this.updateEntries();
        this.entries.forEach((entry) => {
            entry.reset();
        });
        this.fireResetListeners()
    }

    updateEntries(){
        let newEntries = [];
        for (let entry of this.entries) {
            if(!entry.removed){
                newEntries.push(entry);
            }
        }
        this.entries = newEntries;
    }
}

module.exports.Form = Form;

/**
 * @interface IFormEntry
 */
class IFormEntry{
    /**
     * @type string | null
     */
    id;

    /**
     * @type HTMLElement
     */
    element;

    /**
     * @type {function(IFormEntry)[]}
     */
    changeListeners = [];

    /**
     * @type {function(IFormEntry)[]}
     */
    readyListeners = [];

    /**
     * @type {function(IFormEntry)[]}
     */
    removeListeners = [];

    removed = false;

    /**
     * @param id {string | null}
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * @abstract
     */
    construct(){

    }

    /**
     * @return HTMLElement
     */
    getElement(){
        this.construct();
        if(this.element == null){
            throw new Error(`IFormType (${this.id}) element is null`)
        }
        return this.element;
    }

    /**
     * @return ValidityState
     */
    isValid(){
        return ValidityState.invalid(this, "This element is an interface!");
    }

    /**
     * @type {string | {}}
     * @abstract
     */
    serialize(){

    }

    /**
     * @abstract
     */
    reset(){

    }

    post(){

    }

    /**
     * fires when this entry was changed by user
     */
    changed(){
        this.changeListeners.forEach((listener) => {
            listener(this);
        })
    }

    /**
     * @abstract
     */
    getValue(){

    }

    /**
     * @abstract
     * @param value {any}
     */
    setValue(value){

    }

    getId(){
        return this.id
    }

    /**
     * @param callback {function(IFormEntry)}
     */
    addChangeListener(callback){
        this.changeListeners.push(callback);
    }

    /**
     * fires when this entry was changed by user
     */
    ready(){
        this.readyListeners.forEach((listener) => {
            listener(this);
        })
    }

    /**
     * @param callback {function(IFormEntry)}
     */
    addReadyListener(callback){
        this.readyListeners.push(callback);
    }

    remove(){
        this.removed = true;
        if(this.element != null){
            this.element.remove();
        }
        this.removeListeners.forEach((listener) => {
            listener(this);
        })
    }

    /**
     * @param callback {function(IFormEntry)}
     */
    addRemoveListener(callback){
        this.removeListeners.push(callback);
    }
}

class ValidityState{
    /**
     * @type IFormEntry
     */
    formEntry;

    /**
     * @type boolean
     */
    valid;
    /**
     * @type {string[]}
     */
    message;

    /**
     * @param formEntry {IFormEntry}
     * @param valid {boolean}
     * @param message {...string}
     */
    constructor(formEntry, valid, ...message) {
        this.formEntry = formEntry;
        this.valid = valid;
        this.message = message;
    }

    /**
     * @param formEntry {IFormEntry}
     * @return {ValidityState}
     */
    static valid(formEntry){
        return new ValidityState(formEntry,true);
    }

    /**
     * @param formEntry {IFormEntry}
     * @param message
     */
    static invalid(formEntry, message){
        return new ValidityState(formEntry,false, message);
    }
}

class Button{
    /**
     * @type string
     */
    text;
    /**
     * @type function[]
     */
    action = [];
    /**
     * @type string | null
     */
    id;
    /**
     * @type string | null
     */
    clazz;

    /**
     * @type HTMLDivElement
     */
    container;
    /**
     * @type HTMLButtonElement
     */
    button;

    /**
     * @type {boolean}
     */
    transparent = false;

    /**
     * @param text {string}
     * @param action {function}
     * @param clazz {string | null}
     * @param transparent {boolean}
     */
    constructor(text, action, clazz = null, transparent = false) {
        this.text = text;
        this.action.push(action);
        this.clazz = clazz;
        this.transparent = transparent;
    }

    construct(){
        this.container = document.createElement('div');
        this.container.classList.add("button-container");
        if(this.id != null){
            this.container.id = this.id;
        }

        {
            this.button = document.createElement('button');
            this.button.classList.add("button");
            if(this.transparent){
                this.button.classList.add("button-transparent");
            }
            this.button.type = "button";
            if(this.clazz != null){
                this.button.classList.add(this.clazz);
            }
            ComponentUtils.registerRipple(this.button);
            this.button.addEventListener('click', () => {
                this.onClick();
            })

            {
                let span = document.createElement('span');
                span.innerHTML = this.text;
                this.button.insertAdjacentElement('beforeend',span);
            }
            this.container.insertAdjacentElement('beforeend',this.button);
        }
    }

    /**
     * @param parent {HTMLElement}
     */
    addTo(parent){
        this.construct();
        parent.insertAdjacentElement('beforeend',this.container);
    }

    onClick(){
        this.action.forEach((action) => {
            action();
        });
    }

    /**
     * @param action {function}
     */
    addAction(action){
        this.action.push(action);
    }
}

module.exports.el.Button = Button;

class IconButton extends Button{
    icon;

    realpath = false;

    /**
     *
     * @param text {string} shows on hover
     * @param icon {string} relative to icons
     * @param action {function}
     * @param clazz
     */
    constructor(text, icon, action, clazz = null) {
        super(text, action, clazz);
        this.icon = icon;
    }

    /**
     * @private
     */
    construct(){
        this.container = document.createElement('div');
        this.container.classList.add("icon-button-container");
        if(this.id != null){
            this.container.id = this.id;
        }

        {
            this.button = document.createElement('img');
            if(!this.realpath) {
                this.button.src = utils.getIcon(this.icon);
            }else{
                this.button.src = this.icon;
            }
            this.button.classList.add("icon-button");
            if(this.transparent){
                this.button.classList.add("icon-button-transparent");
            }
            if(this.clazz != null){
                this.button.classList.add(this.clazz);
            }
            ComponentUtils.registerRipple(this.button);
            this.container.addEventListener('click', () => {
                this.onClick();
            });

            let tooltip = new tooltips.TextTooltip(this.button,this.text);
            tooltip.applyHover(this.container);

            /*{
                let span = document.createElement('span');
                span.innerHTML = this.text;
                this.button.insertAdjacentElement('beforeend',span);
            }*/
            this.container.insertAdjacentElement('beforeend',this.button);
        }
    }
}

module.exports.el.IconButton = IconButton;

class SubmitButton extends Button{
    /**
     * @type {function(): boolean}
     */
    validCallback;

    /**
     * @param text {string}
     * @param action {function}
     * @param clazz {string | null}
     */
    constructor(text, action, clazz = null) {
        super(text, action, clazz);
    }

    onClick() {
        if(this.validCallback()){
            super.onClick();
        }
    }
}

module.exports.el.SubmitButton = SubmitButton;

// ------------ FORM ENTRIES -------------------------------------------------------------------------------------------
class FormField extends IFormEntry{
    /**
     * @type string
     */
    title;
    /**
     * @type string
     */
    description = "";

    /**
     * @type HTMLInputElement
     */
    input;

    readOnly = false;
    maxLength = -1;
    type = "text";
    pattern = "";
    bottomHTML = "";
    value = "";
    required = true;
    placeholder = "";

    /**
     * @param id {string}
     * @param title {string}
     */
    constructor(id, title) {
        super(id);
        this.title = title;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("form-entry", "form-field-container");

        let text = document.createElement('span');
        text.classList.add("form-field-title");
        text.innerHTML = this.title;
        utils.addChild(this.element, text);

        if(this.description !== ""){
            let description = document.createElement('p');
            description.classList.add("form-field-description");
            description.innerHTML = this.description;
            utils.addChild(this.element, description);
        }

        this.createInput()

        if(this.bottomHTML != null){
            let bottom = document.createElement('div');
            bottom.classList.add("form-field-bottom");
            bottom.innerHTML = this.bottomHTML;
            utils.addChild(this.element, bottom);
        }

        this.ready();
    }

    createInput(){
        this.input = document.createElement('input');
        this.input.classList.add('form-field');
        this.input.type = this.type;
        if(this.pattern !== ""){
            this.input.pattern = this.pattern;
        }
        this.input.readOnly = this.readOnly;
        this.input.value = this.value;
        this.input.required = this.required;
        this.input.placeholder = this.placeholder;
        if(this.maxLength !== -1){
            this.input.maxLength = this.maxLength;
        }
        utils.addChild(this.element,this.input);

        this.input.addEventListener('input', () => {
            this.changed()
        })
        this.input.addEventListener('change', () => {
            this.changed()
        })
    }

    reset() {
        this.input.value = this.value;
    }

    serialize() {
        return this.input.value;
    }

    getValue() {
        return this.input.value;
    }

    setValue(value) {
        if(this.input != null){
            this.input.value = value;
        }else{
            this.value = value;
        }
    }

    isValid() {
        if(this.required && this.getValue() === ""){
            return ValidityState.invalid(this,"This field is required");
        }else if(!this.input.checkValidity()){
            return ValidityState.invalid(this,this.input.validationMessage);
        }

        return ValidityState.valid(this);
    }
}

module.exports.el.FormField = FormField;

// LIMITED FORM FIELD & VALIDATORS
class LimitedFormField extends FormField{
    static validators = {};
    oldValue = "";

    construct() {
        super.construct();
        this.oldValue = this.value;

        this.input.addEventListener('change', () => {
            let valid = true;
            for (let i = 0; i < this.input.value.length; i++) {
                let char = this.input.value[i];
                for (let key in LimitedFormField.validators) {
                    /**
                     * @type {FormFieldValidator}
                     */
                    let validator = LimitedFormField.validators[key];
                    if(!validator.isValid(char,i)){
                        valid = false;
                        break;
                    }
                }
            }

            if(valid){
                this.oldValue = this.input.value;
            }else{
                this.input.value = this.oldValue;
            }
        })
    }

    static addValidator(name, validator){
        this.validators[name] = validator;
    }
}

/**
 * @interface
 */
class FormFieldValidator{
    /**
     * @param char {string}
     * @param index {number}
     * @return {boolean}
     * @abstract
     */
    isValid(char, index){
        return true;
    }
}

//VALIDATORS END

//
class ButtonFormField extends FormField{
    buttonText;
    action;

    /**
     * @param id {string}
     * @param title {string}
     * @param buttonText {string}
     * @param action {function}
     */
    constructor(id, title, buttonText, action) {
        super(id, title);
        this.buttonText = buttonText;
        this.action = action;
    }

    construct() {
        super.construct();
        this.element.classList.add("form-field-button-container")
    }

    createInput() {
        let holder = document.createElement('div');
        holder.classList.add("form-field-button-holder")

        this.input = document.createElement('input');
        this.input.classList.add('form-field');
        this.input.type = this.type;
        if(this.pattern !== ""){
            this.input.pattern = this.pattern;
        }
        this.input.readOnly = this.readOnly;
        this.input.value = this.value;
        this.input.required = this.required;
        this.input.placeholder = this.placeholder;
        if(this.maxLength !== -1){
            this.input.maxLength = this.maxLength;
        }
        utils.addChild(holder, this.input);

        let button = new Button(this.buttonText,this.action,"form-button");
        button.addTo(holder);

        utils.addChild(this.element,holder);

        this.input.addEventListener('input', () => {
            this.changed()
        })
        this.input.addEventListener('change', () => {
            this.changed()
        })
    }
}

module.exports.el.ButtonFormField = ButtonFormField;