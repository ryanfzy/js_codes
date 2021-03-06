var stringformatterjs = (function(){

    /* these code supports filter
    var _getParam = function(parExp, scope){
        // if parExp is a string, return it
        var regStr = /('|").*?\1/;
        if (regStr.test(parExp)){
            return parExp.substring(1, parExp.length - 1);
        }
        // if parExp is a key in scope, return the value
        else{
            if (parExp in scope){
                return scope[parExp];
            }
        }
        return parExp;
    }

    // return a list
    //   first tiem is a key in scope
    //   remainding items are filter expressions
    var _getParts = function(key){
        var exp = key.substring(2, key.length-1);
        var parts = exp.split('|');

        for (var p = 0; p < parts.length; p++){
            parts[p] = parts[p].trim();
        }

        return parts;
    }

    // return a list
    //   first item is function name
    //   remainding items are function parameters
    var _getFnNameParams = function(fnExp){
        var parts = fnExp.split('(');
        var ret = [parts[0]];

        if (parts.length < 2){
            return ret;
        }

        var params = parts[1].substring(0, parts[1].length-1).split(',');
        for (var p = 0; p < params.length; p++){
            var param = _getParam(params[p].trim());
            ret.push(param);
        }

        return ret;
    }
    */

    var _getAllKeys = function(str){
        var regKey = /%\{[^{}]+?\}/g;
        return str.match(regKey);
    }

    var _getNakedKeys = function(str){
        var keys = str.substring(2, str.length - 1).split(',');
        for (var i = 0; i < keys.length; i++){
            keys[i] = keys[i].trim();
        }
        return keys;
    }

    var _getAllNakedKeySet = function(str){
        var keys = _getAllKeys(str);
        var keySet = [];
        for (var i = 0; i < keys.length; i++){
            var nakedKeys = _getNakedKeys(keys[i]);
            for (var j = 0; j < nakedKeys.length; j++){
                if (keySet.indexOf(nakedKeys[j]) < 0){
                    keySet.push(nakedKeys[j]);
                }
            }
        }
        return keySet;
    }
    
    // str is the replacing string
    // scope is an object that contains the values of the keys in the replacing string
    //      for some <key> in <str>, <scope>[<key>] has the <replacing-value>
    //var formater = function(str, scope, filter){
    var formater = function(str, scope){
        var keys = _getAllKeys(str);

        // identify for the replacing strings, e.g. %{somekey}
        for (var i = 0; i < keys.length; i++){
            var unevaluatedKey = keys[i];
            //var parts = _getParts(unevaluatedKey);
            //var key = parts[0];
            var key = unevaluatedKey.substring(2, unevaluatedKey.length - 1);

            // if scope has the value for the key, replace the key
            // otherwise, keep as it is
            var replace = unevaluatedKey;
            if (key in scope){
                replace = scope[key];

                /* filter is pointless
                // if user providers a filter, filter the replace string
                if (filter && parts.length > 1){
                    var fNames = parts.slice(1)
                    for (var n = 0; n < fNames.length; n++){
                        //console.log(fNames[n]);
                        var fNameParams = _getFnNameParams(fNames[n]);
                        var fName = fNameParams[0];
                        replace = filter[fName].apply(null, [replace, fNameParams.slice(1)]);
                    }
                }
                */
            }

            str = str.replace(unevaluatedKey, replace);
        }

        return str;
    }

    var Formater = function(str, subFn){
        this.orig = str;
        this.substituteFn = subFn;
        this.replaceParts = {};
    }

    Formater.prototype = {
        CreateString : function(){
            var resultStr = this.orig;
            if (this.substituteFn != null){
                var keys = _getAllKeys(this.orig);
                for (var i = 0; i < keys.length; i++){
                    var replacingStr = '';
                    var nakedKeys = _getNakedKeys(keys[i]);
                    for (var j = 0; j < nakedKeys.length; j++){
                        var nakedKey = nakedKeys[j];
                        if (nakedKey in this.replaceParts){
                            var resultObj = {
                                resultStr : '',
                                index : j,
                                length : nakedKeys.length
                            };
                            if (this.substituteFn(nakedKey, this.replaceParts[nakedKey], resultObj)){
                                replacingStr += resultObj.resultStr;
                            }
                        }
                    }
                    resultStr = replacingStr.length > 0 ? resultStr.replace(keys[i], replacingStr) : keys[i];
                }
            }
            return resultStr;
        }
    }

    var _createReplaceMethod = function(_this, key){
        return function(val){
            _this.replaceParts[key] = val;
            return _this;
        }
    }

    var createFormater = function(str, subFn){
        var formater = new Formater(str, subFn);
        var keys = _getAllNakedKeySet(str);
        for (var i = 0; i < keys.length; i++){
            var parts = keys[i].split(',');
            for (var j = 0; j < parts.length; j++){
                var part = parts[j].trim();
                formater[part] = _createReplaceMethod(formater, part);
                formater.replaceParts[part] = '';
            }
        }
        return formater;
    }

    return {
        format : formater,
        CreateFormater : createFormater
    }
})();
