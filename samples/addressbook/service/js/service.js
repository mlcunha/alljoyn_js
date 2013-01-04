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
var onDeviceReady = function() {
    var $ = function(id) {
        return document.getElementById(id);
    };

    var contacts,
        vcards = $('vcards'),
        id;

    var createElement = function(name, className, innerHTML) {
        var element = document.createElement(name);
        if (className) {
            element.className = className;
        }
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        return element;
    };

    var toVCard = function(contact) {
        var vcard,
            n,
            details,
            type,
            tel;
        
        vcard = createElement('div', 'vcard');

        n = createElement('div', 'index n');
        n.appendChild(createElement('span', 'family-name', contact.lastName));
        n.appendChild(createElement('span', 'given-name', contact.firstName));
        vcard.appendChild(n);

        details = createElement('div', 'details');
        for (type in contact.phoneNumbers) {
            tel = createElement('div', 'tel');
            tel.appendChild(createElement('span', 'type', type));
            tel.appendChild(createElement('span', 'value', contact.phoneNumbers[type]));
            details.appendChild(tel);
        }
        vcard.appendChild(details);
        
        return vcard;
    };

    contacts = {
        set: function(contact) {
            var vcard,
                li;

            addressbook[contact.lastName] = contact;
            
            vcard = toVCard(contact);
            li = $(contact.lastName);
            if (li) {
                li.replaceChild(vcard, li.firstChild);
            } else {
                li = createElement('li');
                li.id = contact.lastName;
                li.appendChild(vcard);
                vcards.appendChild(li);
            }
        },
        get: function(lastName) {
            return addressbook[lastName];
        },
    };

    for (id in addressbook) {
        contacts.set(addressbook[id]);
    }

    alljoyn.start(contacts);
};

if (window.cordova) {
    document.addEventListener('deviceready', onDeviceReady, false);
} else {
    onDeviceReady();
}
