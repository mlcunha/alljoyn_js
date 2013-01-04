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
    _setUp: ondeviceready(function(callback) {
        otherBus = undefined;
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        otherBus && otherBus.destroy();
        bus.destroy();
    },

    testBindUnbind: function(queue) {
        queue.call(function(callbacks) {
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(bindDefaults));
            };
            var bindDefaults = function(err) {
                assertFalsy(err);
                /* Use defaults */
                var sessionOpts = {};
                bus.bindSessionPort(sessionOpts, callbacks.add(unbindDefaults));
            };
            var unbindDefaults = function(err, port) {
                assertFalsy(err);
                bus.unbindSessionPort(port, callbacks.add(bind));
            };
            var bind = function(err) {
                assertFalsy(err);
                /* Specify parameters */
                var sessionOpts = { port: 0,
                                    traffic: 1, 
                                    isMultipoint: false,
                                    proximity: 0xff,
                                    transports: 0xffff };
                bus.bindSessionPort(sessionOpts, callbacks.add(unbind));
            };
            var unbind = function(err, port) {
                assertFalsy(err);
                bus.unbindSessionPort(port, callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(connect));
        });
    },

    testJoinAcceptJoinedLeaveLost: function(queue) {
        queue.call(function(callbacks) {
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(otherBusBind));
            };
            var otherBusBind = function(err) {
                var onAccept = function(port, joiner, opts) {
                    return true;
                };
                var onJoined = function(port, id, joiner) {
                    /* There is a joiner, so no need to be bound anymore. */
                    var setSessionListener = function(err) {
                        otherBus.setSessionListener(id, { onLost: callbacks.add(function(id) {}) }, callbacks.add(leaveSession));
                    };
                    var leaveSession = function(err) {
                        bus.leaveSession(id, callbacks.add(function(err) { assertFalsy(err); }));
                    };
                    otherBus.unbindSessionPort(port, callbacks.add(setSessionListener));
                };
                var sessionOpts = { onAccept: callbacks.add(onAccept),
                                    onJoined: callbacks.add(onJoined) };
                otherBus.bindSessionPort(sessionOpts, callbacks.add(connect));
            };
            var port;
            var connect = function(err, sessionPort) {
                assertFalsy(err);
                port = sessionPort;
                bus.connect(callbacks.add(joinSession));
            };
            var joinSession = function(err) {
                assertFalsy(err);
                bus.joinSession({ host: otherBus.uniqueName,
                                  port: port }, 
                                callbacks.add(onJoinSession));
            };
            var onJoinSession = function(err, id, opts) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(otherBusCreate));
        });
    },

    testSetLinkTimeout: function(queue) {
        queue.call(function(callbacks) {
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(bindSessionPort));
            };
            var bindSessionPort = function(err) {
                var onAccept = function(port, joiner, opts) {
                    return true;
                };
                var onJoined = function(port, id, joiner) {
                    /* There is a joiner, so no need to be bound anymore. */
                    otherBus.unbindSessionPort(port, callbacks.add(function(err) { assertFalsy(err); }));
                };
                var onLost = function(id) {
                };
                var sessionOpts = { onAccept: callbacks.add(onAccept),
                                    onJoined: callbacks.add(onJoined),
                                    onLost: callbacks.add(onLost) };
                otherBus.bindSessionPort(sessionOpts, callbacks.add(connect));
            };
            var port;
            var connect = function(err, sessionPort) {
                assertFalsy(err);
                port = sessionPort;
                bus.connect(callbacks.add(joinSession));
            };
            var joinSession = function(err) {
                assertFalsy(err);
                bus.joinSession({ host: otherBus.uniqueName,
                                  port: port }, callbacks.add(onJoinSession));
            };
            var id;
            var onJoinSession = function(err, sessionId, opts) {
                assertFalsy(err);
                id = sessionId;
                bus.setLinkTimeout(id, 10, callbacks.add(leaveSession));
            };
            var leaveSession = function(err, timeout) {
                assertFalsy(err);
                assertEquals(10, timeout);
                bus.leaveSession(id, callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(otherBusCreate));
        });
    },

    testJoinerMemberAddedRemoved: function(queue) {
        queue.call(function(callbacks) {
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(bindSessionPort));
            };
            var onAccept = function(port, joiner, opts) {
                return true;
            };
            var onJoined = function(port, id, joiner) {
                /* There is a joiner, so no need to be bound anymore. */
                otherBus.unbindSessionPort(port, callbacks.add(function(err) { assertFalsy(err); }));
            };
            var bindSessionPort = function(err) {
                assertFalsy(err);
                var sessionOpts = { isMultipoint: true, 
                                    onAccept: callbacks.add(onAccept),
                                    onJoined: callbacks.add(onJoined) };
                otherBus.bindSessionPort(sessionOpts, callbacks.add(connect));
            };
            var port;
            var connect = function(err, sessionPort) {
                assertFalsy(err);
                port = sessionPort;
                bus.connect(callbacks.add(joinSession));
            };
            var onMemberAdded = function(id, uniqueName) {
                otherBus.leaveSession(id, callbacks.add(function(err) { assertFalsy(err); }));
            };
            var onMemberRemoved = function(id, uniqueName) {
            };
            var joinSession = function(err) {
                assertFalsy(err);
                bus.joinSession({ host: otherBus.uniqueName,
                                  port: port,
                                  onMemberAdded: callbacks.add(onMemberAdded),
                                  onMemberRemoved: callbacks.add(onMemberRemoved) }, callbacks.add(onJoinSession));
            };
            var onJoinSession = function(err, id, opts) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(otherBusCreate));
        });
    },

    testBinderMemberAddedRemoved: function(queue) {
        queue.call(function(callbacks) {
            var otherBusCreate = function(err) {
                assertFalsy(err);
                otherBus = new org.alljoyn.bus.BusAttachment();
                otherBus.create(false, callbacks.add(otherBusConnect));
            };
            var otherBusConnect = function(err) {
                assertFalsy(err);
                otherBus.connect(callbacks.add(bindSessionPort));
            };
            var onAccept = function(port, joiner, opts) {
                return true;
            };
            var onJoined = function(port, id, joiner) {
            };
            var onMemberAdded = function(id, uniqueName) {
            };
            var onMemberRemoved = function(id, uniqueName) {
            };
            var bindSessionPort = function(err) {
                assertFalsy(err);
                var sessionOpts = { isMultipoint: true, 
                                    onAccept: callbacks.add(onAccept),
                                    onJoined: callbacks.add(onJoined),
                                    onMemberAdded: callbacks.add(onMemberAdded),
                                    onMemberRemoved: callbacks.add(onMemberRemoved) };
                otherBus.bindSessionPort(sessionOpts, callbacks.add(connect));
            };
            var port;
            var connect = function(err, sessionPort) {
                assertFalsy(err);
                port = sessionPort;
                bus.connect(callbacks.add(joinSession));
            };
            var joinSession = function(err) {
                assertFalsy(err);
                bus.joinSession({ host: otherBus.uniqueName,
                                  port: port }, callbacks.add(onJoinSession));
            };
            var onJoinSession = function(err, id, opts) {
                assertFalsy(err);
                bus.leaveSession(id, callbacks.add(function(err) { assertFalsy(err); }));
            };
            this._setUp(callbacks.add(otherBusCreate));
        });
    },

});
