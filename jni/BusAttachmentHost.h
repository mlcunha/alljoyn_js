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
#ifndef _BUSATTACHMENTHOST_H
#define _BUSATTACHMENTHOST_H

#include "BusAttachment.h"
#include "InterfaceDescriptionsHost.h"
#include "ProxyBusObjectsHost.h"
#include "ScriptableObject.h"
#if defined(QCC_OS_ANDROID)
#include "os/android/KeyStoreListener.h"
#endif
#include <qcc/ManagedObj.h>
#include <qcc/String.h>
class AuthListener;
class BusListener;
class BusObjectListener;
class SessionListener;
class SessionPortListener;
class SignalReceiver;

class _BusAttachmentHost : public ScriptableObject {
    friend class JoinSessionAsyncCB;
  public:
    _BusAttachmentHost(Plugin& plugin, const char* applicationName, bool allowRemoteMessages);
    virtual ~_BusAttachmentHost();
    virtual bool HasProperty(NPIdentifier name);

  private:
    BusAttachment busAttachment;
#if defined(QCC_OS_ANDROID)
    KeyStoreListener keyStoreListener;
#endif
    AuthListener* authListener;
    ProxyBusObjectsHost proxyBusObjectsHost;
    InterfaceDescriptionsHost interfaceDescriptionsHost;
    qcc::String applicationName;
    qcc::String connectSpec;
    std::list<SignalReceiver*> signalReceivers;
    std::list<BusListener*> busListeners;
    std::map<ajn::SessionPort, SessionPortListener*> sessionPortListeners;
    std::map<ajn::SessionId, SessionListener*> sessionListeners;
    std::map<NPIdentifier, BusObjectListener*> busObjectListeners;

    bool getGlobalGUIDString(NPVariant* result);
    bool getInterfaces(NPVariant* result);
    bool getPeerSecurityEnabled(NPVariant* result);
    bool getProxy(NPVariant* result);
    bool getTimestamp(NPVariant* result);
    bool getUniqueName(NPVariant* result);

    bool addLogonEntry(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool addMatch(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool advertiseName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool bindSessionPort(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool cancelAdvertiseName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool cancelFindAdvertisedName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool clearKeyStore(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool clearKeys(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool connect(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool disconnect(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool enablePeerSecurity(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool findAdvertisedName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool getKeyExpiration(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool getPeerGUID(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool joinSession(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool leaveSession(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool getSessionFd(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool nameHasOwner(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool registerBusListener(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool registerSignalHandler(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool releaseName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool reloadKeyStore(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool removeMatch(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool requestName(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool setDaemonDebug(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool setLinkTimeout(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool setKeyExpiration(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool setSessionListener(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool unbindSessionPort(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool unregisterBusListener(const NPVariant* args, uint32_t argCount, NPVariant* result);
    bool unregisterSignalHandler(const NPVariant* args, uint32_t argCount, NPVariant* result);

    bool enumerateBusObjects(NPIdentifier** value, uint32_t* count);
    bool getBusObject(NPIdentifier name, NPVariant* result);
    bool registerBusObject(NPIdentifier name, const NPVariant* value);
    bool unregisterBusObject(NPIdentifier name);

    QStatus GetSignal(const qcc::String& signalName, const ajn::InterfaceDescription::Member*& signal);
    qcc::String MatchRule(const ajn::InterfaceDescription::Member* signal, const qcc::String& sourcePath);
    QStatus Connect(Plugin& plugin, const char* connectSpec);
};

typedef qcc::ManagedObj<_BusAttachmentHost> BusAttachmentHost;

#endif // _BUSATTACHMENTHOST_H
