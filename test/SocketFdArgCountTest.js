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
AsyncTestCase("SocketFdArgCountTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            bus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            assertEquals(0, bus.disconnect());
        },

        testConstructor0: function() {
            assertError(function() { new alljoyn.SocketFd(); }, "TypeError");
        },

        testRecv0: function() {
            var socket = new alljoyn.SocketFd(-1);
            assertError(function() { socket.recv(); }, "TypeError");
        },

        testSend0: function() {
            var socket = new alljoyn.SocketFd(-1);
            assertError(function() { socket.send(); }, "TypeError");
        },
    });

