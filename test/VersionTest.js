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
AsyncTestCase("VersionTest", {
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
        },

        testVersion: function() {
            var v = new alljoyn.Version();
            console.log("buildInfo: " + v.buildInfo);
            console.log("version: 0x" + v.version.toString(16));
            console.log("arch: " + v.arch);
            console.log("apiLevel: " + v.apiLevel);
            console.log("release: " + v.release);
            console.log("toString (explicit): " + v.toString());
            console.log("toString (implicit): " + v);
        },
    });

