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
AsyncTestCase("SessionTest", {
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

        testBindUnbind: function() {
            assertEquals(0, bus.connect());
            /* Use defaults */
            var sessionOpts = {}
            assertEquals(0, bus.bindSessionPort(sessionOpts));
            assertEquals(0, bus.unbindSessionPort(sessionOpts.port));
            
            /* Specify parameters */
            sessionOpts = { port: 0,
                            traffic: 1, 
                            isMultipoint: false,
                            proximity: 0xff,
                            transports: 0xffff };
            assertEquals(0, bus.bindSessionPort(sessionOpts));
            assertEquals(0, bus.unbindSessionPort(sessionOpts.port));
        },

        testJoinAcceptJoinedLeaveLost: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                    var onAccept = callbacks.add(function(port, joiner, opts) {
                            return true;
                        });
                    var onJoined = callbacks.add(function(port, id, joiner) {
                            /* There is a joiner, so no need to be bound anymore. */
                            assertEquals(0, otherBus.unbindSessionPort(port));
                            assertEquals(0, otherBus.setSessionListener(id, { onLost: onLost }));
                            assertEquals(0, bus.leaveSession(id));
                        });
                    var onLost = callbacks.add(function(id) {
                        });
                    var sessionOpts = { onAccept: onAccept,
                                        onJoined: onJoined };
                    assertEquals(0, otherBus.bindSessionPort(sessionOpts));

                    assertEquals(0, bus.connect());
                    var onJoinSession = callbacks.add(function(id, opts) {
                        });
                    var onErr = callbacks.addErrback(onError);
                    assertEquals(0, bus.joinSession(onJoinSession, onErr, { host: otherBus.uniqueName,
                                                                            port: sessionOpts.port }));
                });
        },

        testSetLinkTimeout: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                    var onAccept = callbacks.add(function(port, joiner, opts) {
                            return true;
                        });
                    var onJoined = callbacks.add(function(port, id, joiner) {
                            /* There is a joiner, so no need to be bound anymore. */
                            assertEquals(0, otherBus.unbindSessionPort(port));
                            assertEquals(0, otherBus.setSessionListener(id, { onLost: onLost }));
                        });
                    var onLost = callbacks.add(function(id) {
                        });
                    var sessionOpts = { onAccept: onAccept,
                                        onJoined: onJoined };
                    assertEquals(0, otherBus.bindSessionPort(sessionOpts));

                    assertEquals(0, bus.connect());
                    var onJoinSession = callbacks.add(function(id, opts) {
                            assertEquals(10, bus.setLinkTimeout(id, 10));
                            assertEquals(0, bus.leaveSession(id));
                        });
                    var onErr = callbacks.addErrback(onError);
                    assertEquals(0, bus.joinSession(onJoinSession, onErr, { host: otherBus.uniqueName,
                                                                            port: sessionOpts.port }));
                });
        },

        testJoinerMemberAddedRemoved: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                    var onAccept = callbacks.add(function(port, joiner, opts) {
                            return true;
                        });
                    var onJoined = callbacks.add(function(port, id, joiner) {
                            /* There is a joiner, so no need to be bound anymore. */
                            assertEquals(0, otherBus.unbindSessionPort(port));
                        });
                    var sessionOpts = { isMultipoint: true, 
                                        onAccept: onAccept,
                                        onJoined: onJoined };
                    assertEquals(0, otherBus.bindSessionPort(sessionOpts));

                    assertEquals(0, bus.connect());
                    var onJoinSession = callbacks.add(function(id, opts) {
                        });
                    var onMemberAdded = callbacks.add(function(id, uniqueName) {
                        otherBus.leaveSession(id);
                    });
                    var onMemberRemoved = callbacks.add(function(id, uniqueName) {
                    });
                    var onErr = callbacks.addErrback(onError);
                    assertEquals(0, bus.joinSession(onJoinSession, onErr, { host: otherBus.uniqueName,
                                                                            port: sessionOpts.port,
                                                                            onMemberAdded: onMemberAdded,
                                                                            onMemberRemoved: onMemberRemoved }));
                });
        },

        testBinderMemberAddedRemoved: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                    var onAccept = callbacks.add(function(port, joiner, opts) {
                            return true;
                        });
                    var onJoined = callbacks.add(function(port, id, joiner) {
                        });
                    var onMemberAdded = callbacks.add(function(id, uniqueName) {
                    });
                    var onMemberRemoved = callbacks.add(function(id, uniqueName) {
                    });
                    var sessionOpts = { isMultipoint: true, 
                                        onAccept: onAccept,
                                        onJoined: onJoined,
                                        onMemberAdded: onMemberAdded,
                                        onMemberRemoved: onMemberRemoved };
                    assertEquals(0, otherBus.bindSessionPort(sessionOpts));

                    assertEquals(0, bus.connect());
                    var onJoinSession = callbacks.add(function(id, opts) {
                            bus.leaveSession(id);
                        });
                    var onErr = callbacks.addErrback(onError);
                    assertEquals(0, bus.joinSession(onJoinSession, onErr, { host: otherBus.uniqueName,
                                                                            port: sessionOpts.port }));
                });
        },

    });
