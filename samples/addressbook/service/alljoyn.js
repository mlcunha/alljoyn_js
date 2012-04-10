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
var alljoyn = (function() {
        var NAME = "org.alljoyn.bus.samples.addressbook",
            OBJECT_PATH = "/addressbook";

        var that,
            bus,
            properties;

        /*
         * AllJoyn STRUCTs are represented as JavaScript arrays.  toObject and toStruct are
         * convenience functions to convert between the array representation and a more convenient
         * object representation.
         */
        properties = ["firstName", "lastName", "phoneNumbers"];
        var toObject = function(contact) {
            var obj,
                i;
            
            obj = {};
            for (i = 0; i < properties.length; ++i) {
                obj[properties[i]] = contact[i];
            }
            return obj;
        }
        var toStruct = function(contact) {
            var struct,
                i;
            
            struct = [];
            for (i = 0; i < properties.length; ++i) {
                struct[i] = contact[properties[i]];
            }
            return struct;
        };

        var start = function(contacts) {
            var status;

            bus = new org.alljoyn.bus.BusAttachment(true);
            /*
             * Enable peer security before calling connect() to ensure that everything is in place
             * before any remote peers access the service.
             *
             * The main differences between a secure application and a plain application, besides
             * the secure properties of the interfaces, are encapsulated in the AuthListener (the
             * second argument to this function).  The BusAttachment calls the listener with various
             * authentication requests in the process of authenticating a peer.  The requests made
             * are dependent on the specific authentication mechanism negotiated between the peers.
             */
            status = bus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    /*
                     * Authentication requests are being made.  Contained in this call are the
                     * mechanism in use, the number of attempts made so far, the desired user name
                     * for the requests, and the specific credentials being requested in the form of
                     * the credMask.
                     *
                     * A true return value tells the BusAttachment that the requests have been
                     * handled.
                     */
                    onRequest: function(authMechanism, peerName, authCount, userName, credMask, credentials) {
                        /*
                         * We only enabled the "ALLJOYN_SRP_KEYX" authentication mechanism, so we
                         * know that only the PASSWORD will be requested.  This listener sets the
                         * password to "123456".
                         */
                        if (credMask & credentials.PASSWORD) {
                            credentials.password = "123456";
                            return true;
                        }
                        return false;
                    },
                    onSecurityViolation: function(status, context) {
                        alert('Security violation [(' + status + ')]');
                    },
                    /*
                     * An authentication attempt has completed, either successfully or
                     * unsuccessfully.
                     */
                    onComplete: function(authMechanism, peerName, success) {
                        if (!success) {
                            alert('Authentication with "' + peerName + '" failed');
                        }
                    },
                });
            if (status) {
                alert("Enable peer security failed failed [(" + status + ")]");
                return;
            }
            status = bus.connect();
            if (status) {
                alert("Connect to AllJoyn failed [(" + status + ")]");
                return;
            }
            bus.interfaces["org.alljoyn.bus.samples.addressbook.AddressBookInterface"] = {
                /*
                 * The true value of the secure property requests any method calls on this interface
                 * to first authenticate then encrypt the data between the AllJoyn peers.
                 */
                secure: true,
                /*
                 * The '(ssa{ss})' signature specifies the AllJoyn representation of a contact in
                 * the address book.  
                 *
                 * Let's decode this signature into its JavaScript representation:
                 * - First, the '(' tells us this is an AllJoyn STRUCT.  The binding documentation
                 *   says that this maps to a JavaScript array.  That gives us '[...]'.
                 * - Next, the 's' tells us the first member of the struct is an AllJoyn STRING.
                 *   This maps to a JavaScript string.  The next 's' of the signature is also an
                 *   AllJoyn STRING, so we have '[<string>, <string> ...]'.
                 * - Next, the 'a' tells us this member of the struct is an AllJoyn array.  But the
                 *   following '{' tells us this is an array of AllJoyn DICT_ENTRYs.  This maps to
                 *   an object, where the key, value pair of each DICT_ENTRY is a JavaScript
                 *   property name, value pair.  We now have '[<string>, <string>, { <key0>:
                 *   <value0>, <key1>: <value1>...} ]'.
                 * - Finally, the signature of the key and values are both AllJoyn STRINGs, so
                 *   <keyN> and <valueN> above are both JavaScript strings.
                 *
                 * A specific example of a contact in JavaScript would be:
                 *     [
                 *         'Florence',
                 *         'Nightingale',
                 *         {
                 *             'home': '456-1234',
                 *             'work': '456-5678'
                 *         }
                 *     ]
                 */
                method: [
                    { name: "setContact", signature: "(ssa{ss})", argNames: "contact" },
                    { name: "getContact", signature: "s", returnSignature: "(ssa{ss})", argNames: "lastName,contact" },
                    { name: "getContacts", signature: "as", returnSignature: "a(ssa{ss})", argNames: "lastNames,contacts" }
                ],
            };
            bus[OBJECT_PATH] = {
                "org.alljoyn.bus.samples.addressbook.AddressBookInterface": {
                    setContact: function(context, contact) {
                        contacts.set(toObject(contact));
                        /* A void reply to the setContact method call. */
                        context.reply();
                    },
                    getContact: function(context, lastName) {
                        var contact = contacts.get(lastName);
                        if (contact) {
                            context.reply(toStruct(contact));
                        } else {
                            /*
                             * Reply with an AllJoyn BusError.  The name of the error must follow
                             * the same naming conventions as AllJoyn interfaces, well-known names,
                             * etc.  Here the error name is the well-known name concatenated with
                             * 'ContactNotFound'.
                             */
                            context.replyError(NAME + ".ContactNotFound", "No such contact");
                        }
                    },
                    getContacts: function(context, lastNames) {
                        var contact,
                            result,
                            i;
                        
                        result = [];
                        for (i = 0; i < lastNames.length; ++i) {
                            contact = contacts.get(lastNames[i]);
                            if (contact) {
                                result.push(toStruct(contact));
                            }
                        }
                        context.reply(result);
                    }
                }
            };
            status = bus.requestName(NAME);
            if (status) {
                alert("Request name '" + NAME + "' failed [(" + status + ")]");
                return status;
            }
        };

        that = {};

        that.start = function(contacts) {
            navigator.requestPermission("org.alljoyn.bus", function() { start(contacts); });
        }
        
        return that;
    }());
