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

#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

QStatus _BusAttachmentHost::Connect(Plugin& plugin, const char* connectSpec)
{
    QCC_DbgTrace(("%s(connectSpec=%s)", __FUNCTION__, connectSpec));

    QStatus status = ER_OK;
    JNIEnv* env = 0;
    jint jret;
    jclass clazz;
    jmethodID mid;

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }
    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "aliasUnixUser", "()V");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.aliasUnixUser failed"));
        goto exit;
    }
    env->CallVoidMethod(plugin->securityClient, mid);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.aliasUnixUser method failed"));
        goto exit;
    }

    status = busAttachment->Connect(connectSpec);

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    return status;
}
