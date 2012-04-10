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
package org.alljoyn.bus.plugin;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.Signature;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;
import java.util.HashMap;
import java.util.Map;

public class SecurityService extends Service {

    public static final int USER_ALLOWED = 2;
    public static final int DEFAULT_ALLOWED = 1;
    public static final int DEFAULT_DENIED = -1;
    public static final int USER_DENIED = -2;

    public static final String ALLJOYN_FEATURE = "org.alljoyn.bus";

    public static final String KEYSTORE_PREFS = "keystore";
    public static final String PERMISSIONS_PREFS = "permissions";

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override 
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    private static byte[] toByteArray(String hexString) {
        int length = hexString.length();
        byte[] byteArray = new byte[length / 2];
        for (int i = 0; i < length; i += 2) {
            byteArray[i / 2] = (byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                                       + Character.digit(hexString.charAt(i + 1), 16));
        }
        return byteArray;
    }

    private static final String HEX = "0123456789ABCDEF";
    private static String toHexString(byte[] byteArray) {
        StringBuilder hexString = new StringBuilder(2 * byteArray.length);
        for (byte b : byteArray) {
            hexString.append(HEX.charAt((b & 0xF0) >> 4))
                .append(HEX.charAt((b & 0x0F)));
        }
        return hexString.toString();
    }

    private static final Map<String, Signature> trustedCallers = new HashMap<String, Signature>() {{
            put("com.android.browser", new Signature("308204a830820390a003020102020900936eacbe07f201df300d06092a864886f70d0101050500308194310b3009060355040613025553311330110603550408130a43616c69666f726e6961311630140603550407130d4d6f756e7461696e20566965773110300e060355040a1307416e64726f69643110300e060355040b1307416e64726f69643110300e06035504031307416e64726f69643122302006092a864886f70d0109011613616e64726f696440616e64726f69642e636f6d301e170d3038303232393031333334365a170d3335303731373031333334365a308194310b3009060355040613025553311330110603550408130a43616c69666f726e6961311630140603550407130d4d6f756e7461696e20566965773110300e060355040a1307416e64726f69643110300e060355040b1307416e64726f69643110300e06035504031307416e64726f69643122302006092a864886f70d0109011613616e64726f696440616e64726f69642e636f6d30820120300d06092a864886f70d01010105000382010d00308201080282010100d6931904dec60b24b1edc762e0d9d8253e3ecd6ceb1de2ff068ca8e8bca8cd6bd3786ea70aa76ce60ebb0f993559ffd93e77a943e7e83d4b64b8e4fea2d3e656f1e267a81bbfb230b578c20443be4c7218b846f5211586f038a14e89c2be387f8ebecf8fcac3da1ee330c9ea93d0a7c3dc4af350220d50080732e0809717ee6a053359e6a694ec2cb3f284a0a466c87a94d83b31093a67372e2f6412c06e6d42f15818dffe0381cc0cd444da6cddc3b82458194801b32564134fbfde98c9287748dbf5676a540d8154c8bbca07b9e247553311c46b9af76fdeeccc8e69e7c8a2d08e782620943f99727d3c04fe72991d99df9bae38a0b2177fa31d5b6afee91f020103a381fc3081f9301d0603551d0e04160414485900563d272c46ae118605a47419ac09ca8c113081c90603551d230481c13081be8014485900563d272c46ae118605a47419ac09ca8c11a1819aa48197308194310b3009060355040613025553311330110603550408130a43616c69666f726e6961311630140603550407130d4d6f756e7461696e20566965773110300e060355040a1307416e64726f69643110300e060355040b1307416e64726f69643110300e06035504031307416e64726f69643122302006092a864886f70d0109011613616e64726f696440616e64726f69642e636f6d820900936eacbe07f201df300c0603551d13040530030101ff300d06092a864886f70d010105050003820101007aaf968ceb50c441055118d0daabaf015b8a765a27a715a2c2b44f221415ffdace03095abfa42df70708726c2069e5c36eddae0400be29452c084bc27eb6a17eac9dbe182c204eb15311f455d824b656dbe4dc2240912d7586fe88951d01a8feb5ae5a4260535df83431052422468c36e22c2a5ef994d61dd7306ae4c9f6951ba3c12f1d1914ddc61f1a62da2df827f603fea5603b2c540dbd7c019c36bab29a4271c117df523cdbc5f3817a49e0efa60cbd7f74177e7a4f193d43f4220772666e4c4d83e1bd5a86087cf34f2dec21e245ca6c2bb016e683638050d2c430eea7c26a1c49d3760a58ab7f1a82cc938b4831384324bd0401fa12163a50570e684d"));
        }};

    private final ISecurityService.Stub mBinder = new ISecurityService.Stub() {
            public int aliasUnixUser() {
                int uid = getCallingUid();
                /*
                 * Check that the caller is trusted.  Trusted in this case means a browser
                 * application that is signed by a trusted author.
                 */
                Context context = SecurityService.this;
                PackageManager pm = context.getPackageManager();
                for (String name : pm.getPackagesForUid(uid)) {
                    try {
                        Signature trustedSignature = trustedCallers.get(name);
                        if (trustedSignature != null) {
                            PackageInfo info = pm.getPackageInfo(name, PackageManager.GET_SIGNATURES);
                            for (Signature packageSignature : info.signatures) {
                                if (trustedSignature.equals(packageSignature)) {
                                    return SecurityService.this.aliasUnixUser(uid);
                                }
                            }
                        }
                    } catch (NameNotFoundException e) {
                        /* Nothing to do */
                    }
                }
                return 1;
            }

            public byte[] getKeys(String origin) {
                Context context = SecurityService.this.getApplicationContext();
                SharedPreferences preferences = context.getSharedPreferences(KEYSTORE_PREFS, Context.MODE_PRIVATE);
                String keys = preferences.getString(origin, "");
                return toByteArray(keys);
            }
            public void setKeys(String origin, byte[] keys) {
                Context context = SecurityService.this.getApplicationContext();
                SharedPreferences preferences = context.getSharedPreferences(KEYSTORE_PREFS, Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = preferences.edit();
                editor.putString(origin, toHexString(keys));
                editor.commit();
            }

            public int getPermissionLevel(String origin, String feature) {
                Context context = SecurityService.this.getApplicationContext();
                SharedPreferences preferences = context.getSharedPreferences(PERMISSIONS_PREFS, Context.MODE_PRIVATE);
                int level = preferences.getInt(origin, DEFAULT_DENIED);
                return level;
            }
            public void setPermissionLevel(String origin, String feature, int level) {
                Context context = SecurityService.this.getApplicationContext();
                SharedPreferences preferences = context.getSharedPreferences(PERMISSIONS_PREFS, Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = preferences.edit();
                editor.putInt(origin, level);
                editor.commit();
            }
        };

    static { 
        System.loadLibrary("npalljoyn"); 
    }
    private native int aliasUnixUser(int uid);
}
