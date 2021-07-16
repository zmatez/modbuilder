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
        addChild(this.tooltip, this.element);
        return this.tooltip;
    }

    show(){
        if(this.isShowing){
            return;
        }

        this.widthSet = false;

        this.getElement();
        $(this.tooltip).fadeOut(0);
        let tag = this.parent.tagName
        if(tag === "DIV" || tag === "SPAN" || tag === "SECTION" || tag === "MAIN"){
            addChild(this.parent, this.tooltip);
        }else{
            addChild(this.parent.parentNode, this.tooltip);
        }

        //calculate nested
        this.getNestedTooltips();

        //set width and show
        this.tooltip.style.display = "block";
        this.updateParentPosition();
        this.tooltip.style.width = this.tooltip.offsetWidth + "px";
        this.tooltip.style.minWidth = this.tooltip.offsetWidth + "px";
        this.tooltip.style.maxWidth = this.tooltip.offsetWidth + "px";

        $(this.tooltip).fadeIn(this.animationDuration);

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
        $(this.tooltip).fadeOut(this.animationDuration, () => {
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
            addChild(this.element, this.child);
        }
    }
}

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
        this.url = getCDNAsset('icons/' + this.iconName);
        this.animate = true;

        preloadImage(this.url)
        this.parent.classList.add("decision-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("decision-tooltip", "text-tooltip");
        let title = document.createElement('div');
        title.classList.add("decision-title");
        let icon = document.createElement('img');
        icon.src = this.url;
        addChild(title, icon);
        addHTML(title, this.title);

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

        addChild(this.element, title);
        addChild(this.element, description);
        addChild(this.element, buttonInline);
    }

    setLoading(){
        this.button1.button.style.width = this.button1.button.offsetWidth + "px";
        this.button1.button.innerHTML = getLoader(17);
    }
}

class BadgeTooltip extends Tooltip{
    /**
     * @type Badge
     */
    badge;

    showRank = false;

    /**
     * @param parent {HTMLElement}
     * @param badge {Badge};
     */
    constructor(parent, badge) {
        super(parent);
        this.badge = badge;
        this.animate = true;

        preloadImage(getCDNAsset('icons/medal.svg'));
        preloadImage(this.badge.icon.getURL(128,128));
        this.parent.classList.add("badge-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("badge-tooltip", "text-tooltip");
        let badgeIconHolder = document.createElement('div');
        badgeIconHolder.classList.add("badge-main-icon-holder");

        let badgeIcon = document.createElement('img');
        badgeIcon.classList.add("badge-main-icon");
        badgeIcon.src = this.badge.icon.getURL(128,128);
        addChild(badgeIconHolder, badgeIcon);

        let title = document.createElement('div');
        title.classList.add("badge-title");
        let titleIcon = document.createElement('img');
        titleIcon.src = getCDNAsset('icons/medal.svg');
        addChild(title, titleIcon);
        addHTML(title, this.badge.name);

        let description = document.createElement('div');
        description.classList.add("badge-description");
        description.innerHTML = this.badge.description;

        addChild(this.element, badgeIconHolder);
        addChild(this.element, title);
        addChild(this.element, description);

        if(this.showRank){
            let rankDescription = document.createElement('div');
            rankDescription.classList.add("badge-rank-holder");
            rankDescription.innerHTML = "<span>Comes with </span>" + this.badge.rank.get();

            addChild(this.element,rankDescription);
        }
    }
}
class UserTooltip extends Tooltip{
    /**
     * @type User
     */
    user;
    /**
     * @type TeamMember | null
     */
    teamMember;

    /**
     * @param parent {HTMLElement}
     * @param user {User};
     */
    constructor(parent, user) {
        super(parent);
        this.user = user;
        this.animate = true;

        preloadImage(getCDNAsset('icons/medal.svg'));
        preloadImage(this.user.getAvatar());
        this.parent.classList.add("user-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("user-tooltip", "text-tooltip");
        let userAvatarHolder = document.createElement('div');
        userAvatarHolder.classList.add("user-avatar-holder");

        let userTitleAvatar = document.createElement('div');
        userTitleAvatar.classList.add("user-title-avatar");

        let userAvatarWrapper = document.createElement('div');
        userAvatarWrapper.classList.add("user-avatar-wrapper");
        let userAvatar = document.createElement('img');
        userAvatar.classList.add("user-avatar");
        userAvatar.src = this.user.getAvatar();
        addChild(userAvatarWrapper, userAvatar);
        addChild(userTitleAvatar, userAvatarWrapper);
        addChild(userAvatarHolder, userTitleAvatar);

        let userAvatarColor = document.createElement('div');
        userAvatarColor.classList.add('user-avatar-color');
        addChild(userAvatarHolder, userAvatarColor);

        //titles
        let titleWrapper = document.createElement('div');
        titleWrapper.classList.add("user-title-wrapper");

        let userName = document.createElement('div');
        userName.classList.add("user-name");
        userName.innerHTML = this.user.username;

        let userBadges = document.createElement('div');
        userBadges.classList.add("user-badges");
        if(this.user.badges != null){
            for (let badge of this.user.badges) {
                addChild(userBadges, badge.drawElement());
            }
        }

        addChild(titleWrapper, userName);
        addChild(titleWrapper, userBadges);

        addChild(userTitleAvatar, titleWrapper);
        //----

        // COLOR
        userAvatar.addEventListener('load', () => {
            let avg = getAverageRGB(userAvatar);
            let hex = rgbToHex(avg.r,avg.g,avg.b);
            if(isBright(hex)){
                userName.style.color = 'var(--default-tooltip)';
            }
            userAvatarColor.style.backgroundColor = "#" + hex;
        })
        //---
        addChild(this.element, userAvatarHolder);


        // RANKS
        let rankHolder = document.createElement('div');
        rankHolder.classList.add("user-rank-holder");
        let rankTitle = document.createElement('div');
        rankTitle.classList.add("user-rank-title");
        rankTitle.innerHTML = "<h3>Ranks</h3><div class='tooltip-section'></div>";
        let rankList = document.createElement('div');
        rankList.classList.add("user-rank-list");
        if(this.user.ranks != null){
            for (let rank of this.user.ranks) {
                addChild(rankList, rank.drawElement());
            }
        }
        addChild(rankHolder, rankTitle);
        addChild(rankHolder, rankList);

        addChild(this.element, rankHolder);

        //PLAYER
        if(this.user.player != null){
            let playerHolder = document.createElement('div');
            playerHolder.classList.add("user-section-holder");
            if(this.user.player.verified){
                playerHolder.innerHTML = (`<h3>Minecraft</h3><div><img src="${getCDNAsset('icons/verified.svg')}">${this.user.player.nick}</div>`);
            }else{
                playerHolder.innerHTML = (`<h3>Minecraft</h3><div>${this.user.player.nick}</div>`);
            }

            addChild(this.element, playerHolder);
        }

        //JOIN DATE
        if(this.user.creationDateDate != null){
            let joinHolder = document.createElement('div');
            joinHolder.classList.add("user-section-holder");
            joinHolder.innerHTML = (`<h3>Joined</h3><div class="user-date">${timeAgo(this.user.creationDate)}</div>`);

            addChild(this.element, joinHolder);
        }

        //TEAM
        if(this.teamMember != null){
            let teamHolder = document.createElement('div');
            teamHolder.classList.add("user-team-holder");
            let teamTitle = document.createElement('div');
            teamTitle.classList.add("user-team-title");
            teamTitle.innerHTML = "<h3>Team Member</h3><div class='tooltip-section'></div>";
            let teamWrapper = document.createElement('div');
            teamWrapper.classList.add("user-team-wrapper");

            {
                let teamSection = document.createElement('div');
                teamSection.classList.add("user-team-section");
                addHTML(teamSection, '<h4>Function</h4>');
                let teamRank = document.createElement('div');
                addChild(teamRank, this.teamMember.teamRole.rank.drawElement());
                addChild(teamSection,teamRank);
                addChild(teamWrapper, teamSection);
            }
            {
                let teamSection = document.createElement('div');
                teamSection.classList.add("user-team-section");
                addHTML(teamSection, '<h4>Joined</h4>');
                let teamDate = document.createElement('div');
                teamDate.classList.add('user-date');
                addHTML(teamDate, timeAgo(this.teamMember.joinDate));
                addChild(teamSection,teamDate);
                addChild(teamWrapper, teamSection);
            }
            {
                let teamSection = document.createElement('div');
                teamSection.classList.add("user-team-section");
                addHTML(teamSection, '<h4>Nationality</h4>');
                let teamNationality = document.createElement('div');
                teamNationality.classList.add("user-country");
                let f = new CountryFlag(teamNationality);
                f.selectByAlpha3(this.teamMember.country);
                addHTML(teamNationality, this.teamMember.country);
                addChild(teamSection,teamNationality);
                addChild(teamWrapper, teamSection);
            }
            {
                if(this.teamMember.description != null && this.teamMember.description !== ""){
                    let teamSection = document.createElement('div');
                    teamSection.classList.add("user-team-section");
                    addHTML(teamSection, '<h4>Description</h4>');
                    let teamDescription = document.createElement('div');
                    teamDescription.classList.add("user-description");
                    addHTML(teamDescription, "hover to show");
                    let textTooltip = new TextTooltip(teamDescription, this.teamMember.description);
                    textTooltip.applyHover(teamDescription);
                    addChild(teamSection,teamDescription);
                    addChild(teamWrapper, teamSection);
                }
            }

            addChild(teamHolder, teamTitle);
            addChild(teamHolder, teamWrapper);

            addChild(this.element, teamHolder);
        }
    }
}

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
     * @type function(boolean, string)
     */
    saveCallback;

    /**
     * @param parent {HTMLElement}
     * @param title {string}
     * @param iconName {string} relative path from /icons/
     * @param description {string}
     * @param text1 {string}
     * @param text2 {string}
     * @param saveCallback function(boolean, string)
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
        this.url = getCDNAsset('icons/' + this.iconName);
        this.animate = true;

        preloadImage(this.url);
        this.parent.classList.add("decision-tooltip-parent")
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("form-tooltip","decision-tooltip", "text-tooltip");
        let title = document.createElement('div');
        title.classList.add("decision-title");
        let icon = document.createElement('img');
        icon.src = this.url;
        addChild(title, icon);
        addHTML(title, this.title);

        let description = document.createElement('div');
        description.classList.add("decision-description");
        description.innerHTML = this.description;

        let buttonInline = document.createElement('div');
        buttonInline.classList.add("decision-button-inline");

        this.button1 = new Button(this.text1, () => {
            this.setLoading()
            this.form.serializeAndSend(this.title, this.formQuery, (success, response) => {
                this.hide();
                this.saveCallback(success, response);
            });
        });
        this.button1.container.classList.add("decision-button-1");
        this.button1.addTo(buttonInline);

        this.button2 = new Button(this.text2, () => {
            this.hide();
        });
        this.button2.container.classList.add("decision-button-2");
        this.button2.addTo(buttonInline);

        addChild(this.element, title);
        addChild(this.element, description);
        this.form = this.formCallback(this.element);
        addChild(this.element, buttonInline);
    }

    setLoading(){
        this.button1.button.style.width = this.button1.button.offsetWidth + "px";
        this.button1.button.innerHTML = getLoader(17);
    }
}

class ColorPickerTooltip extends Tooltip{
    preset = [
        "8C8C8C",
        "607D8B",
        "F44336",
        "E91E63",
        "9C27B0",
        "673AB7",
        "3F51B5",
        "2196F3",
        "03A9F4",
        "00BCD4",
        "009688",
        "4CAF50",
        "8BC34A",
        "CDDC39",
        "FFEB3B",
        "FFC107",
        "FF9800",
        "FF5722",
        "795548"
    ];

    palette = [];

    onSelect = function (color){};


    constructor(parent) {
        super(parent);
        this.generatePalette()
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "color-picker");

        let colors = document.createElement('div');
        colors.classList.add("colors");

        for (let variants of this.palette) {
            let row = this.createColorRow();
            for (let hex of variants) {
                let box = this.createColorBox(hex);
                addChild(row, box);
            }

            addChild(colors, row);
        }

        addChild(this.element, colors);
    }

    createColorRow(){
        let colorRow = document.createElement('div');
        colorRow.classList.add("color-row");
        return colorRow;
    }

    createColorBox(hex){
        let colorBox = document.createElement('div');
        colorBox.classList.add("color-box");
        colorBox.setAttribute('hex', hex);
        colorBox.style.backgroundColor = "#" + hex;

        colorBox.addEventListener('click', () => {
            this.select(hex);
        })

        return colorBox;
    }

    generatePalette(){
        for (let hex of this.preset) {
            let variants = [];
            for(let i = 5; i > 0; i--){
                let color = adjustBrightness(hex, i * 27);
                variants.push(color);
            }
            for(let i = 5; i < 10; i++){
                let color = adjustBrightness(hex, -(i - 5) * 25);
                variants.push(color);
            }

            this.palette.push(variants);
        }
    }

    select(color){
        this.hide();
        this.onSelect(color);
    }
}


class UserChooserTooltip extends Tooltip{
    /**
     * @type {User[]}
     */
    users = [];

    /**
     * @type {number | null}
     */
    selected;

    onSelect = function (user){};

    /**
     * @param parent {HTMLElement}
     * @param selected {number | null}
     */
    constructor(parent, selected) {
        super(parent);
        this.selected = selected;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "user-chooser");

        let rows = document.createElement('div');
        rows.classList.add("user-rows");

        for (let user of this.users) {
            let row = document.createElement('div');
            row.classList.add("user-row");
            row.insertAdjacentHTML('beforeend', user.get());
            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(user);
            });

            if(this.selected === user.id){
                row.classList.add("selected");
            }
        }

        addChild(this.element, rows);
        appendScrollbarImmediately(this.element);
    }

    select(user){
        this.hide();
        this.onSelect(user);
    }
}

class CountryChooserTooltip extends Tooltip{
    /**
     * @type {string[]}
     */
    countries = [];

    /**
     * @type {string | null}
     */
    selected;

    onSelect = function (country){};

    /**
     * @param parent {HTMLElement}
     * @param selected {string | null}
     */
    constructor(parent, selected) {
        super(parent);
        this.selected = selected;

        for (let countryListElement of JSON.parse(CountryFlag.rawCountryList)) {
            this.countries.push(countryListElement[3]);
        }
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "country-chooser");

        let rows = document.createElement('div');
        rows.classList.add("country-rows");

        for (let country of this.countries) {
            let row = document.createElement('div');
            row.classList.add("country-row");

            let countryFlag = document.createElement('div');
            countryFlag.classList.add("country-flag");
            let flag = new CountryFlag(countryFlag);
            flag.selectByAlpha3(country);
            addChild(row, countryFlag);

            addHTML(row, CountryFlag.getCountryByAlpha3(country).name);

            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(country);
            });

            if(this.selected === country){
                row.classList.add("selected");
            }
        }

        addChild(this.element, rows);
        appendScrollbarImmediately(this.element);
    }

    select(user){
        this.hide();
        this.onSelect(user);
    }
}

class FolderChooserTooltip extends Tooltip{
    /**
     * @type {MediaFolder[]}
     */
    folders = [];

    /**
     * @type {MediaFolder | null}
     */
    selected;

    onSelect = function (folder){};

    /**
     * @param parent {HTMLElement}
     * @param selected {MediaFolder | null}
     */
    constructor(parent, selected) {
        super(parent);
        this.selected = selected;

        for (let countryListElement of JSON.parse(CountryFlag.rawCountryList)) {
            this.folders.push(countryListElement[3]);
        }
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "folder-chooser");

        let rows = document.createElement('div');
        rows.classList.add("folder-rows");

        {
            let row = document.createElement('div');
            row.classList.add("folder-row");
            row.innerHTML = "Root Folder";

            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(null);
            });

            if(this.selected == null){
                row.classList.add("selected");
            }
        }

        for (let folder of this.folders) {
            let row = document.createElement('div');
            row.classList.add("folder-row");
            row.innerHTML = this.getFolderName(folder)

            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(folder);
            });

            if(this.selected != null && this.selected.id === folder.id){
                row.classList.add("selected");
            }
        }

        addChild(this.element, rows);
        appendScrollbarImmediately(this.element);
    }

    select(folder){
        this.selected = folder;
        this.hide();
        this.onSelect(folder);
    }

    /**
     * @param folder {MediaFolder}
     */
    getFolderName(folder){
        return folder.getPath(this.folders);
    }
}

class MultipleUserChooserTooltip extends Tooltip{
    /**
     * @type {User[]}
     */
    users = [];

    /**
     * @type {number[]}
     */
    selected = [];

    /**
     * @type {HTMLDivElement[]}
     */
    rows = [];

    onSelect = function (users){};

    /**
     * @param parent {HTMLElement}
     * @param selected {number[]}
     */
    constructor(parent, selected) {
        super(parent);
        this.selected = selected;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "user-chooser");

        let rows = document.createElement('div');
        rows.classList.add("user-rows");

        for (let user of this.users) {
            let row = document.createElement('div');
            row.classList.add("user-row");
            row.insertAdjacentHTML('beforeend', user.get());
            row.setAttribute('user_id', user.id + "");
            addChild(rows, row);
            this.rows.push(row);

            row.addEventListener('click', () => {
                this.select(user);
            });

            if(this.isSelected(user) !== null){
                row.classList.add("selected");
            }
        }

        addChild(this.element, rows);
        appendScrollbarImmediately(this.element);
    }

    select(user){
        if(this.isSelected(user) !== null){
            removeFromArray(this.selected,user);
        }else{
            this.selected.push(user);
        }

        for (let row of this.rows) {
            let id = parseInt(row.getAttribute('user_id'));
            if(this.isSelectedID(id) != null){
                row.classList.add("selected");
            }else{
                row.classList.remove("selected");
            }
        }

        this.onSelect(this.selected);
    }

    isSelected(user){
        for (let u of this.selected) {
            if(u === user){
                return user;
            }
        }
        return null;
    }


    isSelectedID(user){
        for (let u of this.selected) {
            if(u.id === user){
                return user;
            }
        }
        return null;
    }
}

class PermissionChooserTooltip extends Tooltip{
    /**
     * @type {Permission[]}
     */
    permissions = [];

    /**
     * @type {number | null}
     */
    selected;

    onSelect = function (permission){};

    /**
     * @param parent {HTMLElement}
     * @param selected {number | null}
     */
    constructor(parent, selected) {
        super(parent);
        this.selected = selected;
    }

    construct() {
        this.element = document.createElement('div');
        this.element.classList.add("tooltip", "permission-chooser");

        let rows = document.createElement('div');
        rows.classList.add("permission-rows");

        {
            let row = document.createElement('div');
            row.classList.add("permission-row");
            row.insertAdjacentHTML('beforeend', "Not set");
            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(null);
            });

            if(this.selected == null){
                row.classList.add("selected");
            }
        }

        for (let perm of this.permissions) {
            let row = document.createElement('div');
            row.classList.add("permission-row");
            row.insertAdjacentHTML('beforeend', perm.drawCode());
            addChild(rows, row);

            row.addEventListener('click', () => {
                this.select(perm);
            });

            if(this.selected === perm.id){
                row.classList.add("selected");
            }
        }

        addChild(this.element, rows);
        appendScrollbarImmediately(this.element);
    }

    select(perm){
        this.hide();
        this.onSelect(perm);
    }
}