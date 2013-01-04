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
AsyncTestCase("BusListenerTest", {
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testRegisteredUnregistered: function(queue) {
        queue.call(function(callbacks) {
            var registerBusListener = function(err) {
                assertFalsy(err);
                var busListener = {
                    onRegistered: callbacks.add(function(busAttachment) {
                        bus.unregisterBusListener(busListener, callbacks.add(function(err) { assertFalsy(err); }));
                    }),
                    onUnregistered: callbacks.add(function() {
                    })
                };
                bus.registerBusListener(busListener, callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(registerBusListener));
        });
    },

    testStoppingDisconnected: function(queue) {
        queue.call(function(callbacks) {
            var registerBusListener = function(err) {
                assertFalsy(err);
                var busListener = {
                    onStopping: callbacks.add(function() {
                    }),
                    onDisconnected: callbacks.add(function() {
                    })
                };
                bus.registerBusListener(busListener, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(disconnect));
            };
            var disconnect = function(err) {
                assertFalsy(err);
                bus.disconnect(callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(registerBusListener));
        });
    },

    testFoundLostAdvertisedName: function(queue) {
        queue.call(function(callbacks) {
            var registerBusListener = function(err) {
                assertFalsy(err);
                var busListener = {
                    onFoundAdvertisedName: callbacks.add(function(name, transport, namePrefix) {
                        assertEquals("org.alljoyn.testName", name);
                        assertEquals(1, transport);
                        assertEquals("org.alljoyn.testName", namePrefix);
                        bus.cancelAdvertiseName("org.alljoyn.testName", 0xffff, callbacks.add(function(err) { assertFalsy(err); }));
                    }),
                    onLostAdvertisedName: callbacks.add(function(name, transport, namePrefix) {
                        assertEquals("org.alljoyn.testName", name);
                        assertEquals(1, transport);
                        assertEquals("org.alljoyn.testName", namePrefix);
                        bus.releaseName("org.alljoyn.testName", callbacks.add(function(err) { assertFalsy(err); }));
                    })
                };
                bus.registerBusListener(busListener, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(requestName));
            };
            var requestName = function(err) {
                assertFalsy(err);
                bus.requestName("org.alljoyn.testName", 0, callbacks.add(advertiseName));
            };
            var advertiseName = function(err) {
                assertFalsy(err);
                bus.advertiseName("org.alljoyn.testName", 0xffff, callbacks.add(findAdvertisedName));
            };
            var findAdvertisedName = function(err) {
                assertFalsy(err);
                bus.findAdvertisedName("org.alljoyn.testName", callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(registerBusListener));
        });
    },

    testNameOwnerChanged: function(queue) {
        queue.call(function(callbacks) {
            var registerBusListener = function(err) {
                assertFalsy(err);
                var busListener = {
                    onNameOwnerChanged: callbacks.add(function(busName, previousOwner, newOwner) {
                        assertEquals("org.alljoyn.bus.BusListenerTest", busName);
                    }),
                };
                bus.registerBusListener(busListener, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject("org.freedesktop.DBus/org/freedesktop/DBus", callbacks.add(requestName));
            };
            var requestName = function(err, dbus) {
                assertFalsy(err);
                /* Trigger the onNameOwnerChanged callback by requesting a well-known name. */
                dbus.methodCall("org.freedesktop.DBus", "RequestName", "org.alljoyn.bus.BusListenerTest", 0, callbacks.add(onRequestName));
            };
            var onRequestName = function(err, context, result) {
                assertFalsy(err);
                assertEquals(1, result);
            };
            this._setUp(callbacks.add(registerBusListener));
        });
    },
});
