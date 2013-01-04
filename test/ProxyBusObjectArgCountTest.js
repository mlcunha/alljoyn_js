/*
 * Copyright 2011, Qualcomm Innovation Center, Inc.
 * 
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 * 
 *        http://www.apache.org/licenses/LICENSE-2.0
 * 
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
AsyncTestCase("ProxyBusObjectArgCountTest", {
    _setUp: ondeviceready(function(callback) {
        var getProxyObj = function(err) {
            assertFalsy(err);
            bus.getProxyBusObject("a.b/c", callback);
        };
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, getProxyObj);
    }),
    _wrap: function(queue, f) {
        queue.call(function(callbacks) {
            this._setUp(callbacks.add(f));
        });
    },
    tearDown: function() {
        bus.destroy();
    },

    testIntrospect0: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertError(function() { proxyObj.introspect(); }, "TypeError");
        });
    },
    testIntrospect1: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertNoError(function() { proxyObj.introspect(function() {}); }, "TypeError");
        });
    },

    testParseXML0: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertError(function() { proxyObj.parseXML(); }, "TypeError");
        });
    },
    testParseXML1a: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertError(function() { proxyObj.parseXML("xml"); });
        });
    },
    testParseXML1b: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertNoError(function() { proxyObj.parseXML("xml", function() {}); });
        });
    },

    testSecureConnection0a: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertError(function() { proxyObj.secureConnection(); });
        });
    },
    testSecureConnection0b: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertNoError(function() { proxyObj.secureConnection(function() {}); });
        });
    },
    testSecureConnection1a: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertError(function() { proxyObj.secureConnection(true); });
        });
    },
    testSecureConnection1b: function(queue) {
        this._wrap(queue, function(err, proxyObj) {
            assertNoError(function() { proxyObj.secureConnection(true, function() {}); });
        });
    },
});

