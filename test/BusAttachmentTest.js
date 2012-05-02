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
AsyncTestCase("BusAttachmentTest", {
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

        testDisconnectedAttributes: function() {
            assertNull(bus.uniqueName);
            assertNotNull(bus.globalGUIDString);
            assertNotNull(bus.timestamp);
        },

        testConnectedAttributes: function() {
            assertEquals(0, bus.connect());
            assertNotNull(bus.uniqueName);
        },

        testPeerSecurityEnabled: function() {
            assertFalse(bus.peerSecurityEnabled);
            assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX"));
            assertTrue(bus.peerSecurityEnabled);
        },

        testRegisterUnregisterBusObject: function() {
            var busObject = {};
            /*
             * NPAPI doesn't return the "set" object when setting a property.  So this
             *     assertEquals(busObject, bus["/busObject"] = busObject);
             * isn't valid.
             */
            bus["/busObject"] = busObject;
            assertEquals(busObject, bus["/busObject"]);
            bus["/busObject"] = undefined; // delete bus["/busObject"] doesn't work in chrome
            assertUndefined(bus["/busObject"]);
        },

        testConnect: function() {
            assertEquals(0, bus.connect());
            assertEquals(0, bus.disconnect());
        },

        testConstructor: function() {
            assertNotNull(new alljoyn.BusAttachment());
            assertNotNull(new alljoyn.BusAttachment(false));
            assertNotNull(new alljoyn.BusAttachment(true));
        },

        testEnumerate: function() {
            bus['/foo'] = {};
            bus['/foo/bar'] = {};

            var property = {};
            for (var n in bus) {
                property[n] = true;
            }
            assertTrue(property["globalGUIDString"]);
            assertTrue(property["uniqueName"]);
            assertTrue(property["interfaces"]);
            assertTrue(property["proxy"]);
            assertTrue(property["/foo/bar"]);
            assertTrue(property["/foo"]);
            assertTrue(property["connect"]);
            assertTrue(property["disconnect"]);
            assertTrue(property["registerSignalHandler"]);
            assertTrue(property["unregisterSignalHandler"]);

            bus.interfaces["org.sample.Foo"] = {};
            property = {};
            for (var n in bus.interfaces) {
                property[n] = true;
            }
            assertTrue(property["org.alljoyn.Bus"]);
            assertTrue(property["org.alljoyn.Bus.Peer.Authentication"]);
            assertTrue(property["org.alljoyn.Bus.Peer.HeaderCompression"]);
            assertTrue(property["org.freedesktop.DBus"]);
            assertTrue(property["org.freedesktop.DBus.Introspectable"]);
            assertTrue(property["org.freedesktop.DBus.Peer"]);
            assertTrue(property["org.freedesktop.DBus.Properties"]);
            assertTrue(property["org.sample.Foo"]);
        },

        testCreateGetInterfaceDescription: function() {
            var interfaceDescription = {};
            assertEquals(interfaceDescription, bus.interfaces["interface.Description"] = interfaceDescription);
            assertEquals(interfaceDescription, bus.interfaces["interface.Description"]);
        },

        testProxy: function() {
            assertNotNull(bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"]);
        },

        testRegisterUnregisterMultipleSignalHandlers: function(queue) {
            queue.call(function(callbacks) {
                    var onNameOwnerChanged0 = callbacks.add(function(context, name, oldOwner, newOwner) {
                            assertEquals(0, bus.unregisterSignalHandler(onNameOwnerChanged0, "org.freedesktop.DBus.NameOwnerChanged"));
                        });
                    var onNameOwnerChanged1 = callbacks.add(function(context, name, oldOwner, newOwner) {
                            assertEquals(0, bus.unregisterSignalHandler(onNameOwnerChanged1, "org.freedesktop.DBus.NameOwnerChanged"));
                        });
                    assertEquals(0, bus.connect());
                    assertEquals(0, bus.registerSignalHandler(onNameOwnerChanged0, "org.freedesktop.DBus.NameOwnerChanged"));
                    assertEquals(0, bus.registerSignalHandler(onNameOwnerChanged1, "org.freedesktop.DBus.NameOwnerChanged"));
                    
                    /* This will cause a NameOwnerChanged signal to be fired. */
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                });
        },

        testSignalHandler: function(queue) {
            queue.call(function(callbacks) {
                    var onNameOwnerChanged = callbacks.add(function(context, name, oldOwner, newOwner) {
                            assertEquals("NameOwnerChanged", context.memberName);
                        });
                    assertEquals(0, bus.connect());
                    assertEquals(0, bus.registerSignalHandler(onNameOwnerChanged, "org.freedesktop.DBus.NameOwnerChanged"));
                    
                    /* This will cause a NameOwnerChanged signal to be fired. */
                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.connect());
                });
        },

        testSameHandlerDifferentSignals: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.PlayerState"] = {
                        signal: [
                            { name: "PlayerPosition", signature: "uuu", argNames: "x,y,rotation" },
                            { name: "PlayerVelocity", signature: "ii", argNames: "dx,xy" }
                        ]
                    };
                    bus["/game/player"] = {
                        "org.alljoyn.bus.PlayerState": {}
                    };
                    var signal = {};
                    var onPlayer = callbacks.add(function(context) {
                            signal[context.memberName] = true;
                            if (signal.PlayerPosition && signal.PlayerVelocity) {
                                assertTrue(true);
                            }
                        }, 2);
                    assertEquals(0, bus.registerSignalHandler(onPlayer, "org.alljoyn.bus.PlayerState.PlayerPosition"));
                    assertEquals(0, bus.registerSignalHandler(onPlayer, "org.alljoyn.bus.PlayerState.PlayerVelocity"));
                    
                    bus["/game/player"]["org.alljoyn.bus.PlayerState"].PlayerPosition(100, 200, 300);
                    bus["/game/player"]["org.alljoyn.bus.PlayerState"].PlayerVelocity(+30, -40);
                });
        },

        testBroadcastSignal: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.samples.aroundme.chat"] = {
                        signal: [
                            { name: 'Chat', signature: 'ss', argNames: 'sender,text' }
                        ]
                    };
                    bus["/chatService"] = {
                        "org.alljoyn.bus.samples.aroundme.chat": {}
                    };
                    
                    var onChat = callbacks.add(function(context, sender, text) {
                            assertEquals(32, context.flags);
                        });
                    assertEquals(0, bus.registerSignalHandler(onChat, "org.alljoyn.bus.samples.aroundme.chat.Chat"));
                    bus["/chatService"]["org.alljoyn.bus.samples.aroundme.chat"].Chat("sender", "text", { flags: 0x20 });
                });
        },

        testReplaceSignalHandler: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.PlayerState"] = {
                        signal: [
                            { name: "PlayerPosition", signature: "uuu", argNames: "x,y,rotation" },
                        ]
                    };
                    bus["/game/player"] = {
                        "org.alljoyn.bus.PlayerState": {}
                    };
                    var signalled = 0;
                    var onPlayerPosition = callbacks.add(function(context, x, y, rotation) {
                            if (++signalled === 1) {
                                /* Delay to ensure that a second signal doesn't arrive. */
                                setTimeout(completeTest, 250);
                            }
                        });
                    var completeTest = callbacks.add(function() {
                            assertEquals(1, signalled);
                        });
                    assertEquals(0, bus.registerSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition", "/game/player"));
                    assertEquals(0, bus.registerSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition", "/game/player"));
                    
                    bus["/game/player"]["org.alljoyn.bus.PlayerState"].PlayerPosition(100, 200, 300);
                });
        },
        
        testSignalSourcepath: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.PlayerState"] = {
                        signal: [
                            { name: "PlayerPosition", signature: "uuu", argNames: "x,y,rotation" }
                        ]
                    };
                    bus["/game/player0"] = {
                        "org.alljoyn.bus.PlayerState": {}
                    };
                    bus["/game/player1"] = {
                        "org.alljoyn.bus.PlayerState": {}
                    };
                    var onPlayerPosition = callbacks.add(function(context, x, y, rotation) {
                            assertEquals("/game/player0", context.objectPath);
                        });
                    assertEquals(0, bus.registerSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition", "/game/player0"));
                    assertEquals(0, bus.registerSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition", "/game/player1"));
                    
                    assertEquals(0, bus.unregisterSignalHandler(onPlayerPosition, "org.alljoyn.bus.PlayerState.PlayerPosition", "/game/player1"));
                    
                    bus["/game/player0"]["org.alljoyn.bus.PlayerState"].PlayerPosition(100, 200, 300);
                    bus["/game/player1"]["org.alljoyn.bus.PlayerState"].PlayerPosition(400, 500, 600);
                });
        },

        testEnumerateProxyBusObjects: function(queue) {
            var path = {};
            queue.call(function(callbacks) {
                    var onErr = callbacks.addErrback(onError);
                    var onIntrospect = function(proxy) {
                        return callbacks.add(function() {
                                path[proxy.path] = true;
                                for (var child in proxy.children) {
                                    var childProxy = proxy.children[child];
                                    childProxy.introspect(onIntrospect(childProxy), onErr);
                                }
                            });
                    };
                    assertEquals(0, bus.connect());
                    var proxy = bus.proxy[bus.uniqueName + "/"];
                    proxy.introspect(onIntrospect(proxy), onErr);
                });
            queue.call(function(callbacks) {
                    assertTrue(path["/"]);
                    assertTrue(path["/org"]);
                    assertTrue(path["/org/alljoyn"]);
                    assertTrue(path["/org/alljoyn/Bus"]);
                    assertTrue(path["/org/alljoyn/Bus/Peer"]);
                });
        },

    });

