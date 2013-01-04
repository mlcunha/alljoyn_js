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
AsyncTestCase("GameTest", {
    _setUp: ondeviceready(function(callback) {
        bus = new org.alljoyn.bus.BusAttachment();
        bus.create(false, callback);
    }),
    tearDown: function() {
        bus.destroy();
    },

    testGame: function(queue) {
        queue.call(function(callbacks) {
            var connect = function(err) {
                assertFalsy(err);
                bus.connect(callbacks.add(createInterface));
            };
            var createInterface = function(err) {
                assertFalsy(err);
                bus.createInterface({
                    name: "org.alljoyn.bus.PlayerState",
                    signal: [
                        { name: "PlayerPosition", signature: "uuu", argNames: "x,y,rotation" }
                    ]
                }, callbacks.add(registerBusObject));
            };
            var player = {
                "org.alljoyn.bus.PlayerState": {}
            };
            var registerBusObject = function(err) {
                assertFalsy(err);
                bus.registerBusObject("/game/player", player, callbacks.add(registerSignalHandler));
            };
            var registerSignalHandler = function(err) {
                assertFalsy(err);
                bus.registerSignalHandler(callbacks.add(onPlayerPosition), "org.alljoyn.bus.PlayerState.PlayerPosition", callbacks.add(getDbus));
            };
            var onPlayerPosition = function(context, x, y, rotation) {
                assertEquals(100, x);
                assertEquals(200, y);
                assertEquals(100, rotation);
            };
            var getDbus = function(err) {
                assertFalsy(err);
                bus.getProxyBusObject("org.freedesktop.DBus/org/freedesktop/DBus", callbacks.add(requestName));
            };
            var requestName = function(err, dbus) {
                assertFalsy(err);
                dbus.methodCall("org.freedesktop.DBus", "RequestName", "org.alljoyn.bus.game", 0, callbacks.add(onRequestName));
            };
            var onRequestName = function(err, context, result) {
                assertFalsy(err);
                assertEquals(1, result);
                player.signal("org.alljoyn.bus.PlayerState", "PlayerPosition", 100, 200, 100, callbacks.add(done));
            };
            var done = function(err) {
                assertFalsy(err);
            };
            this._setUp(callbacks.add(connect));
        });
    }
});