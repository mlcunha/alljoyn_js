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
AsyncTestCase("KeyStoreTest", {
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

        testReloadKeyStore: function() {
            assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX"));
            assertEquals(0, bus.reloadKeyStore());
        },

        testClearKeys: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        return true;
                                    })
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());
                    
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        return true;
                                    })
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());
                    
                    var onPing = callbacks.add(function(context, outStr) {
                            var guid = otherBus.getPeerGUID(bus.uniqueName);
                            assertEquals(0, otherBus.clearKeys(guid));
                        });
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testSetGetKeyExpiration: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        return true;
                                    })
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());
                    
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        return true;
                                    })
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());
                    
                    var onPing = callbacks.add(function(context, outStr) {
                            var guid = otherBus.getPeerGUID(bus.uniqueName);
                            assertEquals(0, otherBus.setKeyExpiration(guid, 100));
                            assertEquals(100, otherBus.getKeyExpiration(guid));
                        });
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testCredentialsExpiration: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        assertUndefined(credentials.expiration);
                                        credentials.expiration = 100;
                                        assertEquals(100, credentials.expiration);
                                        return true;
                                    })
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());
                    
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        credentials.password = "123456";
                                        assertUndefined(credentials.expiration);
                                        return true;
                                    })
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());
                    
                    var onPing = callbacks.add(function(context, outStr) {
                            var guid = otherBus.getPeerGUID(bus.uniqueName);
                            assertEquals(100, otherBus.getKeyExpiration(guid));
                        });
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },

        testAddLogonEntry: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_LOGON"));
                    bus.clearKeyStore();
                    assertEquals(0, bus.addLogonEntry("ALLJOYN_SRP_LOGON", "userName", "password"));
                    assertEquals(0, bus.connect());
                    
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_LOGON", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                        assertEquals((credentials.PASSWORD | credentials.USER_NAME), credMask);
                                        credentials.userName = "userName";
                                        credentials.password = "password";
                                        return true;
                                    })
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());
                    
                    var onPing = callbacks.add(function(context, outStr) {});
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },
    });
