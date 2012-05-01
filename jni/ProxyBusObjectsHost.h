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
#ifndef _PROXYBUSOBJECTSHOST_H
#define _PROXYBUSOBJECTSHOST_H

#include "BusAttachment.h"
#include "ProxyBusObjectHost.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>
#include <map>

class _ProxyBusObjectsHost : public ScriptableObject {
  public:
    _ProxyBusObjectsHost(Plugin& plugin, BusAttachment& busAttachment);
    virtual ~_ProxyBusObjectsHost();
    virtual bool HasProperty(const qcc::String& name);

  private:
    BusAttachment busAttachment;
    std::map<qcc::String, ProxyBusObjectHost> proxyBusObjects;

    bool getProxyBusObject(const qcc::String& name, NPVariant* result);

    /**
     * Parse the name string into its components.
     *
     * @param[in] name a proxy bus object name of the form "<serviceName><objectPath><args>"
     * @param[out] serviceName a D-Bus bus name
     * @param[out] path a D-Bus object path
     * @param[out] argMap a map of args from the args component of name: ":<name>=<value>[,<name>=<value>]"
     */
    void ParseName(const qcc::String& name, qcc::String& serviceName, qcc::String& path, std::map<qcc::String, qcc::String>& argMap);
};

typedef qcc::ManagedObj<_ProxyBusObjectsHost> ProxyBusObjectsHost;

#endif // _PROXYBUSOBJECTSHOST_H
