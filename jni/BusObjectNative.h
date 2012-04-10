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
#ifndef _BUSOBJECTNATIVE_H
#define _BUSOBJECTNATIVE_H

#include "MessageReplyHost.h"
#include "NativeObject.h"
#include "Status.h"
#include <alljoyn/InterfaceDescription.h>
#include <alljoyn/MsgArg.h>

class BusObjectNative : public NativeObject {
  public:
    BusObjectNative(Plugin& plugin, NPObject* objectValue);
    virtual ~BusObjectNative();

    void onRegistered();
    void onUnregistered();
    QStatus get(const ajn::InterfaceDescription* interface, const ajn::InterfaceDescription::Property* property, ajn::MsgArg& val);
    QStatus set(const ajn::InterfaceDescription* interface, const ajn::InterfaceDescription::Property* property, const ajn::MsgArg& val);
    QStatus toXML(bool deep, size_t indent, qcc::String& xml);
    void onMessage(const char* interfaceName, const char* methodName, MessageReplyHost& message, const ajn::MsgArg* args, size_t numArgs);
};

#endif // _BUSOBJECTNATIVE_H
