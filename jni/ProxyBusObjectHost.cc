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
#include "ProxyBusObjectHost.h"

#include "BusUtil.h"
#include "ErrorListenerNative.h"
#include "ProxyChildrenHost.h"
#include "SuccessListenerNative.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

class IntrospectRemoteObjectAsyncCB : public ajn::ProxyBusObject::Listener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        ProxyBusObject proxyBusObject;
        SuccessListenerNative* successListenerNative;
        ErrorListenerNative* errorListenerNative;
        _Env(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, SuccessListenerNative* successListenerNative, ErrorListenerNative* errorListenerNative)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , proxyBusObject(proxyBusObject)
            , successListenerNative(successListenerNative)
            , errorListenerNative(errorListenerNative) { }
        ~_Env() {
            delete errorListenerNative;
            delete successListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    IntrospectRemoteObjectAsyncCB(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, SuccessListenerNative* successListenerNative, ErrorListenerNative* errorListenerNative)
        : env(plugin, busAttachment, proxyBusObject, successListenerNative, errorListenerNative) { }
    virtual ~IntrospectRemoteObjectAsyncCB() { }

    class IntrospectCBContext : public PluginData::CallbackContext {
      public:
        Env env;
        QStatus status;
        IntrospectCBContext(Env& env, QStatus status)
            : env(env)
            , status(status) { }
    };
    virtual void IntrospectCB(QStatus status, ajn::ProxyBusObject*, void*) {
        PluginData::Callback callback(env->plugin, _IntrospectCB);
        callback->context = new IntrospectCBContext(env, status);
        delete this;
        PluginData::DispatchCallback(callback);
    }
    static void _IntrospectCB(PluginData::CallbackContext* ctx) {
        IntrospectCBContext* context = static_cast<IntrospectCBContext*>(ctx);
        if (ER_OK == context->status) {
            context->env->successListenerNative->onSuccess();
        } else {
            BusErrorHost busError(context->env->plugin, context->status);
            context->env->errorListenerNative->onError(busError);
        }
    }
};

class _ProxyBusObjectHostImpl {
  public:
    ProxyChildrenHost proxyChildrenHost;
    _ProxyBusObjectHostImpl(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject)
        : proxyChildrenHost(plugin, busAttachment, proxyBusObject) { }
};

_ProxyBusObjectHost::_ProxyBusObjectHost(Plugin& plugin, BusAttachment& busAttachment, const char* serviceName, const char* path, ajn::SessionId sessionId)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
    , proxyBusObject(*busAttachment, serviceName, path, sessionId)
{
    QCC_DbgTrace(("%s(serviceName=%s,path=%s,sessionId=%u)", __FUNCTION__, serviceName, path, sessionId));
    Initialize();
}

_ProxyBusObjectHost::_ProxyBusObjectHost(Plugin& plugin, BusAttachment& busAttachment, ajn::ProxyBusObject* proxyBusObject)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
    , proxyBusObject(*proxyBusObject)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    Initialize();
}

void _ProxyBusObjectHost::Initialize()
{
    impl = new _ProxyBusObjectHostImpl(plugin, busAttachment, proxyBusObject);

    ATTRIBUTE("path", &_ProxyBusObjectHost::getPath, 0);
    ATTRIBUTE("children", &_ProxyBusObjectHost::getChildren, 0);
    ATTRIBUTE("serviceName", &_ProxyBusObjectHost::getServiceName, 0);

    OPERATION("introspect", &_ProxyBusObjectHost::introspect);
    OPERATION("parseXML", &_ProxyBusObjectHost::parseXML);
    OPERATION("secureConnection", &_ProxyBusObjectHost::secureConnection);

    GETTER(&_ProxyBusObjectHost::getProxyInterface);
    ENUMERATOR(&_ProxyBusObjectHost::enumerateProxyInterfaces);
}

_ProxyBusObjectHost::~_ProxyBusObjectHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    delete impl;
}

bool _ProxyBusObjectHost::HasProperty(const qcc::String& name)
{
    bool has = ScriptableObject::HasProperty(name);
    if (!has) {
        has = ajn::IsLegalInterfaceName(name.c_str());
    }
    return has;
}

bool _ProxyBusObjectHost::getPath(NPVariant* result)
{
    ToDOMString(plugin, proxyBusObject->GetPath(), *result);
    return true;
}

bool _ProxyBusObjectHost::getChildren(NPVariant* result)
{
    if (proxyBusObject->GetChildren()) {
        ToHostObject<ProxyChildrenHost>(plugin, impl->proxyChildrenHost, *result);
    } else {
        NULL_TO_NPVARIANT(*result);
    }
    return true;
}

bool _ProxyBusObjectHost::getServiceName(NPVariant* result)
{
    ToDOMString(plugin, proxyBusObject->GetServiceName(), *result);
    return true;
}

bool _ProxyBusObjectHost::introspect(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    SuccessListenerNative* successListenerNative = 0;
    ErrorListenerNative* errorListenerNative = 0;
    IntrospectRemoteObjectAsyncCB* callback = 0;
    bool typeError = false;
    QStatus status = ER_OK;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    successListenerNative = ToNativeObject<SuccessListenerNative>(plugin, args[0], typeError);
    if (typeError || !successListenerNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }
    errorListenerNative = ToNativeObject<ErrorListenerNative>(plugin, args[1], typeError);
    if (typeError || !errorListenerNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 1 is not an object");
        goto exit;
    }

    callback = new IntrospectRemoteObjectAsyncCB(plugin, busAttachment, proxyBusObject, successListenerNative, errorListenerNative);
    successListenerNative = 0; /* callback now owns successListenerNative */
    errorListenerNative = 0; /* callback now owns errorListenerNative */

    status = proxyBusObject->IntrospectRemoteObjectAsync(callback, static_cast<ajn::ProxyBusObject::Listener::IntrospectCB>(&IntrospectRemoteObjectAsyncCB::IntrospectCB), 0);
    if (ER_OK == status) {
        callback = 0; /* alljoyn owns callback */
    } else {
        callback->IntrospectCB(status, 0, 0);
        callback = 0; /* IntrospectCB will delete callback */
    }

exit:
    delete callback;
    delete errorListenerNative;
    delete successListenerNative;
    if (!typeError) {
        VOID_TO_NPVARIANT(*result);
        return true;
    } else {
        return false;
    }
}

bool _ProxyBusObjectHost::parseXML(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String source;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    source = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }

    status = proxyBusObject->ParseXml(source.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _ProxyBusObjectHost::secureConnection(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    bool typeError = false;
    QStatus status = ER_OK;
    bool forceAuth = false;

    if (argCount > 0) {
        forceAuth = ToBoolean(plugin, args[0], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 0 is not a boolean");
            goto exit;
        }
    }

    status = proxyBusObject->SecureConnectionAsync(forceAuth);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _ProxyBusObjectHost::getProxyInterface(const qcc::String& name, NPVariant* result)
{
    if (proxyInterfaces.find(name) == proxyInterfaces.end()) {
        const char* interfaceName = name.c_str();
        std::pair<qcc::String, ProxyInterfaceHost> element(name, ProxyInterfaceHost(plugin, busAttachment, proxyBusObject,
                                                                                    interfaceName));
        proxyInterfaces.insert(element);
    }
    std::map<qcc::String, ProxyInterfaceHost>::iterator it = proxyInterfaces.find(name);
    ToHostObject<ProxyInterfaceHost>(plugin, it->second, *result);
    return true;
}

bool _ProxyBusObjectHost::enumerateProxyInterfaces(NPIdentifier** value, uint32_t* count)
{
    size_t numIfaces = proxyBusObject->GetInterfaces();
    const ajn::InterfaceDescription** ifaces = new const ajn::InterfaceDescription *[numIfaces];
    proxyBusObject->GetInterfaces(ifaces, numIfaces);

    *count = numIfaces;
    *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
    NPIdentifier* v = *value;
    for (size_t i = 0; i < numIfaces; ++i) {
        *v++ = NPN_GetStringIdentifier(ifaces[i]->GetName());
    }

    delete[] ifaces;
    return true;
}
