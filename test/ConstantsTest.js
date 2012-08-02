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
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
            otherBus = undefined;
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            if (otherBus) {
                assertEquals(0, otherBus.disconnect());
                otherBus = undefined;
            }
            assertEquals(0, bus.disconnect());
        },

        testBusAttachment: function() {
            assertEquals(1, alljoyn.BusAttachment.DBUS_NAME_FLAG_ALLOW_REPLACEMENT);
            assertEquals(1, bus.DBUS_NAME_FLAG_ALLOW_REPLACEMENT);
        },

        testMessage: function(queue) {
            assertEquals(1, alljoyn.Message.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
            queue.call(function(callbacks) {
                    bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertEquals(1, context.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
                                assertEquals(0, context.reply(inStr));
                            }
                        }
                    };
                    assertEquals(0, bus.connect());

                    var onErr = callbacks.addErrback(onError);
                    var onPing = callbacks.add(function(context, outStr) {
                            assertEquals(1, context.ALLJOYN_FLAG_NO_REPLY_EXPECTED);
                        });
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testSessionOpts: function(queue) {
            assertEquals(1, alljoyn.SessionOpts.TRAFFIC_MESSAGES);
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                    var onAccept = callbacks.add(function(port, joiner, opts) {
                            assertEquals(1, opts.TRAFFIC_MESSAGES);            
                            return true;
                        });
                    var sessionOpts = { onAccept: onAccept };
                    assertEquals(0, otherBus.bindSessionPort(sessionOpts));

                    assertEquals(0, bus.connect());
                    var onJoinSession = callbacks.add(function(id, opts) {
                            assertEquals(1, opts.TRAFFIC_MESSAGES);            
                            assertEquals(0, bus.leaveSession(id));
                        });
                    var onErr = callbacks.addErrback(onError);
                    assertEquals(0, bus.joinSession(onJoinSession, onErr, { host: otherBus.uniqueName,
                                                                            port: sessionOpts.port }));
                });
        },

        testBusError: function(queue) {
            assertEquals(1, alljoyn.BusError.FAIL);
            queue.call(function(callbacks) {
                    bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertEquals(0, context.replyError("org.alljoyn.bus.samples.simple.Error"));
                            }
                        }
                    };
                    assertEquals(0, bus.connect());

                    var onErr = callbacks.add(function(error) {
                            assertEquals(1, error.FAIL);
                        });
                    var onPing = callbacks.addErrback(function(context, outStr) {});
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testCredentials: function(queue) {
            assertEquals(0x0001, alljoyn.Credentials.PASSWORD);
            assertEquals(0x0020, alljoyn.Credentials.EXPIRATION);
            queue.call(function(callbacks) {
                    bus.interfaces["test.SecureInterface"] = {
                        secure: true,
                        method: [ { name: 'Ping', signature: 's', returnSignature: 's' } ]
                    };
                    bus["/test"] = {
                        "test.SecureInterface": {
                            Ping: function(context, inStr) { context.reply(inStr); }
                        }
                    };
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_LOGON", {
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
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_LOGON", {
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
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    var onPing = callbacks.add(function(context, outStr) {});
                    var onErr = callbacks.addErrback(onError);
                    otherBus.proxy[bus.uniqueName + "/test"]["test.SecureInterface"].Ping(onPing, onErr, "pong");
                });
        },
    });

