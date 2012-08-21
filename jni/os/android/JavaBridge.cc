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
#include "../../BusAttachmentHost.h"
#include "../../FeaturePermissions.h"

#include <alljoyn/AllJoynStd.h>
#include <qcc/Debug.h>
#include <qcc/Log.h>

#define QCC_MODULE "ALLJOYN_JS"

static void SecurityClient_permissionResponse(JNIEnv* env,
                                              jobject thiz,
                                              jint level,
                                              jboolean remember,
                                              jlong jlistener)
{
    QCC_DbgTrace(("%s(level=%d,remember=%d,listener=%x)", __FUNCTION__, level, remember, jlistener));
    RequestPermissionListener* listener = reinterpret_cast<RequestPermissionListener*>(jlistener);
    listener->RequestPermissionCB(level, remember);
}

static jint SecurityService_aliasUnixUser(JNIEnv* env,
                                          jobject thiz,
                                          jint uid)
{
    QCC_DbgTrace(("%s(uid=%d)", __FUNCTION__, uid));

    const char* connectSpec = "unix:abstract=alljoyn";
    ajn::BusAttachment bus("org.alljoyn.bus.plugin");

    QStatus status = bus.Start();
    if (ER_OK != status) {
        goto exit;
    }
    status = bus.Connect(connectSpec);
    if (ER_OK != status) {
        goto exit;
    }

    {
        const ajn::ProxyBusObject& alljoyn = bus.GetAllJoynProxyObj();
        ajn::MsgArg arg("u", static_cast<uint32_t>(uid));
        ajn::Message reply(bus);

        status = alljoyn.MethodCall(ajn::org::alljoyn::Bus::InterfaceName, "AliasUnixUser", &arg, 1, reply);
        if (ER_OK != status) {
            qcc::String errMsg;
#if !defined(NDEBUG)
            const char* errName = reply->GetErrorName(&errMsg);
#endif
            QCC_LogError(status, ("MethodCall failed - %s %s", errName, errMsg.c_str()));
            goto exit;
        }
    }

    if (bus.IsConnected()) {
        status = bus.Disconnect(connectSpec);
    }
    if (bus.IsStarted()) {
        status = bus.Stop();
    }

exit:
    return static_cast<jint>(status);
}

static struct {
    const char* name;
    JNINativeMethod method;
} natives[] = {
    { "org/alljoyn/bus/plugin/SecurityClient", { "permissionResponse", "(IZJ)V", (void*) SecurityClient_permissionResponse } },
    { "org/alljoyn/bus/plugin/SecurityService", { "aliasUnixUser", "(I)I", (void*) SecurityService_aliasUnixUser } }
};

extern "C" {

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved)
{
    // TODO move to dll load?
    QCC_UseOSLogging(true);
    QCC_SetLogLevels("ALLJOYN_JS=15");

    JNIEnv* env = 0;
    jint jret = vm->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        QCC_LogError(ER_FAIL, ("GetEnv failed - %d", jret));
        return JNI_ERR;
    }

    for (size_t i = 0; i < (sizeof(natives) / sizeof(natives[0])); ++i) {
        jclass clazz = env->FindClass(natives[i].name);
        if (!clazz) {
            QCC_LogError(ER_FAIL, ("FindClass failed"));
            env->ExceptionDescribe();
            env->ExceptionClear();
            return JNI_ERR;
        }
        jret = env->RegisterNatives(clazz, &natives[i].method, 1);
        if (JNI_OK != jret) {
            QCC_LogError(ER_FAIL, ("RegisterNatives failed - %d", jret));
            env->ExceptionDescribe();
            env->ExceptionClear();
            return JNI_ERR;
        }
    }

    return JNI_VERSION_1_4;
}

};
