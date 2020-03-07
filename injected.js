function captureXMLHttpRequest(recorder) {
    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;
    var setRequestHeader = XHR.setRequestHeader;

    // Collect data:
    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        this._startTime = (new Date()).toISOString();
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            var endTime = (new Date()).toISOString();

            if (recorder) {
                var myUrl = this._url ? this._url.toLowerCase() : this._url;
                if (myUrl) {

                    var requestModel = {
                        'uri': convertToFullUrl(this._url),
                        'verb': this._method,
                        'time': this._startTime,
                        'headers': this._requestHeaders
                    };

                    if (postData) {
                        if (typeof postData === 'string') {
                            console.log('request post data is string');
                            console.log(postData);
                            try {
                                requestModel['body'] = _.JSONDecode(postData);
                            } catch (err) {
                                console.log('JSON decode failed');
                                console.log(err);
                                requestModel['transfer_encoding'] = 'base64';
                                requestModel['body'] = _.base64Encode(postData);
                            }
                        } else if (typeof postData === 'object' || typeof postData === 'array' || typeof postData === 'number' || typeof postData === 'boolean') {
                            requestModel['body'] = postData;
                        }
                    }

                    var responseHeaders = parseResponseHeaders(this.getAllResponseHeaders());

                    var responseModel = {
                        'status': this.status,
                        'time': endTime,
                        'headers': responseHeaders
                    };

                    if (this.responseText) {
                        // responseText is string or null
                        try {
                            responseModel['body'] = _.JSONDecode(this.responseText);
                        } catch (err) {
                            responseModel['transfer_encoding'] = 'base64';
                            responseModel['body'] = _.base64Encode(this.responseText);
                        }
                    }

                    var event = {
                        'request': requestModel,
                        'response': responseModel
                    };

                    recorder(event);
                }
            }
        });
        return send.apply(this, arguments);
    };

    var undoPatch = function () {
        XHR.open = open;
        XHR.send = send;
        XHR.setRequestHeader = setRequestHeader;
    };

    return undoPatch;
    // so caller have a handle to undo the patch if needed.
}