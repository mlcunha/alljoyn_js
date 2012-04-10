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
TestCase("ProxyBusObjectArgCountTest", {
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

        testIntrospect0: function() {
            assertError(function() { bus.proxy["a.b/c"].introspect(); }, "TypeError");
        },
        testIntrospect1: function() {
            assertError(function() { bus.proxy["a.b/c"].introspect(function() {}); }, "TypeError");
        },
        testIntrospect2: function() {
            assertNoError(function() { bus.proxy["a.b/c"].introspect(function() {}, function() {}); }, "TypeError");
        },

        testParseXML0: function() {
            assertError(function() { bus.proxy["a.b/c"].parseXML(); }, "TypeError");
        },
        testParseXML1: function() {
            assertNoError(function() { bus.proxy["a.b/c"].parseXML("xml"); });
        },

        testSecureConnection0: function() {
            assertNoError(function() { bus.proxy["a.b/c"].secureConnection(); });
        },
        testSecureConnection1: function() {
            assertNoError(function() { bus.proxy["a.b/c"].secureConnection(true); });
        },
    });

