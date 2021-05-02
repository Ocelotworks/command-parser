import {fail, ok, deepStrictEqual} from 'assert';
import Parser from "../Parser";
import {PatternData} from "../Pattern";


function singlePatternTest(input: string, ...output: PatternData[]){
    deepStrictEqual(Parser.BuildPattern("test", input), {
        id: 'test',
        pattern: output
    })
}

function parseTest(pattern: string, input: string, expected: any){
    deepStrictEqual(Parser.Parse(input, Parser.BuildPattern("test", pattern)), expected)
}

describe('Parser', ()=>{
    describe('#BuildPattern', ()=>{
        it('should process simple arguments correctly', ()=>{
            singlePatternTest(":test", {name: 'test', type: 'single'})
        })
        it('should process optional arguments correctly', ()=>{
            singlePatternTest(":test?", {name: 'test', type: 'single', optional: true})
        })
        it('should process infinite arguments correctly', ()=>{
            singlePatternTest(":test+", {name: 'test', type: 'single', infinite: true})
        })
        it('should process combined optional and infinite arguments correctly', ()=>{
            singlePatternTest(":test+?", {name: 'test', type: 'single', optional: true, infinite: true})
            singlePatternTest(":test?+", {name: 'test', type: 'single', optional: true, infinite: true})
        })
        it('should process options parameters correctly', ()=>{
            singlePatternTest("[test:a,b,c]", {name: 'test', type: 'options', options: ["a", "b", "c"]})
        })
        it('should process infinite options parameters correctly', ()=>{
            singlePatternTest("[test+:a b,c d,e f]", {name: 'test', type: 'options', options: ["a b", "c d", "e f"], infinite: true})
        })
        it('should process multiple arguments correctly', ()=>{
            singlePatternTest(":test :test2", {name: 'test', type: 'single'}, {name: 'test2', type: 'single'})
        })
        it('should process a malformed pattern', ()=>{
            singlePatternTest("this is complete garbage")
            singlePatternTest("this is complete garbage with a :test at the end", {name: 'test', type: 'single'})
        })
    })

    describe('#Parse', ()=>{
        it('should parse a simple pattern', ()=>{
            parseTest(":test", "testInput", {data: {test: "testInput"}})
            parseTest(":test", "testInput garbage garbage garbage", {data: {test: "testInput"}})
        })
        it('should require a required argument', ()=>{
            parseTest(":test", "", {data: {}, error: {type: "missingArg", data: "test"}})
        })
    })
})