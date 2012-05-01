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
#include "ProxyChildrenHost.h"

#include "ProxyBusObjectHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_ProxyChildrenHost::_ProxyChildrenHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
    , proxyBusObject(proxyBusObject)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    GETTER(&_ProxyChildrenHost::getProxyBusObject);
    ENUMERATOR(&_ProxyChildrenHost::enumerateProxyBusObjects);
}

_ProxyChildrenHost::~_ProxyChildrenHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _ProxyChildrenHost::HasProperty(const qcc::String& name)
{
    bool has = ScriptableObject::HasProperty(name);
    if (!has) {
        has = proxyBusObject->GetChild(name.c_str()) != 0;
    }
    return has;
}

bool _ProxyChildrenHost::getProxyBusObject(const qcc::String& name, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ajn::ProxyBusObject* child = proxyBusObject->GetChild(name.c_str());
    if (child) {
        qcc::String name = child->GetServiceName() + child->GetPath();
        if (child->GetSessionId()) {
            char sessionId[32];
            snprintf(sessionId, 32, ":sessionId=%u", child->GetSessionId());
            name += sessionId;
        }
        if (proxyBusObjects.find(name) == proxyBusObjects.end()) {
            std::pair<qcc::String, ProxyBusObjectHost> element(name, ProxyBusObjectHost(plugin, busAttachment, child));
            proxyBusObjects.insert(element);
        }
        std::map<qcc::String, ProxyBusObjectHost>::iterator it = proxyBusObjects.find(name);
        ToHostObject<ProxyBusObjectHost>(plugin, it->second, *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _ProxyChildrenHost::enumerateProxyBusObjects(NPIdentifier** value, uint32_t* count)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    size_t numChildren = proxyBusObject->GetChildren();
    ajn::ProxyBusObject** children = new ajn::ProxyBusObject *[numChildren];
    proxyBusObject->GetChildren(children, numChildren);

    *count = numChildren;
    *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
    NPIdentifier* v = *value;
    for (size_t i = 0; i < numChildren; ++i) {
        qcc::String path = children[i]->GetPath();
        qcc::String substr = path.substr(path.find_last_of('/') + 1);
        *v++ = NPN_GetStringIdentifier(substr.c_str());
    }

    delete[] children;
    return true;
}
