enum STATE {
    ROOT,
    SINGLE,
    OPTIONS_NAME,
    OPTIONS,
    STRING,
}

export default class Parser {

    patterns: {[key: string]: any[]} = {};

    constructor(){
    }

    buildPattern(pattern: string){
        let state = STATE.ROOT;

        let output = [];

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
                }else if(state !== STATE.ROOT){
                    console.log(`Malformed pattern char ${i} is '${character}' with state ${state}`);
                    return
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
            }
        }

        if(state === STATE.SINGLE){
            stack.name = Parser.getName(stack, pattern, tokenStart, pattern.length);
            push();
        }else if(state !== STATE.ROOT){
            console.log(`Pattern ended with open state ${state}`);
        }

        return output;
    }

    private static getName(stack: any, pattern: string, tokenStart: number, i: number): string{
        if(stack.optional) {
            return pattern.substring(tokenStart, i - 1);
        }
        return pattern.substring(tokenStart, i);
    }

    //test :arg1 [a,b,c] :arg2?
    parse(input: string): {id: string, data: any} {
        const endOfId = input.indexOf(" ")
        const id = input.substring(0, endOfId);
        const args = input.substring(endOfId+1);
        const pattern = this.patterns[id];

        let data = {};
        let currentPosition = 0;

        for(let i = 0; i < pattern.length; i++){
            const argPattern = pattern[i];
            const str = args.substring(currentPosition).trim();

            if(str.length === 0){
                if(!argPattern.optional)
                    console.log(`Missing required argument ${argPattern.name}`);
                data[argPattern.name] = null;
                continue;
            }

            if(argPattern.type === "single"){
                let index = str.indexOf(" ");
                if(index == -1)
                    index = str.length;
                data[argPattern.name] = str.substring(0, index);
                currentPosition += index+1;
            }else if(argPattern.type === "options"){
                let index = str.indexOf(" ");
                if(index == -1)
                    index = str.length;
                let selectedOption = str.substring(0, index).toLowerCase();
                data[argPattern.name] = argPattern.options.includes(selectedOption) ? selectedOption : null;

                if(data[argPattern.name] === null && !argPattern.optional)
                    console.log(`Invalid option for required argument ${argPattern.name}`);

                currentPosition += index+1;
            }
        }

        return {id, data};
    }
}

new Parser();