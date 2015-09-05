var testhtml = `
<html>
    <head>
        <title>some title</title>
    </head>
    <body>
        <div class=\"uniqueTitle\" key=\"value\">
            <p>some unique text</p>
        </div>

        <div class=\"sharedTitle\" key1=\"value1\">
            <p>some shared text1</p>
        </div>
        <div class=\"sharedTitle\" key2=\"value\">
            <p>some shared text2</p>
        </div>

        <div class=\"nestedTitle\" key1=\"value\">
            <div class=\"nestedTitle\" key2=\"value\">
                <p>some nested text1</p>
            </div>
            <p>some nested text2</p>
        </div>

        <div class=\"sharedTitle\" uniqueKey=\"uniqueValue\">
            <p>some shared and unique text</p>
        </div>
    </body>
</html>`;

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

describe("test parser.Find()", function(){
    beforeAll(function(){
        var html = RemoveSpacesBetweenTags(testhtml);
        this.parser = parserjs.CreateParser(html);

        /*
        this.exp1_innerhtml = "<p>some text</p>";
        this.exp1_attrs = [];
        this.exp1_data = "<div><p>some text</p></div>";

        this.exp2_innerhtml = "<p>some text1</p>";
        this.exp1_attrs = {class : "title", key : "value"};
        this.exp1_data = "<div class=\"title\"><p>some text1</p></div>";

        this.exp3_innerhtml = ["<p>some text1</p>", "<p>some text2</p>"];
        this.exp3_attrs = [{class : "title", key1 : "value1"}, {class : "title", key2 : "value2"}];
        this.exp4_data = ["<div class=\"title\" key1=\"value1\"><p>some text1</p></div>",
            "<div class=\"title\" key2=\"value2\"><p>some text2</p></div>"];
            */
    });

    it("test \"<tag>\", e.g. \"head\"", function(){
        var selector = "head";
        var exp = ["<head><title>some title</title></head>"];
        var p = this.parser.Find(selector);
        expect(p.data).toEqual(exp);
    });

    it("test \"<tag> <tag>\", e.g. \"head title\"", function(){
    });

    it("test \"<tag>[<key>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key>] <tag>\", e.g. ", function(){
    });
    
    it("test \"<tag>[<key> <key>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key>=<value>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key1>=<value1> <key2>=<value2>]\", e.g. ", function(){
    });

    it("test \"<tag> <tag>[<key>=<value>]\", e.g. ", function(){
    });

    it("test \"<tag>[<key>=<value>] <tag>\", e.g. ", function(){
    });
});
