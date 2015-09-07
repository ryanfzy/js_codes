function extractComment(strFn){
    var str = strFn.toString();
    var sIndex = str.indexOf("/*") + "/*".length;
    var eIndex = str.lastIndexOf("*/");
    return str.substring(sIndex, eIndex);
}

var testhtml = extractComment(function(){/*
<tag1>
    <tag2>
        <tag3>tag 3 text</tag3>
    </tag2>
    <tag4>
        <tag5>tag 5 text</tag5>
    </tag4>
    <tag4>
        <tag6>tag 6 text</tag6>
    </tag4>
    <tag7>
        <tag8 key1="value1">
            <tag9>tag 9 text</tag9>
        </tag8>

        <div key1="value1" key2="value2">
            <p>multiple unique keys</p>
        </div>

        <tag8 key2="value2">
            <tag10>tag 10 text</tag10>
        </tag8>
        <tag8 key2="value2">
            <tag11>tag 11 text</tag11>
        </tag8>

        <tag8 key3="value3" key4="value4">
            <tag12>tag 12 text</tag12>
        </tag8>

        <tag8 key5="value5">
            <tag13>tag 13 text</tag13>
        </tag8>

        <tag8 key6="value6">
            <tag14>tag 14 text</tag14>
        </tag8>
        <tag8 key6="value6">
            <tag15>tag 15 text</tag15>
        </tag8>

        <div key1="value" uniqueKey3="value">
            <p>unique key with key 1</p>
        </div>
        <div class="sharedTitle" key="value">
            <p>some shared text</p>
        </div>
        <div>
            <div class="nestedTitle">
                <p>some nested text</p>
            </div>
            <div>
                <p>some nested text with no title</p>
            </div>
        </div>
        <div class="nestedTitle2">
            <div>
                <p>some nested text 2</p>
            </div>
            <p>some nested text 2 with no title</p>
        </div>
        <div class="sharedTitle" uniqueKey3="value">
            <p>some shared and unique text</p>
        </div>
    </body>
</root>
*/});

// this only work on the test html string
// will not be work on real html
function RemoveSpacesBetweenTags(html){
    var lines = html.split(/\r\n|\r|\n/g);
    var str = "";
    lines.forEach(function(value, index, array){
        str += (value.trim());
    });
    return str;
}

describe(`test RemoveSpacesBetweenTags() function
- if this function is not passed, following tests are not valid`, function(){

    it("remove spaces between tags", function(){
        var test = extractComment(function(){/*
<html>
    <head></head>
    <body>
        <div>
            <p>some test</p>
        </div>
    </body>
</html>
        */});
        console.log(test);

        var exp = "<html><head></head><body><div><p>some test</p></div></body></html>";
        expect(RemoveSpacesBetweenTags(test)).toEqual(exp);
    });
});

describe("test parser.CreateParser()", function(){
    it("create a new parser", function(){
        var p1 = parserjs.CreateParser("test");
        expect(p1).not.toBeNull();
    });

    it("create more than one parser", function(){
        var p1 = parserjs.CreateParser("test");
        var p2 = parserjs.CreateParser("test");
        expect(p1).not.toBe(p2);
    });
});

describe("test parser.Find() - for single tag", function(){
    beforeAll(function(){
        var html = RemoveSpacesBetweenTags(testhtml);
        this.parser = parserjs.CreateParser(html);
    });

    it("test \"<tag>\", e.g. \"tag2\"", function(){
        var selector = "tag2";
        var exp = ["<tag2><tag3>tag 3 text</tag3></tag2>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>\" - multi, e.g. \"tag4\"", function(){
        var selector = "tag4";
        var exp = ["<tag4><tag5>tag 5 text</tag5></tag4>","<tag4><tag6>tag 6 text</tag6></tag4>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>]\", e.g. \"tag8[key1]\"", function(){
        var selector = "tag8[key1]";
        var exp = ["<tag8 key1=\"value1\"><tag9>tag 9 text</tag9></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>]\" - multi, e.g. \"tag8[key2]\"", function(){
        var selector = "tag8[key2]";
        var exp = ["<tag8 key2=\"value2\"><tag10>tag 10 text</tag10></tag8>",
                   "<tag8 key2=\"value2\"><tag11>tag 11 text</tag11></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1> <key2>]\", e.g. \"tag8[key3 key4]\"", function(){
        var selector = "tag8[key3 key4]";
        var exp = ["<tag8 key3=\"value3\" key4=\"value4\"><tag12>tag 12 text</tag12></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1> <key2>]\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key2> <key1>]\", e.g. \"tag8[key4 key3]\"", function(){
        var selector = "tag8[key4 key3]";
        var exp = ["<tag8 key3=\"value3\" key4=\"value4\"><tag12>tag 12 text</tag12></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>=<value>]\", e.g. \"tag8[key5=value5]\"", function(){
        var selector = "tag8[key5=value5]";
        var exp = ["<tag8 key5=\"value5\"><tag13>tag 13 text</tag13></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>=<value>]\" - multi, e.g. \"tag8[key6=value6]\"", function(){
        var selector = "tag8[key6=value6]";
        var exp = ["<tag8 key6=\"value6\"><tag14>tag 14 text</tag14></tag8>",
                   "<tag8 key6=\"value6\"><tag15>tag 15 text</tag15></tag8>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1> <key2>=<value2>]\", e.g. \"div[key1 uniqueKey3=value]\"", function(){
        var selector = "div[key1 uniqueKey3=value]";
        var exp = ["<div key1=value uniqueKey3=value><p>unique key with key 1</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1> <key2>=<value2>]\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key2>=<value2> <key1>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key1>=<value1> <key2>=<value2>]\", e.g. \"div[class=sharedTitle key=value]\"", function(){
        var selector = "div[class=sharedTitle key=value]";
        var exp = ["<div class=\"sharedTitle\" key=\"value\"><p>some shared text 1</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1>=<value1> <key2>=<value2>]\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key2>=<value2> <key1>=<value1>]\", e.g. ", function(){
    });

});

describe("test parser.Find() - for multiple tags", function(){
    beforeAll(function(){
        var html = RemoveSpacesBetweenTags(testhtml);
        this.parser = parserjs.CreateParser(html);
    });

    it("test \"<tag> <tag>\", e.g. \"tag2 tag3\"", function(){
        var selector = "tag2 tag3";
        var exp = ["<tag3>tag 3 text</tag3>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag> <tag>\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key>] <tag>\", e.g. \"div[uniqueKey] p\"", function(){
        var selector = "div[uniqueKey] p";
        var exp = ["<p>unique key</p>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>] <tag>\" - multi, e.g. ", function(){
    });

    it("test \"<tag> <tag>[<key]\", e.g. ", function(){
    });

    it("test \"<tag>[<key>=<value>] <tag>\", e.g. \"div[class=nestedTitle2] p\"", function(){
        var selector = "div[class=nestedTitle2] p";
        var exp = ["<p>some nested text with no title</p>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>=<value>] <tag>\" - multi, e.g. ", function(){
    });

    it("test \"<tag> <tag>[<key>=<value>]\", e.g. \"div div[class=nestedTitle]\"", function(){
        var selector = "div div[class=nestedTitle]";
        var exp = ["<div class=\"nestedTitle\"><p>some nested text</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });
});

describe("test parser.Parse()", function(){
    it("test single case", function(){
        var parser = parserjs.CreateParser();
        parser.data = ["<tag key1=\"value1\" key2=\"value2\"><subtag>some text</subtag></tag>"];
        var eInnerHtml = "<subtag>some text</subtag>";
        var eAttrs = {key1 : "value1", key2 : "value2"};
        var eData = "<tag key1=\"value1\" key2=\"value2\"><subtag>some text</subtag></tag>";
        parser.Parse(function(html, attrs, data){
            expect(html).toEqual(eInnerHtml);
            expect(attrs).toEqual(eAttrs);
            expect(data).toEqual(eData);
        });
    });

    it("test multiple cases", function(){
    });
});

