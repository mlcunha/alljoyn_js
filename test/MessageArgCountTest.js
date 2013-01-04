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
AsyncTestCase("MessageArgCountTest", {
    _setUp: ondeviceready(function(callback) {
        var createInterface = function(err) {
            assertFalsy(err);
            bus.createInterface({
                name: "org.alljoyn.bus.samples.simple.SimpleInterface",
                method: [
                    { name: 'Ping', signature: 's', returnSignature: 's' }
                ]
            }, connect);
        };
        var connect = function(err) {
            assertFalsy(err);
            bus.connect(otherBusCreate);
        };
        var otherBusCreate = function(err) {
            assertFalsy(err);            
            otherBus = new org.alljoyn.bus.BusAttachment();
            otherBus.create(false, otherBusConnect);
        };
        var otherBusConnect = function(err) {
            assertFalsy(err);
            otherBus.connect(callback);
        };
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, createInterface);
    }),
    tearDown: function() {
        if (otherBus) {
            otherBus.destroy();
            delete otherBus;
            otherBus = null;
        }
        bus.destroy();
        delete bus;
        bus = null;
    },

    testReplyError0: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertError(function() { context.replyError(); }, "TypeError");
                            context.replyError(1);
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals(1, err.code);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },

    testReplyError1: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertNoError(function() { context.replyError(1); });
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals(1, err.code);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },

    testReplyError2: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertNoError(function() { context.replyError("name", "message"); });
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals("name", err.name);
                assertEquals("message", err.message);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },
    testReplyError3: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertNoError(function() { context.replyError("name"); });
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals("name", err.name);
                assertEquals("", err.message);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },
    testReplyError4: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertNoError(function() { context.replyError("name", callbacks.add(onReplyError)); });
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var onReplyError = function(err) {
                assertFalsy(err);
            }
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals("name", err.name);
                assertEquals("", err.message);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },
    testReplyError5: function(queue) {
        queue.call(function(callbacks) {
            var registerBusObject = function(err) {
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertNoError(function() { context.replyError("name", "message", callbacks.add(onReplyError)); });
                        }
                    }
                }, callbacks.add(getProxyObj));
            };
            var onReplyError = function(err) {
                assertFalsy(err);
            }
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err) {
                assertEquals("name", err.name);
                assertEquals("message", err.message);
            };
            this._setUp(callbacks.add(registerBusObject));
        });
    },
});
