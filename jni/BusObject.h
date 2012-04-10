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
#ifndef _BUSOBJECT_H
#define _BUSOBJECT_H

#include "BusAttachment.h"
#include <alljoyn/BusObject.h>

class _BusObjectListener {
  public:
    virtual ~_BusObjectListener() { }
    virtual QStatus Get(const char* ifcName, const char* propName, ajn::MsgArg& val) = 0;
    virtual QStatus Set(const char* ifcName, const char* propName, ajn::MsgArg& val) = 0;
    virtual QStatus GenerateIntrospection(bool deep, size_t indent, qcc::String& introspection) const = 0;
    virtual void ObjectRegistered() = 0;
    virtual void ObjectUnregistered() = 0;
    virtual void MethodHandler(const ajn::InterfaceDescription::Member* member, ajn::Message& message) = 0;
};

class _BusObject : public ajn::BusObject {
  public:
    _BusObject(BusAttachment& busAttachment, const char* path)
        : ajn::BusObject(*busAttachment, path)
        , busAttachment(busAttachment)
        , busObjectListener(0) { }
    virtual ~_BusObject() { }
    void SetBusObjectListener(_BusObjectListener* busObjectListener) {
        this->busObjectListener = busObjectListener;
    }

    QStatus AddInterface(const ajn::InterfaceDescription& iface) {
        return ajn::BusObject::AddInterface(iface);
    }
    QStatus AddMethodHandler(const ajn::InterfaceDescription::Member* member) {
        return ajn::BusObject::AddMethodHandler(member, static_cast<ajn::MessageReceiver::MethodHandler>(&_BusObject::MethodHandler));
    }
    QStatus MethodReply(ajn::Message& msg, const ajn::MsgArg* args = NULL, size_t numArgs = 0) {
        return ajn::BusObject::MethodReply(msg, args, numArgs);
    }
    QStatus MethodReply(ajn::Message& msg, const char* error, const char* errorMessage = NULL) {
        return ajn::BusObject::MethodReply(msg, error, errorMessage);
    }
    QStatus MethodReply(ajn::Message& msg, QStatus status) {
        return ajn::BusObject::MethodReply(msg, status);
    }
    QStatus Signal(const char* destination, ajn::SessionId sessionId, const ajn::InterfaceDescription::Member& signal, const ajn::MsgArg* args = NULL, size_t numArgs = 0, uint16_t timeToLive = 0, uint8_t flags = 0) {
        return ajn::BusObject::Signal(destination, sessionId, signal, args, numArgs, timeToLive, flags);
    }

  private:
    BusAttachment busAttachment;
    _BusObjectListener* busObjectListener;

    virtual QStatus Get(const char* ifcName, const char* propName, ajn::MsgArg& val) {
        return busObjectListener ? busObjectListener->Get(ifcName, propName, val) : ER_FAIL;
    }
    virtual QStatus Set(const char* ifcName, const char* propName, ajn::MsgArg& val) {
        return busObjectListener ? busObjectListener->Set(ifcName, propName, val) : ER_FAIL;
    }
    virtual qcc::String GenerateIntrospection(bool deep = false, size_t indent = 0) const {
        qcc::String introspection;
        if (!busObjectListener || (ER_OK != busObjectListener->GenerateIntrospection(deep, indent, introspection))) {
            return ajn::BusObject::GenerateIntrospection(deep, indent);
        }
        return introspection;
    }
    virtual void ObjectRegistered() {
        ajn::BusObject::ObjectRegistered();
        if (busObjectListener) busObjectListener->ObjectRegistered();
    }
    virtual void ObjectUnregistered() {
        ajn::BusObject::ObjectUnregistered();
        if (busObjectListener) busObjectListener->ObjectUnregistered();
    }
    void MethodHandler(const ajn::InterfaceDescription::Member* member, ajn::Message& message) {
        if (busObjectListener) busObjectListener->MethodHandler(member, message);
        else MethodReply(message, ER_FAIL);
    }
};

typedef qcc::ManagedObj<_BusObject> BusObject;

#endif
