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
AsyncTestCase("ProxyBusObjectTest", {
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

        /* 
         * Test that bus.proxy["/foo"].children["bar"] is the same as bus.proxy["/foo/bar"]. 
         */
        /*
         * NOTE: This test is disabled.  The underlying C++ code does not implement this
         * functionality, so I am ignoring implementing it in JavaScript.
         */
        disabled_testChildObjectIsSameAs: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());

                    /* Get a couple references to un-introspected objects. */
                    var x = bus.proxy["org.freedesktop.DBus/org/freedesktop"];
                    var a = bus.proxy["org.freedesktop.DBus/org"];

                    var onIntrospect = callbacks.add(function() {
                            /* 
                             * Compare that the previously un-introspected object is the same as the
                             * introspected one. 
                             */
                            var b = a.children["freedesktop"];
                            assertSame(x, b); // TODO This doesn't work in chrome.
                                              // I've verified that I'm returning the same NPObject*.

                            /*
                             * Compare that getting the object again via bus.proxy returns the
                             * introspected one.
                             */
                            x = bus.proxy["org.freedesktop.DBus/org/freedesktop"];
                            assertSame(x, b); // TODO This doesn't work in chrome
                                              // I've verified that I'm returning the same NPObject*.
                        });
                    a.introspect(onIntrospect, callbacks.addErrback(onError));
                });
        },

        testEnumerate: function(queue) {
            queue.call(function(callbacks) {
                    var proxy = bus.proxy["org.alljoyn.Bus/org/alljoyn/Bus"];
                    assertEquals(0, bus.connect());

                    var actual = {};
                    for (var n in proxy) {
                        actual[n] = true;
                    }
                    assertTrue(actual["children"]);
                    assertTrue(actual["serviceName"]);
                    assertTrue(actual["path"]);
                    assertTrue(actual["org.freedesktop.DBus.Peer"]);
                    assertTrue(actual["introspect"]);
                    assertTrue(actual["parseXML"]);
                    
                    actual = {};
                    for (var n in proxy.children) {
                        actual[n] = true;
                    }
                    
                    actual = {};
                    for (var n in proxy['org.freedesktop.DBus.Peer']) {
                        actual[n] = true;
                    }
                    assertTrue(actual["GetMachineId"]);
                    assertTrue(actual["Ping"]);

                    actual = {};
                    for (var n in proxy['org.freedesktop.DBus.Peer'].GetMachineId) {
                        actual[n] = true;
                    }

                    var onIntrospect = callbacks.add(function() {
                            var actual = {};
                            for (var n in proxy) {
                                actual[n] = true;
                            }
                            assertTrue(actual["children"]);
                            assertTrue(actual["serviceName"]);
                            assertTrue(actual["path"]);
                            assertTrue(actual["org.alljoyn.Bus"]);
                            assertTrue(actual["org.freedesktop.DBus.Introspectable"]);
                            assertTrue(actual["org.freedesktop.DBus.Peer"]);
                            assertTrue(actual["introspect"]);
                            assertTrue(actual["parseXML"]);
                    
                            actual = {};
                            for (var n in proxy.children) {
                                actual[n] = true;
                            }
                            assertTrue(actual["Peer"]);
                    
                            actual = {};
                            for (var n in proxy['org.freedesktop.DBus.Peer']) {
                                actual[n] = true;
                            }
                            assertTrue(actual["GetMachineId"]);
                            assertTrue(actual["Ping"]);
                    
                            actual = {};
                            for (var n in proxy['org.freedesktop.DBus.Peer'].GetMachineId) {
                                actual[n] = true;
                            }
                        });    
                    proxy.introspect(onIntrospect, callbacks.addErrback(onError));
                });
        },

        testGetProxyInterface: function(queue) {
            queue.call(function(callbacks) {
                    var proxy = bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    assertEquals(0, bus.connect());
                    var onListNames = callbacks.add(function(context, names) {});
                    proxy["org.freedesktop.DBus"].ListNames(onListNames, callbacks.addErrback(onError));
                });
        },

        testAnnotations: function(queue) {
            queue.call(function(callbacks) {
                    otherBus = new alljoyn.BusAttachment();
                    otherBus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr', 
                              'org.freedesktop.DBus.Deprecated': true }
                        ]
                    };
                    otherBus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {}
                    };
                    assertEquals(0, otherBus.connect());

                    assertEquals(0, bus.connect());
                    var onIntrospect = callbacks.add(function() {
                            var intf = bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"];
                            assertEquals("true", intf.method[0]["org.freedesktop.DBus.Deprecated"]);
                        });
                    var proxy = bus.proxy[otherBus.uniqueName + "/testobject"];
                    proxy.introspect(onIntrospect, callbacks.addErrback(onError));
                });
        },

        testIntrospection: function(queue) {
            queue.call(function(callbacks) {
                    var proxy = bus.proxy["org.alljoyn.Bus/org/alljoyn/Bus"];
                    assertNull(proxy.children);
                    assertEquals(0, bus.connect());
                    var onIntrospect = callbacks.add(function() {
                            var actual = {};
                            for (var name in proxy) {
                                actual[name] = proxy[name];
                            }
                            /*
                             * Chrome and Firefox both return an Object for the proxy
                             * interfaces.  Android returns a Function.
                             */
                            assertNotNull(actual["org.alljoyn.Bus"]);
                            assertNotNull(actual["org.freedesktop.DBus.Introspectable"]);
                            assertNotNull(actual["org.freedesktop.DBus.Peer"]);

                            actual = {};
                            for (var child in proxy.children) {
                                actual[child] = proxy.children[child];
                            }
                            assertNotNull(actual["Peer"]);
                       });
                    proxy.introspect(onIntrospect, callbacks.addErrback(onError));
                });
        },

        testParseIntrospection: function() {
            var xml = 
                '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"' +
                '"http://standards.freedesktop.org/dbus/introspect-1.0.dtd">' +
                '<node>' +
                '  <interface name="test.Interface">' +
                '    <method name="method1">' +
                '      <arg name="in" type="s" direction="in"/>' +
                '      <arg name="out" type="s" direction="out"/>' +
                '    </method>' +
                '    <method name="method2">' +
                '      <arg type="s" direction="in"/>' +
                '      <arg type="s" direction="out"/>' +
                '    </method>' +
                '    <method name="method3">' +
                '      <arg type="s" direction="in"/>' +
                '    </method>' +
                '    <method name="method4">' +
                '    </method>' +
                '    <signal name="signal1">' +
                '      <arg name="in" type="s" direction="in"/>' +
                '    </signal>' +
                '    <signal name="signal2">' +
                '      <arg type="s" direction="in"/>' +
                '    </signal>' +
                '    <signal name="signal3">' +
                '    </signal>' +
                '    <property name="prop1" type="s" access="readwrite"/>' +
                '    <property name="prop2" type="s" access="read"/>' +
                '    <property name="prop3" type="s" access="write"/>' +
                '  </interface>' +
                '  <interface name="org.freedesktop.DBus.Properties">' +
                '    <method name="Get">' +
                '      <arg name="interface" type="s" direction="in"/>' +
                '      <arg name="propname" type="s" direction="in"/>' +
                '      <arg name="value" type="v" direction="out"/>' +
                '    </method>' +
                '    <method name="GetAll">' +
                '      <arg name="interface" type="s" direction="in"/>' +
                '      <arg name="props" type="a{sv}" direction="out"/>' +
                '    </method>' +
                '    <method name="Set">' +
                '      <arg name="interface" type="s" direction="in"/>' +
                '      <arg name="propname" type="s" direction="in"/>' +
                '      <arg name="value" type="v" direction="in"/>' +
                '    </method>' +
                '  </interface>' +
                '  <interface name="org.freedesktop.DBus.Introspectable">' +
                '    <method name="Introspect">' +
                '      <arg name="data" type="s" direction="out"/>' +
                '    </method>' +
                '  </interface>' +
                '</node>';
            assertEquals(0, bus.connect());
            var proxy = bus.proxy[bus.uniqueName + "/busObject"];
            assertEquals(0, proxy.parseXML(xml));
            assertNotNull(proxy["test.Interface"]);
        },

        testPath: function() {
            var proxy = bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
            assertEquals("/org/freedesktop/DBus", proxy.path);
            assertEquals("org.freedesktop.DBus", proxy.serviceName);
        },

        testSecureConnection: function(queue) {
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
                    assertEquals(0, bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                                             credentials.password = "123456";
                                                             return true;
                                                         }),
                                onComplete: callbacks.add(function(authMechanism, peerName, success) {
                                        assertTrue(success);
                                    })
                                }));
                    bus.clearKeyStore();
                    assertEquals(0, bus.connect());

                    otherBus = new alljoyn.BusAttachment();
                    assertEquals(0, otherBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, peerName, authCount, 
                                                                  userName, credMask, credentials) {
                                                             credentials.password = "123456";
                                                             return true;
                                                         }),
                                    onComplete: callbacks.add(function(authMechanism, peerName, success) {
                                            assertTrue(success);
                                    })
                                }));
                    otherBus.clearKeyStore();
                    assertEquals(0, otherBus.connect());

                    assertEquals(0, otherBus.proxy[bus.uniqueName + "/test"].secureConnection());
                });
        }
    });

