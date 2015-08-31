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

describe("test parser.Find() and Parse()", function(){
    beforeAll(function(){

        this.test1 = "<html><head></head><body><div><p>some text</p></div></body></html>";
        this.exp1_innerhtml = "<p>some text</p>";
        this.exp1_attrs = [];
        this.exp1_data = "<div><p>some text</p></div>";
    });

    it("test css selector \"<tag>\", e.g. \"div\"", function(){
        var parser = parserjs.CreateParser(this.test1);
        parser.Find(this.test1).Parse(function(innerHtml, attrs, data){
            expect(innerHtml).toEqual(this.exp1_innerhtml);
            //expect(attrs).toEqual(this.exp1_attrs);
            //expect(data).toEqual(this.exp1_data);
        });
    });
});
