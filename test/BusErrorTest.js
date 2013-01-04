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
AsyncTestCase("BusErrorTest", {
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testBusError: function(queue) {
        queue.call(function(callbacks) {
            var nameHasOwner = function(err) {
                assertFalsy(err);
                bus.nameHasOwner("test.foo", callbacks.add(done));
            };
            var done = function(err, has) {
                assertEquals("BusError", err.name);
                assertEquals(org.alljoyn.bus.BusError.BUS_NOT_CONNECTED, err.code);
            };
            this._setUp(callbacks.add(nameHasOwner));
        });
    },

    testTypeError: function(queue) {
        queue.call(function(callbacks) {
            var registerSignalHandler = function(err) {
                try {
                    bus.registerSignalHandler();
                } catch (err) {
                    assertEquals("TypeError", org.alljoyn.bus.BusError.name);
                    assertEquals("not enough arguments", org.alljoyn.bus.BusError.message);
                }
            };
            this._setUp(callbacks.add(registerSignalHandler));
        });
    },
});

