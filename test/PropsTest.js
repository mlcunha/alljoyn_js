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
AsyncTestCase("PropsTest", {
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

        testProps: function(queue) {
            queue.call(function(callbacks) {
                    assertEquals(0, bus.connect());
                    bus.interfaces["org.alljoyn.bus.PropsInterface"] = {
                        property: [
                            { name: "StringProp", signature: "s", access: "readwrite" },
                            { name: "IntProp", signature: "i", access: "readwrite" }
                        ]
                    };
                    bus["/testProperties"] = function() {
                        var stringProp = "Hello";
                        var intProp = 6;
                        return {
                            "org.alljoyn.bus.PropsInterface": {
                                get StringProp() { return stringProp; },
                                set StringProp(value) { stringProp = value; },
                                get IntProp() { return intProp; },
                                set IntProp(value) { intProp = value; }
                            }
                        };
                    }();
                    var proxy;
                    var onErr = callbacks.addErrback(onError);
                    var onRequestName = callbacks.add(function(context, result) {
                            assertEquals(1, result);
                            var testProperties = bus.proxy["org.alljoyn.bus.samples.props/testProperties"];
                            proxy = testProperties["org.freedesktop.DBus.Properties"];
                            
                            proxy.Get(onGetStringProp, onErr, "org.alljoyn.bus.PropsInterface", "StringProp");
                        });
                    var onGetStringProp = callbacks.add(function(context, value) {
                            assertEquals("Hello", value);
                            proxy.Set(onSetStringProp, onErr, 
                                      "org.alljoyn.bus.PropsInterface", "StringProp", { "s": "MyNewValue" });
                        });
                    var onSetStringProp = callbacks.add(function(context) {
                            proxy.Get(onGetIntProp, onErr, "org.alljoyn.bus.PropsInterface", "IntProp");
                        });
                    var onGetIntProp = callbacks.add(function(context, value) {
                            assertEquals(6, value);
                            proxy.GetAll(onGetAll, onErr, "org.alljoyn.bus.PropsInterface");
                        });
                    var onGetAll = callbacks.add(function(context, values) {
                            assertEquals("MyNewValue", values.StringProp);
                            assertEquals(6, values.IntProp);
                        });
                    var dbus = bus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    dbus["org.freedesktop.DBus"].RequestName(onRequestName, onErr, 
                                                             "org.alljoyn.bus.samples.props", 0);
                });
        }
    });
