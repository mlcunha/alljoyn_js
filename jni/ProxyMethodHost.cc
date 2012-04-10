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
#include "ProxyMethodHost.h"

#include "ErrorListenerNative.h"
#include "MessageListenerNative.h"
#include "PluginData.h"
#include "SignatureUtils.h"
#include "TypeMapping.h"
#include <alljoyn/AllJoynStd.h>
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

class ReplyReceiver : public ajn::ProxyBusObject::Listener, public ajn::MessageReceiver {
  public:
    class _Env {
      public:
        ReplyReceiver* thiz;
        Plugin plugin;
        BusAttachment busAttachment;
        ProxyBusObject proxyBusObject;
        qcc::String interfaceName;
        qcc::String methodName;
        MessageListenerNative* replyListenerNative;
        ErrorListenerNative* errorListenerNative;
        NPVariant* npargs;
        uint32_t npargCount;

        QStatus status;
        qcc::String errorMessage;

        _Env(ReplyReceiver* thiz, Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, qcc::String& interfaceName, qcc::String& methodName, MessageListenerNative* replyListenerNative, ErrorListenerNative* errorListenerNative, const NPVariant* npargs, uint32_t npargCount)
            : thiz(thiz)
            , plugin(plugin)
            , busAttachment(busAttachment)
            , proxyBusObject(proxyBusObject)
            , interfaceName(interfaceName)
            , methodName(methodName)
            , replyListenerNative(replyListenerNative)
            , errorListenerNative(errorListenerNative) {
            this->npargCount = npargCount;
            this->npargs = new NPVariant[this->npargCount];
            for (uint32_t i = 0; i < this->npargCount; ++i) {
                switch (npargs[i].type) {
                case NPVariantType_String: {
                    uint32_t UTF8Length = NPVARIANT_TO_STRING(npargs[i]).UTF8Length;
                    const NPUTF8* UTF8Characters = NPVARIANT_TO_STRING(npargs[i]).UTF8Characters;
                    char* chars = reinterpret_cast<char*>(NPN_MemAlloc(UTF8Length + 1));
                    strncpy(chars, UTF8Characters, UTF8Length);
                    chars[UTF8Length] = 0;
                    STRINGN_TO_NPVARIANT(chars, UTF8Length, this->npargs[i]);
                    break;
                }

                case NPVariantType_Object: {
                    this->npargs[i] = npargs[i];
                    NPN_RetainObject(NPVARIANT_TO_OBJECT(this->npargs[i]));
                    break;
                }

                default:
                    this->npargs[i] = npargs[i];
                    break;
                }
            }
        }
        ~_Env() {
            for (uint32_t i = 0; i < npargCount; ++i) {
                NPN_ReleaseVariantValue(&npargs[i]);
            }
            delete[] npargs;
            delete errorListenerNative;
            delete replyListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    ReplyReceiver(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, qcc::String& interfaceName, qcc::String& methodName, MessageListenerNative* replyListenerNative, ErrorListenerNative* errorListenerNative, const NPVariant* npargs, uint32_t npargCount)
        : env(this, plugin, busAttachment, proxyBusObject, interfaceName, methodName, replyListenerNative, errorListenerNative, npargs, npargCount) { }
    virtual ~ReplyReceiver() { }

    class IntrospectCBContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        QStatus status;
        IntrospectCBContext(Env& env, QStatus status)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , status(status) { }
    };
    virtual void IntrospectCB(QStatus status, ajn::ProxyBusObject* obj, void* context) {
        PluginData::DispatchCallback(env->plugin, _IntrospectCB, new IntrospectCBContext(env, status));
    }
    static void _IntrospectCB(PluginData::CallbackContext* ctx) {
        IntrospectCBContext* context = static_cast<IntrospectCBContext*>(ctx);
        Env& env = context->env;
        if (ER_OK != context->status) {
            QCC_LogError(context->status, ("IntrospectRemoteObjectAsync failed"));
        }

        const ajn::InterfaceDescription* iface;
        const ajn::InterfaceDescription::Member* method;
        size_t numArgs;
        ajn::MsgArg* args = 0;
        const char* begin;
        uint32_t timeout = ajn::ProxyBusObject::DefaultCallTimeout;
        uint8_t flags = 0;
        bool typeError = false;

        iface = env->busAttachment->GetInterface(env->interfaceName.c_str());
        if (!iface) {
            env->status = ER_BUS_NO_SUCH_INTERFACE;
            QCC_LogError(env->status, (""));
            goto exit;
        }
        method = iface->GetMember(env->methodName.c_str());
        if (!method) {
            env->status = ER_BUS_INTERFACE_NO_SUCH_MEMBER;
            QCC_LogError(env->status, (""));
            goto exit;
        }

        numArgs = ajn::SignatureUtils::CountCompleteTypes(method->signature.c_str());
        if (env->npargCount < numArgs) {
            env->status = ER_BAD_ARG_COUNT;
            QCC_LogError(env->status, (""));
            goto exit;
        }
        args = new ajn::MsgArg[numArgs];
        begin = method->signature.c_str();
        for (size_t i = 0; i < numArgs; ++i) {
            const char* end = begin;
            env->status = ajn::SignatureUtils::ParseCompleteType(end);
            if (ER_OK != env->status) {
                QCC_LogError(env->status, (""));
                goto exit;
            }
            qcc::String typeSignature(begin, end - begin);
            ToAny(env->plugin, env->npargs[i], typeSignature, args[i], typeError);
            if (typeError) {
                env->status = ER_BUS_BAD_VALUE;
                char errorMessage[128];
                snprintf(errorMessage, sizeof(errorMessage), "argument %lu is not a '%s'", (unsigned long)(i + 2), typeSignature.c_str());
                env->errorMessage = errorMessage;
                QCC_LogError(env->status, (""));
                goto exit;
            }
            begin = end;
        }

        if (numArgs != env->npargCount) {
            NPVariant params = env->npargs[env->npargCount - 1];
            if (!NPVARIANT_IS_OBJECT(params)) {
                env->status = ER_BUS_BAD_VALUE;
                char errorMessage[128];
                snprintf(errorMessage, sizeof(errorMessage), "argument %d is not an object", env->npargCount - 1 + 2);
                env->errorMessage = errorMessage;
                QCC_LogError(env->status, (""));
                goto exit;
            }

            NPVariant result;
            VOID_TO_NPVARIANT(result);
            NPN_GetProperty(env->plugin->npp, NPVARIANT_TO_OBJECT(params), NPN_GetStringIdentifier("timeout"), &result);
            if (!NPVARIANT_IS_VOID(result)) {
                timeout = ToUnsignedLong(env->plugin, result, typeError);
            }
            NPN_ReleaseVariantValue(&result);
            if (typeError) {
                env->status = ER_BUS_BAD_VALUE;
                env->errorMessage = "'timeout' is not a number";
                QCC_LogError(env->status, (""));
                goto exit;
            }

            VOID_TO_NPVARIANT(result);
            NPN_GetProperty(env->plugin->npp, NPVARIANT_TO_OBJECT(params), NPN_GetStringIdentifier("flags"), &result);
            if (!NPVARIANT_IS_VOID(result)) {
                flags = ToOctet(env->plugin, result, typeError);
            }
            NPN_ReleaseVariantValue(&result);
            if (typeError) {
                env->status = ER_BUS_BAD_VALUE;
                env->errorMessage = "'flags' is not a number";
                QCC_LogError(env->status, (""));
                goto exit;
            }
        }

#if !defined(NDEBUG)
        {
            qcc::String str = ajn::MsgArg::ToString(args, numArgs);
            QCC_DbgTrace(("%s", str.c_str()));
        }
#endif
        env->status = env->proxyBusObject->MethodCallAsync(*method, env->thiz, env->replyListenerNative ? static_cast<ajn::MessageReceiver::ReplyHandler>(&ReplyReceiver::ReplyHandler) : 0, args, numArgs, 0, timeout, flags);

    exit:
        delete[] args;
        if ((ER_OK == env->status) && !env->replyListenerNative) {
            ReplyReceiver* thiz = env->thiz;
            env->thiz = 0;
            delete thiz;
        } else if (ER_OK != env->status) {
            ajn::Message message(*env->busAttachment);
            env->thiz->ReplyHandler(message, 0);
        }
    }

    class ReplyHandlerContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::Message message;
        ReplyHandlerContext(Env& env, ajn::Message& message)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , message(message) { }
    };
    virtual void ReplyHandler(ajn::Message& message, void*) {
        Plugin plugin = env->plugin;
        ReplyHandlerContext* context = new ReplyHandlerContext(env, message);
        env->thiz = 0;
        delete this;
        PluginData::DispatchCallback(plugin, _ReplyHandler, context);
    }
    static void _ReplyHandler(PluginData::CallbackContext* ctx) {
        ReplyHandlerContext* context = static_cast<ReplyHandlerContext*>(ctx);
        Env& env = context->env;
        if (ER_OK != env->status) {
            if (env->errorListenerNative) {
                if (!env->errorMessage.empty()) {
                    BusErrorHost busError(env->plugin, "BusError", env->errorMessage, env->status);
                    env->errorListenerNative->onError(busError);
                } else {
                    BusErrorHost busError(env->plugin, env->status);
                    env->errorListenerNative->onError(busError);
                }
            } else {
                QCC_LogError(env->status, (("No errorListener for status")));
            }
        } else if (ajn::MESSAGE_ERROR == context->message->GetType()) {
            QStatus status = ER_BUS_REPLY_IS_ERROR_MESSAGE;
            qcc::String errorMessage;
            const char* errorName = context->message->GetErrorName(&errorMessage);
            if (errorName && !strcmp(ajn::org::alljoyn::Bus::ErrorName, errorName) && context->message->GetArg(1)) {
                status = static_cast<QStatus>(context->message->GetArg(1)->v_uint16);
            }
            /*
             * Technically, an empty error message field is not the same as no error message field,
             * but treat them the same here.
             */
            if (env->errorListenerNative) {
                if (errorName) {
                    qcc::String name(errorName);
                    BusErrorHost busError(env->plugin, name, errorMessage, status);
                    env->errorListenerNative->onError(busError);
                } else {
                    BusErrorHost busError(env->plugin, status);
                    env->errorListenerNative->onError(busError);
                }
            } else {
                QCC_LogError(status, ("No errorListener for name='%s', message='%s'", errorName, errorMessage.c_str()));
            }
        } else {
            if (env->replyListenerNative) {
                MessageHost messageHost(env->plugin, env->busAttachment, context->message);
                size_t numArgs;
                const ajn::MsgArg* args;
                context->message->GetArgs(numArgs, args);
#if !defined(NDEBUG)
                qcc::String str = ajn::MsgArg::ToString(args, numArgs);
                QCC_DbgTrace(("%s", str.c_str()));
#endif
                env->replyListenerNative->onMessage(messageHost, args, numArgs);
            } else {
                /*
                 * The spec allows the remote side to send a reply even if the method is annotated with
                 * NoReply.  So this is more of a warning than anything else.
                 */
                QCC_LogError(ER_NONE, (("Message reply received, but no replyListener")));
            }
        }
    }
};

_ProxyMethodHost::_ProxyMethodHost(Plugin& plugin, BusAttachment& busAttachment, ProxyBusObject& proxyBusObject, const char* interfaceName, const char* methodName)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)
    , proxyBusObject(proxyBusObject)
    , interfaceName(interfaceName)
    , methodName(methodName)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    OPERATION("apply", &_ProxyMethodHost::apply);

    CALLER(&_ProxyMethodHost::methodCall);
}

_ProxyMethodHost::~_ProxyMethodHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
}

bool _ProxyMethodHost::apply(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    bool typeError = false;
    NPVariant length;
    uint32_t len = 0;
    NPVariant* argList = 0;
    bool ret;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }

    /*
     * thisArg of apply(thisArg, argArray) is ignored since the plugin can do nothing with it.
     */

    if (argCount > 0) {
        if (!NPVARIANT_IS_OBJECT(args[1])) {
            typeError = true;
            plugin->RaiseTypeError("argument 1 must be an array");
            goto exit;
        }
        VOID_TO_NPVARIANT(length);
        if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[1]), NPN_GetStringIdentifier("length"), &length) ||
            NPVARIANT_IS_NULL(length) ||
            NPVARIANT_IS_VOID(length)) {
            typeError = true;
            plugin->RaiseTypeError("argument 1 must be an array");
        }
        if (!typeError) {
            len = ToUnsignedLong(plugin, length, typeError);
            if (typeError) {
                plugin->RaiseTypeError("argument 1 length property must be a number");
            }
        }
        NPN_ReleaseVariantValue(&length);
        if (typeError) {
            goto exit;
        }

        argList = new NPVariant[len];
        for (uint32_t i = 0; i < len; ++i) {
            VOID_TO_NPVARIANT(argList[i]);
        }
        for (uint32_t i = 0; i < len; ++i) {
            if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[1]), NPN_GetIntIdentifier(i), &argList[i])) {
                typeError = true;
                plugin->RaiseTypeError("get element of argArray failed");
                goto exit;
            }
        }
    }

    ret = methodCall(argList, len, result);

exit:
    if (argList) {
        for (uint32_t i = 0; i < len; ++i) {
            NPN_ReleaseVariantValue(&argList[i]);
        }
        delete[] argList;
    }
    if (!typeError) {
        return ret;
    } else {
        return false;
    }
}

bool _ProxyMethodHost::methodCall(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    MessageListenerNative* replyListenerNative = 0;
    ErrorListenerNative* errorListenerNative = 0;
    ReplyReceiver* replyReceiver = 0;
    bool typeError = false;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    replyListenerNative = ToNativeObject<MessageListenerNative>(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }
    errorListenerNative = ToNativeObject<ErrorListenerNative>(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not an object");
        goto exit;
    }

    replyReceiver = new ReplyReceiver(plugin, busAttachment, proxyBusObject, interfaceName, methodName, replyListenerNative, errorListenerNative, &args[2], argCount - 2);
    replyListenerNative = 0; /* replyReceiver now owns replyListenerNative */
    errorListenerNative = 0; /* replyReceiver now owns errorListenerNative */
    if (proxyBusObject->ImplementsInterface(interfaceName.c_str())) {
        replyReceiver->IntrospectCB(ER_OK, 0, 0);
    } else if (busAttachment->GetInterface(interfaceName.c_str())) {
        QStatus status = proxyBusObject->AddInterface(*busAttachment->GetInterface(interfaceName.c_str()));
        replyReceiver->IntrospectCB(status, 0, 0);
    } else {
        QStatus status = proxyBusObject->IntrospectRemoteObjectAsync(replyReceiver, static_cast<ajn::ProxyBusObject::Listener::IntrospectCB>(&ReplyReceiver::IntrospectCB), 0);
        if (ER_OK != status) {
            replyReceiver->IntrospectCB(status, 0, 0);
        }
    }
    replyReceiver = 0; /* alljoyn now owns replyReceiver */

exit:
    delete replyListenerNative;
    delete errorListenerNative;
    delete replyReceiver;
    if (!typeError) {
        VOID_TO_NPVARIANT(*result);
        return true;
    } else {
        return false;
    }
}
