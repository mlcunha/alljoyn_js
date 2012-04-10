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
#ifndef _PROXYMETHODHOST_H
#define _PROXYMETHODHOST_H

#include "BusAttachment.h"
#include "ProxyBusObject.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>
#include <qcc/String.h>

class _ProxyMethodHost : public ScriptableObject {
  public:
    _ProxyMethodHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, const char* interfaceName, const char* methodName);
    virtual ~_ProxyMethodHost();

  private:
    BusAttachment busAttachment;
    ProxyBusObject proxyBusObject;
    qcc::String interfaceName;
    qcc::String methodName;

    bool apply(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool methodCall(const NPVariant* args, uint32_t argCount, NPVariant* result);
};

typedef qcc::ManagedObj<_ProxyMethodHost> ProxyMethodHost;

#endif // _PROXYMETHODHOST_H
