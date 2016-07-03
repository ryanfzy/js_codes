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
    this.Type = TokenType.NoType;
    this.Value = '';
};

var Parser = function(){
    this.parser;
    this.statements = [];
};

var Tokens = function(){
    this.tokens = [];
    this.curIndex = 0;
};

Tokens.prototype = {

    Add : function(token){
        this.tokens.push(token);
    },

    Get : function(){
        return this.tokens[this.curIndex];
    },

    MovePrev : function(){
        this.curIndex--;
        return this.tokens[this.curIdnex];
    },

    MoveNext : function(){
        this.curIndex++;
    },

    HasNext : function(){
        return this.curIndex+1 < this.tokens.length;
    },

    MoveTo : function(index){
        this.curIndex = index;
    },

    GetIndex : function(){
        return this.curIndex;
    },
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

// this handles some speical tokens for ToQueryToken()
var ToQueryToken2 = function(token){
    var queryToken = new Token();
    queryToken.Value = token;

    if (token[0] == '"' || token[0] == "'"){
        queryToken.Type = TokenType.Str;
        queryToken.Value = token.substring(1, token.length-1);
    }
    else if (token[0] == '[' && token[token.length-1] == ']'){
        token = token.substring(1, token.length-1);
        queryToken.Type = TokenType.VarList;
        queryToken.Value = token.split(/,\s+/);
    }
    else{
        queryToken.Type = TokenType.Var;
    }

    return queryToken;
}

// given a token
// return a query token
var ToQueryToken = function(token){
    var queryToken = new Token();
    queryToken.Value = token;

    switch (token){
        case 'from':
            queryToken.Type = TokenType.From;
            break;
        
        case 'select':
            queryToken.Type = TokenType.Select;
            break;
        
        case 'as':
            queryToken.Type = TokenType.As;
            break;

        case 'where-each':
            queryToken.Type = TokenType.WhereEach;
            break;

        case 'add-field':
            queryToken.Type = TokenType.AddField;
            break;

        case 'for-key':
            queryToken.Type = TokenType.ForKey;
            break;

        case 'and':
            queryToken.Type = TokenType.And;
            break;

        default:
            queryToken = ToQueryToken2(token);
            break;
    };

    return queryToken;
};

// given a list of tokens
// return a QueryTokens object
var GetQueryTokens = function(tokens){
    var queryTokens = new Tokens();
    
    for (var i = 0; i < tokens.length; i++){
        var queryToken = ToQueryToken(tokens[i]);
        queryTokens.Add(queryToken);
    }

    return queryTokens;
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
    var queryTokens = GetQueryTokens(tokens);
    console.log(queryTokens);

    console.log('start');
    while (queryTokens.HasNext()){
        var token = queryTokens.Get();
        console.log(token.Type);
        console.log(token.Value);
        queryTokens.MoveNext();
    }
    console.log('end');
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
