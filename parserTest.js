var testhtml = `
<root>
    <section1>
        <title>some title</title>
    </section1>
    <section2>
        <title>section 2</title>
    </section2>
    <section2>
        <title>section 2</title>
    </section2>
    <body>
        <div uniqueKey=\"value\">
            <p>unique key</p>
        </div>
        <div key1=\"value1\" key2=\"value2\">
            <p>multiple unique keys</p>
        </div>
        <div class=\"uniqueTitle\">
            <p>some unique text</p>
        </div>
        <div class=\"sharedTitle\" key=\"value\">
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
        <div class=\"nestedTitle2\">
            <div>
                <p>some nested text 2</p>
            </div>
            <p>some nested text 2 with no title</p>
        </div>
        <div class=\"sharedTitle\" uniqueKey2=\"value\">
            <p>some shared and unique text</p>
        </div>
    </body>
</root>`;

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
        var test = `
<html>
    <head></head>
    <body>
        <div>
            <p>some test</p>
        </div>
    </body>
</html>`;

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

    it("test \"<tag>\", e.g. \"section1\"", function(){
        var selector = "section1";
        var exp = ["<section1><title>some title</title></section1>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>\" - multi, e.g. \"section2\"", function(){
        var selector = "section2";
        var exp = ["<section2><title>section 2</title></section2>","<section2><title>section 2</title></section2>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>]\", e.g. \"div[uniqueKey]\"", function(){
        var selector = "div[uniqueKey]";
        var exp = ["<div uniqueKey=\"value\"><p>unique key</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>]\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key1> <key2>]\", e.g. \"div[key1 key2]\"", function(){
        var selector = "div[key1 key2]";
        var exp = ["<div key1=\"value1\" key2=\"value2\"><p>multiple unique keys</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key1> <key2>]\" - multi, e.g. ", function(){
    });

    it("test \"<tag>[<key2> <key1>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key>=<value>]\", e.g. \"div[class=uniqueTitle]\"", function(){
        var selector = "div[class=uniqueTitle]";
        var exp = ["<div class=\"uniqueTitle\"><p>some unique text</p></div>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag>[<key>=<value>]\" - multi, e.g. \"div[class=uniqueTitle]\"", function(){
    });

    it("test \"<tag>[<key1> <key2>=<value2>]\", e.g. ", function(){
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
    });

    it("test \"<tag> <tag>\", e.g. \"section1 title\"", function(){
        var selector = "section1 title";
        var exp = ["<title>some title</title>"];
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
