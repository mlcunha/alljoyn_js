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
        setUp: function() {
            /*:DOC += <object id="alljoyn" type="application/x-alljoyn"/> */
            alljoyn = document.getElementById("alljoyn");
            serviceBus = new alljoyn.BusAttachment();
            clientBus = new alljoyn.BusAttachment();
        },
        tearDown: function() {
            /*
             * We don't know when the gc will run, so explicitly disconnect to ensure that there is
             * no interference between tests (particularly signal handlers).
             */
            assertEquals(0, clientBus.disconnect());
            assertEquals(0, serviceBus.disconnect());
        },

        testAddressBook: function(queue) {
            queue.call(function(callbacks) {
                    /* Create an addressbook service attachment. */
                    var addressBook = {};
                    serviceBus.interfaces["org.alljoyn.bus.samples.addressbook.AddressBookInterface"] = {
                        secure: true,
                        method: [
                            { name: 'setContact', signature: '(ssa{ss})', argNames: 'contact' },
                            { name: 'getContact', signature: 's', returnSignature: '(ssa{ss})' },
                            { name: 'getContacts', signature: 'as', returnSignature: 'a(ssa{ss})' },
                        ]
                    };
                    serviceBus["/addressbook"] = {
                        "org.alljoyn.bus.samples.addressbook.AddressBookInterface": {
                            setContact: function(context, contact) { 
                                addressBook[contact[1]] = contact;
                                assertEquals(0, context.reply());
                            },
                            getContact: function(context, lastName) {
                                var contact = addressBook[lastName];
                                if (contact) {
                                    assertEquals(0, context.reply(contact));
                                } else {
                                    assertEquals(0, context.replyError("org.alljoyn.bus.samples.addressbook.Error", 
                                                                       "No such contact"));
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
                                assertEquals(0, context.reply(contacts));
                            }
                        }
                    };
                    assertEquals(0, serviceBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, authPeer, authCount, userName, credMask, credentials) {
                                        if (credMask & credentials.PASSWORD) {
                                            credentials.password = "123456";
                                            return true;
                                        }
                                        return false;
                                    }),
                                onComplete: callbacks.add(function(authMechanism, authPeer, success) {
                                    })
                            }));
                    serviceBus.clearKeyStore();
                    assertEquals(0, serviceBus.connect());

                    /* Create an addressbook client attachment. */
                    assertEquals(0, clientBus.enablePeerSecurity("ALLJOYN_SRP_KEYX", {
                                onRequest: callbacks.add(function(authMechanism, authPeer, authCount, userName, credMask, credentials) {
                                        if (credMask & credentials.PASSWORD) {
                                            credentials.password = "123456";
                                            return true;
                                        }
                                        return false;
                                    }),
                                onComplete: callbacks.add(function(authMechanism, authPeer, success) {
                                    })
                            }));
                    clientBus.clearKeyStore();
                    assertEquals(0, clientBus.connect());
                    
                    /*
                     *  Now kick off the test.  This needs to be synchronized to wait until the
                     *  service has acquired its name.
                     */
                    var onErr = callbacks.addErrback(onError);
                    var proxy;
                    var onRequestName = callbacks.add(function(context, result) {
                            assertEquals(1, result);
                            var addressbook = clientBus.proxy["org.alljoyn.bus.samples.addressbook/addressbook"];
                            proxy = addressbook["org.alljoyn.bus.samples.addressbook.AddressBookInterface"];
                            proxy.setContact(onSetContact, onErr, 
                                             [ "first", "last", { home: "1234567", work: "7654321" } ]);
                        });
                    var onSetContact = callbacks.add(function(context) {
                            proxy.getContacts(onGetContacts, onErr, [ "last" ]);
                        });
                    var onGetContacts = callbacks.add(function(context, contacts) {
                            var contact = contacts[0];
                            assertEquals("first", contact[0]);
                            assertEquals("last", contact[1]);
                            assertEquals("1234567", contact[2].home);
                            assertEquals("7654321", contact[2].work);
                        });
                    var dbus = serviceBus.proxy["org.freedesktop.DBus/org/freedesktop/DBus"];
                    dbus["org.freedesktop.DBus"].RequestName(onRequestName, onErr, 
                                                             "org.alljoyn.bus.samples.addressbook", 0);
                });
        }
    });
