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
AsyncTestCase("ProxyMethodTest", {
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testNoReply: function(queue) {
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.NoReply",
                    method: [
                        { name: 'Ping', signature: 's', argNames: 'inStr', 
                          'org.freedesktop.DBus.Method.NoReply': true }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.NoReply": {
                        Ping: callbacks.add(function(context, inStr) {})
                    }
                }, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(getProxyBusObject));
            };
            var getProxyBusObject = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.NoReply", "Ping", "hello", { flags: 0x01 }, callbacks.add(done));
            };
            var done = function(err, context) {
                assertFalsy(err);
                assertUndefined(context.sender);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },

    testFlags: function(queue) {
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.Flags",
                    method: [
                        { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.Flags": {
                        Ping: callbacks.add(function(context, inStr) { 
                            assertEquals(0x02, context.flags & 0x02);
                            context.reply(inStr);
                        })
                    }
                }, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(getProxyBusObject));
            };
            var getProxyBusObject = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.Flags", "Ping", "hello", { flags: 0x02 }, callbacks.add(onPing));
            };
            var onPing = function(err, context, outStr) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },

    testTimeout: function(queue) {
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.Timeout",
                    method: [
                        { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.Timeout": {
                        Ping: function(context, inStr) { /* no reply */ }
                    }
                }, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(getProxyBusObject));
            };
            var getProxyBusObject = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.Timeout", "Ping", "hello", { timeout: 10 }, callbacks.add(onPing));
            };
            var onPing = function(err, context, outStr) {
                assertEquals("org.alljoyn.Bus.Timeout", err.name);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },
});
