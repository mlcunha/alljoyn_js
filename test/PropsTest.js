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
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testProps: function(queue) {
        queue.call(function(callbacks) {
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(createInterface));
            };
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.PropsInterface",
                    property: [
                        { name: "StringProp", signature: "s", access: "readwrite" },
                        { name: "IntProp", signature: "i", access: "readwrite" }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/testProperties", function() {
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
                }(), callbacks.add(getDbus));
            };
            var getDbus = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject("org.freedesktop.DBus/org/freedesktop/DBus", callbacks.add(requestName));
            };
            var requestName = function(err, dbus) {
                assertFalsy(err);
                dbus.methodCall("org.freedesktop.DBus", "RequestName", "org.alljoyn.bus.samples.props", 0, callbacks.add(onRequestName));
            };
            var onRequestName = function(err, context, result) {
                assertFalsy(err);
                assertEquals(1, result);
                bus.getProxyBusObject("org.alljoyn.bus.samples.props/testProperties", callbacks.add(get));
            };
            var proxy;
            var get = function(err, proxyObj) {
                assertFalsy(err);
                proxy = proxyObj;
                proxy.methodCall("org.freedesktop.DBus.Properties", "Get", "org.alljoyn.bus.PropsInterface", "StringProp", callbacks.add(onGetStringProp));
            };
            var onGetStringProp = function(err, context, value) {
                assertFalsy(err);
                assertEquals("Hello", value);
                proxy.methodCall("org.freedesktop.DBus.Properties", "Set", "org.alljoyn.bus.PropsInterface", "StringProp", { "s": "MyNewValue" }, callbacks.add(onSetStringProp));
            };
            var onSetStringProp = function(err, context) {
                assertFalsy(err);
                proxy.methodCall("org.freedesktop.DBus.Properties", "Get", "org.alljoyn.bus.PropsInterface", "IntProp", callbacks.add(onGetIntProp));
            };
            var onGetIntProp = function(err, context, value) {
                assertFalsy(err);
                assertEquals(6, value);
                proxy.methodCall("org.freedesktop.DBus.Properties", "GetAll", "org.alljoyn.bus.PropsInterface", callbacks.add(onGetAll));
            };
            var onGetAll = function(err, context, values) {
                assertFalsy(err);
                assertEquals("MyNewValue", values.StringProp);
                assertEquals(6, values.IntProp);
            };
            this._setUp(callbacks.add(connect));
        });
    }
});
