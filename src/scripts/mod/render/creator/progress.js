class AssetProgress {
    /**
     * @type HTMLElement
     */
    parent;
    /**
     * @type HTMLElement
     */
    background;
    /**
     * @type HTMLElement
     */
    element;

    /**
     * @type HTMLElement
     */
    progressBar;

    /**
     * @type HTMLElement
     */
    infoTime;
    /**
     * @type HTMLElement
     */
    infoProgress;

    /**
     * @type {AssetProgressEntry[]}
     */
    entries = [];

    /**
     * @type {number}
     */
    seconds = 0;

    timer;

    /**
     * @param parent {HTMLElement} parent tab (tab-editor)
     */
    constructor(parent) {
        this.parent = parent;
    }

    start(){
        for (let entry of this.entries) {
            entry.done = false;
        }
        this.background = document.createElement('div');
        this.background.classList.add('asset-loader-background');

        this.element = document.createElement('div');
        this.element.classList.add("asset-loader");

        let title = document.createElement('h1');
        title.innerHTML = "Loading assets";

        let assetProgress = document.createElement('div');
        assetProgress.classList.add("asset-progress");
        let bar = document.createElement('div');
        bar.classList.add("bar");
        this.progressBar = document.createElement('div');
        this.progressBar.classList.add("bar-filled");
        utils.addChild(bar, this.progressBar)

        let info = document.createElement('div');
        info.classList.add("info");
        this.infoTime = document.createElement('div');
        this.infoTime.classList.add('info-time');
        this.infoProgress = document.createElement('div');
        this.infoProgress.classList.add('info-progress');
        utils.addChild(info, this.infoTime, this.infoProgress)
        utils.addChild(assetProgress, bar, info);

        this.timer = setInterval(() => {
            this.seconds++;
            let hours   = Math.floor(this.seconds / 3600);
            let minutes = Math.floor((this.seconds - (hours * 3600)) / 60);
            let seconds = this.seconds - (hours * 3600) - (minutes * 60);

            let text = "";
            if(hours <= 0){
                if(minutes <= 0){
                    text = seconds + "s";
                }else{
                    text = minutes + "m " + seconds + "s";
                }
            }else{
                if(minutes <= 0){
                    text = hours + "h " + seconds + "s";
                }else{
                    text = hours + "h " + minutes + "m " + seconds + "s";
                }
            }

            this.infoTime.innerHTML = text;
        }, 1000);


        let list = document.createElement('div');
        list.classList.add("asset-list");

        for (let entry of this.entries) {
            utils.addChild(list, entry.render());
            entry.update();
        }

        utils.addChild(assetProgress, list);

        utils.addChild(this.element, title, assetProgress);
        utils.addChild(this.background, this.element);

        utils.addChild(this.parent, this.background);
    }

    /**
     * @param data {{}}
     */
    update(data){
        for (let key in data) {
            let value = data[key];
            for (let entry of this.entries) {
                if(entry.codename === key){
                    entry.done = value.value;
                    entry.info = value.info;
                    entry.update();

                    this.onUpdate()
                }
            }
        }
    }

    onUpdate(){
        let progress = this.getPercentDone();
        this.progressBar.style.width = progress + "%";
        this.infoProgress.innerHTML = progress + "%";
    }

    /**
     *
     * @return {number}
     */
    getPercentDone(){
        let done = 0;
        for (let entry of this.entries) {
            if(entry.done){
                done++;
            }
        }

        return Math.round(done / this.entries.length * 100);
    }

    finish(){
        this.progressBar.classList.add("finished");

        setTimeout(() => {
            utils.fadeOut(this.background,200,() => {
                this.background.remove();
            })
        },1000);

        if(this.timer != null){
            clearInterval(this.timer);
        }
    }

    /**
     * @param entry {AssetProgressEntry}
     */
    addEntry(entry){
        this.entries.push(entry);
    }
}

module.exports.AssetProgress = AssetProgress;

class AssetProgressEntry{
    /**
     * @type string
     */
    name;
    /**
     * @type string
     */
    codename;

    /**
     * @type {boolean}
     */
    done = false;

    /**
     * @type string
     */
    info;

    /**
     * @type HTMLElement
     */
    element;
    /**
     * @type HTMLElement
     */
    amount;
    /**
     * @type HTMLElement
     */
    status;

    constructor(name, codename) {
        this.name = name;
        this.codename = codename;
    }

    /**
     * @return {HTMLElement}
     */
    render(){
        this.element = document.createElement('div');
        this.element.classList.add("asset-loader-entry");

        let span = document.createElement('span');
        span.innerHTML = this.name;

        this.amount = document.createElement('div');
        this.amount.classList.add("amount");

        this.status = document.createElement('div');
        this.status.classList.add("status");

        utils.addChild(this.element, span, this.amount, this.status);
        return this.element;
    }

    update(){
        utils.clear(this.amount);
        utils.clear(this.status);
        if(this.done){
            let img = document.createElement('img');
            img.src = utils.getIcon('success.svg');
            utils.addChild(this.status,img);
        }else{
            utils.addHTML(this.status, utils.getLoader(15,false));
        }
        if(this.info != null){
            this.amount.innerHTML = this.info;
        }
    }
}

module.exports.AssetProgressEntry = AssetProgressEntry;
