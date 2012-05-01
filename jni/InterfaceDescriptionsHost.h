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
#ifndef _INTERFACEDESCRIPTIONSHOST_H
#define _INTERFACEDESCRIPTIONSHOST_H

#include "BusAttachment.h"
#include "ScriptableObject.h"
#include <qcc/ManagedObj.h>
#include <map>
class InterfaceDescription;

class _InterfaceDescriptionsHost : public ScriptableObject {
  public:
    _InterfaceDescriptionsHost(Plugin& plugin, BusAttachment& busAttachment);
    virtual ~_InterfaceDescriptionsHost();
    virtual bool HasProperty(const qcc::String& name);

  private:
    BusAttachment busAttachment;
    std::map<qcc::String, InterfaceDescription*> interfaceDescriptions;

    bool parseXML(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool createInterfaceDescription(const qcc::String& name, const NPVariant* value);
    bool getInterfaceDescription(const qcc::String& name, NPVariant* result);
    bool enumerateInterfaceDescriptions(NPIdentifier** value, uint32_t* count);
};

typedef qcc::ManagedObj<_InterfaceDescriptionsHost> InterfaceDescriptionsHost;

#endif // _INTERFACEDESCRIPTIONSHOST_H
