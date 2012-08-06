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
AsyncTestCase("InterfaceDescriptionTest", {
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

        testRegisterIntrospect: function(queue) {
            var expectedXML = 
                '<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN"\n' +
                '"http://standards.freedesktop.org/dbus/introspect-1.0.dtd">\n' +
                '<node>\n' +
                '  <interface name="test.Interface">\n' +
                '    <method name="method1">\n' +
                '      <arg name="in" type="s" direction="in"/>\n' +
                '      <arg name="out" type="s" direction="out"/>\n' +
                '    </method>\n' +
                '    <method name="method2">\n' +
                '      <arg type="s" direction="in"/>\n' +
                '      <arg type="s" direction="out"/>\n' +
                '    </method>\n' +
                '    <method name="method3">\n' +
                '      <arg type="s" direction="in"/>\n' +
                '    </method>\n' +
                '    <method name="method4">\n' +
                '    </method>\n' +
                '    <method name="method5">\n' +
                '      <annotation name="org.freedesktop.DBus.Deprecated" value="true"/>\n' +
                '    </method>\n' +
                '    <method name="method6">\n' +
                '      <annotation name="org.freedesktop.DBus.Method.NoReply" value="true"/>\n' +
                '    </method>\n' +
                '    <method name="method7">\n' +
                '      <annotation name="org.test" value="1"/>\n' +
                '    </method>\n' +
                '    <signal name="signal1">\n' +
                '      <arg name="in" type="s" direction="out"/>\n' +
                '    </signal>\n' +
                '    <signal name="signal2">\n' +
                '      <arg type="s" direction="out"/>\n' +
                '    </signal>\n' +
                '    <signal name="signal3">\n' +
                '    </signal>\n' +
                '    <signal name="signal4">\n' +
                '      <annotation name="org.freedesktop.DBus.Deprecated" value="true"/>\n' +
                '    </signal>\n' +
                '    <signal name="signal5">\n' +
                '      <annotation name="org.test" value="1.2"/>\n' +
                '    </signal>\n' +
                '    <property name="prop1" type="s" access="readwrite"/>\n' +
                '    <property name="prop2" type="s" access="read"/>\n' +
                '    <property name="prop3" type="s" access="write"/>\n' +
                '    <property name="prop4" type="s" access="readwrite">\n' +
                '      <annotation name="org.test" value="test"/>\n' +
                '    </property>\n' +
                '  </interface>\n' +
                '  <interface name="org.freedesktop.DBus.Properties">\n' +
                '    <method name="Get">\n' +
                '      <arg name="interface" type="s" direction="in"/>\n' +
                '      <arg name="propname" type="s" direction="in"/>\n' +
                '      <arg name="value" type="v" direction="out"/>\n' +
                '    </method>\n' +
                '    <method name="GetAll">\n' +
                '      <arg name="interface" type="s" direction="in"/>\n' +
                '      <arg name="props" type="a{sv}" direction="out"/>\n' +
                '    </method>\n' +
                '    <method name="Set">\n' +
                '      <arg name="interface" type="s" direction="in"/>\n' +
                '      <arg name="propname" type="s" direction="in"/>\n' +
                '      <arg name="value" type="v" direction="in"/>\n' +
                '    </method>\n' +
                '  </interface>\n' +
                '  <interface name="org.freedesktop.DBus.Introspectable">\n' +
                '    <method name="Introspect">\n' +
                '      <arg name="data" type="s" direction="out"/>\n' +
                '    </method>\n' +
                '  </interface>\n' +
                '</node>\n';
            queue.call(function(callbacks) {
                    bus.interfaces["test.Interface"] = {
                        method: [
                            { name: "method1", signature: "s", returnSignature: "s", argNames: "in,out" },
                            { name: "method2", signature: "s", returnSignature: "s" },
                            { name: "method3", signature: "s", },
                            { name: "method4" },
                            { name: "method5", "org.freedesktop.DBus.Deprecated": true },
                            { name: "method6", "org.freedesktop.DBus.Method.NoReply": true },
                            { name: "method7", "org.test": 1 }
                        ],
                        signal: [
                            { name: "signal1", signature: "s", argNames: "in" },
                            { name: "signal2", signature: "s" },
                            { name: "signal3" },
                            { name: "signal4", "org.freedesktop.DBus.Deprecated": true },
                            { name: "signal5", "org.test": 1.2 }
                        ],
                        property: [
                            { name: "prop1", signature: "s", access: "readwrite" },
                            { name: "prop2", signature: "s", access: "read" },
                            { name: "prop3", signature: "s", access: "write" },
                            { name: "prop4", signature: "s", access: "readwrite", "org.test": "test" }
                        ]
                    };
                    bus["/busObject"] = {
                        "test.Interface": {}
                    };
                    assertEquals(0, bus.connect());

                    var proxy = bus.proxy[bus.uniqueName + "/busObject"];
                    var onErr = callbacks.addErrback(onError);
                    var onIntrospect = callbacks.add(function(context, xml) { 
                            assertEquals(expectedXML, xml);
                        });
                    proxy["org.freedesktop.DBus.Introspectable"].Introspect(onIntrospect, onErr);
                });
        },

        testParseXML: function() {
            var xml = 
                '<node>\n' +
                '  <interface name="test.Interface">\n' +
                '    <method name="method1">\n' +
                '      <arg name="in" type="s" direction="in"/>\n' +
                '      <arg name="out" type="s" direction="out"/>\n' +
                '      <annotation name="org.freedesktop.DBus.Deprecated" value="true"/>\n' +
                '      <annotation name="org.freedesktop.DBus.Method.NoReply" value="true"/>\n' +
                '      <annotation name="org.test" value="1"/>\n' +
                '    </method>\n' +
                '    <signal name="signal1">\n' +
                '      <arg name="in" type="s" direction="out"/>\n' +
                '      <annotation name="org.freedesktop.DBus.Deprecated" value="true"/>\n' +
                '      <annotation name="org.test" value="1.2"/>\n' +
                '    </signal>\n' +
                '    <property name="prop1" type="s" access="readwrite">\n' +
                '      <annotation name="org.test" value="test"/>\n' +
                '    </property>\n' +
                '  </interface>\n' +
                '  <interface name="org.freedesktop.DBus.Introspectable">\n' +
                '    <method name="Introspect">\n' +
                '      <arg name="data" type="s" direction="out"/>\n' +
                '    </method>\n' +
                '  </interface>\n' +
                '</node>\n';
            assertEquals(0, bus.interfaces.parseXML(xml));
            var intf = bus.interfaces["test.Interface"];

            console.log(intf);

            assertEquals("method1", intf.method[0].name);
            assertEquals("s", intf.method[0].signature);
            assertEquals("s", intf.method[0].returnSignature);
            assertEquals("in,out", intf.method[0].argNames);
            assertEquals("true", intf.method[0]["org.freedesktop.DBus.Deprecated"]);
            assertEquals("true", intf.method[0]["org.freedesktop.DBus.Method.NoReply"]);
            assertEquals("1", intf.method[0]["org.test"]);

            assertEquals("signal1", intf.signal[0].name);
            assertEquals("s", intf.signal[0].signature);
            assertEquals("in", intf.signal[0].argNames);
            assertEquals("true", intf.signal[0]["org.freedesktop.DBus.Deprecated"]);
            assertEquals("1.2", intf.signal[0]["org.test"]);

            assertEquals("prop1", intf.property[0].name);
            assertEquals("s", intf.property[0].signature);
            assertEquals("readwrite", intf.property[0].access);
            assertEquals("test", intf.property[0]["org.test"]);
        },
    });

