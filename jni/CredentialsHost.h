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
#ifndef _CREDENTIALSHOST_H
#define _CREDENTIALSHOST_H

#include "BusAttachment.h"
#include "ScriptableObject.h"
#include <alljoyn/AuthListener.h>

class _CredentialsHost : public ScriptableObject {
  public:
    _CredentialsHost(Plugin& plugin, ajn::AuthListener::Credentials& credentials);
    virtual ~_CredentialsHost();

  protected:
    ajn::AuthListener::Credentials& credentials;

    bool getPassword(NPVariant* npresult);
    bool setPassword(const NPVariant* npvalue);
    bool getUserName(NPVariant* npresult);
    bool setUserName(const NPVariant* npvalue);
    bool getCertChain(NPVariant* npresult);
    bool setCertChain(const NPVariant* npvalue);
    bool getPrivateKey(NPVariant* npresult);
    bool setPrivateKey(const NPVariant* npvalue);
    bool getLogonEntry(NPVariant* npresult);
    bool setLogonEntry(const NPVariant* npvalue);
    bool getExpiration(NPVariant* npresult);
    bool setExpiration(const NPVariant* npvalue);
};

typedef qcc::ManagedObj<_CredentialsHost> CredentialsHost;

#endif // _CREDENTIALSHOST_H
