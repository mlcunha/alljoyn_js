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
#ifndef _PROXYINTERFACEHOST_H
#define _PROXYINTERFACEHOST_H

#include "BusAttachment.h"
#include "ProxyBusObject.h"
#include "ProxyMethodHost.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>
#include <qcc/String.h>
#include <map>

class _ProxyInterfaceHost : public ScriptableObject {
  public:
    _ProxyInterfaceHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, const char* interfaceName);
    virtual ~_ProxyInterfaceHost();
    virtual bool HasProperty(const qcc::String& name);

  private:
    BusAttachment busAttachment;
    ProxyBusObject proxyBusObject;
    qcc::String interfaceName;
    std::map<qcc::String, ProxyMethodHost> proxyMethods;

    bool getProxyMethod(const qcc::String& name, NPVariant* result);
    bool enumerateProxyMethods(NPIdentifier** value, uint32_t* count);
};

typedef qcc::ManagedObj<_ProxyInterfaceHost> ProxyInterfaceHost;

#endif // _PROXYINTERFACEHOST_H
