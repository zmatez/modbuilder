var $ = global.$;

/* ------------------------------------------ */
class Utils{
    /**
     * @param parent {Element | HTMLElement | Node}
     * @param child {Element | HTMLElement | Node}
     */
    static addChild(parent, ...child){
        for (let childElement of child) {
            parent.insertAdjacentElement('beforeend', childElement);
        }
    }

    /**
     * @param element {Element | HTMLElement | Node}
     * @param event {function(Event)}
     */
    static onClick(element, event){
        element.addEventListener('click', event);
    }

    /**
     * @param element {Element | HTMLElement | Node}
     * @param event {function(Event)}
     */
    static onDoubleClick(element, event){
        element.addEventListener('dblclick', event);
    }

    /**
     * @param element {Element | HTMLElement | Node}
     * @param event {function(Event)}
     */
    static onContextClick(element, event){
        element.addEventListener('contextmenu', event);
    }

    /**
     * @param element {Element | HTMLElement | Node}
     */
    static clear(element){
        element.innerHTML = "";
    }

    /**
     * @param parent {Element | HTMLElement | Node}
     * @param html {string}
     */
    static addHTML(parent, html){
        return parent.insertAdjacentHTML('beforeend', html);
    }

    /**
     * @param name {string}
     * @return {string}
     */
    static getIcon(name){
        return '../assets/icons/' + name;
    }

    /**
     * @param name {string}
     * @return {string}
     */
    static getIconModal(name){
        return '../../../../assets/icons/' + name;
    }

    /**
     * @param array {[]}
     * @param element
     */
    static removeFromArray(array,element){
        const index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    static byClass(name){
        return document.getElementsByClassName(name)[0];
    }

    /**
     * @param string {string}
     * @returns {string}
     */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static getLoader(size, padding = true, dark = false){
        let clazz = "";
        if(!padding){
            clazz = "nopadding";
        }

        if(dark){
            clazz += " dark";
        }

        return `<div class="spinner-wrapper ${clazz}" style="width: ${size + "px"}; height: ${size + "px"}"><svg class="spinner" width="${size}px" height="${size}px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">` +
            '                                <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>' +
            '                            </svg></div>';
    }

    static preloadImage(url){
        let img = document.createElement('img');
        img.src = url;
        return img;
    }

    static convertToURLString(value) {
        return value === undefined ? '' : value.toLowerCase().replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    }

    /**
     * @param element {HTMLElement}
     * @param duration {number} milliseconds
     * @param callback {function | null}
     * @param animation {string}
     * @param style {string}
     */
    static fadeIn(element, duration, callback = null, animation= "fadein", style = "ease-in-out"){
        element.style.display = "inherit";
        element.style.animation = duration + "ms " + animation + " " + style + " forwards";
        setTimeout(() => {
            if(callback != null){
                callback();
            }
        }, duration)
    }

    /**
     * @param element {HTMLElement}
     * @param duration {number} milliseconds
     * @param callback {function | null}
     * @param animation {string}
     * @param style {string}
     */
    static fadeOut(element, duration, callback = null, animation= "fadeout", style = "ease-in-out"){
        element.style.animation = duration + "ms " + animation + " " + style + " forwards";
        setTimeout(() => {
            if(callback != null){
                element.style.display = "none";
                callback();
            }
        },duration)
    }


    /**
     * @param min {number}
     * @param max {number}
     * @return {number}
     */
    static random(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    /**
     * @param container {HTMLElement}
     * @param elm {HTMLElement}
     * @param duration {number} seconds
     */
    static scrollToElement(container, elm, duration = 1) {
        let pos = getRelativePos(elm);
        scrollTo(container, pos.top, duration);  // duration in seconds
    }

    /**
     * @param text_
     * @param tag
     * @param color #ffffff
     * @return {HTMLDivElement}
     */
    static createTitle(text_, tag = "h1", color = null){
        let titleHolder = document.createElement('div');
        titleHolder.classList.add('title-holder');
        let text = document.createElement(tag);
        text.classList.add("title");
        text.innerHTML = text_;
        let line = document.createElement('div');
        line.classList.add("line");
        if(color != null){
            line.style.backgroundColor = color;
        }
        Utils.addChild(titleHolder, text, line);
        return titleHolder;
    }

    static copyInstance (original) {
        return Object.assign(
            Object.create(
                Object.getPrototypeOf(original)
            ),
            original
        );
    }

    /**
     * @param text {string}
     * @param element {HTMLElement | null}
     * @param settings {"above" | "under" | null}
     */
    static copyToClipboard(text, element = null, settings = null) {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        if(element != null){
            let tooltip = new tooltips.TextTooltip(element,"Copied to clipboard");
            if(settings != null){
                tooltip.placementY = settings;
            }
            tooltip.show();
            setTimeout(() => {
                tooltip.hide()
            }, 2000);
        }
    }


    /**
     * Check if element is visible on the screen
     * @param elm {HTMLElement}
     * @return {boolean}
     */
    static checkVisible(elm) {
        let rect = elm.getBoundingClientRect();
        let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    }
}

module.exports.utils = Utils;
/* ------------------------------------------ */
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
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            this.element.classList.add("dragover");
            this.element.classList.remove("drag-success", "drag-failure");
        });

        this.element.addEventListener('drop', (e) => {
            e.stopPropagation();
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

        this.element.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            this.element.classList.remove('dragover');
        })
    }

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

module.exports.dragAndDrop = {
    draggable: DraggableComponent,
    zone: DropZone
};

/* ------------------------------------------ */

const GROUP_PANELS = "panels";
const GROUP_FORM_SAVE = "form_save";
const GROUP_POPUP = "popup";
const GROUP_TABLE = "table";
const GROUP_MEDIA_LOADING = "media";

class Loader{
    /**
     * @type {LoadingEntry[]}
     */
    loadingEntries = [];

    /**
     * @type {LoadingEvent[]}
     */
    loadingEvents = [];

    constructor() {
    }

    startLoading(name, group = "") {
        this.loadingEntries.push(new LoadingEntry(name,group));
        this.fireEvents(name,group,0);
    }

    endLoading(name, group = "") {
        let index = -1;
        let ghost = new LoadingEntry(name,group);

        for (let i = 0; i < this.loadingEntries.length; i++) {
            let entry = this.loadingEntries[i];
            if(entry.equals(ghost)){
                index = i;
                break;
            }
        }

        if (index > -1) {
            this.loadingEntries.splice(index, 1);
        }
        this.fireEvents(name,group,1);
    }

    /**
     * @param group {string | string[]}
     * @param callback {function(string, string, int)}
     */
    addEvent(group, callback){
        if(Array.isArray(group)){
            for (let groupElement of group) {
                this.loadingEvents.push(new LoadingEvent(groupElement,callback));
            }
        }else{
            this.loadingEvents.push(new LoadingEvent(group,callback));
        }
    }

    fireEvents(name, group, state){
        for (let loadingEvent of this.loadingEvents) {
            loadingEvent.event(name,group,state);
        }
    }

    getLoadingAmountOf(group){
        let i = 0;
        for (let loadingEntry of this.loadingEntries) {
            if(loadingEntry.group === group){
                i++;
            }
        }
        return i;
    }
}

class LoadingEntry{
    /**
     * @type {string}
     */
    group;
    /**
     * @type {string}
     */
    name;

    constructor(name, group = "") {
        this.group = group;
        this.name = name;
    }

    /**
     * Compare this vs another object
     * @param anotherEntry {LoadingEntry}
     * @returns {boolean}
     */
    equals(anotherEntry){
        return this.group === anotherEntry.group && this.name === anotherEntry.name;
    }
}



class LoadingEvent{
    /**
     * @type {string[] | string}
     */
    groups;

    /**
     * @type {function(string, string, int)}
     */
    callback;

    /**
     * @param groups {string[] | string}
     * @param callback {function(string, string, int)}
     */
    constructor(groups, callback) {
        this.groups = groups;
        this.callback = callback;
    }

    event(name, group, state){
        let matches = false;
        if(Array.isArray(this.groups)){
            for (let groupElement of this.groups) {
                if(group === groupElement){
                    matches = true;
                    break;
                }
            }
        }else{
            matches = this.groups === group;
        }

        if(matches){
            this.callback(name,group,state);
        }
    }
}

const loader = new Loader();

function getGETParam(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function base64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

function base64Decode(str) {
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function removeGETParam(url, parameter) {
    let urlparts = url.split('?');
    if (urlparts.length >= 2) {
        let prefix = encodeURIComponent(parameter) + '=';
        let pars = urlparts[1].split(/[&;]/g);

        for (let i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        url = urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : "");
        return url;
    } else {
        return url;
    }
}

function insertGETParam(key, value, deleteIfEmpty = true) {
    if (history.pushState) {
        let currentUrlWithOutHash = window.location.origin + window.location.pathname + window.location.search;
        let hash = window.location.hash
        currentUrlWithOutHash = removeGETParam(currentUrlWithOutHash, key);

        let queryStart;
        if (currentUrlWithOutHash.indexOf('?') !== -1) {
            queryStart = '&';
        } else {
            queryStart = '?';
        }

        let newurl;
        if(value === ""){
            newurl = currentUrlWithOutHash + hash;
        }else{
            newurl = currentUrlWithOutHash + queryStart + key + '=' + value + hash;
        }
        window.history.pushState({path: newurl}, '', newurl);
    }
}

function modalBasicInfo(iconName, title, description){
    let icon = `<img src='${CURRENT_HOST}assets/icons/${iconName}'>`;
    modal = new InfoModal(icon,title,description);
    modal.init();
    modal.show();
    return modal;
}

function modalBasicButton(iconName, title, description, text = "Okay", action = null){
    let icon = `<img src='${getCDNAsset('icons/' + iconName)}'>`;
    modal = new ButtonModal(icon,title,description,text,() => {
        if(action == null){
            modal.hide();
        }else{
            action();
        }
    });
    modal.init();
    modal.show();
    return modal;
}

function modalBasicDoubleButton(iconName, title, description, text1 = "Okay", text2 = "Cancel", action1 = null, action2 = null){
    let icon = `<img src='${getCDNAsset('icons/' + iconName)}'>`;
    modal = new DoubleButtonModal(icon,title,description,text1,() => {
        if(action1 == null){
            modal.hide();
        }else{
            action1();
        }
    },text2,() => {
        if(action2 == null){
            modal.hide();
        }else{
            action2();
        }
    });
    modal.init();
    modal.show();
    return modal;
}

function forceDownload(url, fileName){
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function(){
        let urlCreator = window.URL || window.webkitURL;
        let imageUrl = urlCreator.createObjectURL(this.response);
        let tag = document.createElement('a');
        tag.href = imageUrl;
        tag.download = fileName;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
    }
    xhr.send();
}

function scrollToOffset(element, yOffset = 0) {
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({top: y, behavior: 'smooth'});
}

/**
 * @param string {string}
 * @returns {string}
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Sending POST/GET requests via AJAX
 * @param url {string} - url to open
 * @param callback {function(boolean, any)} - function callback - (success (boolean), response (text))
 * @param data - special data to send via POST/GET
 * @param auth - should send saved session to the url via POST/GET
 * @param progress {function(number)} progress
 * @param raw - true if you want to send files
 * @param method - POST or GET
 * @return XMLHttpRequest
 */
function post(url, callback = function (success, response) {}, data = {}, auth = true, progress = function (progress) {}, raw = false, method = 'post'){
    if(auth){
        data['sess_uuid'] = SESSION_UUID;
        data['sess_token'] = SESSION_TOKEN;
    }

    //show data params
    //console.log(JSON.stringify(data))

    if(raw){
        return $.ajax({
            xhr: function() {
                let xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(evt) {
                    if (evt.lengthComputable) {
                        let percentComplete = (evt.loaded / evt.total) * 100;
                        progress(percentComplete)
                    }
                }, false);
                return xhr;
            },
            url: url,
            method: method,
            data: data,
            processData: false,
            contentType: false,
            cache: false,
            success: (data, statusText, xhr) => {
                callback(true, data);
            },
            error: (xhr, statusText) => {
                callback(false, xhr.status);
            }
        })
    }else{
        return $.ajax({
            xhr: function() {
                let xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(evt) {
                    if (evt.lengthComputable) {
                        let percentComplete = (evt.loaded / evt.total) * 100;
                        progress(percentComplete)
                    }
                }, false);
                return xhr;
            },
            url: url,
            method: method,
            data: data,
            success: (data, statusText, xhr) => {
                callback(true, data);
            },
            error: (xhr, statusText) => {
                callback(false, xhr.status);
            }
        })
    }
}

/**
 * @param url {string}
 * @param data {{}}
 */
function redirectPost(url, data) {
    let form = document.createElement('form');
    document.body.appendChild(form);
    form.method = 'post';
    form.action = url;
    for (let name in data) {
        let input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = data[name];
        form.appendChild(input);
    }
    form.submit();
}

/**
 *
 * @param datatype {string} datatype you want to get from php (query param)
 * @param callback {function(boolean, *)}
 * @param data
 * @return XMLHttpRequest
 */
function getData(datatype, callback, data = {}){
    data['query'] = datatype;
    return post(CURRENT_HOST + "php/libs/assets/data/data.php", (success, response) => {
        if(success){
            callback(true,response);
        }else{
            callback(false,response);
        }
    },data);
}

function serializeQueries(url = window.location.href){
    url = url.slice(window.location.href.indexOf('?') + 1)
    const params = new URLSearchParams(url);
    let data = {};
    for(let value of params.keys()) {
        data[value] = params.get(value);
    }
    return data;
}

/**
 *
 * @param param {string}
 * @param url {string}
 * @return {string}
 */
function putQueryParam(param, url = window.location.href){
    let char = "?";
    if(url.includes("?")){
        char = "&";
    }

    let qUrl = url + char + param;
    return qUrl;
}

/**
 * Gets hidden variable added by PHP
 * @param id
 * @param remove
 */
function getHiddenVariable(id, remove = false){
    try {
        let doc =  document.getElementById('var-' + id);
        let text = doc.innerText;

        if(remove){
            doc.remove();
        }

        return text;
    }catch (e){
        return null;
    }
}


function timeAgo(time) {
    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    let time_formats = [
        [60, 'seconds', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    let seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds === 0) {
        return 'Just now'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    let i = 0,
        format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
}

/**
 * @param col {string} hex
 * @param amt {number} from -1 (black) to 1 (white)
 * @return {string}
 */
function adjustBrightness(col, amt) {
    let usePound = false;

    if (col[0] === "#") {
        col = col.slice(1);
        usePound = true;
    }

    let R = parseInt(col.substring(0,2),16);
    let G = parseInt(col.substring(2,4),16);
    let B = parseInt(col.substring(4,6),16);

    // to make the colour less bright than the input
    // change the following three "+" symbols to "-"
    R = R + amt;
    G = G + amt;
    B = B + amt;

    if (R > 255) R = 255;
    else if (R < 0) R = 0;

    if (G > 255) G = 255;
    else if (G < 0) G = 0;

    if (B > 255) B = 255;
    else if (B < 0) B = 0;

    let RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return (usePound?"#":"") + RR + GG + BB;

}

/**
 * @param color #hex
 * @return {boolean} is bright = true, is dark = false
 */
function isBright(color) {
    // Variables for red, green, blue values
    let r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {

        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];
    }
    else {

        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(
            color.length < 5 && /./g, '$&$&'));

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5;
}

/**
 * @param color {string} #hex
 * @param opacity {number}
 * @return {string}
 */
function applyOpacity(color, opacity) {
    if (typeof color !== 'string' || color.length !== 7) return color;

    if (opacity < 0) opacity = 0;
    else if (opacity > 100) opacity = 100;

    opacity = Math.round(opacity * 2.55);

    return color + opacity.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * @param newNode {Node}
 * @param referenceNode {Node}
 */
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * @param elements {HTMLElement}
 */
function appendScrollbar(...elements){
    document.addEventListener('DOMContentLoaded', function() {
        //The first argument are the elements to which the plugin shall be initialized
        //The second argument has to be at least a empty object or a object with your desired options
        OverlayScrollbars(...elements, { });
    });
}

/**
 * @param callback {function({})}
 * @param options {{}}
 * @param elements {HTMLElement}
 */
function appendScrollbarWithOptions(callback, options, ...elements){
    document.addEventListener('DOMContentLoaded', function() {
        //The first argument are the elements to which the plugin shall be initialized
        //The second argument has to be at least a empty object or a object with your desired options
        callback(OverlayScrollbars(...elements, options));
    });
}

/**
 * @param elements {HTMLElement}
 * @param options {{}}
 */
function appendScrollbarImmediately(elements, options = {}){
    return OverlayScrollbars(elements, options);
}

/**
 * @param name {string} link
 * @return string | null
 */
function getResource(name){
    return CURRENT_HOST + "uploads/" + name;
}

/**
 * Get CDN resource from projects.matez.net/wildnature/uploads/
 * @param name
 * @param width
 * @param height
 * @param quality %
 * @return {string}
 */
function getCDNResource(name, width = null, height = null, quality = null){
    let props = "";
    if(width != null){
        addProp('w=' + width);
    }
    if(height != null){
        addProp('h=' + height);
    }
    if(quality != null){
        addProp('q=' + quality);
    }

    function addProp(val){
        if(props !== ""){
            props += "," + val;
        }else{
            props += val;
        }
    }

    if(props !== ""){
        return `https://cdn.statically.io/img/projects.matez.net/${props}/wildnature/uploads/${name}`
    }
    return `https://cdn.statically.io/img/projects.matez.net/wildnature/uploads/${name}`
}

/**
 * Get CDN asset from projects.matez.net/wildnature/assets/
 * @param name
 * @param width
 * @param height
 * @param quality %
 * @return {string}
 */
function getCDNAsset(name, width = null, height = null, quality = null){
    let props = "";
    if(width != null){
        addProp('w=' + width);
    }
    if(height != null){
        addProp('h=' + height);
    }
    if(quality != null){
        addProp('q=' + quality);
    }

    function addProp(val){
        if(props !== ""){
            props += "," + val;
        }else{
            props += val;
        }
    }

    if(props !== ""){
        return `https://cdn.statically.io/img/projects.matez.net/${props}/wildnature/assets/${name}`
    }
    return `https://cdn.statically.io/img/projects.matez.net/wildnature/assets/${name}`
}

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function humanFileSize(bytes, si=true, dp=1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function convertToURLString(value) {
    return value === undefined ? '' : value.toLowerCase().replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}


/**
 * @param imgEl {HTMLImageElement}
 * @return {{r: number, b: number, g: number}}
 */
function getAverageRGB(imgEl) {
    let blockSize = 5, // only visit every 5 pixels
        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;

    if (!context) {
        return defaultRGB;
    }

    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    context.drawImage(imgEl, 0, 0);

    try {
        data = context.getImageData(0, 0, width, height);
    } catch(e) {
        /* security error, img on diff domain */
        return defaultRGB;
    }

    length = data.data.length;

    while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
    }

    // ~~ used to floor values
    rgb.r = ~~(rgb.r/count);
    rgb.g = ~~(rgb.g/count);
    rgb.b = ~~(rgb.b/count);

    return rgb;
}

/**
 * @param r {number}
 * @param g {number}
 * @param b {number}
 */
function rgbToHex(r,g,b){
    let hex = "";
    hex += r.toString(16);
    hex += g.toString(16);
    hex += b.toString(16);
    return hex;
}

//----------- SCROLL
/**
 * @param container {HTMLElement}
 * @param elm {HTMLElement}
 * @param duration {number} seconds
 */
function scrollToElement(container, elm, duration) {
    let pos = getRelativePos(elm);
    scrollTo(container, pos.top, 2);  // duration in seconds
}

function getRelativePos(elm) {
    let pPos = elm.parentNode.getBoundingClientRect(), // parent pos
        cPos = elm.getBoundingClientRect(), // target pos
        pos = {};

    pos.top = cPos.top - pPos.top + elm.parentNode.scrollTop
    pos.right = cPos.right - pPos.right
    pos.bottom = cPos.bottom - pPos.bottom
    pos.left = cPos.left - pPos.left;

    return pos;
}

function scrollTo(element, to, duration, onDone) {
    let start = element.scrollTop,
        change = to - start,
        startTime = performance.now(),
        val, now, elapsed, t;

    function animateScroll() {
        now = performance.now();
        elapsed = (now - startTime) / 1000;
        t = (elapsed / duration);

        element.scrollTop = start + change * easeInOutQuad(t);

        if (t < 1)
            window.requestAnimationFrame(animateScroll);
        else
            onDone && onDone();
    }

    animateScroll();
}

function easeInOutQuad(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}