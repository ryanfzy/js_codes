var parserjs = (function(){

    var closedTag = ['input'];
    var IsClosedTag = function(tag){
        return closedTag.indexOf(tag) == -1 ? false : true;
    };

    // lexer class which analyse the selector
    // and return the token and its type
    var SelectorLexer = function(str){
        this.data = str;
        this.curPos = 0;
        this.includeKeys = false;
        this.foundAttribute = false;
    };

    // types of tokens
    // add more types here if need more powerfull selector
    SelectorLexer.Tag = 'Tag';
    SelectorLexer.Attribute = 'Attribute';
    SelectorLexer.Value = 'Value';
    SelectorLexer.NoType = 'NoType';

    SelectorLexer.prototype = {
        // check if there is more tokens
        HasNextToken: function(){
            return this.curPos < this.data.length;
        },

        // get the next token as [type, token]
        GetNextToken: function(){
            var token = '';
            var type = '';
            var foundToken = false;
            while(!foundToken && this.curPos < this.data.length){
                var ch = this.data.charAt(this.curPos);
                if (ch == '['){
                    this.includeKeys = true;
                    type = SelectorLexer.Tag;
                    foundToken = token.length > 0;
                }
                else if (ch == ']'){
                    this.includeKeys = false;
                    if (this.foundAttribute){
                        type = SelectorLexer.Value;
                        this.foundAttribute = false;
                    }
                    else{
                        type = SelectorLexer.Attribute;
                    }
                    foundToken = token.length > 0;
                }
                else if (ch == '=' && this.includeKeys){
                    type = SelectorLexer.Attribute;
                    this.foundAttribute = true;
                    foundToken = token.length > 0;
                }
                else if (ch == ' ' || this.curPos == this.data.length-1){

                    // when reach last ch, have to add it to token first
                    if (this.curPos == this.data.length-1){
                        token += ch;
                    }

                    if (this.includeKeys){
                        if (this.foundAttribute){
                            type = SelectorLexer.Value;
                            this.foundAttribute = false;
                        }
                        else{
                            type = SelectorLexer.Attribute;
                        }
                    }
                    else{
                        type = SelectorLexer.Tag;
                    }
                    foundToken = token.length > 0;
                }
                else{
                    token += ch;
                }
                this.curPos++;
            }

            if (type.length == 0)
                type = SelectorLexer.NoType;
            
            return [type, token];
        }
    };

	// data can be a single string
    // but always convert it to array of strings
	var Parser = function(data){
		this.tag = '';
		if(data instanceof Array){
			this.size = data.length;
			this.data = data;
		}
		else{
			this.size = 1;
			this.data = [data];
		}
	};
	
	// return a new Parser
    // @static method
	Parser.Feed = function(data){
		return new Parser(data);
	};
	
	Parser.prototype = {
        // convert selector to regex
		_convert: function(tag){
            var tagName = Object.keys(tag)[0];
            var keyValue = tag[tagName];
			this.tag = tagName;
	
			// if no attributes found
            if (!keyValue){
				var rstr = '<' + this.tag + '[^>]*>(.|\\s)*?<\/' + this.tag + '>';
				return rstr;
			}
	
            // convert the attributes part
            var key = Object.keys(keyValue)[0];
            var value = keyValue[key];
            var kvstr = '';
            if (value){
                kvstr = key + '="' + value + '"';
            }
            else{
                kvstr = key + '=';
            }
	
			var rstr = 
				'<' + this.tag + '\\s+'		//start of start tag
				+ '[^>]*'			    	//0 or more attributes
				+ kvstr				    	//required attributes
				+ '[^>]*';			    	//0 or more attributes

            if (IsClosedTag(this.tag)){
                rstr += '\/>';              //close tag
            }
            else{
				rstr = rstr
                + '>'				    	//end of start tag
				+ '(.|\\s)*?'		    	//tag body
				+ '<\/' + this.tag + '>';	//end tag
            }

			return rstr;
	
		},
	
        // NOTE: this is not used any more but keep this
        //  if later we introduce position sensitive attributes
		// convert the attributes to regex
		_convert_kv: function(kvstr){
			var kvs = kvstr.split(' ');
			var res = [];
			for (var i = 0; i < kvs.length; i++){
				var kvstr = kvs[i];
				if(kvstr.search('=') == -1){
					res.push(kvstr + '=');
					continue;
				}
				kvstr = kvstr.replace('=', '="') + '"';
				res.push(kvstr);
			}
			return res.join('[^<>]*');
		},
					
		// reconvert the regex
		//   by replace tag body to the right number of start tags and end tags
		_re_convert: function(rstr, num){
			var st = '<' + this.tag + '\\s+[^>]*>';
			var sb = '(.|\\s)*?';
			var se = '<\/' + this.tag + '>';
			var body = '';
			for(var i = 0; i < num; i++){
				body = sb + st;
			}
			for(var i = 0; i < num; i++){
				body = body + sb + se;
			}
			body += sb;
			rstr = rstr.replace('(.|\\s)*?', body);
	
			return rstr;
		},

        // parse the selector to array of objects
        // returns [obj1, obj2, ...], obj_n+1 is the child of obj_ n
        // {obj_n : {k1 : v1, k2 : v2, ...}}, position of keys doesn't matter
        // obj_n could be null, v_n could be null
        _parse_selector: function(pstr){
            var parser = new SelectorLexer(pstr);
            var tags = [];
            var tag = {};
            var curTag = '';
            var curKey = '';
            while (parser.HasNextToken()){
                var typeToken = parser.GetNextToken();
                var type = typeToken[0];
                var token = typeToken[1];
                switch (type){
                    case SelectorLexer.Tag:
                        if (Object.keys(tag).length > 0)
                            tags.push(tag);
                        curTag = token;
                        tag = {};
                        tag[curTag] = null;
                        break;

                    case SelectorLexer.Attribute:
                        curKey = token;
                        if (!tag[curTag]){
                            tag[curTag] = {};
                        }
                        tag[curTag][curKey] = null;
                        break;

                    case SelectorLexer.Value:
                        tag[curTag][curKey] = token;
                        break;

                    default:
                        break;
                }
            }
            tags.push(tag);
            return tags;
        },
	
		// find substring based on css selectors
		Find: function(pstr, onerror){
	
			var tags = this._parse_selector(pstr);
	
			var _parser;
			var res = this.data;

			for(var i = 0; i < tags.length; i++){
				var tmp = [];
	
				for(var j = 0; j < res.length; j++){

					// find the child subtrings for each parent substring
                    var dataitem = [res[j]];
                    var tagsWithSingleKey = this._split_tag_for_each_key(tags[i]);

                    // if tag has more than one attributes
                    // need to process the data item several times 
                    // until we find an item contining all the attributes
                    for (var k = 0; k < tagsWithSingleKey.length; k++){
                        var matches = [];
                        for (var m = 0; m < dataitem.length; m++){
                            var matchitems = this._find(dataitem[m], tagsWithSingleKey[k]);
                            if (matchitems != -1){
                                matches = matches.concat(matchitems);
                            }
                        }
                        dataitem = matches;
                    }
					tmp = tmp.concat(dataitem);
				}
				res = tmp;
			}
	
			// create a new Parser from the result and return it
			// this supports method chaining
			_parser = new Parser(res);
			_parser.tag = this.tag;
			return _parser;
		},

        // if tag has more than one keys, convert it to an array of tags
        // which each has the same tag name but only one key
        // e.g. {tag: {key1: value1, key2: value2, ...} to
        //      [ {tag: {key1: value1}}, {tag: {key2: value2}}, ...]
        _split_tag_for_each_key: function(tag){
            var tagName = Object.keys(tag)[0];
            var keyValues = tag[tagName];
            
            if (!keyValues)
                return [tag];

            var tags = [];
            for (var key in keyValues){
                var newTag = {};
                newTag[tagName] = {};
                newTag[tagName][key] = keyValues[key];
                tags.push(newTag);
            }
            return tags;
        },

		// handle single case for find()
		_find: function(data, tag, onerror){
	
			// convert the selector to regex
			var rstr = this._convert(tag);
	
			var reg = new RegExp(rstr, 'gi');
			var matches = data.match(reg);
			if(!matches){
				return -1;
			}
	
            if (IsClosedTag(this.tag)){
                return matches;
            }

			var mat = matches[0];
			var stag = '<' + this.tag + '\\b';
			var etag = '<\/' + this.tag + '>';
			var sm = mat.match(new RegExp(stag, 'gi')).length;
			var em = mat.match(new RegExp(etag, 'gi')).length;
	
			// handle nested tag
			// if the start tags is more than the tags, nested tags are found
			//   so reconvert the selector
			while(sm > em){
				var nstr = this._re_convert(rstr, sm-1);
				reg = new RegExp(nstr, 'gi');
				matches = data.match(reg);
				mat = matches[0];
				var sm = mat.match(new RegExp(stag, 'gi')).length;
				var em = mat.match(new RegExp(etag, 'gi')).length;
			}
			return matches;
		},
	
		// separate the outermost tag and its innerHTML
		_get_head_body: function(data){
			var s = data.indexOf('>');
			var e = data.lastIndexOf('<');
			var head = data.substring(0, s+1);
			var body = data.substring(s+1, e);
			return [head, body];
		},
	
		// separate key and value
		_get_key_value: function(data){
			var kv = data.split('=');
			var k = kv.shift();
			var v = kv.join('=');
			v = v.substring(1, v.length-1);
			return [k,v];
		},
	
		// convert attrs into object
		_get_attrs: function(data){
            // remove '<' and '>' first
            data = data.substring(1, data.length-1);
			var kvs = data.split(/\s+/);
			var attrs = {};
            var found_kv = false;
            var found_last = false;
            var value = '';
			for(var i = 0; i < kvs.length; i++){
				var kv = kvs[i];
				if(kv.search('=') == -1 && !found_kv){
					continue;
				}

                if (kv[kv.length-1] == '"' || kv[kv.length-1] == "'"){
                    found_last = true;
                    found_kv = false;
                }
                else{
                    found_last = false;
                    found_kv = true;
                }
                
                if (found_kv || found_last){
                    if (value.length > 0){
                        value = value + ' ';
                    }
                    value = value + kv;
                    if (found_last){
                        found_kv = false;
                        found_last = false;
                    }
                }

                if (!found_kv && !found_last){
				    kv = this._get_key_value(value);
				    attrs[kv[0]] = kv[1];
                    value = '';
                }
			}
			return attrs;
		},
	
		// call the given function for each data items
		// the function is passed with innerHTML, attrs as an object, and raw data string
		Parse: function(func){
			for(var i = 0; i < this.size; i++){
				if(this.data[0] == ''){
					func('', {}, '');
				}
				else{
					// separate outmost tag and its innerHTML
					var hb = this._get_head_body(this.data[i]);
					data = this.data[i];
					innerHTML = hb[1];
					// convert attrs into object
					attrs = this._get_attrs(hb[0]);
					func(innerHTML, attrs, data);
				}
			}
		},
	
		// return a new Parser with a single data item
		Index: function(i){
			if(this.size == 1){
				return this;
			}
			i = i > this.size-1 ? this.size-1 : i;
			var p = new Parser(this.data[i]);
			p.tag = this.tag;
			return p;
		}
    };

    return {
        CreateParser : function(data){
            data = data || "";
            return new Parser(data);
        }
    }

})();

