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
        it('should process optional options parameters correctly', ()=>{
            singlePatternTest("[test?:a,b,c]", {name: 'test', type: 'options', options: ["a", "b", "c"], optional: true})
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
        it('should process user types', ()=>{
            singlePatternTest(":@user", {name: 'user', type: 'user'})
        })
        it('should process channel types', ()=>{
            singlePatternTest(":#channel", {name: 'channel', type: 'channel'})
        })
        it('should process boolean types', ()=>{
            singlePatternTest(":!bool", {name: 'bool', type: 'boolean'})
        })
        it('should process role types', ()=>{
            singlePatternTest(":&role", {name: 'role', type: 'role'})
        })
        it('should process integer types', ()=>{
            singlePatternTest(":0number", {name: 'number', type: 'integer'})
        })
    })

    describe('#Parse', ()=>{
        it('should parse a simple pattern', ()=>{
            parseTest(":test", "testInput", {data: {test: "testInput"}})
            parseTest(":test", "testInput garbage garbage garbage", {data: {test: "testInput"}})
        })
        it('should require a required argument', ()=>{
            parseTest(":test", "", {data: {}, error: {type: "missing_arg", data: {name: 'test', type: 'single'}}})
        })
        it('should parse a user mention', ()=>{
            parseTest(":@user", "<@139871249567318017>", {data: {user: "139871249567318017"}})
            parseTest(":@user", "<@!139871249567318017>", {data: {user: "139871249567318017"}})
        })
    })
})