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
AsyncTestCase("MessageTest", {
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

        testMessage: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    otherBus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    otherBus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { 
                                assertFalse(context.isUnreliable);
                                assertUndefined(context.authMechanism);
                                assertEquals("s", context.signature);
                                assertEquals("/testobject", context.objectPath);
                                assertEquals("org.alljoyn.bus.samples.simple.SimpleInterface", context.interfaceName);
                                assertEquals("Ping", context.memberName);
                                assertEquals(bus.uniqueName, context.sender);
                                assertEquals(otherBus.uniqueName, context.destination);
                                assertEquals(0, context.sessionId);
                                assertNotNull(otherBus.timestamp);
                                assertEquals(0, context.reply(inStr));
                            }
                        }
                    };
                    assertEquals(0, otherBus.connect());

                    bus = new alljoyn.BusAttachment();
                    assertEquals(0, bus.connect());
                    var onErr = callbacks.addErrback(onError);
                    var onPing = callbacks.add(function(context, outStr) {
                            assertFalse(context.isUnreliable);
                            assertUndefined(context.authMechanism);
                            assertEquals("s", context.signature);
                            assertUndefined(context.objectPath);
                            assertUndefined(context.interfaceName);
                            assertUndefined(context.memberName);
                            assertEquals(otherBus.uniqueName, context.sender);
                            assertEquals(bus.uniqueName, context.destination);
                            assertEquals(0, context.sessionId);
                            assertNotNull(bus.timestamp);
                        });
                    var testobject = bus.proxy[otherBus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testReplyError: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    otherBus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'PingError', signature: 's', returnSignature: 's' },
                            { name: 'PingStatus', signature: 's', returnSignature: 's' }
                        ]
                    };
                    var errorMessage = "Sample error";
                    otherBus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            PingError: function(context, inStr) { 
                                if (errorMessage) {
                                    assertEquals(0, context.replyError("org.alljoyn.bus.samples.simple.Error", errorMessage));
                                } else {
                                    assertEquals(0, context.replyError("org.alljoyn.bus.samples.simple.Error"));
                                }
                            },
                            PingStatus: function(context, inStr) {
                                assertEquals(0, context.replyError(1));
                            }
                        }
                    };
                    assertEquals(0, otherBus.connect());

                    assertEquals(0, bus.connect());
                    var onPing = callbacks.addErrback('Ping reply callback should not have been called');
                    var onPingError = callbacks.add(function(error) {
                            assertEquals("org.alljoyn.bus.samples.simple.Error", error.name);
                            if (errorMessage) {
                                assertEquals(errorMessage, error.message);
                                errorMessage = undefined;
                                testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].PingError(onPing, onPingError, "hello");
                            } else {
                                assertEquals("", error.message);
                                testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].PingStatus(onPing, onPingStatus, "hello");
                            }
                        }, 2);
                    var onPingStatus = callbacks.add(function(error) {
                            assertEquals(1, error.code);
                        });
                    var testobject = bus.proxy[otherBus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].PingError(onPing, onPingError, "hello");
                });            
        },
    });

