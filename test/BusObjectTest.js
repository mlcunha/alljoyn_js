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
AsyncTestCase("BusObjectTest", {
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

        testMethodNotImplemented: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            /* Doesn't implement Ping. */
                        }
                    };
                    
                    var onErr = callbacks.add(function(error) {
                            assertEquals('org.alljoyn.Bus.ErStatus', error.name);
                            assertEquals('ER_BUS_OBJECT_NO_SUCH_MEMBER', error.message);
                            assertEquals(error.BUS_OBJECT_NO_SUCH_MEMBER, error.code);
                        });
                    var onPing = callbacks.addErrback('Ping reply callback should not have been called');
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },

        testRegisterUnregisterCallbacks: function(queue) {
            queue.call(function(callbacks) {
                    bus["/busObject"] = {
                        onRegistered: callbacks.add(function() {
                            bus["/busObject"] = undefined; // delete bus["/busObject"] doesn't work in chrome
                        }),
                        onUnregistered: callbacks.add(function() {})
                    };
                    assertEquals(0, bus.connect());
                });
        },

        testToXMLCallback: function(queue) {
            queue.call(function(callbacks) {
                    var expectedCustomXML = 
                        '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"\n' +
                        '"http://standards.freedesktop.org/dbus/introspect-1.0.dtd">\n' +
                        '<node>\n' +
                        '  <interface name="org.alljoyn.bus.samples.simple.SimpleInterface">\n' +
                        '    <method name="Ping">\n' +
                        '      <arg name="inStr" type="s" direction="in"/>\n' +
                        '      <arg name="outStr" type="s" direction="out"/>\n' +
                        '      <annotation name="org.alljoyn.Foo" value="bar"/>\n' +
                        '    </method>\n' +
                        '  </interface>\n' +
                        '  <interface name="org.freedesktop.DBus.Introspectable">\n' +
                        '    <method name="Introspect">\n' +
                        '      <arg name="data" type="s" direction="out"/>\n' +
                        '    </method>\n' +
                        '  </interface>\n' +
                        '</node>\n';
                    var expectedBuiltinXML = 
                        '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"\n' +
                        '"http://standards.freedesktop.org/dbus/introspect-1.0.dtd">\n' +
                        '<node>\n' +
                        '  <interface name="org.alljoyn.bus.samples.simple.SimpleInterface">\n' +
                        '    <method name="Ping">\n' +
                        '      <arg name="inStr" type="s" direction="in"/>\n' +
                        '      <arg name="outStr" type="s" direction="out"/>\n' +
                        '    </method>\n' +
                        '  </interface>\n' +
                        '  <interface name="org.freedesktop.DBus.Introspectable">\n' +
                        '    <method name="Introspect">\n' +
                        '      <arg name="data" type="s" direction="out"/>\n' +
                        '    </method>\n' +
                        '  </interface>\n' +
                        '</node>\n';

                    bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) { assertEquals(0, context.reply(inStr)); }
                        },
                        toXML: function(deep, indent) {
                            var sp = '                '.slice(-indent);
                            return sp + '<interface name="org.alljoyn.bus.samples.simple.SimpleInterface">\n' +
                                   sp + '  <method name="Ping">\n' +
                                   sp + '    <arg name="inStr" type="s" direction="in"/>\n' +
                                   sp + '    <arg name="outStr" type="s" direction="out"/>\n' +
                                   sp + '    <annotation name="org.alljoyn.Foo" value="bar"/>\n' +
                                   sp + '  </method>\n' +
                                   sp + '</interface>\n' +
                                   sp + '<interface name="org.freedesktop.DBus.Introspectable">\n' +
                                   sp + '  <method name="Introspect">\n' +
                                   sp + '    <arg name="data" type="s" direction="out"/>\n' +
                                   sp + '  </method>\n' +
                                   sp + '</interface>\n';
                        }
                    };
                    assertEquals(0, bus.connect());

                    var onErr = callbacks.addErrback(onError);
                    var proxy = bus.proxy[bus.uniqueName + "/testobject"];
                    var onIntrospectCustom = callbacks.add(function(context, xml) { 
                            assertEquals(expectedCustomXML, xml);
                            delete bus["/testobject"].toXML;
                            proxy["org.freedesktop.DBus.Introspectable"].Introspect(onIntrospectBuiltin, onErr);
                        });
                    var onIntrospectBuiltin = callbacks.add(function(context, xml) { 
                            assertEquals(expectedBuiltinXML, xml);
                        });
                    proxy["org.freedesktop.DBus.Introspectable"].Introspect(onIntrospectCustom, onErr);
                });
        },

        testDelayedReply: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.samples.simple.SimpleInterface"] = {
                        method: [
                            { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                        ]
                    };
                    bus["/testobject"] = {
                        "org.alljoyn.bus.samples.simple.SimpleInterface": {
                            Ping: function(context, inStr) {
                                window.setTimeout(function() { assertEquals(0, context.reply(inStr)); }, 250);
                            }
                        }
                    };
                    
                    var onErr = callbacks.addErrback(onError);
                    var onPing = callbacks.add(function(context, outStr) {
                            assertEquals("hello", outStr);
                        });
                    var testobject = bus.proxy[bus.uniqueName + "/testobject"];
                    testobject["org.alljoyn.bus.samples.simple.SimpleInterface"].Ping(onPing, onErr, "hello");
                });
        },
    });

