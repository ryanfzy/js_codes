var TokenType = {};
TokenType.NoType = -1;
TokenType.From = 0;
TokenType.Select = 1;
TokenType.As = 2;
TokenType.AddField = 3;
TokenType.ForKey = 4;
TokenType.And = 5;
TokenType.WhereEach = 6;
TokenType.Str = 7;
TokenType.Var = 8;
TokenType.VarList = 9;

var Token = function(){
    this.type = TokenType.NoType;
    this.value = '';
};

var Parser = function(){
    this.parser;
    this.statements = [];
};

var Tokens = function(){
    this.tokens = [];
    this.curIndex = 0;
};

Tokens.Add = function(token){
    if (this.tokens.length > 1){
        this.curIndex++;
    }
    this.tokens.push(token);
};

Tokens.Get = function(){
    return this.tokens[this.curIndex];
};

Tokens.MovePrev = function(){
    this.curIndex--;
    return this.tokens[this.curIdnex];
};

Tokens.MoveNext = function(){
    this.curIndex++;
};

Tokens.HasNext = function(){
    return this.curIndex+1 > this.tokens-1;
};

Tokens.MoveTo = function(index){
    this.curIndex = index;
};

Tokens.GetIndex = function(){
    return this.curIndex;
};

var ParseQueryContext = function(){
    this.Tokens;
    this.ResultFromLastStatement;
};

var RunFromStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    if (token.Type == TokenType.Str){
        if (IsUrl(token.Value)){
            loader.load(token.Value, function(html){
                context.ResultFromLastStatement = html;
                tokens.MoveNext();
                RunNextStatement(context);
            });
        }
    }
};

var RunSelectStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    if (token.Type == TokenType.Str){
        var html = context.ResultFromLastStatement;
        var parser = parserjs.CreateParser(html);
        var rets = [];
        parser.parse(token.Value, function(html, attrs, data){
            var result = {};
            result.html = html;
            result.attrs = attrs;
            result.data = data;
            rets.push(result);
        });
        context.ResultFromLastStatement = rets;
        context.Tokens.MoveNext();
        RunNextStatement(context);
    }
};

var RunAsStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    if (token.Type == TokenType.Var){
        var valObj = new ValObj();
        valObj.Name = token.Value;
        valObj.Value = context.ResultFromLastStatement;
        context.Vars[token.Value] = valObj;
        context.Tokens.MoveNext();
    }
    else if (token.Type == TokenType.VarList){
        for (var i = 0; i < context.ResultFromLastStatement.length; i++){
            var valObj = new ValObj();
            valObj.Name = token.Value[i];
            vaObj.Value = context.ResultFromLastStetement[i];
            context.Vars[token.Value[i]] = valObj;
        }
    }
    RunNextStatement(context);
};

var RunWhereEachStatement = function(context){
    context.Tokens.MovePrev();
    if (context.Tokens.Get().Type == TokenType.Var){
        var sourceName = context.Tokens.Get().Value;
        context.Tokens.MoveNext();
        context.Tokens.MoveNext();
        var token = context.Tokens.Get();
        if (token.Get().Type == TokenType.Var){
            var sources = context.Vars[sourceName] || null;
            if (sources != null && sources.length > 0){
                var indexCurStatement = context.Tokens.GetIndex();
                for (var i = 0; i < sources.length; i++){
                    var newContext = new ParseQueryContext();
                    newContext.Tokens = context.Tokens;
                    newContext.Tokens.MoveTo(indexCurStatement);
                    context.Tokens.MoveNext();
                    RunNextStatement(newContext);
                }
            }
        }
    }
};

var GetFieldToAddFromContext = function(vars, key){
    var keys = key.split('.');
    var value = vars[keys[0]].Value;
    if (keys.length > 1){
        for (var i = 1; i < keys.length; i++){
            value = value[i];
        }
    }
    return value;
};

var GetForKeyName = function(vars, key){
    var keys = key.split('.');
    if (keys.length < 2){
        return keys;
    }
    else if (keys[1][0] == '$'){
        var valObj = vars[keys[0]];
        var k = keys[i].substr(1);
        return valObj[k];
    }
};

var RunAddFieldStatement = function(context){
    context.Tokens.MoveNext();
    var token = cotnext.Tokens.Get();
    if (token.Type == TokenType.Var){
        var fieldToAdd = GetFieldToAddFromContext(context.Vars, Token.Value);
        context.Tokens.MoveNext();
        var token2 = context.Tokens.Get();
        if (tokens.Type == TokenType.ForKey){
            context.Tokens.MoveNext();
            var token3 = context.Tokens.Get();
            var key = GetForKeyName(context.Vars, token3.Value);
            context.RetObj[key] = fieldToAdd;
            context.Tokens.MoveNext();
        }
        RunNextStatement(context);
    }
};

var RunAddStatement = function(context){
    context.Tokens.MoveNext();
    RunNextStatement(context);
};

var DestroyContext = function(context){
    context = new ParseQueryContext();
};

var RunNextStatement = function(context){
   var token = context.tokens.Get(); 
   switch (token.Type){
       case TokenType.From:
           RunFromStatement(context);
           break;
       case TokenType.Select:
           RunSelectStatement(context);
           break;

       case TokenType.As:
           RunAsStatement(conetxt);
           break;

       case TokenType.WhereEach:
           RunWhereEachStatement(context);
           break;

       case TokenType.AddField:
           RunAddFieldStatement(context);
           break;

       case TokenType.Add:
           RunAddStatement(context);
           break;

       case Token.Type.Terminate:
           break;

       default:
           break;
   }
};

Parser.Interpret = function(tokens){
    var parseQueryContext = new ParseQueryContext();
    parseQueryContext.Tokens = tokens;
    RunNextStatement(parseQueryContext);
};

var GetTokenType = function(word){
    if (word[0] == '"' || word[0] == "'"){
        token.type = TokenType.str;
    }
    else{
        token.type = TokenType.variable;
    }
}

var ToToken = function(word){
    var token = new Token();
    token.value = word;

    switch (word){
        case 'from':
            token.type = TokenType.From;
            break;
        
        case 'select':
            token.type = TokenType.Select;
            break;
        
        case 'as':
            token.type = TokenType.As;
            break;

        case 'where-each':
            token.type = TokenType.WhereEach;
            break;

        case 'add-field':
            token.type = TokenType.AddField;
            break;

        case 'for-key':
            token.type = TokenType.ForKey;
            break;

        case 'and':
            token.type = TokenType.And;
            break;

        default:
            token.type = GetTokenType(word);
            break;
    };

    return token;
};

var StrIter = function(str){
    this.str = str;
    this.curPos = 0;
};

StrIter.prototype = {
    CurChar : function(){
        var pos = this.curPos < 0 ? 0 : this.curPos > this.str.length - 1 ? this.str.length - 1 : this.curPos;
        return this.str[pos];
    },

    Next : function(){
        if (this.curPos >= this.str.length - 1){
            return false;
        }
        this.curPos++;
        return true;
    }
};

// given a query string
// returns a list of tokens
// TODO: this only handles the simplest case, it might not handle
//  more complex cases properly
var GetListOfTokens = function(input){
    var tokens = [];
    var foundStr = false;
    var foundList = false;

    var token = '';
    for (var i = 0; i < input.length; i++){
        var ch = input[i];

        if (ch == ' ' || ch == '\n'){
            if (!foundStr && !foundList){
                if (token.length > 0){
                    tokens.push(token);
                    token = '';
                }
                continue;
            }
        }
        // a token can start and end with " or '
        else if (ch == "'" || ch == '"'){
            foundStr = foundStr ? false : true;
        }
        // a token can start with [ and end with ]
        else if (ch == '[' || ch == ']'){
            foundList = foundList ? false : true;
        }
        token = token + ch;
    }

    if (token.length > 0){
        tokens.push(token);
    }

    return tokens;
};

var QueryParser = function(input){
    var tokens = GetListOfTokens(input);
    console.log(tokens);
    //var parser = new Parser();
    //parser.Interpret(tokens);
};

var input = "from 'https://careers.mercyascot.co.nz/home'\n" +
            "select 'div[class=job]' as rets\n" +
            "where-each as ret\n" +
            "from ret.html\n" +
            "select 'div[class=title] a' as href\n" +
            "add-field href.href for-key 'href'\n" +
            "and\n" +
            "select 'div[class=title] a span' as title\n" +
            "add-field title.html for-key 'title'\n" +
            "and\n" +
            "select 'div[class=description]' as description\n" +
            "add-field description.html for-key 'description'\n" +
            "and\n" +
            "select 'span[class=detail-item]' as [location, expertise, worktype, level, posteddate, closedate]\n" +
            "where-each as detail\n" +
            "add-field details.data.split('</span>')[self.length-2] for-key details.$name;";

QueryParser(input);
