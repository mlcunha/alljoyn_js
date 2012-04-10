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
#include "ProxyBusObjectsHost.h"

#include "BusUtil.h"
#include "Transport.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_ProxyBusObjectsHost::_ProxyBusObjectsHost(Plugin& plugin, BusAttachment& busAttachment)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    GETTER(&_ProxyBusObjectsHost::getProxyBusObject);
}

_ProxyBusObjectsHost::~_ProxyBusObjectsHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _ProxyBusObjectsHost::HasProperty(NPIdentifier name)
{
    bool has = ScriptableObject::HasProperty(name);
    if (!has && NPN_IdentifierIsString(name)) {
        qcc::String serviceName, path;
        std::map<qcc::String, qcc::String> argMap;
        ParseName(name, serviceName, path, argMap);
        has = ajn::IsLegalBusName(serviceName.c_str()) && ajn::IsLegalObjectPath(path.c_str());
    }
    return has;
}

bool _ProxyBusObjectsHost::getProxyBusObject(NPIdentifier name, NPVariant* result)
{
    if (proxyBusObjects.find(name) == proxyBusObjects.end()) {
        qcc::String serviceName, path;
        std::map<qcc::String, qcc::String> argMap;
        ParseName(name, serviceName, path, argMap);
        const char* cserviceName = serviceName.c_str();
        const char* cpath = path.c_str();
        ajn::SessionId sessionId = strtoul(argMap["sessionId"].c_str(), 0, 0);
        std::pair<NPIdentifier, ProxyBusObjectHost> element(name, ProxyBusObjectHost(plugin, busAttachment, cserviceName, cpath, sessionId));
        proxyBusObjects.insert(element);
    }
    std::map<NPIdentifier, ProxyBusObjectHost>::iterator it = proxyBusObjects.find(name);
    ToHostObject<ProxyBusObjectHost>(plugin, it->second, *result);
    return true;
}

void _ProxyBusObjectsHost::ParseName(NPIdentifier id, qcc::String& serviceName, qcc::String& path, std::map<qcc::String, qcc::String>& argMap)
{
    NPUTF8* utf8 = NPN_UTF8FromIdentifier(id);
    qcc::String name(utf8);
    size_t slash = name.find_first_of('/');
    size_t colon = name.find_last_of(':');
    serviceName = name.substr(0, slash);
    path = name.substr(slash, colon - slash);
    qcc::String args = name.substr(colon);
    ajn::Transport::ParseArguments("", args.c_str(), argMap); /* Ignore any errors since args are optional */
    NPN_MemFree(utf8);
}
