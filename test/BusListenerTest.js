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
AsyncTestCase("BusListenerTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, bus.disconnect());
        },

        testRegisteredUnregistered: function(queue) {
            queue.call(function(callbacks) {
                    var busListener = {
                        onRegistered: callbacks.add(function(busAttachment) {
                                //assertSame(bus, busAttachment); // TODO This doesn't work in chrome.
                                bus.unregisterBusListener(busListener);
                            }),
                        onUnregistered: callbacks.add(function() {
                            })
                    };
                    bus.registerBusListener(busListener);
                });
        },

        testStoppingDisconnected: function(queue) {
            queue.call(function(callbacks) {
                    var busListener = {
                        onStopping: callbacks.add(function() {
                            }),
                        onDisconnected: callbacks.add(function() {
                            })
                    };
                    bus.registerBusListener(busListener);
                    assertEquals(0, bus.connect());
                    assertEquals(0, bus.disconnect());
                });
        },

        testFoundLostAdvertisedName: function(queue) {
            queue.call(function(callbacks) {
                    var busListener = {
                        onFoundAdvertisedName: callbacks.add(function(name, transport, namePrefix) {
                                assertEquals("org.alljoyn.testName", name);
                                assertEquals(1, transport);
                                assertEquals("org.alljoyn.testName", namePrefix);
                                assertEquals(0, bus.cancelAdvertiseName("org.alljoyn.testName", 0xffff));
                            }),
                        onLostAdvertisedName: callbacks.add(function(name, transport, namePrefix) {
                                assertEquals("org.alljoyn.testName", name);
                                assertEquals(1, transport);
                                assertEquals("org.alljoyn.testName", namePrefix);
                                assertEquals(0, bus.releaseName("org.alljoyn.testName"));
                            })
                    };
                    bus.registerBusListener(busListener);
                    assertEquals(0, bus.connect());
                    assertEquals(0, bus.requestName("org.alljoyn.testName", 0));
                    assertEquals(0, bus.advertiseName("org.alljoyn.testName", 0xffff));
                    assertEquals(0, bus.findAdvertisedName("org.alljoyn.testName"));
                });
        },

        testNameOwnerChanged: function(queue) {
            queue.call(function(callbacks) {
                    var busListener = {
                        onNameOwnerChanged: callbacks.add(function(busName, previousOwner, newOwner) {
                                assertEquals("org.alljoyn.bus.BusListenerTest", busName);
                            }),
                    };
                    bus.registerBusListener(busListener);
                    assertEquals(0, bus.connect());

                    /* Trigger the onNameOwnerChanged callback by requesting a well-known name. */
                    var onRequestName = callbacks.add(function(context, result) {
                            assertEquals(1, result);
                        });
                    var dbus = bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    dbus["org.freedesktop.DBus"].RequestName(onRequestName, callbacks.addErrback(onError), 
                                                             "org.alljoyn.bus.BusListenerTest", 0);
                });
        },
    });
