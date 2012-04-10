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
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            bus.interfaces["test.SecureInterface"] = {
                secure: true,
                method: [ { name: 'Ping', signature: 's', returnSignature: 's' } ]
            };
            bus["/test"] = {
                "test.SecureInterface": {
                    Ping: function(context, inStr) { context.reply(inStr); }
                }
            };
            otherBus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, otherBus.disconnect());
            assertEquals(0, bus.disconnect());
        },

        testSrpKeyxPass: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
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
                            }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
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
                            }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    var onPing = callbacks.add(function(context, outStr) {});
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testSrpKeyxFail: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
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
                            }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
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
                                        assertEquals(alljoyn.BusError.AUTH_FAIL, status);
                                    })
                            }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    var onPing = callbacks.addErrback(function(context, outStr) {});
                    var onErr = callbacks.add(function(error) {});
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testRsaKeyxPass: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_RSA_KEYX", {
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
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_RSA_KEYX", {
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
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    var onPing = callbacks.add(function(context, outStr) {});
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testMultipleAuthMechanisms: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_RSA_KEYX ALLJOYN_SRP_KEYX", {
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
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
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
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    var onPing = callbacks.add(function(context, outStr) {});
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },
    });
