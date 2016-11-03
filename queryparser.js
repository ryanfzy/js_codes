var queryparserjs = (function(){

    ////////////////////////////////////////////////////////////////////////////
    // data structures
    ////////////////////////////////////////////////////////////////////////////

    // token types
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

    ////////////////////////////////////////////////////////////////////////////
    // field evaluator
    ////////////////////////////////////////////////////////////////////////////

    var _fns = {
        Split : function(data, sep){
            return data.split(sep);
        },
        LastItem : function(data){
            return data[data.length-1];
        }
    };

    var _getEvaluatedField = function(value, key){
        var parts = key.split('(');
        if (parts.length < 2){
            return value[parts[0]];
        }
        
        var fnName = parts[0];
        var params = [];
        if (parts[1].length > 1){
            params = parts[1].substring(0, parts[1].length-1).split('.');
            for (var p = 0; p < params.length; p++){
                params[p] = params[p].trim();
                if (params[p][0] == "'"){
                    params[p] = params[p].substring(1, params[p].length - 1);
                }
            }
        }

        if (fnName in _fns){
            return _fns[fnName].apply(null, [value].concat(params));
        }
        return value;
    };

    // evaluate a expression
    var _getEvaluatedExp = function(vars, exp){
        var parts = exp.split('.');
        // this is a list, we only check the first element
        var value = vars[parts[0]];
        if (value != null){
            var value = value[0].Value;
            if (parts.length > 1){
                for (var i = 1; i < parts.length; i++){
                    var key = parts[i];
                    //value = value[key];
                    value = _getEvaluatedField(value, key);
                    console.log(value);
                }
            }
        }
        else{
            value = key;
        }
        return value;
    };

    // evaluate a string
    var _getEvaluatedStr = function(vars, value){
        var pat = /\$\{.*?\}/g;
        var matches = value.match(pat);
        var substrs = value.split(pat);

        // get the keys, then use the keys to get the values
        var keys = [];
        for (var i = 0; i < matches.length; i++){
            var match = matches[i];
            var key = match.substring(2, match.length - 1);
            keys.push(_getEvaluatedExp(vars, key));
        }
        
        // get the return value
        var value = substrs[0];
        for (var i = 1; i < substrs.length; i++){
            value += keys[i-1];
            value += substrs[i];
        }
        return value;
    };

    // helper function for the add-field statement
    var _getFieldToAdd = function(vars, token){
        if (token.Type == TokenType.Str){
            return _getEvaluatedStr(vars, token.Value);
        }
        else if (token.Type == TokenType.Var){
            return _getEvaluatedExp(vars, token.Value);
        }
        return token.Value;
    };
    
    // helper function for the for-key statement
    // a key might be a string or the value of a field of a ValObj
    var GetForKeyName = function(vars, key){
        var name = '';
        if (key.Type == TokenType.Str){
            name = key.Value;
        }
        else if (key.Type == TokenType.Var){
            var keys = key.Value.split('.');
            // we support expression like key.$fieldName
            if (keys[1][0] == '$'){
                // get the first element of a Var
                var valObj = vars[keys[0]][0];
                var k = keys[1].substr(1);
                name = valObj[k] || '';
            }
        }
        return name;
    };
    
    // helper functions
    var IsUrl = function(url){
        if (url.indexOf('http') == 0){
            return true;
        }
        return false;
    };
    
    
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
            return this.Get();
        },
    
        MoveNext : function(){
            this.curIndex++;
            return this.Get();
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
        // that is [r1, r1, ...]
        this.ResultFromLastStatement;
    
        // by convension, each var should be always a list
        // and each element in the list is a ValObj
        // that is {k1:[v1, v2, ...], k2:[v1], ...}
        this.Vars = {};
    
        // this is a simple dict
        // that is {k1:v1, k2:v2, ...}
        this.RetObj = {};
    
        // currently, only where-as statement will set this is true
        // so the first where-as will return a list
        // but all nested where-as will return merge its RetObj to its parent's RetObj
        this.NestedContext = false;

        // this callback will be passed all the results
        this.AllFinishFn = null;

        // this callback will be called for each result
        this.ForEachFn = null;

        // this call back will be called when all the work is done
        this.WhenAllFinishFn = null;
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // interpreter
    ////////////////////////////////////////////////////////////////////////////

    // interpret the run statement
    var RunFromStatement = function(context){
        var token = context.Tokens.MoveNext();
        console.log('FROM: ' + token.Value);
        // if the given param is str, it should be a url
        // and we will call the url loader to load the page
        // before run the next statement
        if (token.Type == TokenType.Str){
            if (IsUrl(token.Value)){
                urlloaderjs.Load(token.Value, function(html){
                    // TODO: this seems like an issue, because this won't set
                    // the result as a list
                    // we thinks the follow statement must be select statement
                    context.ResultFromLastStatement = html;
                    context.Tokens.MoveNext();
                    RunNextStatement(context);
                });
            }
        }
        // if it is a var, we should find it in context.Vars
        // and we can pass it to the next statement directly
        else if (token.Type == TokenType.Var){
            context.ResultFromLastStatement = _getFieldToAdd(context.Vars, token);
            context.Tokens.MoveNext();
            RunNextStatement(context);
        }
    };
    
    
    // interpret the as statement that is after the select statement
    // this statement will save the result from the select statement to context.Vars
    // by a given name, so the following statement could refer it by name
    var RunSelectAsStatement = function(context){
        context.Tokens.MoveNext();
        var token = context.Tokens.Get();
        console.log('SELECT-AS: ' + token.Value);
        
        var results = [];
    
        // if the give param is a var, save all the results by a single key (the name of the var)
        if (token.Type == TokenType.Var){
            for (var i = 0; i < context.ResultFromLastStatement.length; i++){
                var valObj = new ValObj();
                // we create the name for the user
                valObj.Name = '_' + token.Value + i;
                valObj.Value = context.ResultFromLastStatement[i];
                results.push(valObj);
            }
            context.Vars[token.Value] = results;
        }
        // if the given param is a var list, save each result by each key in
        // the var list
        else if (token.Type == TokenType.VarList){
            var results = [];
            for (var i = 0; i < context.ResultFromLastStatement.length; i++){
                var valObj = new ValObj();
                valObj.Name = token.Value[i];
                valObj.Value = context.ResultFromLastStatement[i];
                // each var should always refers to a list of ValObj
                context.Vars[token.Value[i]] = [valObj];
                results.push(valObj);
            }
        }
        // end function if neither the case
        else{
            return;
        }
    
        context.ResultFromLastStatement = results;
        context.Tokens.MoveNext();
        RunNextStatement(context);
    };
    
    // intepret the select statement
    var RunSelectStatement = function(context){
        context.Tokens.MoveNext();
        var token = context.Tokens.Get();
        console.log('SELECT: ' + token.Value);
    
        // given param must be a query string which will be passed to the parser
        if (token.Type == TokenType.Str){
            // TODO: this seems like an issue
            // we think that the prev statement must be from statement
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
    
            // the result should always be a list
            context.ResultFromLastStatement = results;
            context.Tokens.MoveNext();
    
            if (context.Tokens.Get().Type == TokenType.As){
                RunSelectAsStatement(context);
            }
            else{
                // TODO: currently, if it runs into here, there would be problem
                RunNextStatement(context);
            }
        }
    };
    
    // interpret the as stetement after the where-each statement
    var RunWhereEachAsStatement = function(context){
        context.Tokens.MoveNext();
        var token = context.Tokens.Get();
        console.log('WHERE-EACH-AS: ' + token.Value);
    
        if (token.Type == TokenType.Var){
            var whereEachValObj = context.ResultFromLastStatement;
            // just give a different name
            context.Vars[token.Value] = whereEachValObj;
            context.Tokens.MoveNext();
            RunNextStatement(context);
        }
    };

    var _merge2RetObjs = function(toRetObj, fromRetObj){
        var keys = Object.keys(fromRetObj);
        for (var i = 0; i < keys.length; i++){
            var key = keys[i];
            toRetObj[key] = fromRetObj[key];
        }
        return toRetObj;
    };
    
    // interpret where-each statement
    var RunWhereEachStatement = function(context){
        // we depends the result from last statement is a list
        var sources = context.ResultFromLastStatement;
        var results = [];
    
        // for testing purpose
        //sources = [sources[0]];
    
        console.log('WHERE-EACH: ');
        if (sources != null && sources.length > 0){
            var indexCurStatement = context.Tokens.GetIndex();
            for (var i = 0; i < sources.length; i++){
                // create a new context for nested statements
                // currently, nested or child statement cannot see their parents
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
                    //TODO: if you are here, means that the caller didn't
                    // give a name to where-each element
                    // maybe we should create a name for it
                    RunNextStatement(newContext);
                }

                // for nested statements, combine the child's RetObj with parent's RetObj
                if (context.NestedContext){
                    context.RetObj = _merge2RetObjs(context.RetObj, newContext.RetObj);
                }
                // for non-nested statement, add RetObj to ResultFromLastStatement
                else{
                    results.push(newContext.RetObj);
                }
            }
        }
        console.log('WHERE-EACH results:');
        console.log(results);

        context.ResultFromLastStatement = results;
        RunTerminateStatement(context);
    };
    
    // interpret the add-field statement
    var RunAddFieldStatement = function(context){
        context.Tokens.MoveNext();
        var token = context.Tokens.Get();
        if (token.Type == TokenType.Var || token.Type == TokenType.Str){
            // get the value we want to add into RetObj
            var fieldToAdd = _getFieldToAdd(context.Vars, token);
            console.log('ADD-FIELD: ' + fieldToAdd);
            context.Tokens.MoveNext();
            var token2 = context.Tokens.Get();
            if (token2.Type == TokenType.ForKey){
                context.Tokens.MoveNext();
                var token3 = context.Tokens.Get();
                // get the key that refers to the value in RetObj
                var key = GetForKeyName(context.Vars, token3);
                console.log('FOR-KEY: ' + key);
                // add the field
                context.RetObj[key] = fieldToAdd;
                console.log(context.RetObj);
                context.Tokens.MoveNext();
            }
            RunNextStatement(context);
        }
    };
    
    // interpret the and statement
    // currently it did nothing
    var RunAndStatement = function(context){
        console.log('AND:');
        context.Tokens.MoveNext();
        RunNextStatement(context);
    };
    
    /*
    var DestroyContext = function(context){
        context = new ParseQueryContext();
    };*/

    var RunTerminateStatement = function(context){
        if (!context.NestedContext){
            console.log('terminate query');
            var results = context.ResultFromLastStatement;

            if (context.AllFinishFn != null){
                context.AllFinishFn(results);
            }

            if (context.ForEachFn != null){
                for (var i = 0; i < results.length; i ++){
                    context.ForEachFn(results[i]);
                }
            };

            if (context.WhenAllFinishFn !=null){
                context.WhenAllFinishFn();
            }
        }
        else{
            console.log('temrinate statement');    
        }
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
               RunTerminateStatement(context);
               break;
    
           default:
               break;
       }
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // lexer
    ////////////////////////////////////////////////////////////////////////////

    // this handles some speical tokens for ToQueryToken()
    var _toQueryToken = function(token){
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
                queryToken = _toQueryToken(token);
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

    ////////////////////////////////////////////////////////////////////////////
    // engine
    ////////////////////////////////////////////////////////////////////////////

    var QueryParser = function(input, onAllFinish){
        console.log("==== queryparserjs start =====");
        var tokens = GetListOfTokens(input);
        var queryTokens = GetQueryTokens(tokens);
    
        Interpret(queryTokens, onAllFinish);
        console.log("==== queryparserjs finished ====");
    };

    var Interpret = function(queryTokens, onAllFinish){
        var parseQueryContext = new ParseQueryContext();
        parseQueryContext.Tokens = queryTokens;
        parseQueryContext.AllFinishFn = onAllFinish;
        RunNextStatement(parseQueryContext);
    };

    var QueryParserEx = function(input, parameter){
        console.log("==== queryparserjs start =====");
        var parseQueryContext = new ParseQueryContext();
        var tokens = GetListOfTokens(input);
        var queryTokens = GetQueryTokens(tokens);
        parseQueryContext.Tokens = queryTokens;
        parseQueryContext.ForEachFn = parameter['forEach'];
        parseQueryContext.WhenAllFinishFn = parameter['whenAllFinish'];
        RunNextStatement(parseQueryContext);
        console.log("==== queryparserjs finished ====");
    };
    
    return {
        Interpret : QueryParser,
        InterpretEx : QueryParserEx
    }
})();


var input = "from 'https://careers.mercyascot.co.nz/home'\n" +
            "select 'div[class=job]' as rets\n" +
            "where-each as ret\n" +
            "from ret.html\n" +
            "select 'div[class=title] a' as href\n" +
            "add-field 'https://careers.mercyascot.co.nz/${href.attrs.href}' for-key 'href'\n" +
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
            "add-field detail.html.Split('</span>').LastItem() for-key detail.$Name;";

queryparserjs.Interpret(input, function(rets){
    console.log('all results')
    console.log(rets);
});
