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
AsyncTestCase("AddressBookTest", {
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

    testAddressBook: function(queue) {
        queue.call(function(callbacks) {
            /* Create an addressbook service attachment. */
            var addressBook = {};
            var serviceCreateInterface = function(err) {
                assertFalsy(err);
                serviceBus.createInterface({
                    name: "org.alljoyn.bus.samples.addressbook.AddressBookInterface",
                    secure: true,
                    method: [
                        { name: "setContact", signature: "(ssa{ss})", argNames: "contact" },
                        { name: "getContact", signature: "s", returnSignature: "(ssa{ss})", argNames: "lastName,contact" },
                        { name: "getContacts", signature: "as", returnSignature: "a(ssa{ss})", argNames: "lastNames,contacts" }
                    ]
                }, callbacks.add(serviceRegisterBusObject));
            };
            var serviceRegisterBusObject = function(err) {
                assertFalsy(err);
                serviceBus.registerBusObject("/addressbook", {
                    "org.alljoyn.bus.samples.addressbook.AddressBookInterface": {
                        setContact: function(context, contact) {
                            addressBook[contact[1]] = contact;
                            context.reply();
                        },
                        getContact: function(context, lastName) {
                            var contact = addressBook[lastName];
                            if (contact) {
                                context.reply(contact);
                            } else {
                                context.replyError("org.alljoyn.bus.samples.addressbook.Error", 
                                                   "No such contact");
                            }
                        },
                        getContacts: function(context, lastNames) {
                            var contacts = [];
                            for (var i = 0; i < lastNames.length; ++i) {
                                var contact = addressBook[lastNames[i]];
                                if (contact) {
                                    contacts.push(contact);
                                }
                            }
                            context.reply(contacts);
                        }
                    }
                }, callbacks.add(serviceEnablePeerSecurity));
            };
            var serviceEnablePeerSecurity = function(err) {
                assertFalsy(err);
                serviceBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, authPeer, authCount, userName, credMask, credentials) {
                        console.log(credentials);
                        if (credMask & credentials.PASSWORD) {
                            credentials.password = "123456";
                            return true;
                        }
                        return false;
                    }),
                    onComplete: callbacks.add(function(authMechanism, authPeer, success) {
                    })
                }, callbacks.add(serviceClearKeyStore));
            };
            var serviceClearKeyStore = function(err) {
                assertFalsy(err);
                serviceBus.clearKeyStore(callbacks.add(serviceConnect));
            };
            var serviceConnect = function(err) {
                assertFalsy(err);
                serviceBus.connect(callbacks.add(clientEnablePeerSecurity));
            };

            /* Create an addressbook client attachment. */
            var clientEnablePeerSecurity = function(err) {
                assertFalsy(err);
                clientBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                    onRequest: callbacks.add(function(authMechanism, authPeer, authCount, userName, credMask, credentials) {
                        console.log(credentials);
                        if (credMask & credentials.PASSWORD) {
                            credentials.password = "123456";
                            return true;
                        }
                        return false;
                    }),
                    onComplete: callbacks.add(function(authMechanism, authPeer, success) {
                    })
                }, callbacks.add(clientClearKeyStore));
            };
            var clientClearKeyStore = function(err) {
                assertFalsy(err);
                clientBus.clearKeyStore(callbacks.add(clientConnect));
            };
            var clientConnect = function(err) {
                assertFalsy(err);
                clientBus.connect(callbacks.add(getDbus));
            };
            
            /*
             *  Now kick off the test.  This needs to be synchronized to wait until the
             *  service has acquired its name.
             */
            var getDbus = function(err) {
                assertFalsy(err);
                serviceBus.getProxyBusObject("org.freedesktop.DBus/org/freedesktop/DBus", callbacks.add(requestName));
            };
            var requestName = function(err, dbus) {
                assertFalsy(err);
                dbus.methodCall("org.freedesktop.DBus", "RequestName", "org.alljoyn.bus.samples.addressbook", 0, callbacks.add(onRequestName));
            };
            var proxy;
            var onRequestName = function(err, context, result) {
                assertFalsy(err);
                assertEquals(1, result);
                clientBus.getProxyBusObject("org.alljoyn.bus.samples.addressbook/addressbook", callbacks.add(getProxy));
            };
            var getProxy = function(err, proxyObj) {
                assertFalsy(err);
                proxy = proxyObj;
                proxy.methodCall("org.alljoyn.bus.samples.addressbook.AddressBookInterface", "setContact", [ "first", "last", { home: "1234567", work: "7654321" } ],
                                 callbacks.add(onSetContact));
            };
            var onSetContact = function(err, context) {
                assertFalsy(err);
                proxy.methodCall("org.alljoyn.bus.samples.addressbook.AddressBookInterface", "getContacts", [ "last" ], callbacks.add(onGetContacts));
            };
            var onGetContacts = function(err, context, contacts) {
                assertFalsy(err);
                var contact = contacts[0];
                assertEquals("first", contact[0]);
                assertEquals("last", contact[1]);
                assertEquals("1234567", contact[2].home);
                assertEquals("7654321", contact[2].work);
            };

            this._setUp(callbacks.add(serviceCreateInterface));
        });
    }
});
