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
#include "KeyStoreListener.h"
#include <qcc/Debug.h>

#define QCC_MODULE "ALLJOYN_JS"

QStatus KeyStoreListener::LoadRequest(ajn::KeyStore& keyStore)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    JNIEnv* env = 0;
    jint jret;
    bool detach;
    jclass clazz;
    jmethodID mid;
    jbyteArray jkeys;
    jsize length;
    jbyte* jelements;
    qcc::String keys;

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    detach = (JNI_EDETACHED == jret);
    if (detach) {
        jret = gVM->AttachCurrentThread(&env, NULL);
    }
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }

    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "getKeys", "()[B");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.getKeys failed"));
        goto exit;
    }
    jkeys = (jbyteArray)env->CallObjectMethod(plugin->securityClient, mid);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.getKeys method failed"));
        goto exit;
    }
    if (jkeys) {
        length = env->GetArrayLength(jkeys);
        jelements = env->GetByteArrayElements(jkeys, NULL);
        if (!jelements) {
            status = ER_FAIL;
            QCC_LogError(status, ("GetByteArrayElements failed"));
            goto exit;
        }
        keys = qcc::String(reinterpret_cast<const char*>(jelements), length);
        env->ReleaseByteArrayElements(jkeys, jelements, JNI_ABORT);
    }
    status = PutKeys(keyStore, keys, "alljoyn_js"); // TODO does password actually do anything?

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    if (detach) {
        gVM->DetachCurrentThread();
    }
    return status;
}

QStatus KeyStoreListener::StoreRequest(ajn::KeyStore& keyStore)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    QStatus status = ER_OK;
    JNIEnv* env = 0;
    jint jret;
    bool detach;
    jclass clazz;
    jmethodID mid;
    qcc::String keys;
    jbyteArray jkeys;

    jret = gVM->GetEnv((void** )&env, JNI_VERSION_1_4);
    detach = (JNI_EDETACHED == jret);
    if (detach) {
        jret = gVM->AttachCurrentThread(&env, NULL);
    }
    if (JNI_OK != jret) {
        status = ER_FAIL;
        QCC_LogError(status, ("GetEnv failed - %d", jret));
        goto exit;
    }

    clazz = env->GetObjectClass(plugin->securityClient);
    mid = env->GetMethodID(clazz, "setKeys", "([B)V");
    if (!mid) {
        status = ER_FAIL;
        QCC_LogError(status, ("Get SecurityClient.setKeys failed"));
        goto exit;
    }
    status = GetKeys(keyStore, keys);
    if (ER_OK != status) {
        goto exit;
    }
    jkeys = env->NewByteArray(keys.size());
    if (!jkeys) {
        status = ER_FAIL;
        QCC_LogError(status, ("NewByteArray failed"));
        goto exit;
    }
    env->SetByteArrayRegion(jkeys, 0, keys.size(), reinterpret_cast<const jbyte*>(keys.data()));
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SetByteArrayRegion failed"));
        goto exit;
    }
    env->CallVoidMethod(plugin->securityClient, mid, jkeys);
    if (env->ExceptionCheck()) {
        status = ER_FAIL;
        QCC_LogError(status, ("SecurityClient.setKeys method failed"));
    }

exit:
    if (env && env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
    if (detach) {
        gVM->DetachCurrentThread();
    }
    return status;
}
