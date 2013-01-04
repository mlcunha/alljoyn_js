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
AsyncTestCase("SimpleTest", {
    _setUp: ondeviceready(function(callback) {
        var clientBusCreate = function(err) {
            assertFalsy(err);
            clientBus = new org.alljoyn.bus.BusAttachment();
            clientBus.create(false, callback);
        };
        serviceBus = new org.alljoyn.bus.BusAttachment();
        serviceBus.create(false, clientBusCreate);
    }),
    tearDown: function() {
        clientBus.destroy();
        serviceBus.destroy();
    },

    testSimple: function(queue) {
        queue.call(function(callbacks) {
            /* Create a Ping service attachment. */
            var serviceBusCreateInterface = function(err) {
                assertFalsy(err);
                serviceBus.createInterface({
                    name: "org.alljoyn.bus.samples.simple.SimpleInterface",
                    method: [
                        { name: 'Ping', signature: 's', returnSignature: 's', argNames: 'inStr,outStr' }
                    ]
                }, callbacks.add(serviceBusRegisterBusObject));
            };
            var serviceBusRegisterBusObject = function(err) {
                assertFalsy(err);
                serviceBus.registerBusObject("/testobject", {
                    "org.alljoyn.bus.samples.simple.SimpleInterface": {
                        Ping: function(context, inStr) { context.reply(inStr); }
                    }
                }, callbacks.add(serviceBusConnect));
            };
            var serviceBusConnect = function(err) {
                assertFalsy(err);
                serviceBus.connect(callbacks.add(clientBusConnect));
            };

            /* Create a Ping client attachment. */
            var clientBusConnect = function(err) {
                assertFalsy(err);
                clientBus.connect(callbacks.add(getDbus));
            };

            /*
             * Now kick off the Ping.  This needs to be synchronized to not Ping until the
             * service has acquired its name.
             */
            var getDbus = function(err) {
                assertFalsy(err);
                serviceBus.getProxyBusObject("org.freedesktop.DBus/org/freedesktop/DBus", callbacks.add(requestName));
            };
            var requestName = function(err, dbus) {
                assertFalsy(err);
                dbus.methodCall("org.freedesktop.DBus", "RequestName", "org.alljoyn.bus.samples.simple", 0, callbacks.add(onRequestName));
            };
            var onRequestName = function(err, context, result) {
                assertFalsy(err);
                assertEquals(1, result);
                clientBus.getProxyBusObject("org.alljoyn.bus.samples.simple/testobject", callbacks.add(ping));
            };
            var ping = function(err, testobject) {
                assertFalsy(err);
                testobject.methodCall("org.alljoyn.bus.samples.simple.SimpleInterface", "Ping", "hello", callbacks.add(onPing));
            };
            var onPing = function(err, context, outStr) {
                assertFalsy(err);
                assertEquals("hello", outStr);
            };
            this._setUp(callbacks.add(serviceBusCreateInterface));
        });
    }
});
