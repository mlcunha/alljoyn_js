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
#include "InterfaceDescriptionsHost.h"

#include "BusUtil.h"
#include "InterfaceDescriptionNative.h"
#include "TypeMapping.h"
#include <qcc/Debug.h>
#include <assert.h>

#define QCC_MODULE "ALLJOYN_JS"

#undef STRINGZ_TO_NPVARIANT
#define STRINGZ_TO_NPVARIANT(_val, _v)                                        \
    NP_BEGIN_MACRO                                                                \
        (_v).type = NPVariantType_String;                                         \
    NPString str = { _val, (uint32_t)strlen(_val) };                          \
    (_v).value.stringValue = str;                                             \
    NP_END_MACRO

class InterfaceDescription {
  public:
    InterfaceDescriptionNative* interfaceDescriptionNative;
    InterfaceDescription(InterfaceDescriptionNative* interfaceDescriptionNative)
        : interfaceDescriptionNative(interfaceDescriptionNative) { }
    ~InterfaceDescription() {
        delete interfaceDescriptionNative;
    }
};

_InterfaceDescriptionsHost::_InterfaceDescriptionsHost(Plugin& plugin, BusAttachment& busAttachment)
    : ScriptableObject(plugin)
    , busAttachment(busAttachment)

{
    QCC_DbgTrace(("%s", __FUNCTION__));

    OPERATION("parseXML", &_InterfaceDescriptionsHost::parseXML);

    GETTER(&_InterfaceDescriptionsHost::getInterfaceDescription);
    SETTER(&_InterfaceDescriptionsHost::createInterfaceDescription);
    ENUMERATOR(&_InterfaceDescriptionsHost::enumerateInterfaceDescriptions);
}

_InterfaceDescriptionsHost::~_InterfaceDescriptionsHost()
{
    QCC_DbgTrace(("%s", __FUNCTION__));
    for (std::map<qcc::String, InterfaceDescription*>::iterator it = interfaceDescriptions.begin(); it != interfaceDescriptions.end(); ++it) {
        delete it->second;
    }
}

bool _InterfaceDescriptionsHost::HasProperty(const qcc::String& name)
{
    bool has = ScriptableObject::HasProperty(name);
    if (!has) {
        has = ajn::IsLegalInterfaceName(name.c_str());
    }
    return has;
}

bool _InterfaceDescriptionsHost::parseXML(const NPVariant* args, uint32_t argCount, NPVariant* result)
{
    QCC_DbgTrace(("%s", __FUNCTION__));
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

    status = busAttachment->CreateInterfacesFromXml(source.c_str());

exit:
    ToUnsignedShort(plugin, status, *result);
    return !typeError;
}

bool _InterfaceDescriptionsHost::createInterfaceDescription(const qcc::String& name, const NPVariant* value)
{
    QCC_DbgTrace(("%s", __FUNCTION__));

    InterfaceDescriptionNative* interfaceDescriptionNative = 0;
    InterfaceDescription* interfaceDescription = 0;
    bool typeError = false;
    ajn::InterfaceDescription* interface;
    NPVariant length;
    NPVariant method;
    NPVariant signal;
    NPVariant property;
    NPVariant secure;
    QStatus status = ER_OK;

    interfaceDescriptionNative = ToNativeObject<InterfaceDescriptionNative>(plugin, *value, typeError);
    if (typeError || !interfaceDescriptionNative) {
        typeError = true;
        plugin->RaiseTypeError("argument 0 is not an object");
        goto exit;
    }

    VOID_TO_NPVARIANT(secure);
    if (!NPN_GetProperty(plugin->npp, interfaceDescriptionNative->objectValue, NPN_GetStringIdentifier("secure"), &secure)) {
        QCC_LogError(ER_FAIL, ("Failed to get 'secure' property, defaulting to false"));
        BOOLEAN_TO_NPVARIANT(false, secure);
    }

    status = busAttachment->CreateInterface(name.c_str(), interface, ToBoolean(plugin, secure, typeError));
    assert(!typeError); /* ToBoolean should never fail */
    if (typeError) {
        status = ER_FAIL;
        QCC_LogError(status, ("ToBoolean failed"));
    }
    if (ER_OK != status) {
        goto exit;
    }

    VOID_TO_NPVARIANT(method);
    VOID_TO_NPVARIANT(length);
    if (NPN_GetProperty(plugin->npp, interfaceDescriptionNative->objectValue, NPN_GetStringIdentifier("method"), &method) &&
        NPVARIANT_IS_OBJECT(method) &&
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier("length"), &length) &&
        (NPVARIANT_IS_INT32(length) || NPVARIANT_IS_DOUBLE(length))) {

        bool ignored;
        int32_t n = ToLong(plugin, length, ignored);
        for (int32_t i = 0; (ER_OK == status) && (i < n); ++i) {
            NPVariant element = NPVARIANT_VOID;
            if (NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetIntIdentifier(i), &element) &&
                NPVARIANT_IS_OBJECT(element)) {
                qcc::String name, signature, returnSignature, argNames;
                ajn::InterfaceDescription::AnnotationsMap annotations;

                NPIdentifier* properties = 0;
                uint32_t propertiesCount = 0;
                if (NPN_Enumerate(plugin->npp, NPVARIANT_TO_OBJECT(element), &properties, &propertiesCount)) {
                    for (uint32_t i = 0; (ER_OK == status) && (i < propertiesCount); ++i) {
                        if (!NPN_IdentifierIsString(properties[i])) {
                            continue;
                        }
                        NPUTF8* property = NPN_UTF8FromIdentifier(properties[i]);
                        if (!property) {
                            status = ER_OUT_OF_MEMORY;
                            break;
                        }
                        NPVariant npvalue = NPVARIANT_VOID;
                        if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(element), properties[i], &npvalue)) {
                            continue;
                        }
                        qcc::String value = ToDOMString(plugin, npvalue, typeError);
                        if (typeError) {
                            continue;
                        }
                        NPN_ReleaseVariantValue(&npvalue);

                        if (!strcmp(property, "name")) {
                            name = value;
                        } else if (!strcmp(property, "signature")) {
                            signature = value;
                        } else if (!strcmp(property, "returnSignature")) {
                            returnSignature = value;
                        } else if (!strcmp(property, "argNames")) {
                            argNames = value;
                        } else {
                            annotations[property] = value;
                        }
                        NPN_MemFree(property);
                    }
                    NPN_MemFree(properties);
                }

                status = interface->AddMember(ajn::MESSAGE_METHOD_CALL,
                                              name.empty() ? 0 : name.c_str(),
                                              signature.empty() ? 0 : signature.c_str(),
                                              returnSignature.empty() ? 0 : returnSignature.c_str(),
                                              argNames.empty() ? 0 : argNames.c_str(),
                                              annotations);
            }
            NPN_ReleaseVariantValue(&element);
        }
    }
    NPN_ReleaseVariantValue(&length);
    NPN_ReleaseVariantValue(&method);
    if (ER_OK != status) {
        goto exit;
    }

    VOID_TO_NPVARIANT(signal);
    VOID_TO_NPVARIANT(length);
    if (NPN_GetProperty(plugin->npp, interfaceDescriptionNative->objectValue, NPN_GetStringIdentifier("signal"), &signal) &&
        NPVARIANT_IS_OBJECT(signal) &&
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetStringIdentifier("length"), &length) &&
        (NPVARIANT_IS_INT32(length) || NPVARIANT_IS_DOUBLE(length))) {

        bool ignored;
        int32_t n = ToLong(plugin, length, ignored);
        for (int32_t i = 0; (ER_OK == status) && (i < n); ++i) {
            NPVariant element = NPVARIANT_VOID;
            if (NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetIntIdentifier(i), &element) &&
                NPVARIANT_IS_OBJECT(element)) {
                qcc::String name, signature, argNames;
                ajn::InterfaceDescription::AnnotationsMap annotations;

                NPIdentifier* properties = 0;
                uint32_t propertiesCount = 0;
                if (NPN_Enumerate(plugin->npp, NPVARIANT_TO_OBJECT(element), &properties, &propertiesCount)) {
                    for (uint32_t i = 0; (ER_OK == status) && (i < propertiesCount); ++i) {
                        if (!NPN_IdentifierIsString(properties[i])) {
                            continue;
                        }
                        NPUTF8* property = NPN_UTF8FromIdentifier(properties[i]);
                        if (!property) {
                            status = ER_OUT_OF_MEMORY;
                            break;
                        }
                        NPVariant npvalue = NPVARIANT_VOID;
                        if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(element), properties[i], &npvalue)) {
                            continue;
                        }
                        qcc::String value = ToDOMString(plugin, npvalue, typeError);
                        if (typeError) {
                            continue;
                        }
                        NPN_ReleaseVariantValue(&npvalue);

                        if (!strcmp(property, "name")) {
                            name = value;
                        } else if (!strcmp(property, "signature")) {
                            signature = value;
                        } else if (!strcmp(property, "argNames")) {
                            argNames = value;
                        } else {
                            annotations[property] = value;
                        }
                        NPN_MemFree(property);
                    }
                    NPN_MemFree(properties);
                }

                status = interface->AddMember(ajn::MESSAGE_SIGNAL,
                                              name.empty() ? 0 : name.c_str(),
                                              signature.empty() ? 0 : signature.c_str(),
                                              NULL,
                                              argNames.empty() ? 0 : argNames.c_str(),
                                              annotations);
            }
            NPN_ReleaseVariantValue(&element);
        }
    }
    NPN_ReleaseVariantValue(&length);
    NPN_ReleaseVariantValue(&signal);
    if (ER_OK != status) {
        goto exit;
    }

    VOID_TO_NPVARIANT(property);
    VOID_TO_NPVARIANT(length);
    if (NPN_GetProperty(plugin->npp, interfaceDescriptionNative->objectValue, NPN_GetStringIdentifier("property"), &property) &&
        NPVARIANT_IS_OBJECT(property) &&
        NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetStringIdentifier("length"), &length) &&
        (NPVARIANT_IS_INT32(length) || NPVARIANT_IS_DOUBLE(length))) {

        bool ignored;
        int32_t n = ToLong(plugin, length, ignored);
        for (int32_t i = 0; (ER_OK == status) && (i < n); ++i) {
            NPVariant element = NPVARIANT_VOID;
            if (NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetIntIdentifier(i), &element) &&
                NPVARIANT_IS_OBJECT(element)) {
                qcc::String name, signature;
                uint8_t accessFlags = 0;
                ajn::InterfaceDescription::AnnotationsMap annotations;

                NPIdentifier* properties = 0;
                uint32_t propertiesCount = 0;
                if (NPN_Enumerate(plugin->npp, NPVARIANT_TO_OBJECT(element), &properties, &propertiesCount)) {
                    for (uint32_t i = 0; (ER_OK == status) && (i < propertiesCount); ++i) {
                        if (!NPN_IdentifierIsString(properties[i])) {
                            continue;
                        }
                        NPUTF8* property = NPN_UTF8FromIdentifier(properties[i]);
                        if (!property) {
                            status = ER_OUT_OF_MEMORY;
                            break;
                        }
                        NPVariant npvalue = NPVARIANT_VOID;
                        if (!NPN_GetProperty(plugin->npp, NPVARIANT_TO_OBJECT(element), properties[i], &npvalue)) {
                            continue;
                        }
                        qcc::String value = ToDOMString(plugin, npvalue, typeError);
                        if (typeError) {
                            continue;
                        }
                        NPN_ReleaseVariantValue(&npvalue);

                        if (!strcmp(property, "name")) {
                            name = value;
                        } else if (!strcmp(property, "signature")) {
                            signature = value;
                        } else if (!strcmp(property, "access")) {
                            if (value == "readwrite") {
                                accessFlags = ajn::PROP_ACCESS_RW;
                            } else if (value == "read") {
                                accessFlags = ajn::PROP_ACCESS_READ;
                            } else if (value == "write") {
                                accessFlags = ajn::PROP_ACCESS_WRITE;
                            }
                        } else {
                            annotations[property] = value;
                        }
                        NPN_MemFree(property);
                    }
                    NPN_MemFree(properties);
                }

                status = interface->AddProperty(name.empty() ? 0 : name.c_str(),
                                                signature.empty() ? 0 : signature.c_str(),
                                                accessFlags);
                for (ajn::InterfaceDescription::AnnotationsMap::const_iterator it = annotations.begin();
                     (ER_OK == status) && (it != annotations.end()); ++it) {
                    status = interface->AddPropertyAnnotation(name, it->first, it->second);
                }
            }
            NPN_ReleaseVariantValue(&element);
        }
    }
    NPN_ReleaseVariantValue(&length);
    NPN_ReleaseVariantValue(&property);
    if (ER_OK != status) {
        goto exit;
    }

    interface->Activate();
#if !defined(NDEBUG)
    {
        qcc::String str = interface->Introspect();
        QCC_DbgTrace(("%s", str.c_str()));
    }
#endif

    interfaceDescription = new InterfaceDescription(interfaceDescriptionNative);
    interfaceDescriptionNative = 0; /* interfaceDescription now owns interfaceDescriptionNative */
    interfaceDescriptions.insert(std::pair<qcc::String, InterfaceDescription*>(name, interfaceDescription));
    interfaceDescription = 0; /* interfaceDescriptions now owns interfaceDescriptionNative */

exit:
    delete interfaceDescription;
    delete interfaceDescriptionNative;
    if ((ER_OK == status) && !typeError) {
        return true;
    } else {
        if (ER_OK != status) {
            plugin->RaiseBusError(status);
        }
        return false;
    }
}

bool _InterfaceDescriptionsHost::getInterfaceDescription(const qcc::String& name, NPVariant* result)
{
    std::map<qcc::String, InterfaceDescription*>::iterator it = interfaceDescriptions.find(name);
    if (it != interfaceDescriptions.end()) {
        InterfaceDescription* interfaceDescription = it->second;
        ToNativeObject<InterfaceDescriptionNative>(plugin, interfaceDescription->interfaceDescriptionNative, *result);
        return true;
    } else {
        const ajn::InterfaceDescription* iface = busAttachment->GetInterface(name.c_str());
        if (iface) {
            NPVariant value = NPVARIANT_VOID;
            size_t numMembers = 0;
            const ajn::InterfaceDescription::Member** members = 0;
            size_t numMethods = 0;
            size_t numSignals = 0;
            size_t numProps = 0;
            NPVariant methodArray = NPVARIANT_VOID;
            NPVariant method = NPVARIANT_VOID;
            NPVariant signalArray = NPVARIANT_VOID;
            NPVariant signal = NPVARIANT_VOID;
            const ajn::InterfaceDescription::Property** props = 0;
            NPVariant propertyArray = NPVARIANT_VOID;
            NPVariant property = NPVARIANT_VOID;
            QStatus status = ER_OK;
            InterfaceDescriptionNative* interfaceDescriptionNative = 0;
            InterfaceDescription* interfaceDescription = 0;
            bool typeError = false;

            if (!NewObject(plugin, value)) {
                status = ER_FAIL;
                QCC_LogError(status, ("NewObject failed"));
                goto exit;
            }

            if (iface->IsSecure()) {
                NPVariant secure;
                BOOLEAN_TO_NPVARIANT(false, secure);
                if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(value), NPN_GetStringIdentifier("secure"), &secure)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NPN_SetProperty failed"));
                    goto exit;
                }
            }

            numMembers = iface->GetMembers();
            members = new const ajn::InterfaceDescription::Member *[numMembers];
            iface->GetMembers(members, numMembers);
            for (size_t i = 0; i < numMembers; ++i) {
                switch (members[i]->memberType) {
                case ajn::MESSAGE_METHOD_CALL:
                    ++numMethods;
                    break;

                case ajn::MESSAGE_SIGNAL:
                    ++numSignals;
                    break;

                default:
                    break;
                }
            }
            numProps = iface->GetProperties();

            if (numMethods) {
                if (!NewArray(plugin, methodArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NewArray failed"));
                    goto exit;
                }
                if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(value), NPN_GetStringIdentifier("method"), &methodArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NPN_SetProperty failed"));
                    goto exit;
                }
                for (size_t i = 0, j = 0; i < numMembers; ++i) {
                    if (ajn::MESSAGE_METHOD_CALL == members[i]->memberType) {
                        if (!NewObject(plugin, method)) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NewObject failed"));
                            goto exit;
                        }
                        NPVariant name, signature, returnSignature, argNames;
                        STRINGZ_TO_NPVARIANT(members[i]->name.c_str(), name);
                        STRINGZ_TO_NPVARIANT(members[i]->signature.c_str(), signature);
                        STRINGZ_TO_NPVARIANT(members[i]->returnSignature.c_str(), returnSignature);
                        STRINGZ_TO_NPVARIANT(members[i]->argNames.c_str(), argNames);
                        bool set =
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier("name"), &name) &&
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier("signature"), &signature) &&
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier("returnSignature"), &returnSignature) &&
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier("argNames"), &argNames);
                        if (!set) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NPN_SetProperty failed"));
                            goto exit;
                        }

                        for (ajn::InterfaceDescription::AnnotationsMap::const_iterator it = members[i]->annotations.begin();
                             it != members[i]->annotations.end(); ++it) {
                            NPVariant annotation;
                            STRINGZ_TO_NPVARIANT(it->second.c_str(), annotation);
                            if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(method), NPN_GetStringIdentifier(it->first.c_str()), &annotation)) {
                                status = ER_FAIL;
                                QCC_LogError(status, ("NPN_SetProperty failed"));
                                goto exit;
                            }
                        }

                        if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(methodArray), NPN_GetIntIdentifier(j++), &method)) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NPN_SetProperty failed"));
                            goto exit;
                        }
                        NPN_ReleaseVariantValue(&method);
                        VOID_TO_NPVARIANT(method);
                    }
                }
            }

            if (numSignals) {
                if (!NewArray(plugin, signalArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NewArray failed"));
                    goto exit;
                }
                if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(value), NPN_GetStringIdentifier("signal"), &signalArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NPN_SetProperty failed"));
                    goto exit;
                }
                for (size_t i = 0, j = 0; i < numMembers; ++i) {
                    if (ajn::MESSAGE_SIGNAL == members[i]->memberType) {
                        if (!NewObject(plugin, signal)) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NewObject failed"));
                            goto exit;
                        }
                        NPVariant name, signature, argNames;
                        STRINGZ_TO_NPVARIANT(members[i]->name.c_str(), name);
                        STRINGZ_TO_NPVARIANT(members[i]->signature.c_str(), signature);
                        STRINGZ_TO_NPVARIANT(members[i]->argNames.c_str(), argNames);
                        bool set =
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetStringIdentifier("name"), &name) &&
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetStringIdentifier("signature"), &signature) &&
                            NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetStringIdentifier("argNames"), &argNames);
                        if (!set) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NPN_SetProperty failed"));
                            goto exit;
                        }

                        for (ajn::InterfaceDescription::AnnotationsMap::const_iterator it = members[i]->annotations.begin();
                             it != members[i]->annotations.end(); ++it) {
                            NPVariant annotation;
                            STRINGZ_TO_NPVARIANT(it->second.c_str(), annotation);
                            if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signal), NPN_GetStringIdentifier(it->first.c_str()), &annotation)) {
                                status = ER_FAIL;
                                QCC_LogError(status, ("NPN_SetProperty failed"));
                                goto exit;
                            }
                        }

                        if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(signalArray), NPN_GetIntIdentifier(j++), &signal)) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NPN_SetProperty failed"));
                            goto exit;
                        }
                    }
                    NPN_ReleaseVariantValue(&signal);
                    VOID_TO_NPVARIANT(signal);
                }
            }

            if (numProps) {
                props = new const ajn::InterfaceDescription::Property *[numProps];
                iface->GetProperties(props, numProps);
                if (!NewArray(plugin, propertyArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NewArray failed"));
                    goto exit;
                }
                if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(value), NPN_GetStringIdentifier("property"), &propertyArray)) {
                    status = ER_FAIL;
                    QCC_LogError(status, ("NPN_SetProperty failed"));
                    goto exit;
                }
                for (size_t i = 0, j = 0; i < numProps; ++i) {
                    if (!NewObject(plugin, property)) {
                        status = ER_FAIL;
                        QCC_LogError(status, ("NewObject failed"));
                        goto exit;
                    }
                    NPVariant name, signature;
                    STRINGZ_TO_NPVARIANT(props[i]->name.c_str(), name);
                    STRINGZ_TO_NPVARIANT(props[i]->signature.c_str(), signature);
                    bool set =
                        NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetStringIdentifier("name"), &name) &&
                        NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetStringIdentifier("signature"), &signature);
                    if (!set) {
                        status = ER_FAIL;
                        QCC_LogError(status, ("NPN_SetProperty failed"));
                        goto exit;
                    }

                    NPVariant access;
                    if (props[i]->access == ajn::PROP_ACCESS_RW) {
                        STRINGZ_TO_NPVARIANT("readwrite", access);
                    } else if (props[i]->access == ajn::PROP_ACCESS_READ) {
                        STRINGZ_TO_NPVARIANT("read", access);
                    } else if (props[i]->access == ajn::PROP_ACCESS_WRITE) {
                        STRINGZ_TO_NPVARIANT("write", access);
                    }
                    if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetStringIdentifier("access"), &access)) {
                        status = ER_FAIL;
                        QCC_LogError(status, ("NPN_SetProperty failed"));
                        goto exit;
                    }

                    for (ajn::InterfaceDescription::AnnotationsMap::const_iterator it = props[i]->annotations.begin();
                         it != props[i]->annotations.end(); ++it) {
                        NPVariant annotation;
                        STRINGZ_TO_NPVARIANT(it->second.c_str(), annotation);
                        if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(property), NPN_GetStringIdentifier(it->first.c_str()), &annotation)) {
                            status = ER_FAIL;
                            QCC_LogError(status, ("NPN_SetProperty failed"));
                            goto exit;
                        }
                    }

                    if (!NPN_SetProperty(plugin->npp, NPVARIANT_TO_OBJECT(propertyArray), NPN_GetIntIdentifier(j++), &property)) {
                        status = ER_FAIL;
                        QCC_LogError(status, ("NPN_SetProperty failed"));
                        goto exit;
                    }
                    NPN_ReleaseVariantValue(&property);
                    VOID_TO_NPVARIANT(property);
                }
            }

            interfaceDescriptionNative = ToNativeObject<InterfaceDescriptionNative>(plugin, value, typeError);
            if (typeError || !interfaceDescriptionNative) {
                typeError = true;
                goto exit;
            }

            interfaceDescription = new InterfaceDescription(interfaceDescriptionNative);
            interfaceDescriptionNative = 0; /* interfaceDescription now owns interfaceDescriptionNative */
            ToNativeObject<InterfaceDescriptionNative>(plugin, interfaceDescription->interfaceDescriptionNative, *result);
            interfaceDescriptions.insert(std::pair<qcc::String, InterfaceDescription*>(name, interfaceDescription));
            interfaceDescription = 0; /* interfaceDescriptions now owns interfaceDescriptionNative */

        exit:
            delete interfaceDescription;
            delete interfaceDescriptionNative;
            NPN_ReleaseVariantValue(&property);
            NPN_ReleaseVariantValue(&propertyArray);
            delete[] props;
            NPN_ReleaseVariantValue(&signal);
            NPN_ReleaseVariantValue(&signalArray);
            NPN_ReleaseVariantValue(&method);
            NPN_ReleaseVariantValue(&methodArray);
            delete[] members;
            NPN_ReleaseVariantValue(&value);
        } else {
            VOID_TO_NPVARIANT(*result);
        }
        return true;
    }
}

bool _InterfaceDescriptionsHost::enumerateInterfaceDescriptions(NPIdentifier** value, uint32_t* count)
{
    size_t numIfaces = busAttachment->GetInterfaces();
    const ajn::InterfaceDescription** ifaces = new const ajn::InterfaceDescription *[numIfaces];
    busAttachment->GetInterfaces(ifaces, numIfaces);

    *count = numIfaces;
    *value = reinterpret_cast<NPIdentifier*>(NPN_MemAlloc(*count * sizeof(NPIdentifier)));
    NPIdentifier* v = *value;
    for (uint32_t i = 0; i < numIfaces; ++i) {
        *v++ = NPN_GetStringIdentifier(ifaces[i]->GetName());
    }

    delete[] ifaces;
    return true;
}

