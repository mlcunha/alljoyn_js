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
AsyncTestCase("AuthListenerTest", {
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        var createInterface = function(err) {
            bus.createInterface({
                name: "test.SecureInterface", 
                secure: true,
                method: [ { name: 'Ping', signature: 's', returnSignature: 's' } ]
            }, registerBusObject);
        };
        var registerBusObject = function(err) {
            bus.registerBusObject("/test", {
                "test.SecureInterface": {
                    Ping: function(context, inStr) { context.reply(inStr); }
                }
            }, createOtherBus);
        };
        var createOtherBus = function(err) {
            otherBus = new org.alljoyn.bus.BusAttachment();
            otherBus.create(false, callback);
        };
        bus.create(false, createInterface);
    }),
    tearDown: function() {
        bus.destroy();
        otherBus.destroy();
    },

    testSrpKeyxPass: function(queue) {
        queue.call(function(callbacks) {
            var enablePeerSecurity = function(err) {
                bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertEquals(1, authCount);
                        assertEquals(credentials.ONE_TIME_PWD, credMask);
                        credentials.password = "123456";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
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
                bus.connect(callbacks.add(otherBusEnablePeerSecurity));
            };
            var otherBusEnablePeerSecurity = function(err) {
                assertFalsy(err);
                otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertEquals(1, authCount);
                        assertEquals(credentials.PASSWORD, credMask);
                        credentials.password = "123456";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
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
                otherBus.connect(callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/test", callbacks.add(ping));
            };
            var ping = function(err, proxyObj) {
                assertFalsy(err);
                proxyObj.methodCall("test.SecureInterface", "Ping", "pong", callbacks.add(done));
            };
            var done = function(err, context, outStr) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(enablePeerSecurity));
        });
    },

    testSrpKeyxFail: function(queue) {
        queue.call(function(callbacks) {
            var enablePeerSecurity = function(err) {
                bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertEquals(credentials.ONE_TIME_PWD, credMask);
                        credentials.password = "123456";
                        return true;
                    }, 2),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertFalse(success);
                    })
                }, clearKeyStore);
            };
            var clearKeyStore = function(err) {
                assertFalsy(err);
                bus.clearKeyStore(callbacks.add(connect));
            };
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(otherBusEnablePeerSecurity));
            };
            var otherBusEnablePeerSecurity = function(err) {
                assertFalsy(err);
                otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertEquals(credentials.PASSWORD, credMask);
                        credentials.password = "654321";
                        return (authCount < 2) ? true : false;
                    }, 2),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertFalse(success);
                    }),
                    onSecurityViolation: callbacks.add(function(status, message) {
                        assertEquals(org.alljoyn.bus.BusError.AUTH_FAIL, status);
                    })
                }, callbacks.add(otherBusClearKeyStore));
            };
            var otherBusClearKeyStore = function(err) {
                assertFalsy(err);
                otherBus.clearKeyStore(callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/test", callbacks.add(ping));
            };
            var ping = function(err, proxyObj) {
                assertFalsy(err);
                proxyObj.methodCall("test.SecureInterface", "Ping", "pong", callbacks.add(function(){}));
            };
            this._setUp(callbacks.add(enablePeerSecurity));
        });
    },

    testRsaKeyxPass: function(queue) {
        queue.call(function(callbacks) {
            var enablePeerSecurity = function(err) {
                bus.enablePeerSecurity("ALLJOYN_RSA_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_RSA_KEYX", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        if (credentials.NEW_PASSWORD & credMask) {
                            credentials.password = "654321";
                        }
                        return true;
                    }, 2),
                    onVerify: callbacks.add(function(authMechanism, peerName, credentials) {
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_RSA_KEYX", authMechanism);
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
                bus.connect(callbacks.add(otherBusEnablePeerSecurity));
            };
            var otherBusEnablePeerSecurity = function(err) {
                assertFalsy(err);
                otherBus.enablePeerSecurity("ALLJOYN_RSA_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_RSA_KEYX", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        if (credentials.NEW_PASSWORD & credMask) {
                            credentials.password = "123456";
                        }
                        return true;
                    }, 2),
                    onVerify: callbacks.add(function(authMechanism, peerName, credentials) {
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_RSA_KEYX", authMechanism);
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
                otherBus.connect(callbacks.add(getProxyObj));
            };
            var getProxyObj = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/test", callbacks.add(ping));
            };
            var ping = function(err, proxyObj) {
                assertFalsy(err);
                proxyObj.methodCall("test.SecureInterface", "Ping", "pong", callbacks.add(function(){}));
            };
            this._setUp(callbacks.add(enablePeerSecurity));
        });
    },
    
    testMultipleAuthMechanisms: function(queue) {
        queue.call(function(callbacks) {
            var enablePeerSecurity = function(err) { 
                assertFalsy(err);
                bus.enablePeerSecurity("ALLJOYN_RSA_KEYX ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(otherBus.uniqueName, peerName);
                        assertEquals(credentials.ONE_TIME_PWD, credMask);
                        credentials.password = "123456";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
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
                bus.connect(callbacks.add(otherBusEnablePeerSecurity));
            };
            var otherBusEnablePeerSecurity = function(err) {
                assertFalsy(err);
                otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                      userName, credMask, credentials) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertEquals(credentials.PASSWORD, credMask);
                        credentials.password = "123456";
                        return true;
                    }),
                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                        assertEquals("ALLJOYN_SRP_KEYX", authMechanism);
                        assertEquals(bus.uniqueName, peerName);
                        assertTrue(success);
                    }),
                }, callbacks.add(otherBusClearKeyStore));
            };
            var otherBusClearKeyStore = function(err) {
                assertFalsy(err);
                otherBus.clearKeyStore(callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(getProxy));
            };
            var getProxy = function(err) {
                assertFalsy(err);
                otherBus.getProxyBusObject(bus.uniqueName + "/test", callbacks.add(ping));
            };
            var ping = function(err, proxyObj) {
                assertFalsy(err);
                proxyObj.methodCall("test.SecureInterface", "Ping", "pong", callbacks.add(function(){}));
            };
            this._setUp(callbacks.add(enablePeerSecurity));
        });
    },
});
