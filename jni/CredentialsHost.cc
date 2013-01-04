/*
 * Copyright 2011-2012, Qualcomm Innovation Center, Inc.
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
#include "CredentialsHost.h"

#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

_CredentialsHost::_CredentialsHost(Plugin& plugin, ajn::AuthListener::Credentials& credentials)
    : ScriptableObject(plugin, _CredentialsInterface::Constants())
    , credentials(credentials)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ATTRIBUTE("password", &_CredentialsHost::getPassword, &_CredentialsHost::setPassword);
    ATTRIBUTE("userName", &_CredentialsHost::getUserName, &_CredentialsHost::setUserName);
    ATTRIBUTE("certChain", &_CredentialsHost::getCertChain, &_CredentialsHost::setCertChain);
    ATTRIBUTE("privateKey", &_CredentialsHost::getPrivateKey, &_CredentialsHost::setPrivateKey);
    ATTRIBUTE("logonEntry", &_CredentialsHost::getLogonEntry, &_CredentialsHost::setLogonEntry);
    ATTRIBUTE("expiration", &_CredentialsHost::getExpiration, &_CredentialsHost::setExpiration);
}

_CredentialsHost::~_CredentialsHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _CredentialsHost::getPassword(NPVariant* result)
{
    if (credentials.IsSet(ajn::AuthListener::CRED_PASSWORD)) {
        ToDOMString(plugin, credentials.GetPassword(), *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::getUserName(NPVariant* result)
{
    if (credentials.IsSet(ajn::AuthListener::CRED_USER_NAME)) {
        ToDOMString(plugin, credentials.GetUserName(), *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::getCertChain(NPVariant* result)
{
    if (credentials.IsSet(ajn::AuthListener::CRED_CERT_CHAIN)) {
        ToDOMString(plugin, credentials.GetCertChain(), *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::getPrivateKey(NPVariant* result)
{
    if (credentials.IsSet(ajn::AuthListener::CRED_PRIVATE_KEY)) {
        ToDOMString(plugin, credentials.GetPrivateKey(), *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::getLogonEntry(NPVariant* result)
{
    if (credentials.IsSet(ajn::AuthListener::CRED_LOGON_ENTRY)) {
        ToDOMString(plugin, credentials.GetLogonEntry(), *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::getExpiration(NPVariant* result)
{
    uint32_t expiration = credentials.GetExpiration();
    if (0xFFFFFFFF != expiration) {
        ToUnsignedLong(plugin, expiration, *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _CredentialsHost::setPassword(const NPVariant* value)
{
    bool typeError;
    qcc::String password = ToDOMString(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetPassword(password);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a string");
        return false;
    }
}

bool _CredentialsHost::setUserName(const NPVariant* value)
{
    bool typeError;
    qcc::String userName = ToDOMString(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetUserName(userName);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a string");
        return false;
    }
}

bool _CredentialsHost::setCertChain(const NPVariant* value)
{
    bool typeError;
    qcc::String certChain = ToDOMString(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetCertChain(certChain);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a string");
        return false;
    }
}

bool _CredentialsHost::setPrivateKey(const NPVariant* value)
{
    bool typeError;
    qcc::String privateKey = ToDOMString(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetPrivateKey(privateKey);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a string");
        return false;
    }
}

bool _CredentialsHost::setLogonEntry(const NPVariant* value)
{
    bool typeError;
    qcc::String logonEntry = ToDOMString(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetLogonEntry(logonEntry);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a string");
        return false;
    }
}

bool _CredentialsHost::setExpiration(const NPVariant* value)
{
    bool typeError;
    uint32_t expiration = ToUnsignedLong(plugin, *value, typeError);
    if (!typeError) {
        credentials.SetExpiration(expiration);
        return true;
    } else {
        plugin->RaiseTypeError("value is not a number");
        return false;
    }
}
