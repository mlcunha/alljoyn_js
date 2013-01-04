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
    _setUp: ondeviceready(function(callback) {
        otherBus = undefined;
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        otherBus && otherBus.destroy();
        bus.destroy();
    },

    testConstructor: function(queue) {
        assertNotNull(new org.alljoyn.bus.SocketFd(-1));
        assertNotNull(new org.alljoyn.bus.SocketFd("-1"));
    },

    testFd: function(queue) {
        var socket = new org.alljoyn.bus.SocketFd(-1);
        assertEquals("-1", socket.fd);
        assertEquals(-1, socket.fd);
    },

    testClose: function(queue) {
        var socket = new org.alljoyn.bus.SocketFd(-1);
        socket.close();
    },

    testShutdown: function(queue) {
        var socket = new org.alljoyn.bus.SocketFd(-1);
        /* This should be an error since the socket isn't open. */
        assertNotEquals(0, socket.shutdown());
    },

    testSendRecv: function(queue) {
        queue.call(function(callbacks) {
            var SESSION_PORT = 111;
            
            var startSession = function() {
                var connect = function(err) {
                    assertFalsy(err);
                    bus.connect();
                };
                assertEquals(0, bus.bindSessionPort({
                    port: SESSION_PORT,
                    traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE,
                    transport: org.alljoyn.bus.SessionOpts.TRANSPORT_LOCAL,
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
                otherBus = new org.alljoyn.bus.BusAttachment();
                var onJoinSession = callbacks.add(function(id, opts) {
                    var fd = otherBus.getSessionFd(id);
                    var buf = new Array(4);
                    assertEquals(4, fd.recv(buf));
                    assertEquals([1, 2, 3, 4], buf);
                });
                var otherBusConnect = function(err) {
                    assertFalsy(err);
                    otherBus.connect();
                };
                assertEquals(0, otherBus.joinSession({
                    host: bus.uniqueName,
                    port: SESSION_PORT,
                    traffic: org.alljoyn.bus.SessionOpts.TRAFFIC_RAW_RELIABLE
                }, callbacks.add(onJoinSession)));
            };

            startSession();
            joinSession();
        });
    },
});

