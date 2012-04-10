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
#include "../../FeaturePermissions.h"

#include "../../PluginData.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

QStatus RequestPermission(Plugin& plugin, const qcc::String& feature, RequestPermissionListener* listener)
{
    QCC_DbgTrace(("%s(feature=%s,listener=%p)", __FUNCTION__, feature.c_str(), listener));

    QStatus status = ER_OK;
    int32_t level;
    JNIEnv* env = 0;
    jint jret;
    jclass clazz;
    jmethodID mid;
    jlong jlistener;

    status = PluginData::PermissionLevel(plugin, feature, level);
    if (ER_OK != status) {
        goto exit;
    }
    if (DEFAULT_DENIED != level) {
        listener->RequestPermissionCB(level, false);
        goto exit;
    }

    if (feature != ALLJOYN_FEATURE) {
        status = ER_FAIL;
        QCC_LogError(status, ("feature '%s' not supported", feature.c_str()));
        goto exit;
    }

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }
    jlistener = reinterpret_cast<jlong>(listener);
    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "requestPermission", "(J)V");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.requestPermission failed"));
        goto exit;
    }
    env->CallVoidMethod(plugin->securityClient, mid, jlistener);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.requestPermission failed"));
        goto exit;
    }

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    return status;
}

QStatus PersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t& level)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    JNIEnv* env = 0;
    jint jret;
    jclass clazz;
    jmethodID mid;
    int jlevel;

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }
    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "getPermissionLevel", "()I");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.getPermissionLevel failed"));
        goto exit;
    }
    jlevel = env->CallIntMethod(plugin->securityClient, mid);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.getPermissionLevel method failed"));
        goto exit;
    }
    level = jlevel;

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    return status;
}

QStatus SetPersistentPermissionLevel(Plugin& plugin, const qcc::String& origin, int32_t level)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    JNIEnv* env = 0;
    jint jret;
    jclass clazz;
    jmethodID mid;
    int jlevel;

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }
    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "setPermissionLevel", "(I)V");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.setPermissionLevel failed"));
        goto exit;
    }
    jlevel = level;
    env->CallVoidMethod(plugin->securityClient, mid, jlevel);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.setPermissionLevel method failed"));
    }

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    return status;
}
