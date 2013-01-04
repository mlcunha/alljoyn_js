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
AsyncTestCase("ConstantsTest", {
    _setUp: ondeviceready(function(callback) {
        otherBus = undefined;
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        otherBus && otherBus.destroy();
        bus.destroy();
    },

    testBusAttachment: function(queue) {
        queue.call(function(callbacks) {
            var done = function(err) {
                assertFalsy(err);
                assertEquals(1, org.alljoyn.bus.BusAttachment.DBUS_NAME_FLAG_ALLOW_REPLACEMENT);
                assertEquals(1, bus.DBUS_NAME_FLAG_ALLOW_REPLACEMENT);
            };
            this._setUp(callbacks.add(done));
        });
    },

    testMessage: function(queue) {
        assertEquals(1, org.alljoyn.bus.Message.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.samples.simple.SimpleInterface",
                    method: [
                        { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            assertEquals(1, context.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
                            context.reply(inStr);
                        }
                    }
                }, callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject(bus.uniqueName + "/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err, context, outStr) {
                assertFalsy(err);
                assertEquals(1, context.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },

    testSessionOpts: function(queue) {
        assertEquals(1, org.alljoyn.bus.SessionOpts.TRAFFIC_MESSAGES);
        queue.call(function(callbacks) {
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(otherBusBindSessionPort));
            };
            var onAccept = callbacks.add(function(port, joiner, opts) {
                assertEquals(1, opts.TRAFFIC_MESSAGES);            
                return true;
            });
            var sessionOpts = { onAccept: onAccept };
            var otherBusBindSessionPort = function(err) {
                assertFalsy(err);
                otherBus.bindSessionPort(sessionOpts, callbacks.add(connect));
            };
            var connect = function(err, port) {
                assertFalsy(err);
                sessionOpts.port = port;
                bus.connect(callbacks.add(joinSession));
            };
            var joinSession = function(err) {
                assertFalsy(err);
                bus.joinSession({ host: otherBus.uniqueName,
                                  port: sessionOpts.port }, callbacks.add(onJoinSession));
            };
            var onJoinSession = function(err, id, opts) {
                assertFalsy(err);
                assertEquals(1, opts.TRAFFIC_MESSAGES);            
                bus.leaveSession(id, callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(otherBusCreate));
        });
    },

    testBusError: function(queue) {
        assertEquals(1, org.alljoyn.bus.BusError.FAIL);
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.samples.simple.SimpleInterface", 
                    method: [
                        { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { 
                            context.replyError("org.alljoyn.bus.samples.simple.Error");
                        }
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
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err, context, outStr) {
                assertEquals(1, err.FAIL);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },

    testCredentials: function(queue) {
        assertEquals(0x0001, org.alljoyn.bus.Credentials.PASSWORD);
        assertEquals(0x0020, org.alljoyn.bus.Credentials.EXPIRATION);
        queue.call(function(callbacks) {
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "test.SecureInterface",
                    secure: true,
                    method: [ { name: 'Ping', signature: 's', returnSignature: 's' } ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/test", {
                    "test.SecureInterface": {
                        Ping: function(context, inStr) { context.reply(inStr); }
                    }
                }, callbacks.add(enablePeerSecurity));
            };
            var enablePeerSecurity = function(err) {
                assertFalsy(err);
                bus.enablePeerSecurity("ALLJOYN_SRP_LOGON", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_LOGON", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertEquals(1, authCount);
                        assertEquals("userName", userName);
                        assertEquals((credentials.LOGON_ENTRY | credentials.PASSWORD), credMask);
                        assertEquals(0x0020, credentials.EXPIRATION);
                        credentials.password = "password";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_LOGON", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertTrue(success);
                    })
                }, callbacks.add(clearKeyStore));
            };
            var clearKeyStore = function(err) {
                assertFalsy(err);
                bus.clearKeyStore(callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(otherBusCreate));
            };
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusEnablePeerSecurity));
            };
            var otherBusEnablePeerSecurity = function(err) {
                assertFalsy(err);
                otherBus.enablePeerSecurity("ALLJOYN_SRP_LOGON", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_LOGON", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertEquals(1, authCount);
                        assertEquals((credentials.PASSWORD | credentials.USER_NAME), credMask);
                        credentials.userName = "userName";
                        credentials.password = "password";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_LOGON", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertTrue(success);
                    })
                }, callbacks.add(otherBusClearKeyStore));
            };
            var otherBusClearKeyStore = function(err) {
                assertFalsy(err);
                otherBus.clearKeyStore(callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(otherBusGetProxyBusObject));
            };
            var otherBusGetProxyBusObject = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/test", callbacks.add(ping));
            };
            var ping = function(err, proxy) {
                assertFalsy(err);
                proxy.methodCall("test.SecureInterface", "Ping", "pong", callbacks.add(done));
            };
            var done = function(err, context, outStr) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(createInterface));
        });
    },
});

