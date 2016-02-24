(function (window) {

    "use strict";

    var internal = {},
        util = {},
        aj = {
            version:    '0.1.0'
        };

    /**************************************| Internal |**************************************/

    internal.configDefault =  {
        url:        document.location,
        data:       '',
        async:      true,
        method:     'GET',
        timeout:    0,
        headers:    {'X-Requested-With':'XMLHttpRequest', 'Content-Type':'application/x-www-form-urlencoded; charset=utf-8'},
        username:   '',
        password:   '',
        credentials: false,
        response:   'text',
        contentType:'',
        onComplete: function(e){},
        onProgress: function(e){},
        onTimeout:  function(e){},
        onSuccess:  function(e){},
        onBefore:   function(e){},
        onChange:   function(e){},
        onError:    function(e){},
        onAbort:    function(e){},
        onStart:    function(e){}
    };

    internal.addConfigHeader = function(type, value){
        internal.configDefault.headers[type] = value;
    };

    internal.removeConfigHeader = function(type){
        if(internal.configDefault.headers[type])
            delete internal.configDefault.headers[type];
    };

    /**************************************| Util |**************************************/

    util.encode = function(object){
        if(typeof object === 'string') return object;
        if(typeof object !== 'object') return '';
        var key, convert = [];
        for(key in object)
            convert.push(key+'='+encodeURIComponent(object[key]));
        return convert.join('&');
    };
    util.decode = function(string){
        return util.parse(string);
    };
    util.parse = function(url){
        url = url || document.location;
        var params = {}, parser = document.createElement('a');
        parser.href = url;
        if(parser.search.length > 1){
            parser.search.substr(1).split('&').forEach(function(part){
                var item = part.split('=');
                params[item[0]] = decodeURIComponent(item[1]);
            });
        }
        return params;
    };
    util.parseUrl = function(url){
        url = url || document.location;
        var params = {};
        var parser = document.createElement('a');
        parser.href = url;
        params.protocol = parser.protocol;
        params.host = parser.host;
        params.hostname = parser.hostname;
        params.port = parser.port;
        params.pathname = parser.pathname;
        params.hash = parser.hash;
        params.search = parser.search;
        params.get = util.parse(parser.search);
        return params;
    };
    util.merge = function(object, source){
        if(typeof source !== 'object') return {};
        if(typeof object !== 'object') return source;
        var key, result = {};
        for(key in source) {
            if(object[key] !== undefined)
                result[key] = object[key];
            else
                result[key] = source[key];
        }
        return result;
    };
    util.parseForm = function(formElement, asObject){
        var obj = {}, str = '';
        for(var i=0;i<formElement.length;i++){
            var f = formElement[i], fName = f.nodeName.toLowerCase();
            if(f.type == 'submit' || f.type == 'button') continue;
            if((f.type == 'radio' || f.type == 'checkbox') && f.checked == false) continue;
            if(fName == 'input' || fName == 'select' || fName == 'textarea'){
                obj[f.name] = f.value;
                str += ((str=='')?'':'&') + f.name +'='+encodeURIComponent(f.value);
            }
        }
        return (asObject == true) ? obj : str;
    };

    /**************************************| Aj |**************************************/


    aj.open = function(config){

        if(typeof config !== 'object') {
            aj.consoleError (config + ' is not object of configuration!');
            return;
        }
        aj.xhr = null;
        aj.config = util.merge(config, internal.configDefault);

        // internal object, as prototype it`is
        var o = {}; aj.self = o;

        o.send = aj.send;






        aj.self = o;
        return o;
    };

    aj.send = function() {

        var sendData = null,
            sendStr = '',
            conf = aj.config,
            self = aj.self,
            method = conf.method.toUpperCase(),
            xhr = new XMLHttpRequest();

        /*if((method == 'GET' || method == 'HEAD') && conf.data) {*/
        if(typeof conf.data === 'string' && conf.data.length > 2 && method != 'POST') {
            sendStr = (conf.url.indexOf('?') === -1 ? '?' : '&') + util.encode(conf.data);
        } else {
            if(typeof conf.data === 'object' && conf.data instanceof FormData)
                sendData = conf.data;
            else
                sendData = util.encode(conf.data);
        }

        xhr.open(
            method,
            conf.url + sendStr,
            conf.async,
            conf.username,
            conf.password);

        if(conf.timeout > 0){
            xhr.timeout = conf.timeout;
        }

        if(conf.credentials || (conf.username.length>2 && conf.password.length>2)){
            xhr.withCredentials = conf.credentials;
        }

        if(!(conf.data instanceof FormData)) {
            for(var key in conf.headers)
                xhr.setRequestHeader(key, conf.headers[key]);
        }

        /* callbacks handlers */

        if(typeof conf.onBefore === 'function')
            conf.onBefore.call(self, xhr);

        xhr.onreadystatechange = function(event){
            if(typeof conf.onChange === 'function')
                conf.onChange.call(self, xhr.readyState, xhr.status, xhr, event);
        };
        xhr.onloadstart = function(event){
            if(typeof conf.onStart === 'function')
                conf.onStart.call(self, xhr, event);
        };
        xhr.onprogress = function(event){
            if(typeof conf.onProgress === 'function')
            conf.onProgress.call(self, xhr, event);
        };
        xhr.onabort = function(event){
            if(typeof conf.onAbort === 'function')
                conf.onAbort.call(self, xhr, event);
        };
        xhr.onerror = function(event){
            if(typeof conf.onError === 'function')
                conf.onError.call(self, xhr.statusText, xhr, event);
        };
        xhr.onload = function(event){
            if(xhr.status > 400) {
                if(typeof conf.onError === 'function')
                    conf.onError.call(self, xhr.statusText, xhr, event);
            }
            else {
                var response = xhr.responseText;
                if(conf.response == 'xml') response = xhr.responseXML;
                if(conf.response == 'json') response = JSON.parse(response);
                if(typeof conf.onSuccess === 'function')
                    conf.onSuccess.call(self, response, xhr.status, xhr, event);
            }
        };
        xhr.ontimeout = function(event){
            if(typeof conf.onTimeout === 'function')
                conf.onTimeout.call(self, xhr, event);
        };
        xhr.onloadend = function(event){
            var response = xhr.responseText;
            if(conf.response == 'xml') response = xhr.responseXML;
            if(conf.response == 'json') response = JSON.parse(response);

            if(typeof conf.onComplete === 'function')
                conf.onComplete.call(self, xhr.status, response, xhr, event);
        };

        xhr.send(sendData);
        return xhr;
    };

    aj.consoleError = function(message) {console.error('Aj throw error: ' + message)};
    aj.consoleLog = function(message) {console.log('Aj info: ' + message)};

    /**
     * Упрощенный GET запрос
     *
     * @param url       config: url,        type: string
     * @param data      config: data,       type: string|FormData
     * @param callback  config: onComplete, type: function
     * @param response  config: url,        type: string
     * @returns {*}
     */
    aj.get = function(url, data, callback, response){
        var params = {
            url:url,
            data:data || '',
            method:'GET',
            response:response || 'html',
            contentType:'text/html; charset=utf-8',
            onComplete:callback
        };
        var ajax = aj.open(params);
        return ajax.send();
    };

    aj.post = function(url, data, callback, response){
        var params = {
            url:url,
            data:data || '',
            method:'POST',
            response:response || 'html',
            onComplete:callback
        };
        var ajax = aj.open(params);
        return ajax.send();
    };

    aj.head = function(url, headers, callback){
        var callbackResult = function(status, response, xhr, event){
            callback.call(aj.self, status, xhr, event);
        };
        var params = {
            url:url,
            data:'',
            method:'HEAD',
            headers:headers || false,
            onComplete:callbackResult
        };
        var ajax = aj.open(params);
        return ajax.send();
    };

    aj.load = function(url, data, callback, contentType){
        var params = {
            url: url,
            data: data || '',
            method: 'GET',
            contentType:contentType || 'text/html; charset=utf-8',
            onComplete:callback
        };
        var ajax = aj.open(params);
        return ajax.send();
    };

    aj.request = function(method, url, data, callback, contentType){
        var params = {
            url: url,
            data: data || '',
            method: method || 'GET',
            contentType:contentType || 'text/html; charset=utf-8',
            onComplete:callback
        };
        var ajax = aj.open(params);
        return ajax.send();
    };

    aj.form = function(form, config, callback){

        if(typeof form === 'object' && form.nodeName == 'FORM'){

            config = config || {};
            var appendData = config.data || false;

            config.url = config.url || form.action || document.location;
            config.method = config.method || form.method || 'POST';
            config.contentType = config.contentType || form.enctype || 'application/x-www-form-urlencoded; charset=utf-8';
            config.data = new FormData(form);

            if(typeof appendData === 'object'){
                for(var key in appendData)
                    config.data.append(key, appendData[key]);
            }

            config.onComplete = callback;

            var ajax = aj.open(config);
            return ajax.send();
        }
        else
            aj.consoleError('ERROR! Element not nodeName = FORM!');
    };




    /**
     * Import to global
     */

    window.Aj = aj.open;
    window.AjGet = aj.get;
    window.AjPost = aj.post;
    window.AjHead = aj.head;
    window.AjLoad = aj.load;
    window.AjRequest = aj.request;
    window.AjForm = aj.form;
    window.AjJson = aj;
    window.AjJsonp = aj;
    window.AjMessage = aj;
    window.AjUpload = aj;
    window.AjAddScript = aj;
    window.AjAddStyle = aj;
    window.Aj.util = util;

})(window);

/*
https://github.com/sobstel/jsonp.js

https://learn.javascript.ru/ajax-jsonp

var JSONP = function(global){
    // (C) WebReflection Essential - Mit Style
    // 216 bytes minified + gzipped via Google Closure Compiler
    function JSONP(uri, callback) {
        function JSONPResponse() {
            try { delete global[src] } catch(e) {
                // kinda forgot < IE9 existed
                // thanks @jdalton for the catch
                global[src] = null
            }
            documentElement.removeChild(script);
            callback.apply(this, arguments);
        }
        var
            src = prefix + id++,
            script = document.createElement("script")
            ;
        global[src] = JSONPResponse;
        documentElement.insertBefore(
            script,
            documentElement.lastChild
        ).src = uri + "=" + src;
    }
    var
        id = 0,
        prefix = "__JSONP__",
        document = global.document,
        documentElement = document.documentElement
        ;
    return JSONP;
}(this);

<script src="JSONP.js"></script>
<script>
this.onload = function () {
    var many = 0;
    JSONP("test.php?callback", function (a, b, c) {
        this.document.body.innerHTML += [
                a, b, ++many, c
            ].join(" ") + "<br />";
    });
    JSONP("test.php?callback", function (a, b, c) {
        this.document.body.innerHTML += [
                a, b, ++many, c
            ].join(" ") + "<br />";
    });
};
</script>


*/