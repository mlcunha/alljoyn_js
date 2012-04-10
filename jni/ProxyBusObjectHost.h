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
#ifndef _PROXYBUSOBJECTHOST_H
#define _PROXYBUSOBJECTHOST_H

#include "BusAttachment.h"
#include "ProxyBusObject.h"
#include "ProxyInterfaceHost.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>
class _ProxyBusObjectHostImpl;

class _ProxyBusObjectHost : public ScriptableObject {
  public:
    _ProxyBusObjectHost(Plugin& plugin, BusAttachment& busAttachment, const char* serviceName, const char* path, ajn::SessionId sessionId);
    _ProxyBusObjectHost(Plugin& plugin, BusAttachment& busAttachment, ajn::ProxyBusObject* proxyBusObject);
    virtual ~_ProxyBusObjectHost();
    virtual bool HasProperty(NPIdentifier name);

  private:
    BusAttachment busAttachment;
    ProxyBusObject proxyBusObject;
    _ProxyBusObjectHostImpl* impl; /* Hide declaration of ProxyChildrenHost to get around recursive include. */
    std::map<NPIdentifier, ProxyInterfaceHost> proxyInterfaces;

    void Initialize();

    bool getPath(NPVariant* result);
    bool getChildren(NPVariant* result);
    bool getServiceName(NPVariant* result);

    bool introspect(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool parseXML(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool secureConnection(const NPVariant* args, uint32_t argCount, NPVariant* result);

    bool getProxyInterface(NPIdentifier name, NPVariant* result);
    bool enumerateProxyInterfaces(NPIdentifier** value, uint32_t* count);
};

typedef qcc::ManagedObj<_ProxyBusObjectHost> ProxyBusObjectHost;

#endif // _PROXYBUSOBJECTHOST_H
