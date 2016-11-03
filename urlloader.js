urlloaderjs = (function(){
    var UrlLoader = function(psize){
	    this.http = new XMLHttpRequest();
        this.httpr = [];
    };

    UrlLoader.prototype = {
	    load: function(url, onsuccess){
		    if(!(url instanceof Array)){
			    url = [url];
			    this.httpr = [];
		    }
		    for(var i = 0; i < url.length; i++){
			    this.httpr.push(new XMLHttpRequest());
		        var loader = this.httpr[i];
		        this.httpr[i].onreadystatechange = function(){
			        var lloader = loader; 
			        if(lloader.readyState == 4 && lloader.status == 200){
				        onsuccess(lloader.responseText);
			        }
		        };
		        this.httpr[i].open('GET', url[i], true);
		        this.httpr[i].send(null);
		    }
	    },
	    _onready: function(onsuccess){
		    if(this.http.readyState == 4 && this.http.status == 200){
			    onsuccess(loader.http.responseText);
		    }
	    }
    };

    var load = function(url, onsuccess){
        var loader = new UrlLoader();
        loader.load(url, onsuccess);
    };

    var loadEx = function(urls, getUrlFn, onEachSuccess, onAllSuccess){
        var jobsDone = 0;
        var loader = new UrlLoader();
        for (var i = 0; i < urls.length; i++){
            var url = getUrlFn(urls[i]);
            loader.load(url, function(text){
                onEachSuccess(text);
                jobsDone++;
                if (jobsDone == urls.length){
                    onAllSuccess();
                }
            });
        }
    };
    
    return {
        Load : load,
        LoadEx : loadEx
    }
})();
