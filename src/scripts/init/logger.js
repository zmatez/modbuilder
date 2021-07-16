// Reset
const COLOR_RESET = "\033[0m";  // Text Reset

// Regular Colors
const COLOR_BLACK = "\033[0;30m";   // BLACK
const COLOR_RED = "\033[0;31m";     // RED
const COLOR_GREEN = "\033[0;32m";   // GREEN
const COLOR_YELLOW = "\033[0;33m";  // YELLOW
const COLOR_BLUE = "\033[0;34m";    // BLUE
const COLOR_PURPLE = "\033[0;35m";  // PURPLE
const COLOR_CYAN = "\033[0;36m";    // CYAN
const COLOR_WHITE = "\033[0;37m";   // WHITE

// Bold
const COLOR_BLACK_BOLD = "\033[1;30m";  // BLACK
const COLOR_RED_BOLD = "\033[1;31m";    // RED
const COLOR_GREEN_BOLD = "\033[1;32m";  // GREEN
const COLOR_YELLOW_BOLD = "\033[1;33m"; // YELLOW
const COLOR_BLUE_BOLD = "\033[1;34m";   // BLUE
const COLOR_PURPLE_BOLD = "\033[1;35m"; // PURPLE
const COLOR_CYAN_BOLD = "\033[1;36m";   // CYAN
const COLOR_WHITE_BOLD = "\033[1;37m";  // WHITE

// Underline
const COLOR_BLACK_UNDERLINED = "\033[4;30m";  // BLACK
const COLOR_RED_UNDERLINED = "\033[4;31m";    // RED
const COLOR_GREEN_UNDERLINED = "\033[4;32m";  // GREEN
const COLOR_YELLOW_UNDERLINED = "\033[4;33m"; // YELLOW
const COLOR_BLUE_UNDERLINED = "\033[4;34m";   // BLUE
const COLOR_PURPLE_UNDERLINED = "\033[4;35m"; // PURPLE
const COLOR_CYAN_UNDERLINED = "\033[4;36m";   // CYAN
const COLOR_WHITE_UNDERLINED = "\033[4;37m";  // WHITE

// Background
const COLOR_BLACK_BACKGROUND = "\033[40m";  // BLACK
const COLOR_RED_BACKGROUND = "\033[41m";    // RED
const COLOR_GREEN_BACKGROUND = "\033[42m";  // GREEN
const COLOR_YELLOW_BACKGROUND = "\033[43m"; // YELLOW
const COLOR_BLUE_BACKGROUND = "\033[44m";   // BLUE
const COLOR_PURPLE_BACKGROUND = "\033[45m"; // PURPLE
const COLOR_CYAN_BACKGROUND = "\033[46m";   // CYAN
const COLOR_WHITE_BACKGROUND = "\033[47m";  // WHITE

// High Intensity
const COLOR_BLACK_BRIGHT = "\033[0;90m";  // BLACK
const COLOR_RED_BRIGHT = "\033[0;91m";    // RED
const COLOR_GREEN_BRIGHT = "\033[0;92m";  // GREEN
const COLOR_YELLOW_BRIGHT = "\033[0;93m"; // YELLOW
const COLOR_BLUE_BRIGHT = "\033[0;94m";   // BLUE
const COLOR_PURPLE_BRIGHT = "\033[0;95m"; // PURPLE
const COLOR_CYAN_BRIGHT = "\033[0;96m";   // CYAN
const COLOR_WHITE_BRIGHT = "\033[0;97m";  // WHITE

// Bold High Intensity
const COLOR_BLACK_BOLD_BRIGHT = "\033[1;90m"; // BLACK
const COLOR_RED_BOLD_BRIGHT = "\033[1;91m";   // RED
const COLOR_GREEN_BOLD_BRIGHT = "\033[1;92m"; // GREEN
const COLOR_YELLOW_BOLD_BRIGHT = "\033[1;93m";// YELLOW
const COLOR_BLUE_BOLD_BRIGHT = "\033[1;94m";  // BLUE
const COLOR_PURPLE_BOLD_BRIGHT = "\033[1;95m";// PURPLE
const COLOR_CYAN_BOLD_BRIGHT = "\033[1;96m";  // CYAN
const COLOR_WHITE_BOLD_BRIGHT = "\033[1;97m"; // WHITE

// High Intensity backgrounds
const COLOR_BLACK_BACKGROUND_BRIGHT = "\033[0;100m";// BLACK
const COLOR_RED_BACKGROUND_BRIGHT = "\033[0;101m";// RED
const COLOR_GREEN_BACKGROUND_BRIGHT = "\033[0;102m";// GREEN
const COLOR_YELLOW_BACKGROUND_BRIGHT = "\033[0;103m";// YELLOW
const COLOR_BLUE_BACKGROUND_BRIGHT = "\033[0;104m";// BLUE
const COLOR_PURPLE_BACKGROUND_BRIGHT = "\033[0;105m"; // PURPLE
const COLOR_CYAN_BACKGROUND_BRIGHT = "\033[0;106m";  // CYAN
const COLOR_WHITE_BACKGROUND_BRIGHT = "\033[0;107m";   // WHITE

class Logger{
    debug(text){
        console.debug(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_WHITE + COLOR_BLUE_BACKGROUND + "DEBUG" + COLOR_BLACK_BRIGHT + " >> " + COLOR_BLUE_BRIGHT + text);
    }

    log(text){
        console.log(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_CYAN + "LOG" + COLOR_BLACK_BRIGHT + " >> " + COLOR_CYAN_BRIGHT + text);
    }

    warn(text){
        console.warn(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_YELLOW + "WARN" + COLOR_BLACK_BRIGHT + " >> " + COLOR_YELLOW_BRIGHT + text);
    }

    error(text){
        console.error(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_RED + "ERROR" + COLOR_BLACK_BRIGHT + " >> " + COLOR_RED_BRIGHT + text);
    }

    progress(text){
        console.log(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_PURPLE + "PROGRESS" + COLOR_BLACK_BRIGHT + " >> " + COLOR_PURPLE_BRIGHT + text);
    }

    success(text){
        console.log(COLOR_BLACK_BRIGHT + this.getPrefix() + COLOR_GREEN + "SUCCESS" + COLOR_BLACK_BRIGHT + " >> " + COLOR_GREEN_BRIGHT + text);
    }

    /**
     * @private
     */
    getPrefix(){
        function withZero(num){
            return num < 10 ? "0" + num : num;
        }
        let now = new Date();
        return "[" + withZero(now.getHours()) + ":" + withZero(now.getMinutes()) + ":" + withZero(now.getSeconds()) + "] ";
    }


}

exports.LOG = new Logger();