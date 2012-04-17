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
#ifndef _PLUGIN_H
#define _PLUGIN_H

#include "npn.h"
#include "Status.h"
#include <qcc/ManagedObj.h>
#include <qcc/String.h>
#include <list>
#include <map>
class NativeObject;
class ScriptableObject;

/**
 * Per-instance plugin data (controlled via NPP_New and NPP_Destroy).
 */
class _Plugin {
  public:
    /**
     * Plugin handle.  This will be 0 after the NPP_Destroy is called.
     */
    NPP npp;
    /**
     * HostObject constructor params (an impl of T).
     *
     * The runtime calls Allocate of the host object with two params, this plugin and an NPClass.
     * So the only way to pass params to the HostObject constructor is via this plugin or NPClass.
     * Adding the params to NPClass would make it global across all instances of the plugin which
     * could lead to race conditions.  Adding the params to this plugin makes it per-instance and
     * thread-safe.
     */
    void* params;
    /**
     * Cache of allocated HostObjects, keyed off the impl object.
     *
     * This means that as long as the runtime has not called Deallocate of a HostObject, then
     * HostObject::GetInstance() will just retain cached object and return it.
     */
    std::map<ScriptableObject*, NPObject*> hostObjects;
    /**
     * Cache of retained NPObjects, keyed off the NativeObject wrapper.
     *
     * This is necessary as Firefox will delete native *retained* objects after calling
     * NPP_Destroy.  This at least gives me a chance to null out the pointers when the plugin is
     * destroyed and not reference freed memory.
     */
    std::map<NativeObject*, NPObject*> nativeObjects;

#if defined(QCC_OS_ANDROID)
    /**
     * Plugin's android.content.Context.  This will be 0 after the NPP_Destroy is called.
     */
    jobject context;
    /**
     * This provides access to the right class loader for loading Java classes in the plugin.
     */
    ANPSystemInterfaceV0 system;
    /**
     * The security service client that manages permission levels and key stores.
     */
    jobject securityClient;
#endif

    QStatus Initialize();

    /**
     * Compare two values for equality using the native '===' operator.
     *
     * This exists so that two native objects can be compared for equality.  The pointers cannot
     * be compared since that does not work in chrome, so add a native function to the plugin
     * element to do the comparison for us (which does work in all the browsers).
     */
    bool StrictEquals(const NPVariant& a, const NPVariant& b) const;

    /**
     * Return the security origin of this plugin instance.
     *
     * @param[out] origin a string of the form "<protocol>://<hostname>:<port>"
     */
    QStatus Origin(qcc::String& origin);
    /**
     * The characters (minus the quotes) "$-_.+!*'(),;/?:@=&" may appear unencoded in a URL.
     * Depending on the filesystem, these may not work for filenames, so encode all of them.
     *
     * For the curious, the intersection of unencoded characters and Windows is "/:*?".  On Linux,
     * it is "/".
     *
     * @param url the URL to encode as a filename
     *
     * @return the encoded URL
     */
    qcc::String ToFilename(const qcc::String& url);

    bool RaiseBusError(QStatus code, const char* message = 0);
    bool RaiseTypeError(const char* message);

    /*
     * Used only by HostObject and BusErrorInterface.  Real support for throwing Error objects is
     * missing from NPAPI.
     */
    class Error {
      public:
        /* Error fields */
        qcc::String name;
        qcc::String message;
        /* BusError fields */
        QStatus code;
        Error() : code(ER_NONE) { }
        void Clear() {
            name.clear();
            message.clear();
            code = ER_NONE;
        }
    };
    Error error;
    void CheckError(NPObject* npobj);

    _Plugin(NPP npp);
    _Plugin();
    ~_Plugin();

  private:
    Error _error;
};

typedef qcc::ManagedObj<_Plugin> Plugin;

#endif
