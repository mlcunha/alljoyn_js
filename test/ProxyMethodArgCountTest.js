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
AsyncTestCase("ProxyMethodArgCountTest", {
    _setUp: ondeviceready(function(callback) {
        var createInterface = function(err) {
            assertFalsy(err);
            bus.createInterface({
                name: "org.alljoyn.bus.NoReply",
                method: [
                    { name: 'Ping', signature: 's', argNames: 'inStr' }
                ]
            }, registerBusObject);
        };
        var registerBusObject = function(err) {
            assertFalsy(err);
            bus.registerBusObject("/testobject", {
                "org.alljoyn.bus.NoReply": {
                    Ping: function(context, inStr) {}
                }
            }, connect);
        };
        var connect = function(err) {
            assertFalsy(err);
            bus.connect(getProxyObj);
        };
        var getProxyObj = function(err) {
            assertFalsy(err);
            bus.getProxyBusObject(bus.uniqueName + "/testobject", callback);
        };
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, createInterface);
    }),
    _wrap: function(queue, f) {
        queue.call(function(callbacks) {
            this._setUp(callbacks.add(f));
        });
    },
    tearDown: function() {
        bus.destroy();
    },

    testMethodCall0: function(queue) {
        this._wrap(queue, function(err, testobject) {
            assertError(function () { testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "str"); }, "TypeError");
        });
    },
    testMethodCall1: function(queue) {
        this._wrap(queue, function(err, testobject) {
            assertError(function () { testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "str"); }, "TypeError");
        });
    },
    testMethodCall2a: function(queue) {
        this._wrap(queue, function(err, testobject) {
            assertError(function () { testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "str", null); }, "TypeError");
        });
    },
    testMethodCall2b: function(queue) {
        this._wrap(queue, function(err, testobject) {
            assertNoError(function () { testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "str", function() {}); });
        });
    },
    testMethodCall3: function(queue) {
        this._wrap(queue, function(err, testobject) {
            assertNoError(function () { testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "str", { timeout: 30 }, function() {}); });
        });
    },
});
