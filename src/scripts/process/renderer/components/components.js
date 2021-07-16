class ComponentUtils {
    static createShadowRipple(event) {
        const button = event.currentTarget;

        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        let rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("shadowripple");
        button.addEventListener('mouseup', (event) => {
            circle.remove();
            ComponentUtils.createRipple(event)
        })

        button.appendChild(circle);
    }

    static createRipple(event) {
        const button = event.currentTarget;

        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        let rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");
        circle.addEventListener('animationend', () => {
            circle.remove();
        })

        button.appendChild(circle);
    }

    static registerRipple(button) {
        button.addEventListener("click", ComponentUtils.createRipple);
        button.addEventListener("mousedown", ComponentUtils.createShadowRipple);
    }
}

module.exports.ComponentUtils = ComponentUtils;

//draggable
class DraggableComponent{
    /**
     * @type HTMLElement
     */
    element;

    /**
     * @private
     * @type function(DragEvent)[]
     */
    dragStartEvents = [];

    /**
     * @private
     * @type function(DragEvent)[]
     */
    dragEndEvents = [];

    /**
     * @param element {HTMLElement}
     */
    constructor(element) {
        this.element = element;
        this.construct();
    }

    construct(){
        this.element.draggable = true;

        this.element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain",this.serialize());
            e.dataTransfer.dropEffect = "copy";
            this.fireDragStartEvents(e)
        });

        this.element.addEventListener('dragend', (e) => {
            this.fireDragEndEvents(e)
        });
    }

    /**
     * @return string
     */
    serialize(){

    }

    /**
     * @param e {function(DragEvent)}
     */
    addDragStartEvent(e){
        this.dragStartEvents.push(e);
    }

    /**
     * @private
     * @param e {DragEvent}
     */
    fireDragStartEvents(e){
        this.dragStartEvents.forEach((f) => {
            f(e);
        })
    }

    /**
     * @param e {function(DragEvent)}
     */
    addDragEndEvent(e){
        this.dragEndEvents.push(e);
    }

    /**
     * @private
     * @param e {DragEvent}
     */
    fireDragEndEvents(e){
        this.dragEndEvents.forEach((f) => {
            f(e);
        })
    }
}

class DropZone{
    /**
     * @type HTMLElement
     */
    element;

    /**
     * @param element {HTMLElement}
     */
    constructor(element) {
        this.element = element;
        this.construct();
    }

    construct(){
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.element.classList.add("dragover");
            this.element.classList.remove("drag-success", "drag-failure");
        });

        this.element.addEventListener('drop', (e) => {
            let data = e.dataTransfer.getData("text/plain");
            this.element.classList.remove('dragover');
            if(this.analyzeData(data)){
                this.element.classList.add('drag-success');
                setTimeout(() => {
                    this.element.classList.remove('drag-success');
                }, 500)
            }else{
                this.element.classList.add('drag-failure');
                setTimeout(() => {
                    this.element.classList.remove('drag-failure');
                }, 500)
            }
        });

        this.element.addEventListener('dragleave', () => {
            this.element.classList.remove('dragover');
        })
    }

    //todo
    /**
     *
     * @param element {HTMLElement}
     * @return {boolean}
     */
    canDragOver(element){
        return true;
    }

    /**
     * @param data {string}
     * @return boolean success
     */
    analyzeData(data){

    }
}