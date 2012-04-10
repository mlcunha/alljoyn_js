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

import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.content.res.XmlResourceParser;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.CheckBox;
import android.widget.TextView;

public class SecurityClient {

    private Context mContext;
    private ISecurityService mService = null;
    private String mOrigin;
    private long mListener;
    private CheckBox mRemember;

    public SecurityClient(Context context, String origin) throws InterruptedException {
        /*
         * The context is the browser context, not the plugin context.  Example:
         * com.android.browser, /system/app/Browser.apk.
         */
        mContext = context;
        mOrigin = origin;
    }

    public void requestPermission(long listener) throws PackageManager.NameNotFoundException, 
                                                        Resources.NotFoundException {
        final long l = listener;

        /*
         * Our context is the browser's context, so we need to do a little work to extract the
         * dialog layout from the plugin's package.  Additional work is also required to resolve the
         * string references in the layout XML.
         */
        PackageManager pm = mContext.getPackageManager();
        Resources res = pm.getResourcesForApplication("org.alljoyn.bus.plugin");
        XmlResourceParser layout = res.getLayout(R.layout.permission_dialog);

        LayoutInflater inflater = (LayoutInflater) mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        View view = inflater.inflate(layout, null);
        TextView tv = (TextView) view.findViewById(R.id.the_website_below_wants_to_use_alljoyn);
        tv.setText(res.getString(R.string.the_website_below_wants_to_use_alljoyn));
        tv = (TextView) view.findViewById(R.id.origin);
        tv.setText(mOrigin);
        tv = (TextView) view.findViewById(R.id.do_you_want_to_allow_this);
        tv.setText(res.getString(R.string.do_you_want_to_allow_this));
        mRemember = (CheckBox) view.findViewById(R.id.remember_my_decision_for_this_site);
        mRemember.setText(res.getString(R.string.remember_my_decision_for_this_site));

        AlertDialog.Builder builder = new AlertDialog.Builder(mContext);
        builder.setTitle(res.getString(R.string.security_warning))
            .setView(view)
            .setCancelable(false)
            .setPositiveButton(res.getString(R.string.allow), new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        permissionResponse(SecurityService.USER_ALLOWED, mRemember.isChecked(), l);
                    }
                })
            .setNegativeButton(res.getString(R.string.deny), new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        permissionResponse(SecurityService.USER_DENIED, mRemember.isChecked(), l);
                    }
                });
        AlertDialog alert = builder.show();
    }

    private ServiceConnection mConnection = new ServiceConnection() {
            public void onServiceConnected(ComponentName className,
                                           IBinder service) {
                synchronized (mConnection) {
                    mService = ISecurityService.Stub.asInterface(service);
                    mConnection.notify();
                }
            }
            
            public void onServiceDisconnected(ComponentName className) {
                mService = null;
            }
        };

    private void synchronousBindService() throws RemoteException, InterruptedException {
        Intent intent = new Intent();
        intent.setClassName("org.alljoyn.bus.plugin", "org.alljoyn.bus.plugin.SecurityService");
        mContext.bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
        synchronized (mConnection) {
            if (mService == null) {
                mConnection.wait(3000);
            }
        }
    }

    public void aliasUnixUser() throws RemoteException, InterruptedException, SecurityException {
        synchronousBindService();
        int status = mService.aliasUnixUser();
        mContext.unbindService(mConnection);
        if (status != 0) {
            throw new SecurityException();
        }
    }

    public byte[] getKeys() throws RemoteException, InterruptedException {
        synchronousBindService();
        byte[] keys = mService.getKeys(mOrigin);
        mContext.unbindService(mConnection);
        return keys;
    }

    public void setKeys(byte[] keys) throws RemoteException, InterruptedException {
        synchronousBindService();
        mService.setKeys(mOrigin, keys);
        mContext.unbindService(mConnection);
    }

    public int getPermissionLevel() throws RemoteException, InterruptedException {
        synchronousBindService();
        int level = mService.getPermissionLevel(mOrigin, SecurityService.ALLJOYN_FEATURE);
        mContext.unbindService(mConnection);
        return level;
    }

    public void setPermissionLevel(int level) throws RemoteException, InterruptedException {
        synchronousBindService();
        mService.setPermissionLevel(mOrigin, SecurityService.ALLJOYN_FEATURE, level);
        mContext.unbindService(mConnection);
    }

    static { 
        System.loadLibrary("npalljoyn"); 
    }
    private native void permissionResponse(int level, boolean remember, long listener);
}
