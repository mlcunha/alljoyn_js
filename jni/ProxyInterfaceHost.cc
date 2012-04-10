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
#include "ProxyInterfaceHost.h"

#include "BusUtil.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_ProxyInterfaceHost::_ProxyInterfaceHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, const char* interfaceName)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
    , proxyBusObject(proxyBusObject)
    , interfaceName(interfaceName)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    GETTER(&_ProxyInterfaceHost::getProxyMethod);
    ENUMERATOR(&_ProxyInterfaceHost::enumerateProxyMethods);
}

_ProxyInterfaceHost::~_ProxyInterfaceHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _ProxyInterfaceHost::HasProperty(NPIdentifier name)
{
    bool has = ScriptableObject::HasProperty(name);
    if (!has && NPN_IdentifierIsString(name)) {
        /*
         * Firefox in particular likes to lookup a lot of __name__ properties.  This is a problem
         * when enumerating this object.  Firefox looks for an __iterator__ property of this.  If it
         * doesn't find it, enumeration will proceed succesfully.  If it does find it, it will call
         * it and then throw if there's an error.
         *
         * Ideally we'd have already have an interface description available to check against, but
         * since we lazily introspect when making method calls that won't work.  So the workaround here
         * is to look for the interface description first and if that doesn't exist, fallback on some
         * heuristics to look for underscores around the name.
         *
         * The above at least allows an application to explicitly set the interface description if it's
         * talking to an interface with a name matching one of the __name__ properties.
         */
        NPUTF8* methodName = NPN_UTF8FromIdentifier(name);
        const ajn::InterfaceDescription* iface = busAttachment->GetInterface(interfaceName.c_str());
        if (iface) {
            has = iface->GetMember(methodName);
        } else {
            qcc::String underscores("__");
            qcc::String nameStr(methodName);
            if ((nameStr.size() > 4) &&
                !nameStr.compare(0, 2, underscores) && !nameStr.compare(nameStr.size() - 2, 2, underscores)) {
                has = false;
            } else {
                has = ajn::IsLegalMemberName(methodName);
            }
        }
        NPN_MemFree(methodName);
    }
    return has;
}

bool _ProxyInterfaceHost::getProxyMethod(NPIdentifier name, NPVariant* result)
{
    if (proxyMethods.find(name) == proxyMethods.end()) {
        const char* cinterfaceName = interfaceName.c_str();
        NPUTF8* methodName = NPN_UTF8FromIdentifier(name);
        std::pair<NPIdentifier, ProxyMethodHost> element(name, ProxyMethodHost(plugin, busAttachment, proxyBusObject, cinterfaceName, methodName));
        NPN_MemFree(methodName);
        proxyMethods.insert(element);
    }
    std::map<NPIdentifier, ProxyMethodHost>::iterator it = proxyMethods.find(name);
    ToHostObject<ProxyMethodHost>(plugin, it->second, *result);
    return true;
}

bool _ProxyInterfaceHost::enumerateProxyMethods(NPIdentifier** value, uint32_t* count)
{
    *value = 0;
    *count = 0;
    const ajn::InterfaceDescription* iface = proxyBusObject->GetInterface(interfaceName.c_str());
    if (iface) {
        size_t numMembers = iface->GetMembers();
        const ajn::InterfaceDescription::Member** members = new const ajn::InterfaceDescription::Member *[numMembers];
        iface->GetMembers(members, numMembers);
        for (size_t i = 0; i < numMembers; ++i) {
            if (ajn::MESSAGE_METHOD_CALL == members[i]->memberType) {
                ++(*count);
            }
        }
        *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
        NPIdentifier* v = *value;
        for (size_t i = 0; i < numMembers; ++i) {
            if (ajn::MESSAGE_METHOD_CALL == members[i]->memberType) {
                *v++ = NPN_GetStringIdentifier(members[i]->name.c_str());
            }
        }
        delete[] members;
    }
    return true;
}
