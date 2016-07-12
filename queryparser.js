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

var ValObj = function(){
    this.Name;
    this.Value;
};

// a query token, value has to be interpreted based on the type
var Token = function(){
    this.Type = TokenType.NoType;
    this.Value = '';
};

// a stream of query tokens
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

// keep the status of the interpretation
var ParseQueryContext = function(){
    this.Tokens;
    // this should be always be a list
    this.ResultFromLastStatement;
    this.Vars = {};
    this.RetObj = {};
    this.NestedContext = false;
};

var IsUrl = function(url){
    if (url.indexOf('http') == 0){
        return true;
    }
    return false;
};

// interpret the run statement
var RunFromStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    console.log('FROM: ' + token.Value);
    // if the given param is str, it should be start with 'http'
    // and we will call the url loader to load the page
    // before run the next statement
    if (token.Type == TokenType.Str){
        if (IsUrl(token.Value)){
            var loader = new UrlLoader();
            loader.load(token.Value, function(html){
                context.ResultFromLastStatement = html;
                context.Tokens.MoveNext();
                RunNextStatement(context);
            });
        }
    }
    // if it is a var, we should find it in context.Vars
    // and we can pass it to the next statement directly
    else if (token.Type == TokenType.Var){
        context.ResultFromLastStatement = GetFieldToAddFromContext(context.Vars, token.Value);
        context.Tokens.MoveNext();
        RunNextStatement(context);
    }
};


// interpret the as statement
// this statement will save the result from last statement to context.Vars
// by a given name, so the following statement could refer it by name
var RunSelectAsStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    console.log('SELECT-AS: ' + token.Value);
    // if the give param is a var, save all the results by a single key (the name of the var)
    if (token.Type == TokenType.Var){
        //var valObj = new ValObj();
        //valObj.Name = token.Value;
        //valObj.Value = context.ResultFromLastStatement;
        var results = [];
        for (var i = 0; i < context.ResultFromLastStatement.length; i++){
            var valObj = new ValObj();
            valObj.Name = '_' + token.Value + i;
            valObj.Value = context.ResultFromLastStatement[i];
            results.push(valObj);
        }
        //context.Vars[token.Value] = valObj;
        context.Vars[token.Value] = results;
        context.ResultFromLastStatement = results;
        context.Tokens.MoveNext();
    }
    // if the given param is a var list, save each result by each key in
    // the var list
    else if (token.Type == TokenType.VarList){
        //console.log('here');
        var results = [];
        for (var i = 0; i < context.ResultFromLastStatement.length; i++){
            var valObj = new ValObj();
            //console.log(context);
            //console.log(token);
            valObj.Name = token.Value[i];
            valObj.Value = context.ResultFromLastStatement[i];
            context.Vars[token.Value[i]] = [valObj];
            results.push(valObj);
        }
        context.ResultFromLastStatement = results;
        console.log(context.Vars);
        context.Tokens.MoveNext();
    }
    RunNextStatement(context);
};

// intepret the select statement
var RunSelectStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    console.log('SELECT: ' + token.Value);
    // given param must be a query string which will be passed to the parser
    if (token.Type == TokenType.Str){
        var html = context.ResultFromLastStatement;
        var parser = parserjs.CreateParser(html);
        var results = [];
        parser.Find(token.Value).Parse(function(html, attrs, data){
            var result = {};
            result.html = html;
            result.attrs = attrs;
            result.data = data;
            results.push(result);
        });
        // the parser could return multiple results
        //context.ResultFromLastStatement = results.length > 1 ? results : results[0];
        context.ResultFromLastStatement = results;
        context.Tokens.MoveNext();
        //RunNextStatement(context);
        if (context.Tokens.Get().Type == TokenType.As){
            RunSelectAsStatement(context);
        }
        else{
            RunNextStatement(context);
        }
    }
};

var RunWhereEachAsStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    console.log('WHERE-EACH-AS: ' + token.Value);
    if (token.Type == TokenType.Var){
        var whereEachValObj = context.ResultFromLastStatement;
        //var valObj = new ValObj();
        //valObj.Name = whereEachValObj.Name;
        //valObj.Value = whereEachValObj.Value;
        //context.Vars[token.Value] = valObj;
        context.Vars[token.Value] = whereEachValObj;
        context.Tokens.MoveNext();
        RunNextStatement(context);
    }
};

// TODO: need to fix this
var RunWhereEachStatement = function(context){
    // we don't need to check the prev token and find
    // the value from context.Vars
    // because the objects where this statement need is in context.ResultFromLastStatement
    /*
    context.Tokens.MovePrev();
    var sources = [];
    if (context.Tokens.Get().Type == TokenType.Var){
        var sourceName = context.Tokens.Get().Value;
        context.Tokens.MoveNext();
        //var token = context.Tokens.Get();
        sources = context.Vars[sourceName].Value || null;
    }
    else if (context.Tokens.Get().Type == TokenType.VarList){
        var sourceNames = context.Tokens.Get().Value;
        console.log(sourceNames);
        console.log(context.Vars);
        for (var i = 0; i < sourceNames.length; i++){
            sources.push(context.Vars[sourceNames[i]].Value);
        }
    }
    */
    var sources = context.ResultFromLastStatement;
    var results = [];
    // for testing purpose
    //sources = [sources[0]];
    console.log('WHERE-EACH: ');
    console.log(sources);
    if (sources != null && sources.length > 0){
        var indexCurStatement = context.Tokens.GetIndex();
        for (var i = 0; i < sources.length; i++){
            var newContext = new ParseQueryContext();
            newContext.NestedContext = true;
            newContext.Tokens = context.Tokens;
            newContext.Tokens.MoveTo(indexCurStatement);
            newContext.ResultFromLastStatement = [sources[i]];
            newContext.Tokens.MoveNext();
            var nextToken = newContext.Tokens.Get();
            if (nextToken.Type == TokenType.As){
                RunWhereEachAsStatement(newContext);
            }
            else{
                RunNextStatement(newContext);
            }
            results.push(newContext.RetObj);
        }
    }
    console.log('WHERE-EACH results:');
    console.log(results);
    if (context.NestedContext && results.length > 0){
        for (var i = 0; i < results.length; i++){
            var result = results[i];
            var keys = Object.keys(result);
            for (var j = 0; j < keys.length; j++){
                var key = keys[j];
                context.RetObj[key] = result[key];
            }
        }
    }
};

var GetFieldToAddFromContext = function(vars, key){
    var keys = key.split('.');
    var value = vars[keys[0]];
    /* we are expecting the value has only one elem
    //TODO
    if (value.length > 1){
        // log a warning message
    }*/
    console.log(vars);
    console.log(value);
    var value = value[0].Value;
    if (keys.length > 1){
        for (var i = 1; i < keys.length; i++){
            var key = keys[i];
            value = value[key];
        }
    }
    return value;
};

var GetForKeyName = function(vars, key){
    var name = '';
    if (key.Type == TokenType.Str){
        name = key.Value;
    }
    else if (key.Type == TokenType.Var){
        var keys = key.Value.split('.');
        console.log(vars);
        console.log(keys);
        /*
        if (keys.length < 2){
            name = GetFieldToAddFromContext(vars, key);
        }*/
        if (keys[1][0] == '$'){
            var valObj = vars[keys[0]][0];
            var k = keys[1].substr(1);
            name = valObj[k];
        }
    }
    return name;
};

var RunAddFieldStatement = function(context){
    context.Tokens.MoveNext();
    var token = context.Tokens.Get();
    if (token.Type == TokenType.Var){
        var fieldToAdd = GetFieldToAddFromContext(context.Vars, token.Value);
        console.log('ADD-FIELD: ' + fieldToAdd);
        context.Tokens.MoveNext();
        var token2 = context.Tokens.Get();
        if (token2.Type == TokenType.ForKey){
            context.Tokens.MoveNext();
            var token3 = context.Tokens.Get();
            var key = GetForKeyName(context.Vars, token3);
            console.log('FOR-KEY: ' + key);
            context.RetObj[key] = fieldToAdd;
            console.log(context.RetObj);
            context.Tokens.MoveNext();
        }
        RunNextStatement(context);
    }
};

var RunAndStatement = function(context){
    console.log('AND:');
    context.Tokens.MoveNext();
    RunNextStatement(context);
};

var DestroyContext = function(context){
    context = new ParseQueryContext();
};

var RunNextStatement = function(context){
   var token = context.Tokens.Get(); 
   switch (token.Type){
       case TokenType.From:
           RunFromStatement(context);
           break;
       case TokenType.Select:
           RunSelectStatement(context);
           break;

           /*
       case TokenType.As:
           RunAsStatement(context);
           break;
           */

       case TokenType.WhereEach:
           RunWhereEachStatement(context);
           break;

       case TokenType.AddField:
           RunAddFieldStatement(context);
           break;

       case TokenType.And:
           RunAndStatement(context);
           break;

       case TokenType.Terminate:
           break;

       default:
           break;
   }
};

var Interpret = function(queryTokens){
    var parseQueryContext = new ParseQueryContext();
    parseQueryContext.Tokens = queryTokens;
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

        case ';':
            queryToken.Type = TokenType.Terminate;
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

        if (ch == ';' && !foundStr){
            if (token.length > 0){
                tokens.push(token);
                token = '';
            }
            tokens.push(';');
            continue;
        }

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
    var queryTokens = GetQueryTokens(tokens);

    Interpret(queryTokens);
};

var input = "from 'https://careers.mercyascot.co.nz/home'\n" +
            "select 'div[class=job]' as rets\n" +
            "where-each as ret\n" +
            "from ret.html\n" +
            "select 'div[class=title] a' as href\n" +
            "add-field href.attrs.href for-key 'href'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=title] a span' as title\n" +
            "add-field title.html for-key 'title'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=description]' as description\n" +
            "add-field description.html for-key 'description'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'span[class=detail-item]' as [location, expertise, worktype, level, posteddate, closedate]\n" +
            "where-each as detail\n" +
            "add-field detail.html for-key detail.$Name;";

QueryParser(input);
