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
AsyncTestCase("SocketFdTest", {
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

        testConstructor: function() {
            assertNotNull(new alljoyn.SocketFd(-1));
            assertNotNull(new alljoyn.SocketFd("-1"));
        },

        testFd: function() {
            var socket = new alljoyn.SocketFd(-1);
            assertEquals("-1", socket.fd);
            assertEquals(-1, socket.fd);
        },

        testClose: function() {
            var socket = new alljoyn.SocketFd(-1);
            socket.close();
        },

        testShutdown: function() {
            var socket = new alljoyn.SocketFd(-1);
            /* This should be an error since the socket isn't open. */
            assertNotEquals(0, socket.shutdown());
        },

        testSendRecv: function(queue) {
            queue.call(function(callbacks) {
                    var SESSION_PORT = 111;
                    
                    var startSession = function() {
                        assertEquals(0, bus.connect());
                        assertEquals(0, bus.bindSessionPort({
                                    port: SESSION_PORT,
                                    traffic: alljoyn.SessionOpts.TRAFFIC_RAW_RELIABLE,
                                    transport: alljoyn.SessionOpts.TRANSPORT_LOCAL,
                                    onAccept: function(port, joiner, opts) { 
                                        return true; 
                                    },
                                    onJoined: callbacks.add(function(port, id, opts) {
                                        var fd = bus.getSessionFd(id);
                                        assertEquals(4, fd.send([1, 2, 3, 4]));
                                    })
                                }));
                    };

                    var joinSession = function() {
                        otherBus = new alljoyn.BusAttachment();
                        var onJoinSession = callbacks.add(function(id, opts) {
                            var fd = otherBus.getSessionFd(id);
                            var buf = new Array(4);
                            assertEquals(4, fd.recv(buf));
                            assertEquals([1, 2, 3, 4], buf);
                        });
                        assertEquals(0, otherBus.connect());
                        assertEquals(0, otherBus.joinSession(onJoinSession, callbacks.addErrback(onError), {
                                    host: bus.uniqueName,
                                    port: SESSION_PORT,
                                    traffic: alljoyn.SessionOpts.TRAFFIC_RAW_RELIABLE
                                }));
                    };

                    startSession();
                    joinSession();
                });
        },
    });

