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
        this.patterns["test"] = this.buildPattern(":arg1 :arg2 :arg3");

        this.parse("test ans1 ans2 ans3");
    }

    buildPattern(pattern: string){
        let state = STATE.ROOT;

        let output = [];

        let tokenStart = 0;
        let stack: any = {};

        function push(){
            if(!stack.optional && output[output.length-1].optional && output[output.length-1].type !== "options"){
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
                    stack.name = this.getName(stack, pattern, tokenStart, i);
                    push();
                }else if(state !== STATE.ROOT){
                    console.log(`Malformed pattern char ${i} is '${character}' with state ${state}`);
                    return
                }
            }else if(character === ":"){
                if(state === STATE.OPTIONS_NAME){
                    stack.name = this.getName(stack, pattern, tokenStart, i);
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
            stack.name = pattern.substring(tokenStart);
            push();
        }else if(state !== STATE.ROOT){
            console.log(`Pattern ended with open state ${state}`);
        }

        return output;
    }

    private getName(stack: any, pattern: string, tokenStart: number, i: number): string{
        if(stack.optional)
            return pattern.substring(tokenStart, i - 1);
        return pattern.substring(tokenStart, i);
    }

    //test :arg1 [a,b,c] :arg2?
    parse(input: string): {id: string, data: any} {
        const endOfId = input.indexOf(" ")
        const id = input.substring(0, endOfId);
        const args = input.substring(endOfId);
        const pattern = this.patterns[id];



        return {
            id: "",
            data: {}
        }
    }
}

new Parser();