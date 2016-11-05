
var createapijs = (function(urlLoader){
    /*
    var api = {};

    /////////////////////////////////////
    var add_api = function(name){
        var newAPI = new API();
        api[name] = newAPI;
        return newAPI;
    }

    var get_api = function(name){
        return api[name];
    }
    ///////////////////////////////////

    ///////////////////////////////////
    var API = function(){
        this.domain = '';
        this.services = {};
    }

    API.prototype = {
        addDomain : function(api_domain){
            this.domain = api_domain;
        },
        createRequest : function(service_name){
            var newService = new APIService(this.domain);
            this.services[service_name] = newService;
            return newService;
        },
        getRequest : function(service_name){
            return this.services[service_name];
        }
    };
    /////////////////////////////////////////
    */

    ///////////////////////////////////////
    var apiService = function(domain){
        this.response_body = {};
        this.request_body = {};
        this.replace_body = {};
        this.domain = domain || '';
    }

    apiService.prototype = {

        startNew : function(){
            this.response_body = {};
            this.request_body = {};
            this.replace_body = {};
            return this;
        },

        addSubDomain : function(sub_domain){
            var tag_regex;
            this._simple_parse(sub_domain);

            //check if sub_domain contains replace body
            tag_regex = /\{.*\}/;
            if (tag_regex.test(sub_domain)){
                this._complex_parse();
            }
        },

        _complex_parse : function(){
            // handles 2 cases:
            //  1) .../{tag}/urlpart
            //  2) ...?{tag1, tag2, ...}
            var tag_regex = /[/?]\{.*?\}/g;
            var matches = this.domain.match(tag_regex);
            if (matches != -1){
                for (var i = 0; i < matches.length; i++){
                    var mat = matches[i];
                    // case 1
                    if (mat[0] == '/'){
                        this._add_replace_tag(trim_ex(mat.substring(1), ['{','}']));
                    }
                    // case 2
                    else if (mat[0] == '?'){
                        var tags = trim_ex(mat.substring(1), ['{','}']).split(/[,|, ]/);
                        this.addRequestTags(tags);
                    }
                };
            }
        },

        _simple_parse : function(sub_domain){
            // here only check if domain ends a / and sub domain starts a / at same time
            if (this.domain[this.domain.length-1] == '/' && sub_domain[0] == '/'){
                sub_domain = sub_domain.substring(1);
            }
            this.domain = this.domain + sub_domain;
        },

        _add_replace_tag : function(tag_name){
            this[tag_name] = this._create_replace_method(tag_name);
        },
        
        _create_replace_method : function(tag_name){
            var this_obj = this;
            return function(data){
                this_obj.replace_body[tag_name] = data;
                return this_obj;
            }
        },

        addRequestTags : function(tag_names){
            // this only handles query, tag_names always result ?k1=v1&k2=v2&...
            var this_obj = this;
            for (var i = 0; i < tag_names.length; i++){
                var tag_name = tag_names[i];
                this_obj[tag_name] = this_obj._create_request_method(tag_name);
            };
        },

        _create_request_method : function(tag_name){
            var this_obj = this;
            return function(data){
                this_obj.request_body[tag_name] = data;
                return this_obj;
            }
        },

        addResponseTags : function(tag_names){
            var this_obj = this;
            for (var i = 0; i < tag_names.length; i++){
                var tag_name = tag_names[i];
                this_obj.response_body[tag_name] = '';
            };
        },

        _build_request_url : function(){
            //need to handle many cases, see below:
            var rp = /\/\{.*?\}/g,
                rq = /\?\{.*?\}/g;

            var query = '',
                result = this.domain;

            // handle replace body
            for (var key in this.replace_body){
                var val = this.replace_body[key];
                var rpk = '{' + key + '}';
                result = result.replace(rpk, val);
            };

            //handle request body
            var this_obj = this;
            for (var key in this.request_body){
                var val = this.request_body[key];
                if (query == ''){
                    query = query + '?';
                }
                else{
                    query = query + '&';
                }
                query = query + key + '=' + val;
            };
            
            // check if there is a place holder for request body
            if (rq.test(this.domain)){
                result = result.replace(rq, query);
            }
            else{
                if (this.domain[this.domain.length-1] == '/'){
                    result = result.substring(0, this.domain.length-1);
                }
                result = result + query;
            }
            return result;
        },

        build : function(){
            return this._build_request_url();
        },

        send : function(userReceiveFn){
            // simply passed the response object to the user
            var url = this._build_request_url();
            //var responseFn = this._create_responseFn(userReceiveFn);
            //load_url(url, responseFn);
            //userReceiveFn(url);
            //load_url(url, userReceiveFn);
            urlLoader.Load(url, userReceiveFn);
        },

        _create_responseFn : function(userReceiveFn){
            var this_obj = this;
            return function(data){
                this_obj._process_response(data);
                userRecieveFn(this_obj.resposne_body);   
            }
        },

        _process_response : function(raw_data){
            var raw_keys = Object.keys(raw_data);
            var ret_keys = Object.keys(this.response_body);
            var set_keys = this._find_same_keys(raw_keys, ret_keys);
            for (var i = 0; i < set_keys.length; i++){
                var key = set_keys[i];
                this.response_body[key] = raw_data[key];
            };
        }
    };
    /////////////////////////////////////////////////

    function load_url(url, onsuccessFn){
        var http = new XMLHttpRequest();
        http.onreadystatechange = function(){
            if(http.readyState == 4 && http.status == 200){
                var jobj = JSON.parse(http.responseText);
                onsuccessFn(jobj);
            }
        };
        http.open('GET', url, true);
        http.send();
    }

    //////////////////////////////////////////
    var create_service = function(url){
        var service = new APIService();
        service.addSubDomain(url);
        return service;
    }
    ////////////////////////////////////////

    var return_api = {
        //addAPI : add_api,
        //getAPI : get_api,
        createService : create_service
    }

    return return_api;
})(urlloaderjs);

/*
x1) create a api repository:

    var apis = createAPI();

x2) add a api to the api repository:

    // #1
    var api = apis.add_api('douban');
    api.add_domain('https://api.douban.com/');

    // #2
    var api = apis.add_api('douabn', 'https://api.douban.com/');

3) create a api service:

    // #1
    var search = api.create_request('search');
    search.add_sub_domain('/v2/movie/search');

    // #2
    var search = api.create_request('search', '/v2/movie/search');

    // #3
    var search = api.create_request('search', '/v2/movie/search?{q,tag,start,count}');

4) add request tags that can be used on the service:

    search.add_request_tags(['q','tag', 'start', 'count']);

this will create protocol://domain/subdomain?key1=val1&key2=val2...

sometime, the api is the form protocol://domain/subdomain/request | /request/sub-subdomain
you must use this method

    var ser = api.create_request('service', '/subdomain/{tagName}');
    ser.tagName('val').send();

this will create protocol://domain/subdomain/val

5) add response tags, the result you want from the service:

    search.add_response_tags(['count', 'start', 'total', 'subjects', 'title']);

6) send a request:

    search.q('matrix').start('1').count('2').send(function(response){
        document.write(response.title);
    });

OTHERS:

possible api formats:

    protocol://domain/sub_domain/{value}
        => protocol://domain/sub_domain/value
        
    protocol://domain/sub_domain/{value}/sub_subdomain
        => protocol://domain/sub_domain/value/sub_subdomain

    protocol://domain/sub_domain?{k1, k2, ...}
        => protocol://domain/sub_domain?k1=v1&k2=v2...

    protocol://domain/sub_domain/{value}?{k1, k2, ...}
        => protocol://domain/sub_domain/value?k1=v1&k2=v2...

    protocol://domain/sub_domain/{value}/sub_domain?{k1, k2, ...}
        => protocol://domain/sub_domain/value/sub_domain?k1=v1&k2=v2...
*/
