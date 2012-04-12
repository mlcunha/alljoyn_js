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
#include "BusAttachmentHost.h"

#include "AcceptSessionJoinerListenerNative.h"
#include "AuthListenerNative.h"
#include "BusListenerNative.h"
#include "BusObject.h"
#include "BusObjectNative.h"
#include "BusUtil.h"
#include "ErrorListenerNative.h"
#include "JoinSessionSuccessListenerNative.h"
#include "MessageHost.h"
#include "MessageListenerNative.h"
#include "SessionJoinedListenerNative.h"
#include "SessionLostListenerNative.h"
#include "SessionMemberAddedListenerNative.h"
#include "SessionMemberRemovedListenerNative.h"
#include "SignalEmitterHost.h"
#include "SocketFdHost.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <assert.h>

#define QCC_MODULE "ALLJOYN_JS"

class SignalReceiver : public ajn::MessageReceiver {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        MessageListenerNative* signalListener;
        const ajn::InterfaceDescription::Member* signal;
        qcc::String sourcePath;
        _Env(Plugin& plugin, BusAttachment& busAttachment, MessageListenerNative* signalListener, const ajn::InterfaceDescription::Member* signal, qcc::String& sourcePath)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , signalListener(signalListener)
            , signal(signal)
            , sourcePath(sourcePath) {
            QCC_DbgTrace(("%s this=%p", __FUNCTION__, this));
        }
        ~_Env() {
            delete signalListener;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    SignalReceiver(Plugin& plugin, BusAttachment& busAttachment, MessageListenerNative* signalListener, const ajn::InterfaceDescription::Member* signal, qcc::String& sourcePath)
        : env(plugin, busAttachment, signalListener, signal, sourcePath) {
        QCC_DbgTrace(("%s this=%p", __FUNCTION__, this));
    }
    virtual ~SignalReceiver() {
        QCC_DbgTrace(("%s this=%p", __FUNCTION__, this));
    }

    class SignalHandlerContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        const ajn::InterfaceDescription::Member* member;
        qcc::String sourcePath;
        ajn::Message message;
        SignalHandlerContext(Env& env, const ajn::InterfaceDescription::Member* member, const char* sourcePath, ajn::Message& message)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , member(member)
            , sourcePath(sourcePath)
            , message(message) { }
    };
    virtual void SignalHandler(const ajn::InterfaceDescription::Member* member, const char* sourcePath, ajn::Message& message) {
        PluginData::DispatchCallback(env->plugin, _SignalHandler, new SignalHandlerContext(env, member, sourcePath, message));
    }
    static void _SignalHandler(PluginData::CallbackContext* ctx) {
        SignalHandlerContext* context = static_cast<SignalHandlerContext*>(ctx);
        MessageHost messageHost(context->env->plugin, context->env->busAttachment, context->message);
        size_t numArgs;
        const ajn::MsgArg* args;
        context->message->GetArgs(numArgs, args);
        context->env->signalListener->onMessage(messageHost, args, numArgs);
    }
};

class BusListener : public ajn::BusListener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachmentHost busAttachmentHost;
        BusAttachment busAttachment;
        BusListenerNative* busListenerNative;
        _Env(Plugin& plugin, BusAttachmentHost& busAttachmentHost, BusAttachment& busAttachment, BusListenerNative* busListenerNative)
            : plugin(plugin)
            , busAttachmentHost(busAttachmentHost)
            , busAttachment(busAttachment)
            , busListenerNative(busListenerNative) { }
        ~_Env() {
            delete busListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    BusListener(Plugin& plugin, BusAttachmentHost& busAttachmentHost, BusAttachment& busAttachment, BusListenerNative* busListenerNative)
        : env(plugin, busAttachmentHost, busAttachment, busListenerNative) { }
    virtual ~BusListener() { }

    class ListenerRegisteredContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ListenerRegisteredContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void ListenerRegistered(ajn::BusAttachment* bus) {
        PluginData::DispatchCallback(env->plugin, _ListenerRegistered, new ListenerRegisteredContext(env));
    }
    static void _ListenerRegistered(PluginData::CallbackContext* ctx) {
        ListenerRegisteredContext* context = static_cast<ListenerRegisteredContext*>(ctx);
        context->env->busListenerNative->onRegistered(context->env->busAttachmentHost);
    }

    class ListenerUnregisteredContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ListenerUnregisteredContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void ListenerUnregistered() {
        PluginData::DispatchCallback(env->plugin, _ListenerUnregistered, new ListenerUnregisteredContext(env));
    }
    static void _ListenerUnregistered(PluginData::CallbackContext* ctx) {
        ListenerUnregisteredContext* context = static_cast<ListenerUnregisteredContext*>(ctx);
        context->env->busListenerNative->onUnregistered();
    }

    class FoundAdvertisedNameContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        qcc::String name;
        ajn::TransportMask transport;
        qcc::String namePrefix;
        FoundAdvertisedNameContext(Env& env, const char* name, ajn::TransportMask transport, const char* namePrefix)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , name(name)
            , transport(transport)
            , namePrefix(namePrefix) { }
    };
    virtual void FoundAdvertisedName(const char* name, ajn::TransportMask transport, const char* namePrefix) {
        PluginData::DispatchCallback(env->plugin, _FoundAdvertisedName, new FoundAdvertisedNameContext(env, name, transport, namePrefix));
    }
    static void _FoundAdvertisedName(PluginData::CallbackContext* ctx) {
        FoundAdvertisedNameContext* context = static_cast<FoundAdvertisedNameContext*>(ctx);
        context->env->busListenerNative->onFoundAdvertisedName(context->name, context->transport, context->namePrefix);
    }

    class LostAdvertisedNameContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        qcc::String name;
        ajn::TransportMask transport;
        qcc::String namePrefix;
        LostAdvertisedNameContext(Env& env, const char* name, ajn::TransportMask transport, const char* namePrefix)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , name(name)
            , transport(transport)
            , namePrefix(namePrefix) { }
    };
    virtual void LostAdvertisedName(const char* name, ajn::TransportMask transport, const char* namePrefix) {
        PluginData::DispatchCallback(env->plugin, _LostAdvertisedName, new LostAdvertisedNameContext(env, name, transport, namePrefix));
    }
    static void _LostAdvertisedName(PluginData::CallbackContext* ctx) {
        LostAdvertisedNameContext* context = static_cast<LostAdvertisedNameContext*>(ctx);
        context->env->busListenerNative->onLostAdvertisedName(context->name, context->transport, context->namePrefix);
    }

    class NameOwnerChangedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        qcc::String busName;
        qcc::String previousOwner;
        qcc::String newOwner;
        NameOwnerChangedContext(Env& env, const char* busName, const char* previousOwner, const char* newOwner)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , busName(busName)
            , previousOwner(previousOwner)
            , newOwner(newOwner) { }
    };
    virtual void NameOwnerChanged(const char* busName, const char* previousOwner, const char* newOwner) {
        PluginData::DispatchCallback(env->plugin, _NameOwnerChanged, new NameOwnerChangedContext(env, busName, previousOwner, newOwner));
    }
    static void _NameOwnerChanged(PluginData::CallbackContext* ctx) {
        NameOwnerChangedContext* context = static_cast<NameOwnerChangedContext*>(ctx);
        context->env->busListenerNative->onNameOwnerChanged(context->busName, context->previousOwner, context->newOwner);
    }

    class BusStoppingContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        BusStoppingContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void BusStopping() {
        PluginData::DispatchCallback(env->plugin, _BusStopping, new BusStoppingContext(env));
    }
    static void _BusStopping(PluginData::CallbackContext* ctx) {
        BusStoppingContext* context = static_cast<BusStoppingContext*>(ctx);
        context->env->busListenerNative->onStopping();
    }

    class BusDisconnectedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        BusDisconnectedContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void BusDisconnected() {
        PluginData::DispatchCallback(env->plugin, _BusDisconnected, new BusDisconnectedContext(env));
    }
    static void _BusDisconnected(PluginData::CallbackContext* ctx) {
        BusDisconnectedContext* context = static_cast<BusDisconnectedContext*>(ctx);
        context->env->busListenerNative->onDisconnected();
    }
};

class SessionPortListener : public ajn::SessionPortListener, public ajn::SessionListener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        AcceptSessionJoinerListenerNative* acceptSessionListenerNative;
        SessionJoinedListenerNative* sessionJoinedListenerNative;
        SessionLostListenerNative* sessionLostListenerNative;
        SessionMemberAddedListenerNative* sessionMemberAddedListenerNative;
        SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative;
        _Env(Plugin& plugin, BusAttachment& busAttachment, AcceptSessionJoinerListenerNative* acceptSessionListenerNative, SessionJoinedListenerNative* sessionJoinedListenerNative, SessionLostListenerNative* sessionLostListenerNative, SessionMemberAddedListenerNative* sessionMemberAddedListenerNative, SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , acceptSessionListenerNative(acceptSessionListenerNative)
            , sessionJoinedListenerNative(sessionJoinedListenerNative)
            , sessionLostListenerNative(sessionLostListenerNative)
            , sessionMemberAddedListenerNative(sessionMemberAddedListenerNative)
            , sessionMemberRemovedListenerNative(sessionMemberRemovedListenerNative) { }
        ~_Env() {
            delete sessionJoinedListenerNative;
            delete acceptSessionListenerNative;
            delete sessionLostListenerNative;
            delete sessionMemberAddedListenerNative;
            delete sessionMemberRemovedListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    qcc::Event cancelEvent;
    SessionPortListener(Plugin& plugin, BusAttachment& busAttachment, AcceptSessionJoinerListenerNative* acceptSessionListenerNative, SessionJoinedListenerNative* sessionJoinedListenerNative, SessionLostListenerNative* sessionLostListenerNative, SessionMemberAddedListenerNative* sessionMemberAddedListenerNative, SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative)
        : env(plugin, busAttachment, acceptSessionListenerNative, sessionJoinedListenerNative, sessionLostListenerNative, sessionMemberAddedListenerNative, sessionMemberRemovedListenerNative) { }
    virtual ~SessionPortListener() { }

    class AcceptSessionJoinerContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        ajn::SessionPort sessionPort;
        qcc::String joiner;
        const ajn::SessionOpts opts;
        AcceptSessionJoinerContext(Env& env, ajn::SessionPort sessionPort, const char* joiner, const ajn::SessionOpts& opts)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , sessionPort(sessionPort)
            , joiner(joiner)
            , opts(opts) { }
    };
    virtual bool AcceptSessionJoiner(ajn::SessionPort sessionPort, const char* joiner, const ajn::SessionOpts& opts) {
        AcceptSessionJoinerContext context(env, sessionPort, joiner, opts);
        PluginData::DispatchCallback(env->plugin, _AcceptSessionJoiner, &context);
        /*
         * Complex processing here to prevent UI thread from deadlocking if it ends up calling
         * unbindSessionPort.
         *
         * UnbindSessionPort() will block until all AcceptSessionJoiner callbacks have returned.
         * Setting the cancelEvent will unblock any synchronous callback.  Then a little extra
         * coordination is needed to remove the dispatch context so that when the dispatched callback
         * is run it does nothing.
         */
        std::vector<qcc::Event*> check;
        check.push_back(&context.event);
        check.push_back(&cancelEvent);
        std::vector<qcc::Event*> signaled;
        signaled.clear();
        QStatus status = qcc::Event::Wait(check, signaled);
        assert(ER_OK == status);
        if (ER_OK != status) {
            QCC_LogError(status, ("Wait failed"));
        }
        for (std::vector<qcc::Event*>::iterator i = signaled.begin(); i != signaled.end(); ++i) {
            if (*i == &cancelEvent) {
                PluginData::CancelCallback(env->plugin, _AcceptSessionJoiner, &context);
                qcc::Event::Wait(context.event);
                context.status = ER_ALERTED_THREAD;
                break;
            }
        }
        return (ER_OK == context.status);
    }
    static void _AcceptSessionJoiner(PluginData::CallbackContext* ctx) {
        AcceptSessionJoinerContext* context = static_cast<AcceptSessionJoinerContext*>(ctx);
        if (context->env->acceptSessionListenerNative) {
            SessionOptsHost optsHost(context->env->plugin, context->opts);
            bool accepted = context->env->acceptSessionListenerNative->onAccept(context->sessionPort, context->joiner, optsHost);
            context->status = accepted ? ER_OK : ER_FAIL;
        } else {
            context->status = ER_FAIL;
        }
    }

    class SessionJoinedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionPort sessionPort;
        ajn::SessionId id;
        qcc::String joiner;
        SessionJoinedContext(Env& env, ajn::SessionPort sessionPort, ajn::SessionId id, const char* joiner)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , sessionPort(sessionPort)
            , id(id)
            , joiner(joiner) { }
    };
    virtual void SessionJoined(ajn::SessionPort sessionPort, ajn::SessionId id, const char* joiner) {
        /*
         * We have to do this here, otherwise we can miss the session member added callback (the app won't have called
         * setSessionListener soon enough).
         */
        if (env->sessionLostListenerNative || env->sessionMemberAddedListenerNative || env->sessionMemberRemovedListenerNative) {
            QStatus status = env->busAttachment->SetSessionListener(id, this);
            if (ER_OK != status) {
                QCC_LogError(status, ("SetSessionListener failed"));
            }
        }
        PluginData::DispatchCallback(env->plugin, _SessionJoined, new SessionJoinedContext(env, sessionPort, id, joiner));
    }
    static void _SessionJoined(PluginData::CallbackContext* ctx) {
        SessionJoinedContext* context = static_cast<SessionJoinedContext*>(ctx);
        if (context->env->sessionJoinedListenerNative) {
            context->env->sessionJoinedListenerNative->onJoined(context->sessionPort, context->id, context->joiner);
        }
    }

    class SessionLostContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        SessionLostContext(Env& env, ajn::SessionId id)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id) { }
    };
    virtual void SessionLost(ajn::SessionId id) {
        PluginData::DispatchCallback(env->plugin, _SessionLost, new SessionLostContext(env, id));
    }
    static void _SessionLost(PluginData::CallbackContext* ctx) {
        SessionLostContext* context = static_cast<SessionLostContext*>(ctx);
        if (context->env->sessionLostListenerNative) {
            context->env->sessionLostListenerNative->onLost(context->id);
        }
    }

    class SessionMemberAddedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        qcc::String uniqueName;
        SessionMemberAddedContext(Env& env, ajn::SessionId id, const char* uniqueName)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id)
            , uniqueName(uniqueName) { }
    };
    virtual void SessionMemberAdded(ajn::SessionId id, const char* uniqueName) {
        PluginData::DispatchCallback(env->plugin, _SessionMemberAdded, new SessionMemberAddedContext(env, id, uniqueName));
    }
    static void _SessionMemberAdded(PluginData::CallbackContext* ctx) {
        SessionMemberAddedContext* context = static_cast<SessionMemberAddedContext*>(ctx);
        if (context->env->sessionMemberAddedListenerNative) {
            context->env->sessionMemberAddedListenerNative->onMemberAdded(context->id, context->uniqueName);
        }
    }

    class SessionMemberRemovedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        qcc::String uniqueName;
        SessionMemberRemovedContext(Env& env, ajn::SessionId id, const char* uniqueName)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id)
            , uniqueName(uniqueName) { }
    };
    virtual void SessionMemberRemoved(ajn::SessionId id, const char* uniqueName) {
        PluginData::DispatchCallback(env->plugin, _SessionMemberRemoved, new SessionMemberRemovedContext(env, id, uniqueName));
    }
    static void _SessionMemberRemoved(PluginData::CallbackContext* ctx) {
        SessionMemberRemovedContext* context = static_cast<SessionMemberRemovedContext*>(ctx);
        if (context->env->sessionMemberRemovedListenerNative) {
            context->env->sessionMemberRemovedListenerNative->onMemberRemoved(context->id, context->uniqueName);
        }
    }
};

class SessionListener : public ajn::SessionListener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        SessionLostListenerNative* sessionLostListenerNative;
        SessionMemberAddedListenerNative* sessionMemberAddedListenerNative;
        SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative;
        _Env(Plugin& plugin, BusAttachment& busAttachment, SessionLostListenerNative* sessionLostListenerNative, SessionMemberAddedListenerNative* sessionMemberAddedListenerNative, SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , sessionLostListenerNative(sessionLostListenerNative)
            , sessionMemberAddedListenerNative(sessionMemberAddedListenerNative)
            , sessionMemberRemovedListenerNative(sessionMemberRemovedListenerNative) { }
        ~_Env() {
            delete sessionLostListenerNative;
            delete sessionMemberAddedListenerNative;
            delete sessionMemberRemovedListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    SessionListener(Plugin& plugin, BusAttachment& busAttachment, SessionLostListenerNative* sessionLostListenerNative, SessionMemberAddedListenerNative* sessionMemberAddedListenerNative, SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative)
        : env(plugin, busAttachment, sessionLostListenerNative, sessionMemberAddedListenerNative, sessionMemberRemovedListenerNative) { }
    virtual ~SessionListener() { }

    class SessionLostContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        SessionLostContext(Env& env, ajn::SessionId id)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id) { }
    };
    virtual void SessionLost(ajn::SessionId id) {
        PluginData::DispatchCallback(env->plugin, _SessionLost, new SessionLostContext(env, id));
    }
    static void _SessionLost(PluginData::CallbackContext* ctx) {
        SessionLostContext* context = static_cast<SessionLostContext*>(ctx);
        if (context->env->sessionLostListenerNative) {
            context->env->sessionLostListenerNative->onLost(context->id);
        }
    }

    class SessionMemberAddedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        qcc::String uniqueName;
        SessionMemberAddedContext(Env& env, ajn::SessionId id, const char* uniqueName)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id)
            , uniqueName(uniqueName) { }
    };
    virtual void SessionMemberAdded(ajn::SessionId id, const char* uniqueName) {
        PluginData::DispatchCallback(env->plugin, _SessionMemberAdded, new SessionMemberAddedContext(env, id, uniqueName));
    }
    static void _SessionMemberAdded(PluginData::CallbackContext* ctx) {
        SessionMemberAddedContext* context = static_cast<SessionMemberAddedContext*>(ctx);
        if (context->env->sessionMemberAddedListenerNative) {
            context->env->sessionMemberAddedListenerNative->onMemberAdded(context->id, context->uniqueName);
        }
    }

    class SessionMemberRemovedContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ajn::SessionId id;
        qcc::String uniqueName;
        SessionMemberRemovedContext(Env& env, ajn::SessionId id, const char* uniqueName)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , id(id)
            , uniqueName(uniqueName) { }
    };
    virtual void SessionMemberRemoved(ajn::SessionId id, const char* uniqueName) {
        PluginData::DispatchCallback(env->plugin, _SessionMemberRemoved, new SessionMemberRemovedContext(env, id, uniqueName));
    }
    static void _SessionMemberRemoved(PluginData::CallbackContext* ctx) {
        SessionMemberRemovedContext* context = static_cast<SessionMemberRemovedContext*>(ctx);
        if (context->env->sessionMemberRemovedListenerNative) {
            context->env->sessionMemberRemovedListenerNative->onMemberRemoved(context->id, context->uniqueName);
        }
    }
};

class JoinSessionAsyncCB : public ajn::BusAttachment::JoinSessionAsyncCB {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachmentHost busAttachmentHost;
        BusAttachment busAttachment;
        JoinSessionSuccessListenerNative* successListenerNative;
        ErrorListenerNative* errorListenerNative;
        SessionListener* sessionListener;
        _Env(Plugin& plugin, BusAttachmentHost& busAttachmentHost, BusAttachment& busAttachment, JoinSessionSuccessListenerNative* successListenerNative, ErrorListenerNative* errorListenerNative, SessionListener* sessionListener)
            : plugin(plugin)
            , busAttachmentHost(busAttachmentHost)
            , busAttachment(busAttachment)
            , successListenerNative(successListenerNative)
            , errorListenerNative(errorListenerNative)
            , sessionListener(sessionListener) { }
        ~_Env() {
            delete sessionListener;
            delete errorListenerNative;
            delete successListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    JoinSessionAsyncCB(Plugin& plugin, BusAttachmentHost& busAttachmentHost, BusAttachment& busAttachment, JoinSessionSuccessListenerNative* successListenerNative, ErrorListenerNative* errorListenerNative, SessionListener* sessionListener)
        : env(plugin, busAttachmentHost, busAttachment, successListenerNative, errorListenerNative, sessionListener) { }
    virtual ~JoinSessionAsyncCB() { }

    class JoinSessionCBContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        QStatus status;
        ajn::SessionId sessionId;
        ajn::SessionOpts sessionOpts;
        JoinSessionCBContext(Env& env, QStatus status, ajn::SessionId sessionId, ajn::SessionOpts sessionOpts)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , status(status)
            , sessionId(sessionId)
            , sessionOpts(sessionOpts) { }
    };
    virtual void JoinSessionCB(QStatus status, ajn::SessionId sessionId, const ajn::SessionOpts& opts, void*) {
        Plugin plugin = env->plugin;
        JoinSessionCBContext* context = new JoinSessionCBContext(env, status, sessionId, opts);
        delete this;
        PluginData::DispatchCallback(plugin, _JoinSessionCB, context);
    }
    static void _JoinSessionCB(PluginData::CallbackContext* ctx) {
        JoinSessionCBContext* context = static_cast<JoinSessionCBContext*>(ctx);
        if (ER_OK == context->status) {
            std::pair<ajn::SessionId, SessionListener*> element(context->sessionId, context->env->sessionListener);
            context->env->busAttachmentHost->sessionListeners.insert(element);
            context->env->sessionListener = 0; /* sessionListeners now owns sessionListener */
            SessionOptsHost sessionOpts(context->env->plugin, context->sessionOpts);
            context->env->successListenerNative->onSuccess(context->sessionId, sessionOpts);
        } else {
            BusErrorHost busError(context->env->plugin, context->status);
            context->env->errorListenerNative->onError(busError);
        }
    }
};

class BusObjectListener : public _BusObjectListener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        BusObject busObject;
        BusObjectNative* busObjectNative;
        _Env(Plugin& plugin, BusAttachment& busAttachment, const char* path, BusObjectNative* busObjectNative)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , busObject(busAttachment, path)
            , busObjectNative(busObjectNative) { }
        ~_Env() {
            delete busObjectNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    mutable Env env; /* mutable so that GenerateIntrospection can be declared const to match ajn::BusObject */
    BusObjectListener(Plugin& plugin, BusAttachment& busAttachment, const char* path, BusObjectNative* busObjectNative)
        : env(plugin, busAttachment, path, busObjectNative) {
        env->busObject->SetBusObjectListener(this);
    }
    virtual ~BusObjectListener() {
        env->busObject->SetBusObjectListener(0);
    }
    QStatus AddInterfaceAndMethodHandlers()  {
        QStatus status = ER_OK;
        NPIdentifier* properties = 0;
        uint32_t propertiesCount = 0;
        if (NPN_Enumerate(env->plugin->npp, env->busObjectNative->objectValue, &properties, &propertiesCount)) {
            for (uint32_t i = 0; (ER_OK == status) && (i < propertiesCount); ++i) {
                if (!NPN_IdentifierIsString(properties[i])) {
                    continue;
                }
                NPUTF8* property = NPN_UTF8FromIdentifier(properties[i]);
                if (!property) {
                    status = ER_OUT_OF_MEMORY;
                    break;
                }
                const ajn::InterfaceDescription* interface = env->busAttachment->GetInterface(property);
                if (!interface) {
                    QCC_DbgHLPrintf(("No such interface '%s', ignoring", property));
                }
                NPN_MemFree(property);
                if (!interface) {
                    continue;
                }

                status = env->busObject->AddInterface(*interface);
                if (ER_OK != status) {
                    break;
                }

                size_t numMembers = interface->GetMembers();
                if (!numMembers) {
                    continue;
                }
                const ajn::InterfaceDescription::Member** members = new const ajn::InterfaceDescription::Member *[numMembers];
                interface->GetMembers(members, numMembers);
                for (size_t j = 0; (ER_OK == status) && (j < numMembers); ++j) {
                    if (ajn::MESSAGE_METHOD_CALL == members[j]->memberType) {
                        status = env->busObject->AddMethodHandler(members[j]);
                    } else if (ajn::MESSAGE_SIGNAL == members[j]->memberType) {
                        SignalEmitterHost emitter(env->plugin, env->busObject, members[j]);
                        NPVariant npemitter;
                        ToHostObject<SignalEmitterHost>(env->plugin, emitter, npemitter);
                        NPVariant npinterface = NPVARIANT_VOID;
                        if (NPN_GetProperty(env->plugin->npp, env->busObjectNative->objectValue, properties[i], &npinterface) && NPVARIANT_IS_OBJECT(npinterface)) {
                            if (!NPN_SetProperty(env->plugin->npp, NPVARIANT_TO_OBJECT(npinterface), NPN_GetStringIdentifier(members[j]->name.c_str()), &npemitter)) {
                                status = ER_FAIL;
                                QCC_LogError(status, ("NPN_SetProperty failed"));
                            }
                        }
                        NPN_ReleaseVariantValue(&npemitter);
                        NPN_ReleaseVariantValue(&npinterface);
                    }
                }
                delete[] members;
            }
            NPN_MemFree(properties);
        }
        return status;
    }

    class MethodHandlerContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        const ajn::InterfaceDescription::Member* member;
        ajn::Message message;
        MethodHandlerContext(Env& env, const ajn::InterfaceDescription::Member* member, ajn::Message& message)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , member(member)
            , message(message) { }
    };
    void MethodHandler(const ajn::InterfaceDescription::Member* member, ajn::Message& message) {
        PluginData::DispatchCallback(env->plugin, _MethodHandler, new MethodHandlerContext(env, member, message));
    }
    static void _MethodHandler(PluginData::CallbackContext* ctx) {
        MethodHandlerContext* context = static_cast<MethodHandlerContext*>(ctx);
        MessageReplyHost messageReplyHost(context->env->plugin, context->env->busAttachment, context->env->busObject, context->message, context->member->returnSignature);
        size_t numArgs;
        const ajn::MsgArg* args;
        context->message->GetArgs(numArgs, args);
        context->env->busObjectNative->onMessage(context->member->iface->GetName(), context->member->name.c_str(), messageReplyHost, args, numArgs);
    }

    class ObjectRegisteredContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ObjectRegisteredContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void ObjectRegistered() {
        PluginData::DispatchCallback(env->plugin, _ObjectRegistered, new ObjectRegisteredContext(env));
    }
    static void _ObjectRegistered(PluginData::CallbackContext* ctx) {
        ObjectRegisteredContext* context = static_cast<ObjectRegisteredContext*>(ctx);
        context->env->busObjectNative->onRegistered();
    }

    class ObjectUnregisteredContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        ObjectUnregisteredContext(Env& env)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env) { }
    };
    virtual void ObjectUnregistered() {
        PluginData::DispatchCallback(env->plugin, _ObjectUnregistered, new ObjectUnregisteredContext(env));
    }
    static void _ObjectUnregistered(PluginData::CallbackContext* ctx) {
        ObjectUnregisteredContext* context = static_cast<ObjectUnregisteredContext*>(ctx);
        context->env->busObjectNative->onUnregistered();
    }

    class GetContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        qcc::String ifcName;
        qcc::String propName;
        ajn::MsgArg& val;
        GetContext(Env& env, const char* ifcName, const char* propName, ajn::MsgArg& val)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , ifcName(ifcName)
            , propName(propName)
            , val(val) { }
    };
    virtual QStatus Get(const char* ifcName, const char* propName, ajn::MsgArg& val) {
        GetContext context(env, ifcName, propName, val);
        PluginData::DispatchCallback(env->plugin, _Get, &context);
        qcc::Event::Wait(context.event);
        return context.status;
    }
    static void _Get(PluginData::CallbackContext* ctx) {
        GetContext* context = static_cast<GetContext*>(ctx);
        const ajn::InterfaceDescription* interface = context->env->busAttachment->GetInterface(context->ifcName.c_str());
        if (!interface) {
            context->status = ER_BUS_NO_SUCH_INTERFACE;
            return;
        }
        const ajn::InterfaceDescription::Property* property = interface->GetProperty(context->propName.c_str());
        if (!property) {
            context->status = ER_BUS_NO_SUCH_PROPERTY;
            return;
        }
        context->status = context->env->busObjectNative->get(interface, property, context->val);
    }

    class SetContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        qcc::String ifcName;
        qcc::String propName;
        ajn::MsgArg& val;
        SetContext(Env& env, const char* ifcName, const char* propName, ajn::MsgArg& val)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , ifcName(ifcName)
            , propName(propName)
            , val(val) { }
    };
    virtual QStatus Set(const char* ifcName, const char* propName, ajn::MsgArg& val) {
        SetContext context(env, ifcName, propName, val);
        PluginData::DispatchCallback(env->plugin, _Set, &context);
        qcc::Event::Wait(context.event);
        return context.status;
    }
    static void _Set(PluginData::CallbackContext* ctx) {
        SetContext* context = static_cast<SetContext*>(ctx);
        const ajn::InterfaceDescription* interface = context->env->busAttachment->GetInterface(context->ifcName.c_str());
        if (!interface) {
            context->status = ER_BUS_NO_SUCH_INTERFACE;
            return;
        }
        const ajn::InterfaceDescription::Property* property = interface->GetProperty(context->propName.c_str());
        if (!property) {
            context->status = ER_BUS_NO_SUCH_PROPERTY;
            return;
        }
        context->status = context->env->busObjectNative->set(interface, property, context->val);
    }

    class GenerateIntrospectionContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        bool deep;
        size_t indent;
        qcc::String& introspection;
        GenerateIntrospectionContext(Env& env, bool deep, size_t indent, qcc::String& introspection)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , deep(deep)
            , indent(indent)
            , introspection(introspection) { }
    };
    virtual QStatus GenerateIntrospection(bool deep, size_t indent, qcc::String& introspection) const {
        GenerateIntrospectionContext context(env, deep, indent, introspection);
        PluginData::DispatchCallback(env->plugin, _GenerateIntrospection, &context);
        qcc::Event::Wait(context.event);
        return context.status;
    }
    static void _GenerateIntrospection(PluginData::CallbackContext* ctx) {
        GenerateIntrospectionContext* context = static_cast<GenerateIntrospectionContext*>(ctx);
        context->status = context->env->busObjectNative->toXML(context->deep, context->indent, context->introspection);
    }
};

class AuthListener : public ajn::AuthListener {
  public:
    class _Env {
      public:
        Plugin plugin;
        BusAttachment busAttachment;
        qcc::String authMechanisms;
        AuthListenerNative* authListenerNative;
        _Env(Plugin& plugin, BusAttachment& busAttachment, qcc::String& authMechanisms, AuthListenerNative* authListenerNative)
            : plugin(plugin)
            , busAttachment(busAttachment)
            , authMechanisms(authMechanisms)
            , authListenerNative(authListenerNative) { }
        ~_Env() {
            delete authListenerNative;
        }
    };
    typedef qcc::ManagedObj<_Env> Env;
    Env env;
    qcc::Event cancelEvent;
    AuthListener(Plugin& plugin, BusAttachment& busAttachment, qcc::String& authMechanisms, AuthListenerNative* authListenerNative)
        : env(plugin, busAttachment, authMechanisms, authListenerNative) {
        QCC_DbgTrace(("AuthListener %p", this));
    }
    virtual ~AuthListener() {
        QCC_DbgTrace(("~AuthListener %p", this));
    }

    class RequestCredentialsContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        qcc::String authMechanism;
        qcc::String peerName;
        uint16_t authCount;
        qcc::String userName;
        uint16_t credMask;
        Credentials& credentials;
        RequestCredentialsContext(Env& env, const char* authMechanism, const char* peerName, uint16_t authCount, const char* userName, uint16_t credMask, Credentials& credentials)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , authMechanism(authMechanism)
            , peerName(peerName)
            , authCount(authCount)
            , userName(userName)
            , credMask(credMask)
            , credentials(credentials) { }
    };
    virtual bool RequestCredentials(const char* authMechanism, const char* peerName, uint16_t authCount, const char* userName, uint16_t credMask, Credentials& credentials) {
        QCC_DbgTrace(("%s(authMechanism=%s,peerName=%s,authCount=%u,userName=%s,credMask=0x%04x)",
                      __FUNCTION__, authMechanism, peerName, authCount, userName, credMask));
        RequestCredentialsContext context(env, authMechanism, peerName, authCount, userName, credMask, credentials);
        PluginData::DispatchCallback(env->plugin, _RequestCredentials, &context);
        /*
         * Complex processing here to prevent UI thread from deadlocking if _BusAttachmentHost
         * destructor is called.
         *
         * EnablePeerSecurity(0, ...), called from the _BusAttachmentHost destructor, will block
         * until all AuthListener callbacks have returned.  Setting the cancelEvent will unblock any
         * synchronous callback.  Then a little extra coordination is needed to remove the dispatch
         * context so that when the dispatched callback is run it does nothing.
         */
        std::vector<qcc::Event*> check;
        check.push_back(&context.event);
        check.push_back(&cancelEvent);
        std::vector<qcc::Event*> signaled;
        signaled.clear();
        QStatus status = qcc::Event::Wait(check, signaled);
        assert(ER_OK == status);
        if (ER_OK != status) {
            QCC_LogError(status, ("Wait failed"));
        }
        for (std::vector<qcc::Event*>::iterator i = signaled.begin(); i != signaled.end(); ++i) {
            if (*i == &cancelEvent) {
                PluginData::CancelCallback(env->plugin, _RequestCredentials, &context);
                qcc::Event::Wait(context.event);
                context.status = ER_ALERTED_THREAD;
                break;
            }
        }
        return (ER_OK == context.status);
    }
    static void _RequestCredentials(PluginData::CallbackContext* ctx) {
        RequestCredentialsContext* context = static_cast<RequestCredentialsContext*>(ctx);
        if (context->env->authListenerNative) {
            CredentialsHost credentialsHost(context->env->plugin, context->credentials);
            bool requested = context->env->authListenerNative->onRequest(context->authMechanism, context->peerName, context->authCount, context->userName, context->credMask, credentialsHost);
            context->status = requested ? ER_OK : ER_FAIL;
        } else {
            context->status = ER_FAIL;
        }
    }

    class VerifyCredentialsContext : public PluginData::SyncCallbackContext {
      public:
        Env env;
        qcc::String authMechanism;
        qcc::String peerName;
        Credentials credentials;
        VerifyCredentialsContext(Env& env, const char* authMechanism, const char* peerName, const Credentials& credentials)
            : PluginData::SyncCallbackContext(env->plugin)
            , env(env)
            , authMechanism(authMechanism)
            , peerName(peerName)
            , credentials(credentials) { }
    };
    virtual bool VerifyCredentials(const char* authMechanism, const char* peerName, const Credentials& credentials) {
        QCC_DbgTrace(("%s(authMechanism=%s,peerName=%s)", __FUNCTION__, authMechanism, peerName));
        VerifyCredentialsContext context(env, authMechanism, peerName, credentials);
        PluginData::DispatchCallback(env->plugin, _VerifyCredentials, &context);
        std::vector<qcc::Event*> check;
        check.push_back(&context.event);
        check.push_back(&cancelEvent);
        std::vector<qcc::Event*> signaled;
        signaled.clear();
        QStatus status = qcc::Event::Wait(check, signaled);
        assert(ER_OK == status);
        if (ER_OK != status) {
            QCC_LogError(status, ("Wait failed"));
        }
        for (std::vector<qcc::Event*>::iterator i = signaled.begin(); i != signaled.end(); ++i) {
            if (*i == &cancelEvent) {
                PluginData::CancelCallback(env->plugin, _VerifyCredentials, &context);
                qcc::Event::Wait(context.event);
                context.status = ER_ALERTED_THREAD;
                break;
            }
        }
        return (ER_OK == context.status);
    }
    static void _VerifyCredentials(PluginData::CallbackContext* ctx) {
        VerifyCredentialsContext* context = static_cast<VerifyCredentialsContext*>(ctx);
        if (context->env->authListenerNative) {
            CredentialsHost credentialsHost(context->env->plugin, context->credentials);
            bool verified = context->env->authListenerNative->onVerify(context->authMechanism, context->peerName, credentialsHost);
            context->status = verified ? ER_OK : ER_FAIL;
        } else {
            context->status = ER_FAIL;
        }
    }

    class SecurityViolationContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        QStatus violation;
        ajn::Message message;
        SecurityViolationContext(Env& env, QStatus violation, const ajn::Message& message)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , violation(violation)
            , message(message) { }
    };
    virtual void SecurityViolation(QStatus status, const ajn::Message& message) {
        QCC_DbgTrace(("%s(status=%s,msg=%s)", __FUNCTION__, QCC_StatusText(status), message->ToString().c_str()));
        PluginData::DispatchCallback(env->plugin, _SecurityViolation, new SecurityViolationContext(env, status, message));
    }
    static void _SecurityViolation(PluginData::CallbackContext* ctx) {
        SecurityViolationContext* context = static_cast<SecurityViolationContext*>(ctx);
        if (context->env->authListenerNative) {
            MessageHost messageHost(context->env->plugin, context->env->busAttachment, context->message);
            context->env->authListenerNative->onSecurityViolation(context->violation, messageHost);
        }
    }

    class AuthenticationCompleteContext : public PluginData::AsyncCallbackContext {
      public:
        Env env;
        qcc::String authMechanism;
        qcc::String peerName;
        bool success;
        AuthenticationCompleteContext(Env& env, const char* authMechanism, const char* peerName, bool success)
            : PluginData::AsyncCallbackContext(env->plugin)
            , env(env)
            , authMechanism(authMechanism)
            , peerName(peerName)
            , success(success) { }
    };
    virtual void AuthenticationComplete(const char* authMechanism, const char* peerName, bool success) {
        QCC_DbgTrace(("%s(authMechanism=%s,peerName=%s,success=%d)", __FUNCTION__, authMechanism, peerName, success));
        PluginData::DispatchCallback(env->plugin, _AuthenticationComplete, new AuthenticationCompleteContext(env, authMechanism, peerName, success));
    }
    static void _AuthenticationComplete(PluginData::CallbackContext* ctx) {
        AuthenticationCompleteContext* context = static_cast<AuthenticationCompleteContext*>(ctx);
        if (context->env->authListenerNative) {
            context->env->authListenerNative->onComplete(context->authMechanism, context->peerName, context->success);
        }
    }
};

_BusAttachmentHost::_BusAttachmentHost(Plugin& plugin, const char* applicationName, bool allowRemoteMessages)
    : ScriptableObject(plugin, _BusAttachmentInterface::Constants())
    , busAttachment(applicationName, allowRemoteMessages)
#if defined(QCC_OS_ANDROID)
    , keyStoreListener(plugin)
#endif
    , authListener(0)
    , proxyBusObjectsHost(plugin, busAttachment)
    , interfaceDescriptionsHost(plugin, busAttachment)
    , applicationName(applicationName)
{
    QCC_DbgTrace(("%s(applicationName=%s,allowRemoteMessages=%d)", __FUNCTION__, applicationName, allowRemoteMessages));

#if defined(QCC_OS_ANDROID)
    busAttachment->RegisterKeyStoreListener(keyStoreListener);
#endif

    ATTRIBUTE("globalGUIDString", &_BusAttachmentHost::getGlobalGUIDString, 0);
    ATTRIBUTE("interfaces", &_BusAttachmentHost::getInterfaces, 0);
    ATTRIBUTE("peerSecurityEnabled", &_BusAttachmentHost::getPeerSecurityEnabled, 0);
    ATTRIBUTE("proxy", &_BusAttachmentHost::getProxy, 0);
    ATTRIBUTE("timestamp", &_BusAttachmentHost::getTimestamp, 0);
    ATTRIBUTE("uniqueName", &_BusAttachmentHost::getUniqueName, 0);

    OPERATION("addLogonEntry", &_BusAttachmentHost::addLogonEntry);
    OPERATION("addMatch", &_BusAttachmentHost::addMatch);
    OPERATION("advertiseName", &_BusAttachmentHost::advertiseName);
    OPERATION("bindSessionPort", &_BusAttachmentHost::bindSessionPort);
    OPERATION("cancelAdvertiseName", &_BusAttachmentHost::cancelAdvertiseName);
    OPERATION("cancelFindAdvertisedName", &_BusAttachmentHost::cancelFindAdvertisedName);
    OPERATION("clearKeyStore", &_BusAttachmentHost::clearKeyStore);
    OPERATION("clearKeys", &_BusAttachmentHost::clearKeys);
    OPERATION("connect", &_BusAttachmentHost::connect);
    OPERATION("disconnect", &_BusAttachmentHost::disconnect);
    OPERATION("enablePeerSecurity", &_BusAttachmentHost::enablePeerSecurity);
    OPERATION("findAdvertisedName", &_BusAttachmentHost::findAdvertisedName);
    OPERATION("getKeyExpiration", &_BusAttachmentHost::getKeyExpiration);
    OPERATION("getPeerGUID", &_BusAttachmentHost::getPeerGUID);
    OPERATION("joinSession", &_BusAttachmentHost::joinSession);
    OPERATION("leaveSession", &_BusAttachmentHost::leaveSession);
    OPERATION("getSessionFd", &_BusAttachmentHost::getSessionFd);
    OPERATION("nameHasOwner", &_BusAttachmentHost::nameHasOwner);
    OPERATION("registerBusListener", &_BusAttachmentHost::registerBusListener);
    OPERATION("registerSignalHandler", &_BusAttachmentHost::registerSignalHandler);
    OPERATION("releaseName", &_BusAttachmentHost::releaseName);
    OPERATION("reloadKeyStore", &_BusAttachmentHost::reloadKeyStore);
    OPERATION("removeMatch", &_BusAttachmentHost::removeMatch);
    OPERATION("requestName", &_BusAttachmentHost::requestName);
    OPERATION("setDaemonDebug", &_BusAttachmentHost::setDaemonDebug);
    OPERATION("setKeyExpiration", &_BusAttachmentHost::setKeyExpiration);
    OPERATION("setLinkTimeout", &_BusAttachmentHost::setLinkTimeout);
    OPERATION("setSessionListener", &_BusAttachmentHost::setSessionListener);
    OPERATION("unbindSessionPort", &_BusAttachmentHost::unbindSessionPort);
    OPERATION("unregisterBusListener", &_BusAttachmentHost::unregisterBusListener);
    OPERATION("unregisterSignalHandler", &_BusAttachmentHost::unregisterSignalHandler);

    GETTER(&_BusAttachmentHost::getBusObject);
    SETTER(&_BusAttachmentHost::registerBusObject);
    DELETER(&_BusAttachmentHost::unregisterBusObject);
    ENUMERATOR(&_BusAttachmentHost::enumerateBusObjects);
}

_BusAttachmentHost::~_BusAttachmentHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    for (std::map<NPIdentifier, BusObjectListener*>::iterator it = busObjectListeners.begin(); it != busObjectListeners.end(); ++it) {
        BusObjectListener* busObjectListener = it->second;
        busAttachment->UnregisterBusObject(*busObjectListener->env->busObject);
        delete busObjectListener;
    }
    for (std::map<ajn::SessionId, SessionListener*>::iterator it = sessionListeners.begin(); it != sessionListeners.end(); ++it) {
        SessionListener* sessionListener = it->second;
        busAttachment->SetSessionListener(it->first, 0);
        delete sessionListener;
    }
    for (std::map<ajn::SessionPort, SessionPortListener*>::iterator it = sessionPortListeners.begin(); it != sessionPortListeners.end(); ++it) {
        SessionPortListener* sessionPortListener = it->second;
        QStatus status = sessionPortListener->cancelEvent.SetEvent();
        assert(ER_OK == status);
        if (ER_OK != status) {
            QCC_LogError(status, ("SetEvent failed")); /* Small chance of deadlock if this occurs. */
        }
        busAttachment->UnbindSessionPort(it->first);
        delete sessionPortListener;
    }
    for (std::list<BusListener*>::iterator it = busListeners.begin(); it != busListeners.end(); ++it) {
        BusListener* busListener = (*it);
        busAttachment->UnregisterBusListener(*busListener);
        delete busListener;
    }
    for (std::list<SignalReceiver*>::iterator it = signalReceivers.begin(); it != signalReceivers.end(); ++it) {
        SignalReceiver* signalReceiver = (*it);
        qcc::String rule = MatchRule(signalReceiver->env->signal, signalReceiver->env->sourcePath);
        busAttachment->RemoveMatch(rule.c_str());
        busAttachment->UnregisterSignalHandler(
            signalReceiver, static_cast<ajn::MessageReceiver::SignalHandler>(&SignalReceiver::SignalHandler),
            signalReceiver->env->signal, signalReceiver->env->sourcePath.empty() ? 0 : signalReceiver->env->sourcePath.c_str());
        delete signalReceiver;
    }
    if (authListener) {
        QStatus status = authListener->cancelEvent.SetEvent();
        assert(ER_OK == status);
        if (ER_OK != status) {
            QCC_LogError(status, ("SetEvent failed")); /* Small chance of deadlock if this occurs. */
        }
        busAttachment->EnablePeerSecurity(0, 0, 0, true);
        delete authListener;
    }
}

bool _BusAttachmentHost::HasProperty(NPIdentifier name)
{
    /*
     * The first instinct would be just to check busObjectListeners for the name, but in order to set a
     * property using NPAPI this function must return true.  registerBusObject() sets the property,
     * so return true for any valid object path.
     */
    bool has = ScriptableObject::HasProperty(name);
    if (!has && NPN_IdentifierIsString(name)) {
        NPUTF8* path = NPN_UTF8FromIdentifier(name);
        has = ajn::IsLegalObjectPath(path);
        NPN_MemFree(path);
    }
    return has;
}

bool _BusAttachmentHost::getProxy(NPVariant* result)
{
    ToHostObject<ProxyBusObjectsHost>(plugin, proxyBusObjectsHost, *result);
    return true;
}

bool _BusAttachmentHost::getInterfaces(NPVariant* result)
{
    ToHostObject<InterfaceDescriptionsHost>(plugin, interfaceDescriptionsHost, *result);
    return true;
}

bool _BusAttachmentHost::getUniqueName(NPVariant* result)
{
    ToDOMString(plugin, busAttachment->GetUniqueName(), *result, TreatEmptyStringAsNull);
    return true;
}

bool _BusAttachmentHost::getGlobalGUIDString(NPVariant* result)
{
    ToDOMString(plugin, busAttachment->GetGlobalGUIDString(), *result);
    return true;
}

bool _BusAttachmentHost::getTimestamp(NPVariant* result)
{
    ToUnsignedLong(plugin, busAttachment->GetTimestamp(), *result);
    return true;
}

bool _BusAttachmentHost::getPeerSecurityEnabled(NPVariant* result)
{
    ToBoolean(plugin, busAttachment->IsPeerSecurityEnabled(), *result);
    return true;
}

bool _BusAttachmentHost::connect(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String connectSpec;

    if (argCount > 0) {
        connectSpec = ToDOMString(plugin, args[0], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 0 is not a string");
            goto exit;
        }
    } else {
#if defined(QCC_OS_WINDOWS)
        connectSpec = "tcp:addr=127.0.0.1,port=9955";
#else
        connectSpec = "unix:abstract=alljoyn";
#endif
    }
    QCC_DbgTrace(("connectSpec=%s", connectSpec.c_str()));

    status = ER_OK;
    if (!busAttachment->IsStarted()) {
        status = busAttachment->Start();
    }
    if ((ER_OK == status) && !busAttachment->IsConnected()) {
        status = Connect(plugin, connectSpec.c_str());
        this->connectSpec = connectSpec;
    }

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::registerSignalHandler(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    MessageListenerNative* signalListener = 0;
    qcc::String signalName;
    qcc::String sourcePath;
    const ajn::InterfaceDescription::Member* signal;
    QStatus status = ER_OK;
    SignalReceiver* signalReceiver = 0;

    bool typeError = false;
    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    signalListener = ToNativeObject<MessageListenerNative>(plugin, args[0], typeError);
    if (typeError || !signalListener) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }
    signalName = ToDOMString(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a string");
        goto exit;
    }
    if (argCount > 2) {
        sourcePath = ToDOMString(plugin, args[2], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 2 is not a string");
            goto exit;
        }
    }

    status = GetSignal(signalName, signal);
    if (ER_OK == status) {
        for (std::list<SignalReceiver*>::iterator it = signalReceivers.begin(); it != signalReceivers.end(); ++it) {
            if ((*((*it)->env->signalListener) == *signalListener) &&
                (*((*it)->env->signal) == *signal) &&
                ((*it)->env->sourcePath == sourcePath)) {
                /* Identical receiver registered, nothing to do. */
                goto exit;
            }
        }

        signalReceiver = new SignalReceiver(plugin, busAttachment, signalListener, signal, sourcePath);
        signalListener = 0; /* signalReceiver now owns signalListener */
        status = busAttachment->RegisterSignalHandler(
            signalReceiver, static_cast<ajn::MessageReceiver::SignalHandler>(&SignalReceiver::SignalHandler),
            signal, sourcePath.empty() ? 0 : sourcePath.c_str());
        if (ER_OK != status) {
            goto exit;
        }
        qcc::String rule = MatchRule(signal, sourcePath);
        status = busAttachment->AddMatch(rule.c_str());
        if (ER_OK == status) {
            signalReceivers.push_back(signalReceiver);
            signalReceiver = 0; /* signalReceivers now owns signalReceiver */
        } else {
            busAttachment->UnregisterSignalHandler(
                signalReceiver, static_cast<ajn::MessageReceiver::SignalHandler>(&SignalReceiver::SignalHandler),
                signal, sourcePath.empty() ? 0 : sourcePath.c_str());
        }
    }

exit:
    delete signalReceiver;
    delete signalListener;
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::getBusObject(NPIdentifier name, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    std::map<NPIdentifier, BusObjectListener*>::iterator it = busObjectListeners.find(name);
    if (it != busObjectListeners.end()) {
        BusObjectListener* busObjectListener = it->second;
        ToNativeObject<BusObjectNative>(plugin, busObjectListener->env->busObjectNative, *result);
    } else {
        VOID_TO_NPVARIANT(*result);
    }
    return true;
}

bool _BusAttachmentHost::unregisterBusObject(NPIdentifier name)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    std::map<NPIdentifier, BusObjectListener*>::iterator it = busObjectListeners.find(name);
    if (it != busObjectListeners.end()) {
        BusObjectListener* busObjectListener = it->second;
        busAttachment->UnregisterBusObject(*busObjectListener->env->busObject);
        busObjectListeners.erase(it);
        delete busObjectListener;
    }
    return true;
}

bool _BusAttachmentHost::enumerateBusObjects(NPIdentifier** value, uint32_t* count)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    *count = busObjectListeners.size();
    *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
    NPIdentifier* v = *value;
    for (std::map<NPIdentifier, BusObjectListener*>::iterator it = busObjectListeners.begin(); it != busObjectListeners.end(); ++it) {
        *v++ = it->first;
    }
    return true;
}

bool _BusAttachmentHost::disconnect(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    if (busAttachment->IsStarted() && !busAttachment->IsStopping() && busAttachment->IsConnected()) {
        status = busAttachment->Disconnect(connectSpec.c_str());
    }
    if ((ER_OK == status) && busAttachment->IsStarted()) {
        status = busAttachment->Stop();
    }

    ToUnsignedShort(plugin, status, *result);
    return true;
}

bool _BusAttachmentHost::registerBusObject(NPIdentifier name, const NPVariant* value)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    BusObjectNative* busObjectNative = 0;
    BusObjectListener* busObjectListener = 0;
    NPUTF8* path = NPN_UTF8FromIdentifier(name);
    QStatus status = ER_OK;

    bool typeError = false;
    busObjectNative = ToNativeObject<BusObjectNative>(plugin, *value, typeError);
    if (typeError || !busObjectNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }

    busObjectListener = new BusObjectListener(plugin, busAttachment, path, busObjectNative);
    busObjectNative = 0; /* busObject now owns busObjectNative */
    status = busObjectListener->AddInterfaceAndMethodHandlers();
    if (ER_OK != status) {
        goto exit;
    }
    status = busAttachment->RegisterBusObject(*busObjectListener->env->busObject);
    if (ER_OK == status) {
        std::pair<NPIdentifier, BusObjectListener*> element(name, busObjectListener);
        busObjectListeners.insert(element);
        busObjectListener = 0; /* busObjectListeners now owns busObjectListener */
    }

exit:
    NPN_MemFree(path);
    delete busObjectListener;
    delete busObjectNative;
    if ((ER_OK == status) && !typeError) {
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _BusAttachmentHost::unregisterSignalHandler(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    MessageListenerNative* signalListener = 0;
    qcc::String signalName;
    qcc::String sourcePath;
    const ajn::InterfaceDescription::Member* signal;
    QStatus status = ER_OK;

    bool typeError = false;
    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    signalListener = ToNativeObject<MessageListenerNative>(plugin, args[0], typeError);
    if (typeError || !signalListener) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }
    signalName = ToDOMString(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a string");
        goto exit;
    }
    if (argCount > 2) {
        sourcePath = ToDOMString(plugin, args[2], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 2 is not a string");
            goto exit;
        }
    }

    status = GetSignal(signalName, signal);
    if (ER_OK == status) {
        std::list<SignalReceiver*>::iterator it;
        for (it = signalReceivers.begin(); it != signalReceivers.end(); ++it) {
            if ((*((*it)->env->signalListener) == *signalListener) &&
                (*((*it)->env->signal) == *signal) &&
                ((*it)->env->sourcePath == sourcePath)) {
                break;
            }
        }
        if (it != signalReceivers.end()) {
            status = busAttachment->UnregisterSignalHandler(
                (*it), static_cast<ajn::MessageReceiver::SignalHandler>(&SignalReceiver::SignalHandler),
                signal, sourcePath.empty() ? 0 : sourcePath.c_str());
            if (ER_OK != status) {
                goto exit;
            }
            qcc::String rule = MatchRule(signal, sourcePath);
            status = busAttachment->RemoveMatch(rule.c_str());
            if (ER_OK == status) {
                SignalReceiver* signalReceiver = (*it);
                signalReceivers.erase(it);
                delete signalReceiver;
            } else {
                busAttachment->RegisterSignalHandler(
                    (*it), static_cast<ajn::MessageReceiver::SignalHandler>(&SignalReceiver::SignalHandler),
                    signal, sourcePath.empty() ? 0 : sourcePath.c_str());
            }
        }
    }

exit:
    delete signalListener;
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::registerBusListener(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    BusAttachmentHost busAttachmentHost(this);
    BusListenerNative* busListenerNative = 0;
    BusListener* busListener = 0;
    std::list<BusListener*>::iterator it;

    bool typeError = false;
    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    busListenerNative = ToNativeObject<BusListenerNative>(plugin, args[0], typeError);
    if (typeError || !busListenerNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }

    for (it = busListeners.begin(); it != busListeners.end(); ++it) {
        if (*((*it)->env->busListenerNative) == *busListenerNative) {
            /* Identical listener registered, nothing to do. */
            goto exit;
        }
    }

    busListener = new BusListener(plugin, busAttachmentHost, busAttachment, busListenerNative);
    busListenerNative = 0; /* busListener now owns busListenerNative */
    busAttachment->RegisterBusListener(*busListener);
    busListeners.push_back(busListener);
    busListener = 0; /* busListeners now owns busListener */

exit:
    delete busListener;
    delete busListenerNative;
    if (!typeError) {
        VOID_TO_NPVARIANT(*result);
        return true;
    } else {
        return false;
    }
}

bool _BusAttachmentHost::unregisterBusListener(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    BusListenerNative* busListenerNative = 0;
    std::list<BusListener*>::iterator it;

    bool typeError = false;
    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    busListenerNative = ToNativeObject<BusListenerNative>(plugin, args[0], typeError);
    if (typeError || !busListenerNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }

    for (it = busListeners.begin(); it != busListeners.end(); ++it) {
        if (*((*it)->env->busListenerNative) == *busListenerNative) {
            break;
        }
    }
    if (it != busListeners.end()) {
        BusListener* busListener = (*it);
        busAttachment->UnregisterBusListener(*busListener);
        busListeners.erase(it);
        delete busListener;
    }

exit:
    delete busListenerNative;
    if (!typeError) {
        VOID_TO_NPVARIANT(*result);
        return true;
    } else {
        return false;
    }
}

bool _BusAttachmentHost::requestName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String requestedName;
    uint32_t flags = 0;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    requestedName = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    if (argCount > 1) {
        flags = ToUnsignedLong(plugin, args[1], typeError);
        if (typeError) {
            plugin->RaiseTypeError("argument 1 is not a number");
            goto exit;
        }
    }
    QCC_DbgTrace(("requestedName=%s,flags=0x%x", requestedName.c_str(), flags));

    status = busAttachment->RequestName(requestedName.c_str(), flags);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::releaseName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String name;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    name = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("name=%s", name.c_str()));

    status = busAttachment->ReleaseName(name.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::addMatch(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String rule;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    rule = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("rule=%s", rule.c_str()));

    status = busAttachment->AddMatch(rule.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::removeMatch(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String rule;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    rule = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("rule=%s", rule.c_str()));

    status = busAttachment->RemoveMatch(rule.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::advertiseName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String name;
    uint16_t transports;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    name = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    transports = ToUnsignedShort(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("name=%s,transports=0x%x", name.c_str(), transports));

    status = busAttachment->AdvertiseName(name.c_str(), transports);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::cancelAdvertiseName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String name;
    uint16_t transports;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    name = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    transports = ToUnsignedShort(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("name=%s,transports=0x%x", name.c_str(), transports));

    status = busAttachment->CancelAdvertiseName(name.c_str(), transports);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::findAdvertisedName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String namePrefix;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    namePrefix = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("namePrefix=%s", namePrefix.c_str()));

    status = busAttachment->FindAdvertisedName(namePrefix.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::cancelFindAdvertisedName(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String namePrefix;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    namePrefix = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("namePrefix=%s", namePrefix.c_str()));

    status = busAttachment->CancelFindAdvertisedName(namePrefix.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::bindSessionPort(const NPVariant* args, uint32_t argCount, NPVariant* npresult)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ajn::SessionPort sessionPort = ajn::SESSION_PORT_ANY;
    ajn::SessionOpts sessionOpts;
    AcceptSessionJoinerListenerNative* acceptSessionListenerNative = 0;
    SessionJoinedListenerNative* sessionJoinedListenerNative = 0;
    SessionLostListenerNative* sessionLostListenerNative = 0;
    SessionMemberAddedListenerNative* sessionMemberAddedListenerNative = 0;
    SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative = 0;
    SessionPortListener* sessionPortListener = 0;
    QStatus status = ER_OK;

    /*
     * Pull out the parameters from the native object.
     */
    bool typeError = false;
    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    if (!NPVARIANT_IS_OBJECT(args[0])) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }

    NPVariant result;
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("port"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionPort = ToUnsignedShort(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'port' is not a number");
        goto exit;
    }

    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("traffic"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionOpts.traffic = (ajn::SessionOpts::TrafficType) ToOctet(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'traffic' is not a number");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("isMultipoint"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionOpts.isMultipoint = ToBoolean(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'isMultipoint' is not a boolean");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("proximity"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionOpts.proximity = ToOctet(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'proximity' is not a number");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("transports"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionOpts.transports = ToUnsignedShort(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'transports' is not a number");
        goto exit;
    }

    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("onAccept"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        acceptSessionListenerNative = ToNativeObject<AcceptSessionJoinerListenerNative>(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'onAccept' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("onJoined"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionJoinedListenerNative = ToNativeObject<SessionJoinedListenerNative>(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'onJoined' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("onLost"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionLostListenerNative = ToNativeObject<SessionLostListenerNative>(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'onLost' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("onMemberAdded"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionMemberAddedListenerNative = ToNativeObject<SessionMemberAddedListenerNative>(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'onMemberAdded' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(result);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("onMemberRemoved"), &result);
    if (!NPVARIANT_IS_VOID(result)) {
        sessionMemberRemovedListenerNative = ToNativeObject<SessionMemberRemovedListenerNative>(plugin, result, typeError);
    }
    NPN_ReleaseVariantValue(&result);
    if (typeError) {
        plugin->RaiseTypeError("'onMemberRemoved' is not an object");
        goto exit;
    }
    QCC_DbgTrace(("sessionPort=%u", sessionPort));

    sessionPortListener = new SessionPortListener(plugin, busAttachment, acceptSessionListenerNative, sessionJoinedListenerNative, sessionLostListenerNative, sessionMemberAddedListenerNative, sessionMemberRemovedListenerNative);
    acceptSessionListenerNative = 0; /* listener now owns acceptSessionListenerNative */
    sessionJoinedListenerNative = 0; /* listener now owns sessionJoinedListenerNative */
    sessionLostListenerNative = 0; /* listener now owns sessionLostListenerNative */
    sessionMemberAddedListenerNative = 0; /* listener now owns sessionMemberAddedListenerNative */
    sessionMemberRemovedListenerNative = 0; /* listener now owns sessionMemberRemovedListenerNative */

    status = busAttachment->BindSessionPort(sessionPort, sessionOpts, *sessionPortListener);
    if (ER_OK == status) {
        NPVariant result;
        ToUnsignedShort(plugin, sessionPort, result);
        if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[0]), NPN_GetStringIdentifier("port"), &result)) {
            status = ER_FAIL;
            QCC_LogError(status, ("NPN_SetProperty failed"));
        }
    }
    if (ER_OK == status) {
        std::pair<ajn::SessionPort, SessionPortListener*> element(sessionPort, sessionPortListener);
        sessionPortListeners.insert(element);
        sessionPortListener = 0; /* sessionPortListeners now owns sessionPort */

    }

exit:
    delete acceptSessionListenerNative;
    delete sessionJoinedListenerNative;
    delete sessionLostListenerNative;
    delete sessionMemberAddedListenerNative;
    delete sessionMemberRemovedListenerNative;
    delete sessionPortListener;
    ToUnsignedShort(plugin, status, *npresult);
    return !typeError;
}

bool _BusAttachmentHost::unbindSessionPort(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    ajn::SessionPort sessionPort;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    sessionPort = ToUnsignedShort(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("sessionPort=%u", sessionPort));

    status = busAttachment->UnbindSessionPort(sessionPort);
    if (ER_OK == status) {
        std::map<ajn::SessionPort, SessionPortListener*>::iterator it = sessionPortListeners.find(sessionPort);
        if (it != sessionPortListeners.end()) {
            SessionPortListener* listener = it->second;
            sessionPortListeners.erase(it);
            delete listener;
        }
    }

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::setSessionListener(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    ajn::SessionId id;
    SessionLostListenerNative* sessionLostListenerNative = 0;
    SessionMemberAddedListenerNative* sessionMemberAddedListenerNative = 0;
    SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative = 0;
    SessionListener* sessionListener = 0;
    QStatus status;

    NPVariant variant;
    bool typeError = false;
    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    id = ToUnsignedLong(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a number");
        goto exit;
    }
    if (NPVARIANT_IS_OBJECT(args[1])) {
        VOID_TO_NPVARIANT(variant);
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[1]), NPN_GetStringIdentifier("onLost"), &variant);
        sessionLostListenerNative = ToNativeObject<SessionLostListenerNative>(plugin, variant, typeError);
        NPN_ReleaseVariantValue(&variant);
        if (typeError) {
            plugin->RaiseTypeError("'onLost' is not an object");
            goto exit;
        }
        VOID_TO_NPVARIANT(variant);
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[1]), NPN_GetStringIdentifier("onMemberAdded"), &variant);
        sessionMemberAddedListenerNative = ToNativeObject<SessionMemberAddedListenerNative>(plugin, variant, typeError);
        NPN_ReleaseVariantValue(&variant);
        if (typeError) {
            plugin->RaiseTypeError("'onMemberAdded' is not an object");
            goto exit;
        }
        VOID_TO_NPVARIANT(variant);
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[1]), NPN_GetStringIdentifier("onMemberRemoved"), &variant);
        sessionMemberRemovedListenerNative = ToNativeObject<SessionMemberRemovedListenerNative>(plugin, variant, typeError);
        NPN_ReleaseVariantValue(&variant);
        if (typeError) {
            plugin->RaiseTypeError("'onMemberRemoved' is not an object");
            goto exit;
        }
    } else if (!NPVARIANT_IS_NULL(args[1])) {
        typeError = true;
        plugin->RaiseTypeError("argument 1 is not an object or null");
        goto exit;
    }
    QCC_DbgTrace(("id=%u", id));

    if (sessionLostListenerNative || sessionMemberAddedListenerNative || sessionMemberRemovedListenerNative) {
        sessionListener = new SessionListener(plugin, busAttachment, sessionLostListenerNative, sessionMemberAddedListenerNative, sessionMemberRemovedListenerNative);
        /* sessionListener now owns session*ListenerNative */
        sessionLostListenerNative = 0;
        sessionMemberAddedListenerNative = 0;
        sessionMemberRemovedListenerNative = 0;
    }

    status = busAttachment->SetSessionListener(id, sessionListener);
    if (ER_OK == status) {
        /* Overwrite existing listener. */
        std::map<ajn::SessionId, SessionListener*>::iterator it = sessionListeners.find(id);
        if (it != sessionListeners.end()) {
            SessionListener* listener = it->second;
            sessionListeners.erase(it);
            delete listener;
        }
        if (sessionListener) {
            std::pair<ajn::SessionId, SessionListener*> element(id, sessionListener);
            sessionListeners.insert(element);
            sessionListener = 0; /* sessionListeners now owns sessionListener */
        }
    }

exit:
    delete sessionListener;
    delete sessionLostListenerNative;
    delete sessionMemberAddedListenerNative;
    delete sessionMemberRemovedListenerNative;
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::joinSession(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    BusAttachmentHost busAttachmentHost(this);
    JoinSessionSuccessListenerNative* successListenerNative = 0;
    ErrorListenerNative* errorListenerNative = 0;
    qcc::String sessionHost;
    ajn::SessionPort sessionPort = ajn::SESSION_PORT_ANY;
    ajn::SessionOpts sessionOpts;
    SessionLostListenerNative* sessionLostListenerNative = 0;
    SessionMemberAddedListenerNative* sessionMemberAddedListenerNative = 0;
    SessionMemberRemovedListenerNative* sessionMemberRemovedListenerNative = 0;
    SessionListener* sessionListener = 0;
    QStatus status = ER_OK;
    JoinSessionAsyncCB* callback = 0;

    /*
     * Pull out the parameters from the native object.
     */
    NPVariant variant;
    bool typeError = false;
    if (argCount < 3) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    /*
     * Mandatory parameters
     */
    successListenerNative = ToNativeObject<JoinSessionSuccessListenerNative>(plugin, args[0], typeError);
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
    if (!NPVARIANT_IS_OBJECT(args[2])) {
        typeError = true;
        plugin->RaiseTypeError("argument 2 is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("host"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionHost = ToDOMString(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError || sessionHost.empty()) {
        typeError = true;
        plugin->RaiseTypeError("property 'host' of argument 2 is undefined");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("port"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionPort = ToUnsignedShort(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError || (ajn::SESSION_PORT_ANY == sessionPort)) {
        typeError = true;
        plugin->RaiseTypeError("property 'port' of argument 2 is undefined or invalid");
        goto exit;
    }
    /*
     * Optional parameters
     */
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("traffic"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionOpts.traffic = (ajn::SessionOpts::TrafficType) ToOctet(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'traffic' is not a number");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("isMultipoint"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionOpts.isMultipoint = ToBoolean(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'isMultipoint' is not a boolean");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("proximity"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionOpts.proximity = ToOctet(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'proximity' is not a number");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("transports"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionOpts.transports = ToUnsignedShort(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'transports' is not a number");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("onLost"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionLostListenerNative = ToNativeObject<SessionLostListenerNative>(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'onLost' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("onMemberAdded"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionMemberAddedListenerNative = ToNativeObject<SessionMemberAddedListenerNative>(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'onMemberAdded' is not an object");
        goto exit;
    }
    VOID_TO_NPVARIANT(variant);
    NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(args[2]), NPN_GetStringIdentifier("onMemberRemoved"), &variant);
    if (!NPVARIANT_IS_VOID(variant)) {
        sessionMemberRemovedListenerNative = ToNativeObject<SessionMemberRemovedListenerNative>(plugin, variant, typeError);
    }
    NPN_ReleaseVariantValue(&variant);
    if (typeError) {
        plugin->RaiseTypeError("'onMemberRemoved' is not an object");
        goto exit;
    }
    QCC_DbgTrace(("sessionHost=%s,sessionPort=%u", sessionHost.c_str(), sessionPort));

    sessionListener = new SessionListener(plugin, busAttachment, sessionLostListenerNative, sessionMemberAddedListenerNative, sessionMemberRemovedListenerNative);
    /* sessionListener now owns session*ListenerNative */
    sessionLostListenerNative = 0;
    sessionMemberAddedListenerNative = 0;
    sessionMemberRemovedListenerNative = 0;

    callback = new JoinSessionAsyncCB(plugin, busAttachmentHost, busAttachment, successListenerNative, errorListenerNative, sessionListener);
    successListenerNative = 0; /* callback now owns successListenerNative */
    errorListenerNative = 0; /* callback now owns errorListenerNative */
    sessionListener = 0; /* callback now owns sessionListener */

    status = busAttachment->JoinSessionAsync(sessionHost.c_str(), sessionPort, callback->env->sessionListener, sessionOpts, callback);
    if (ER_OK == status) {
        callback = 0; /* alljoyn owns callback */
    }

exit:
    delete callback;
    delete sessionListener;
    delete sessionLostListenerNative;
    delete sessionMemberAddedListenerNative;
    delete sessionMemberRemovedListenerNative;
    delete errorListenerNative;
    delete successListenerNative;
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::leaveSession(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    ajn::SessionId id;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    id = ToUnsignedLong(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("id=%u", id));

    status = busAttachment->LeaveSession(id);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::getSessionFd(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    ajn::SessionId id;
    qcc::SocketFd sockFd;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    id = ToUnsignedLong(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("id=%u", id));

    status = busAttachment->GetSessionFd(id, sockFd);

exit:
    if ((ER_OK == status) && !typeError) {
        SocketFdHost socketFdHost(plugin, sockFd);
        ToHostObject<SocketFdHost>(plugin, socketFdHost, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _BusAttachmentHost::setLinkTimeout(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    ajn::SessionId id;
    uint32_t linkTimeout;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    id = ToUnsignedLong(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    linkTimeout = ToUnsignedLong(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 2 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("id=%u,linkTimeout=%u", id, linkTimeout));

    status = busAttachment->SetLinkTimeout(id, linkTimeout);

exit:
    if ((ER_OK == status) && !typeError) {
        ToUnsignedLong(plugin, linkTimeout, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _BusAttachmentHost::nameHasOwner(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String name;
    bool has;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    name = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("name=%s", name.c_str()));

    status = busAttachment->NameHasOwner(name.c_str(), has);

exit:
    if ((ER_OK == status) && !typeError) {
        ToBoolean(plugin, has, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _BusAttachmentHost::setDaemonDebug(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String module;
    uint32_t level;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    module = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    level = ToUnsignedLong(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a number");
        goto exit;
    }
    QCC_DbgTrace(("module=%s,level=%u", module.c_str(), level));

    status = busAttachment->SetDaemonDebug(module.c_str(), level);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::enablePeerSecurity(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    qcc::String authMechanisms;
    AuthListenerNative* authListenerNative = 0;

    QStatus status = ER_OK;
    bool typeError = false;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    authMechanisms = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    if (argCount > 1) {
        authListenerNative = ToNativeObject<AuthListenerNative>(plugin, args[1], typeError);
        if (typeError) {
            typeError = true;
            plugin->RaiseTypeError("argument 1 is not an object");
            goto exit;
        }
    }

    if (authListener) {
        status = ER_BUS_ALREADY_LISTENING;
        goto exit;
    }
    status = busAttachment->Start();
    if ((ER_OK != status) && (ER_BUS_BUS_ALREADY_STARTED != status)) {
        goto exit;
    }
    authListener = new AuthListener(plugin, busAttachment, authMechanisms, authListenerNative);
    authListenerNative = 0; /* authListener now owns authListenerNative */
    status = busAttachment->EnablePeerSecurity(authListener->env->authMechanisms.c_str(), authListener, 0, true);
    if (ER_OK != status) {
        delete authListener;
        authListener = 0;
    }

exit:
    delete authListenerNative;
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::reloadKeyStore(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    ToUnsignedShort(plugin, busAttachment->ReloadKeyStore(), *result);
    return true;
}

bool _BusAttachmentHost::clearKeyStore(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    busAttachment->ClearKeyStore();
    VOID_TO_NPVARIANT(*result);
    return true;
}

bool _BusAttachmentHost::clearKeys(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QStatus status = ER_OK;
    bool typeError = false;
    qcc::String guid;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    guid = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }

    status = busAttachment->ClearKeys(guid);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::getKeyExpiration(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    qcc::String guid;
    uint32_t timeout;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    guid = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("guid=%s", guid.c_str()));

    status = busAttachment->GetKeyExpiration(guid, timeout);

exit:
    if ((ER_OK == status) && !typeError) {
        ToUnsignedLong(plugin, timeout, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _BusAttachmentHost::setKeyExpiration(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    bool typeError = false;
    qcc::String guid;
    uint32_t timeout;

    if (argCount < 2) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    guid = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    timeout = ToUnsignedLong(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    QCC_DbgTrace(("guid=%s,timeout=%u", guid.c_str(), timeout));

    status = busAttachment->SetKeyExpiration(guid, timeout);

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::addLogonEntry(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String authMechanism;
    qcc::String userName;
    qcc::String password;

    if (argCount < 3) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    authMechanism = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }
    userName = ToDOMString(plugin, args[1], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 1 is not a string");
        goto exit;
    }
    password = ToDOMString(plugin, args[2], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 2 is not a string");
        goto exit;
    }

    status = busAttachment->AddLogonEntry(authMechanism.c_str(), userName.c_str(), NPVARIANT_IS_NULL(args[2]) ? 0 : password.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _BusAttachmentHost::getPeerGUID(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    bool typeError = false;
    QStatus status = ER_OK;
    qcc::String name;
    qcc::String guid;

    if (argCount < 1) {
        typeError = true;
        plugin->RaiseTypeError("not enough arguments");
        goto exit;
    }
    name = ToDOMString(plugin, args[0], typeError);
    if (typeError) {
        plugin->RaiseTypeError("argument 0 is not a string");
        goto exit;
    }

    status = busAttachment->GetPeerGUID(name.c_str(), guid);

exit:
    if ((ER_OK == status) && !typeError) {
        ToDOMString(plugin, guid, *result);
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

QStatus _BusAttachmentHost::GetSignal(const qcc::String& name, const ajn::InterfaceDescription::Member*& signal)
{
    size_t dot = name.find_last_of('.');
    if (qcc::String::npos == dot) {
        QCC_LogError(ER_BUS_BAD_MEMBER_NAME, ("Can't find '.' in '%s'", name.c_str()));
        return ER_BUS_BAD_MEMBER_NAME;
    }
    qcc::String interfaceName = name.substr(0, dot);
    qcc::String signalName = name.substr(dot + 1);
    QCC_DbgTrace(("interfaceName=%s,signalName=%s", interfaceName.c_str(), signalName.c_str()));

    const ajn::InterfaceDescription* interface = busAttachment->GetInterface(interfaceName.c_str());
    if (!interface) {
        QCC_LogError(ER_BUS_UNKNOWN_INTERFACE, ("Don't know about interface '%s'", interfaceName.c_str()));
        return ER_BUS_UNKNOWN_INTERFACE;
    }
    signal = interface->GetMember(signalName.c_str());
    if (!signal) {
        QCC_LogError(ER_BUS_INTERFACE_NO_SUCH_MEMBER, ("Don't know about signal '%s' in interface '%s'", signalName.c_str(), interfaceName.c_str()));
        return ER_BUS_INTERFACE_NO_SUCH_MEMBER;
    }
    return ER_OK;
}

qcc::String _BusAttachmentHost::MatchRule(const ajn::InterfaceDescription::Member* signal, const qcc::String& sourcePath)
{
    qcc::String rule = "type='signal',member='" + signal->name + "',interface='" + signal->iface->GetName() + "'";
    if (!sourcePath.empty()) {
        rule += ",path='" + sourcePath + "'";
    }
    return rule;
}
