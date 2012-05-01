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
#ifndef _PROXYCHILDRENHOST_H
#define _PROXYCHILDRENHOST_H

#include "BusAttachment.h"
#include "ProxyBusObject.h"
#include "ProxyBusObjectHost.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>

class _ProxyChildrenHost : public ScriptableObject {
  public:
    _ProxyChildrenHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject);
    virtual ~_ProxyChildrenHost();
    virtual bool HasProperty(const qcc::String& name);

  private:
    BusAttachment busAttachment;
    ProxyBusObject proxyBusObject;
    std::map<qcc::String, ProxyBusObjectHost> proxyBusObjects;

    bool getProxyBusObject(const qcc::String& name, NPVariant* result);
    bool enumerateProxyBusObjects(NPIdentifier** value, uint32_t* count);
};

typedef qcc::ManagedObj<_ProxyChildrenHost> ProxyChildrenHost;

#endif // _PROXYCHILDRENHOST_H
