import Pattern, {PatternData} from "./Pattern";

enum STATE {
    ROOT,
    SINGLE,
    OPTIONS_NAME,
    OPTIONS,
    STRING,
}

const userRegex = /<@!?(\d{17,19})>/;
const channelRegex = /<#(\d{17,19})>/;
const rolesRegex = /<@&(\d{17,19})>/;


const bools = {
    "1": true,
    "0": false,
    "yes": true,
    "no": false,
    "true": true,
    "false": false,
    "enable": true,
    "disable": false,
    "allow": true,
    "disallow": false,
    "deny": false,
    "on": true,
    "off": false,
}

export default class Parser {

    patterns: {[key: string]: {id: string, pattern: any[]}} = {};

    constructor(){
    }

    static BuildPattern(id: string, pattern: string): Pattern{
        let state = STATE.ROOT;

        let output: PatternData[] = [];

        let tokenStart = 0;
        let stack: any = {};

        function push(){
            if(output.length > 1 && !stack.optional && output[output.length-1].optional && output[output.length-1].type !== "options"){
                console.log(`Cannot have required parameter '${stack.name}' after optional non-options parameter '${output[output.length-1].name}'`)
                return;
            }
            output.push(stack);
            stack = {};
            state = STATE.ROOT;
        }

        for(let i = 0; i < pattern.length; i++){
            const character = pattern[i];
            if(character === " ") {
                if (state === STATE.SINGLE){
                    //End of single arg
                    stack.name = Parser.getName(stack, pattern, tokenStart, i);
                    push();
                }
            }else if(character === ":"){
                if(state === STATE.OPTIONS_NAME){
                    stack.name = Parser.getName(stack, pattern, tokenStart, i);
                    state = STATE.OPTIONS;
                    stack.options = [];
                    stack.type = "options"
                    tokenStart = i+1;
                }else {
                    state = STATE.SINGLE;
                    stack.type = "single"
                    tokenStart = i + 1;
                }
            }else if(character === "?" && state !== STATE.OPTIONS){
                stack.optional = true;
            }else if(character === "["){
                state = STATE.OPTIONS_NAME;
                tokenStart = i + 1;
            }else if(character === "," && state === STATE.OPTIONS){
                stack.options.push(pattern.substring(tokenStart, i))
                tokenStart = i + 1;
            }else if(character === "]" && state === STATE.OPTIONS){
                stack.options.push(pattern.substring(tokenStart, i))
                tokenStart = i + 1;
                push();
            }else if(character === "+"){
                stack.infinite = true;
            }
        }

        if(state === STATE.SINGLE){
            stack.name = Parser.getName(stack, pattern, tokenStart, pattern.length);
            push();
        }else if(state !== STATE.ROOT){
            console.log(`Pattern ended with open state ${state}`);
        }

        return {id: id, pattern: output};
    }

    private static getName(stack: PatternData, pattern: string, tokenStart: number, i: number): string{
        if(stack.optional) {
            i--;
        }

        if(stack.infinite){
            i--;
        }

        // Special types
        switch(pattern[tokenStart]){
            case "@":
                stack.type = "user";
                tokenStart++;
                break;
            case "#":
                stack.type = "channel";
                tokenStart++;
                break;
            case "!":
                stack.type = "boolean";
                tokenStart++;
                break;
            case "&":
                stack.type = "role";
                tokenStart++;
                break;
            case "0":
                stack.type = "integer";
                tokenStart++;
                break;
        }

        return pattern.substring(tokenStart, i);
    }

    static Parse(args: string, pattern: Pattern): {data?: any, error?: {type: string, data: any}}{
        let data = {};
        let currentPosition = 0;

        for(let i = 0; i < pattern.pattern.length; i++){
            const argPattern = pattern.pattern[i];
            const str = args.substring(currentPosition).trim();

            if(str.length === 0){
                if(!argPattern.optional)
                    return {
                        data,
                        error: {type: "missing_arg", data: argPattern}
                    }
                data[argPattern.name] = null;
                continue;
            }

            // Get the index of the end of the parsed pattern
            let index = str.indexOf(" ");
            if(index == -1)
                index = str.length;
            const value = str.substring(0, index);

            if(argPattern.type === "single"){
                if(argPattern.infinite){
                    data[argPattern.name] = str;
                }else{
                    data[argPattern.name] = value;
                }
                currentPosition += index+1;
            }else if(argPattern.type === "options"){
                let selectedOption = value.toLowerCase();
                data[argPattern.name] = argPattern.options.includes(selectedOption) ? selectedOption : null;

                if(data[argPattern.name] === null && !argPattern.optional){
                    return {
                        data,
                        error: {type: "options", data: argPattern}
                    }
                }
                if(data[argPattern.name] !== null)
                    currentPosition += index+1;
            }else if(argPattern.type === "user"){
                const userMention = userRegex.exec(value);
                const userID = userMention?.[1];
                if(!userID && !argPattern.optional){
                    return {
                        data,
                        error: {type: "user", data: argPattern}
                    }
                }
                data[argPattern.name] = userID;
                if(userID) {
                    currentPosition += index + 1;
                }
            }else if(argPattern.type === "role"){
                const roleMention = rolesRegex.exec(value);
                const roleID = roleMention?.[1];
                if(!roleID && !argPattern.optional){
                    return {
                        data,
                        error: {type: "role", data: argPattern}
                    }
                }
                data[argPattern.name] = roleID;
                if(roleID) {
                    currentPosition += index + 1;
                }
            }else if(argPattern.type === "channel"){
                const channelMention = channelRegex.exec(value);
                const channelID = channelMention?.[1];
                if(!channelID && !argPattern.optional){
                    return {
                        data,
                        error: {type: "channel", data: argPattern}
                    }
                }
                data[argPattern.name] = channelID;
                if(channelID) {
                    currentPosition += index + 1;
                }
            }else if(argPattern.type === "boolean"){
                const bool = bools[value.toLowerCase()];
                if(bool !== undefined){
                    data[argPattern.name] = bool;
                    currentPosition += index + 1;
                }else if(!argPattern.optional){
                    return {
                        data,
                        error: {type: "boolean", data: argPattern}
                    }
                }
            }else if(argPattern.type === "integer"){
                const integer = parseInt(value);
                if(!isNaN(integer)){
                    data[argPattern.name] = integer;
                    currentPosition += index+1;
                }else if(!argPattern.options){
                    return {
                        data,
                        error: {type: "integer", data: argPattern}
                    }
                }
            }
        }

        return {data};
    }

    //test :arg1 [a,b,c] :arg2?
    parse(input: string): {id: string, data?: any, error?: any} {
        let endOfId = input.indexOf(" ")
        if(endOfId === -1)
            endOfId = input.length;
        const id = input.substring(0, endOfId);
        const args = input.substring(endOfId+1);
        const pattern = this.patterns[id];

        if(!pattern)return {
            id,
            error: `Pattern for '${id}' not found`
        };

        return {
            id,
            ...Parser.Parse(args, pattern)
        }
    }
}
